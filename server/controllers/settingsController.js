const { cloudinary } = require("../config/cloudinary");
const mongoose = require("mongoose");
const User = require("../models/User");
const { getTeamMemberModel } = require("../models/TeamMember");
const mailSender = require("../utils/mailSender");
const { broadcastEmailTemplate } = require("../mail/templates");

const RESOURCE_TYPES = ["image", "video", "raw"];
const MAX_RESULTS_PER_PAGE = 500;
const MAX_PAGES_PER_TYPE = 20;
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();
const TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Design and Creative",
  "Content and Documentation",
  "Capture The Event",
  "Sponsorship and Marketing",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function getDepartmentMemberEmailRecipients() {
  const groups = await Promise.all(
    TEAM_DEPARTMENTS.map(async (department) => {
      const members = await getTeamMemberModel(department).find({
        email: { $exists: true, $ne: "" },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      }).select("name email").lean();
      return members.map((member) => ({
        _id: member._id,
        name: member.name || member.email,
        email: String(member.email || "").trim().toLowerCase(),
        department,
      }));
    })
  );
  return Array.from(
    new Map(groups.flat().filter((member) => isValidEmail(member.email)).map((member) => [member.email, member])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
}

async function getDepartmentMemberUnsignedEmailRecipients() {
  const groups = await Promise.all(
    TEAM_DEPARTMENTS.map(async (department) => {
      const members = await getTeamMemberModel(department).find({
        email: { $exists: true, $ne: "" },
        $or: [{ signedIn: { $ne: true } }, { signedIn: { $exists: false } }],
        $and: [
          { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
        ],
      }).select("name email signedIn").lean();
      return members.map((member) => ({
        _id: member._id,
        name: member.name || member.email,
        email: String(member.email || "").trim().toLowerCase(),
        department,
        signedIn: member.signedIn === true,
      }));
    })
  );
  return Array.from(
    new Map(groups.flat().filter((member) => isValidEmail(member.email)).map((member) => [member.email, member])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
}

function bytesToGb(bytes) {
  return Number((Number(bytes || 0) / 1024 ** 3).toFixed(2));
}

function bytesToMb(bytes) {
  return Number((Number(bytes || 0) / 1024 ** 2).toFixed(2));
}

function formatDateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getCached(key) {
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.time > CACHE_TTL_MS) return null;
  return hit.data;
}

function setCached(key, data) {
  cache.set(key, { time: Date.now(), data });
  return data;
}

function readNumber(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function normalizePercent(value) {
  if (value == null || value === "") return 0;
  const parsed = Number(String(value).replace("%", ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed > 1 ? parsed : parsed * 100;
}

function getRootFolder(publicId = "") {
  const clean = String(publicId || "").replace(/^\/+/, "");
  if (!clean) return "Root";
  return clean.includes("/") ? clean.split("/")[0] : "Root";
}

async function listResourcesByType(resourceType) {
  const resources = [];
  let nextCursor = undefined;
  let page = 0;

  do {
    const result = await cloudinary.api.resources({
      resource_type: resourceType,
      type: "upload",
      max_results: MAX_RESULTS_PER_PAGE,
      next_cursor: nextCursor,
    });
    resources.push(...(result.resources || []));
    nextCursor = result.next_cursor;
    page += 1;
  } while (nextCursor && page < MAX_PAGES_PER_TYPE);

  return resources;
}

exports.getCloudinaryStorageUsage = async (_req, res) => {
  try {
    const [usage, resourceGroups] = await Promise.all([
      cloudinary.api.usage(),
      Promise.all(RESOURCE_TYPES.map(listResourcesByType)),
    ]);

    const resources = resourceGroups.flat();
    const folders = new Map();

    resources.forEach((resource) => {
      const folderName = getRootFolder(resource.public_id);
      const current = folders.get(folderName) || {
        folder: folderName,
        bytes: 0,
        assets: 0,
        image: 0,
        video: 0,
        raw: 0,
      };
      current.bytes += Number(resource.bytes || 0);
      current.assets += 1;
      current[resource.resource_type] = (current[resource.resource_type] || 0) + 1;
      folders.set(folderName, current);
    });

    const usedBytes = readNumber(
      usage?.storage?.usage,
      usage?.storage?.used,
      usage?.storage?.bytes
    );
    const reportedLimitBytes = readNumber(
      usage?.storage?.limit,
      usage?.storage?.limits,
      usage?.storage?.quota,
      usage?.storage?.bytes_limit,
      usage?.storage?.storage_limit,
      usage?.limits?.storage,
      usage?.plan?.storage,
      usage?.plan?.storage_limit
    );
    const usedPercent = normalizePercent(
      usage?.storage?.used_percent ??
        usage?.storage?.usage_percent ??
        usage?.storage?.percent_used
    );
    const derivedLimitBytes =
      !reportedLimitBytes && usedBytes > 0 && usedPercent > 0
        ? Math.round(usedBytes / (usedPercent / 100))
        : 0;
    const limitBytes = reportedLimitBytes || derivedLimitBytes;
    const remainingBytes = limitBytes > 0 ? Math.max(limitBytes - usedBytes, 0) : null;

    const folderBreakdown = Array.from(folders.values())
      .sort((a, b) => b.bytes - a.bytes)
      .map((folder) => ({
        ...folder,
        gb: bytesToGb(folder.bytes),
        percentOfUsed: usedBytes > 0 ? Math.round((folder.bytes / usedBytes) * 100) : 0,
      }));

    res.json({
      success: true,
      storage: {
        usedBytes,
        limitBytes,
        remainingBytes,
        usedGb: bytesToGb(usedBytes),
        limitGb: limitBytes > 0 ? bytesToGb(limitBytes) : null,
        remainingGb: remainingBytes == null ? null : bytesToGb(remainingBytes),
        percentUsed: limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : null,
        usedPercentFromCloudinary: usedPercent || null,
        limitSource: reportedLimitBytes ? "cloudinary_limit" : derivedLimitBytes ? "derived_from_used_percent" : null,
        availableStorageKeys: Object.keys(usage?.storage || {}),
      },
      assets: {
        total: resources.length,
        image: resources.filter((item) => item.resource_type === "image").length,
        video: resources.filter((item) => item.resource_type === "video").length,
        raw: resources.filter((item) => item.resource_type === "raw").length,
      },
      folders: folderBreakdown,
      partial: resourceGroups.some((group) => group.length >= MAX_RESULTS_PER_PAGE * MAX_PAGES_PER_TYPE),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cloudinary storage usage error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to load Cloudinary storage usage.",
    });
  }
};

exports.getMongoDatabaseAnalytics = async (_req, res) => {
  try {
    const cached = getCached("mongo-analytics");
    if (cached) return res.json(cached);

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "MongoDB connection is not available.",
      });
    }

    const dbStats = await db.stats();
    const collectionNames = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((collection) => collection.name)
      .filter((name) => name && !name.startsWith("system."));

    const collectionStats = await Promise.all(
      collectionNames.map(async (name) => {
        try {
          const stats = await db.command({ collStats: name });
          return {
            name,
            documents: Number(stats.count || 0),
            storageBytes: Number(stats.storageSize || stats.size || 0),
            indexBytes: Number(stats.totalIndexSize || 0),
          };
        } catch {
          const documents = await db.collection(name).estimatedDocumentCount();
          return { name, documents, storageBytes: 0, indexBytes: 0 };
        }
      })
    );

    const totalDocuments = collectionStats.reduce((sum, item) => sum + item.documents, 0);
    const collections = collectionStats
      .sort((a, b) => b.documents - a.documents)
      .map((item) => ({
        ...item,
        storageMb: bytesToMb(item.storageBytes),
        indexMb: bytesToMb(item.indexBytes),
        percentOfDocuments:
          totalDocuments > 0 ? Math.round((item.documents / totalDocuments) * 100) : 0,
      }));

    const response = {
      success: true,
      summary: {
        storageBytes: Number(dbStats.storageSize || dbStats.dataSize || 0),
        storageMb: bytesToMb(dbStats.storageSize || dbStats.dataSize || 0),
        totalDocuments,
        totalCollections: collections.length,
        indexBytes: Number(dbStats.indexSize || 0),
        indexMb: bytesToMb(dbStats.indexSize || 0),
      },
      collections,
      updatedAt: new Date().toISOString(),
    };

    res.json(setCached("mongo-analytics", response));
  } catch (error) {
    console.error("MongoDB analytics error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to load MongoDB analytics.",
    });
  }
};

async function brevoFetch(path) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    const err = new Error("Brevo API key is not configured.");
    err.status = 503;
    throw err;
  }

  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    headers: {
      "api-key": apiKey,
      Accept: "application/json",
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || response.statusText || "Brevo request failed.");
    err.status = response.status;
    throw err;
  }
  return data;
}

function numberFrom(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function getBrevoRecipient(event = {}) {
  const value = event.email || event.recipient || event.recipientEmail || event.to;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  if (value && typeof value.email === "string") return value.email;
  return "";
}

function normalizeBrevoReport(report = {}) {
  const requests = numberFrom(report.requests, report.sent, report.delivered);
  const delivered = numberFrom(report.delivered);
  const hardBounces = numberFrom(report.hardBounces, report.hard_bounces);
  const softBounces = numberFrom(report.softBounces, report.soft_bounces);
  const bounces = hardBounces + softBounces;
  const uniqueOpens = numberFrom(report.uniqueOpens, report.unique_opens);
  const uniqueClicks = numberFrom(report.uniqueClicks, report.unique_clicks);
  const unsubscribed = numberFrom(report.unsubscriptions, report.unsubscribed);
  const spamReports = numberFrom(report.spamReports, report.spam_reports);

  return {
    sent: requests,
    delivered,
    failed: bounces,
    deliveryRate: requests > 0 ? Math.round((delivered / requests) * 100) : 0,
    openRate: delivered > 0 ? Math.round((uniqueOpens / delivered) * 100) : 0,
    clickRate: delivered > 0 ? Math.round((uniqueClicks / delivered) * 100) : 0,
    bounceRate: requests > 0 ? Math.round((bounces / requests) * 100) : 0,
    unsubscribed,
    spamReports,
  };
}

function findBrevoRemainingCredits(account = {}) {
  const plans = Array.isArray(account.plan) ? account.plan : [];
  for (const plan of plans) {
    const creditsType = String(plan.creditsType || "").toLowerCase();
    const type = String(plan.type || "").toLowerCase();
    if (creditsType && creditsType !== "sendlimit") continue;
    if (type && !["free", "email", "marketing"].includes(type)) continue;
    const remaining = numberFrom(plan.remainingCredits, plan.credits);
    if (remaining > 0) return remaining;
  }

  const verticals = Array.isArray(account.planVerticals) ? account.planVerticals : [];
  for (const plan of verticals) {
    const category = String(plan.planCategory || "").toLowerCase();
    if (category && category !== "marketing") continue;
    const remaining = numberFrom(plan.remainingCredits, plan.credits);
    if (remaining > 0) return remaining;
  }

  return null;
}

function findBrevoConfiguredDailyLimit() {
  const limit = numberFrom(
    process.env.BREVO_DAILY_EMAIL_LIMIT,
    process.env.EMAIL_DAILY_LIMIT
  );
  return limit > 0 ? limit : null;
}

exports.getBrevoEmailAnalytics = async (req, res) => {
  try {
    const cached = req.query.refresh === "1" ? null : getCached("brevo-analytics");
    if (cached) return res.json(cached);

    const now = new Date();
    const today = formatDateOnly(now);
    // Brevo permits a maximum 90-day range for transactional event reports.
    // Request its full available history window in one page (up to 5,000 events).
    const recentActivityStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const recentActivityStartDate = formatDateOnly(recentActivityStart);
    const [account, reportData, eventsData] = await Promise.allSettled([
      brevoFetch("/account"),
      brevoFetch(`/smtp/statistics/aggregatedReport?startDate=${today}&endDate=${today}`),
      brevoFetch(`/smtp/statistics/events?startDate=${recentActivityStartDate}&endDate=${today}&limit=5000&offset=0`),
    ]);

    if (account.status === "rejected") throw account.reason;

    const todayReport = reportData.status === "fulfilled" ? reportData.value : {};
    const performance = normalizeBrevoReport(todayReport);
    const configuredDailyLimit = findBrevoConfiguredDailyLimit();
    const remainingCredits = findBrevoRemainingCredits(account.value);
    const dailyLimit =
      configuredDailyLimit ||
      (remainingCredits != null ? remainingCredits + performance.sent : null);
    const remaining =
      remainingCredits != null
        ? remainingCredits
        : dailyLimit > 0
          ? Math.max(dailyLimit - performance.sent, 0)
          : null;

    const rawEvents =
      eventsData.status === "fulfilled"
        ? eventsData.value.events || eventsData.value.items || []
        : [];
    const recentActivity = (Array.isArray(rawEvents) ? rawEvents : [])
      .map((event) => ({
        subject: event.subject || event.messageSubject || "Transactional email",
        recipient: getBrevoRecipient(event),
        status: event.event || event.status || "unknown",
        sentAt: event.date || event.ts || event.createdAt || null,
      }))
      .sort((left, right) => new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime())
      .slice(0, 5000);

    const response = {
      success: true,
      connected: true,
      summary: {
        sentToday: performance.sent,
        dailyLimit,
        remaining,
        delivered: performance.delivered,
        failed: performance.failed,
        quotaSource: configuredDailyLimit
          ? "configured_daily_limit"
          : remainingCredits != null
            ? "brevo_remaining_plus_sent"
            : null,
      },
      performance,
      recentActivity,
      recentActivityWindowDays: 90,
      reportUnavailable: reportData.status === "rejected" ? reportData.reason.message : null,
      eventsUnavailable: eventsData.status === "rejected" ? eventsData.reason.message : null,
      updatedAt: new Date().toISOString(),
    };

    res.json(setCached("brevo-analytics", response));
  } catch (error) {
    console.error("Brevo analytics error:", error);
    res.status(error.status || 500).json({
      success: false,
      connected: false,
      message: error?.message || "Failed to load Brevo email analytics.",
      updatedAt: new Date().toISOString(),
    });
  }
};

exports.getBroadcastEmailAudience = async (_req, res) => {
  try {
    const count = await User.countDocuments({
      email: { $exists: true, $ne: "" },
    });

    res.json({
      success: true,
      count,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Broadcast audience count error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to load email audience count.",
    });
  }
};

exports.sendBroadcastEmail = async (req, res) => {
  try {
    const title = normalizeText(req.body?.title);
    const subject = normalizeText(req.body?.subject);
    const description = normalizeText(req.body?.description);
    const linkUrl = normalizeText(req.body?.linkUrl);
    const linkLabel = normalizeText(req.body?.linkLabel) || "Open link";

    if (!title || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, subject and description are required.",
      });
    }

    if (title.length > 120 || subject.length > 160) {
      return res.status(400).json({
        success: false,
        message: "Title or subject is too long.",
      });
    }

    if (description.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Description must be 5000 characters or fewer.",
      });
    }

    if (!isValidHttpUrl(linkUrl)) {
      return res.status(400).json({
        success: false,
        message: "Link must start with http:// or https://.",
      });
    }

    const users = await User.find({ email: { $exists: true, $ne: "" } })
      .select("firstName lastName email")
      .lean();

    if (!users.length) {
      return res.status(400).json({
        success: false,
        message: "No registered users with email addresses were found.",
      });
    }

    const senderName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") || "GFG BVCOE Team";
    const html = broadcastEmailTemplate({
      title,
      description,
      linkUrl,
      linkLabel,
      senderName,
    });

    const results = await Promise.allSettled(
      users.map((user) => mailSender(user.email, subject, html))
    );
    const failedEmails = [];
    let sent = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        sent += 1;
        return;
      }
      failedEmails.push(users[index].email);
    });

    res.json({
      success: sent > 0,
      message:
        sent > 0
          ? `Email sent to ${sent} of ${users.length} registered users.`
          : "Email could not be sent to any registered users.",
      total: users.length,
      sent,
      failed: failedEmails.length,
      failedEmails: failedEmails.slice(0, 10),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Broadcast email error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to send broadcast email.",
    });
  }
};

exports.getMemberBroadcastEmailAudience = async (_req, res) => {
  try {
    const recipients = await getDepartmentMemberEmailRecipients();
    res.json({ success: true, count: recipients.length, recipients });
  } catch (error) {
    console.error("Member broadcast audience error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load member email audience." });
  }
};

exports.sendMemberBroadcastEmail = async (req, res) => {
  try {
    const title = normalizeText(req.body?.title);
    const subject = normalizeText(req.body?.subject);
    const description = normalizeText(req.body?.description);
    const linkUrl = normalizeText(req.body?.linkUrl);
    const linkLabel = normalizeText(req.body?.linkLabel) || "Open link";
    if (!title || !subject || !description) return res.status(400).json({ success: false, message: "Title, subject and description are required." });
    if (title.length > 120 || subject.length > 160 || description.length > 5000) return res.status(400).json({ success: false, message: "One or more email fields are too long." });
    if (!isValidHttpUrl(linkUrl)) return res.status(400).json({ success: false, message: "Link must start with http:// or https://." });

    const recipients = await getDepartmentMemberEmailRecipients();
    if (!recipients.length) return res.status(400).json({ success: false, message: "No department members with email addresses were found." });
    const html = broadcastEmailTemplate({ title, description, linkUrl, linkLabel, senderName: "GFG BVCOE Team" });
    const results = await Promise.allSettled(recipients.map((member) => mailSender(member.email, subject, html)));
    const failedEmails = [];
    let sent = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) sent += 1;
      else failedEmails.push(recipients[index].email);
    });
    res.json({
      success: sent > 0,
      message: sent > 0 ? `Email sent to ${sent} of ${recipients.length} members.` : "Email could not be sent to any members.",
      total: recipients.length, sent, failed: failedEmails.length, failedEmails: failedEmails.slice(0, 10), updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Member broadcast email error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to send member email." });
  }
};

exports.getUnsignedMemberBroadcastEmailAudience = async (_req, res) => {
  try {
    const recipients = await getDepartmentMemberUnsignedEmailRecipients();
    res.json({ success: true, count: recipients.length, recipients });
  } catch (error) {
    console.error("Unsigned member broadcast audience error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load unsigned member email audience." });
  }
};

exports.sendUnsignedMemberBroadcastEmail = async (req, res) => {
  try {
    const title = normalizeText(req.body?.title);
    const subject = normalizeText(req.body?.subject);
    const description = normalizeText(req.body?.description);
    const linkUrl = normalizeText(req.body?.linkUrl);
    const linkLabel = normalizeText(req.body?.linkLabel) || "Open link";
    if (!title || !subject || !description) return res.status(400).json({ success: false, message: "Title, subject and description are required." });
    if (title.length > 120 || subject.length > 160 || description.length > 5000) return res.status(400).json({ success: false, message: "One or more email fields are too long." });
    if (!isValidHttpUrl(linkUrl)) return res.status(400).json({ success: false, message: "Link must start with http:// or https://." });

    const recipients = await getDepartmentMemberUnsignedEmailRecipients();
    if (!recipients.length) return res.status(400).json({ success: false, message: "No unsigned department members with email addresses were found." });
    const html = broadcastEmailTemplate({ title, description, linkUrl, linkLabel, senderName: "GFG BVCOE Team" });
    const results = await Promise.allSettled(recipients.map((member) => mailSender(member.email, subject, html)));
    const failedEmails = [];
    let sent = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) sent += 1;
      else failedEmails.push(recipients[index].email);
    });
    res.json({
      success: sent > 0,
      message: sent > 0 ? `Email sent to ${sent} of ${recipients.length} unsigned members.` : "Email could not be sent to any unsigned members.",
      total: recipients.length, sent, failed: failedEmails.length, failedEmails: failedEmails.slice(0, 10), updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unsigned member broadcast email error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to send unsigned member email." });
  }
};

exports.getTargetedEmailRecipients = async (_req, res) => {
  try {
    const users = await User.find({ email: { $exists: true, $ne: "" } })
      .select("firstName lastName email accountType")
      .sort({ firstName: 1, lastName: 1, email: 1 })
      .lean();
    const teamMemberGroups = await Promise.all(
      TEAM_DEPARTMENTS.map(async (department) => {
        const members = await getTeamMemberModel(department).find({
          email: { $exists: true, $ne: "" },
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        }).select("name email").lean();
        return members.map((member) => ({
          _id: member._id,
          name: member.name || member.email,
          email: member.email,
          department,
          type: "teamMember",
        }));
      })
    );
    const recipients = [
      ...users.map((user) => ({
        _id: user._id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
        email: user.email,
        department: user.accountType || "Society",
        type: "user",
      })),
      ...teamMemberGroups.flat(),
    ];
    const uniqueRecipients = Array.from(
      new Map(recipients.map((recipient) => [String(recipient.email).toLowerCase(), recipient])).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, data: uniqueRecipients });
  } catch (error) {
    console.error("Targeted email recipients error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load members." });
  }
};

exports.sendTargetedEmail = async (req, res) => {
  try {
    const recipientEmail = normalizeText(req.body?.recipientEmail).toLowerCase();
    const title = normalizeText(req.body?.title);
    const subject = normalizeText(req.body?.subject);
    const description = normalizeText(req.body?.description);
    const linkUrl = normalizeText(req.body?.linkUrl);
    const linkLabel = normalizeText(req.body?.linkLabel) || "Open link";

    if (!isValidEmail(recipientEmail)) {
      return res.status(400).json({ success: false, message: "Enter a valid recipient email address." });
    }
    if (!title || !subject || !description) {
      return res.status(400).json({ success: false, message: "Title, subject and description are required." });
    }
    if (title.length > 120 || subject.length > 160 || description.length > 5000) {
      return res.status(400).json({ success: false, message: "One or more email fields are too long." });
    }
    if (!isValidHttpUrl(linkUrl)) {
      return res.status(400).json({ success: false, message: "Link must start with http:// or https://." });
    }

    const senderName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") || "GFG BVCOE Team";
    const html = broadcastEmailTemplate({ title, description, linkUrl, linkLabel, senderName });
    const delivered = await mailSender(recipientEmail, subject, html);
    if (!delivered) {
      return res.status(502).json({ success: false, message: "Email provider could not deliver this email." });
    }
    res.json({ success: true, message: `Email sent to ${recipientEmail}.`, recipientEmail });
  } catch (error) {
    console.error("Targeted email error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to send email." });
  }
};
