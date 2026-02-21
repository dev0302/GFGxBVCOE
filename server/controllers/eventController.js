const Event = require("../models/Event");
const EventUploadConfig = require("../models/EventUploadConfig");
const EventUploadLink = require("../models/EventUploadLink");
const UpcomingEvent = require("../models/UpcomingEvent");
const { CONFIG_KEY, CORE_EVENT_UPLOAD_ROLES, FORCE_DELETE_CONFIG_KEY, CORE_FORCE_DELETE_ROLES } = require("../models/EventUploadConfig");
const { imageUpload, videoUpload, deleteImageByUrl, deleteAssetByUrl } = require("../config/cloudinary");
const { logActivity } = require("../utils/activityLog");

const UPLOAD_LINK_EXPIRY_HOURS = 12;

const FOLDER = "gfg-events";

const createEvent = async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      location,
      category,
      description,
      modalDescription,
      targetAudience,
      agenda,
      prerequisites,
      speakers,
    } = req.body;

    if (!title || !date || !time || !location || !category || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, date, time, location, category and description are required.",
      });
    }

    const galleryUrls = [];

    if (req.files && req.files.gallery) {
      const files = Array.isArray(req.files.gallery) ? req.files.gallery : [req.files.gallery];
      for (const file of files) {
        const ext = (file.name || "").split(".").pop().toLowerCase();
        const videoTypes = ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "mpeg", "mpg", "3gp", "m4v"];
        if (videoTypes.includes(ext)) {
          const result = await videoUpload(file, FOLDER);
          galleryUrls.push(result.secure_url);
        } else {
          const result = await imageUpload(file, FOLDER);
          galleryUrls.push(result.secure_url);
        }
      }
    }

    if (galleryUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one gallery image or video is required.",
      });
    }

    const parseJson = (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val || [];
    };

    const event = await Event.create({
      title,
      date,
      time,
      location,
      category,
      description,
      modalDescription: modalDescription || description,
      galleryImages: galleryUrls,
      speakers: parseJson(speakers) || [],
      agenda: parseJson(agenda) || [],
      prerequisites: parseJson(prerequisites) || [],
      targetAudience: targetAudience || "",
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create event",
    });
  }
};

/** Delete all event gallery assets (images/videos) from Cloudinary. */
async function deleteEventGalleryFromCloudinary(event) {
  const urls = event?.galleryImages || [];
  for (const url of urls) {
    if (url) await deleteAssetByUrl(url);
  }
}

const getAllEvents = async (req, res) => {
  try {
    const now = new Date();
    const toRemove = await Event.find({ scheduledDeleteAt: { $lte: now } }).lean();
    for (const ev of toRemove) {
      await deleteEventGalleryFromCloudinary(ev);
    }
    await Event.deleteMany({ scheduledDeleteAt: { $lte: now } });
    const forManage = req.query.manage === "1";
    const query = forManage
      ? { $or: [{ scheduledDeleteAt: null }, { scheduledDeleteAt: { $gt: now } }] }
      : { scheduledDeleteAt: null };
    const events = await Event.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Get events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

/** Schedule event for deletion in 10 days (soft delete). */
const scheduleDeleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const scheduledDeleteAt = new Date(Date.now() + TEN_DAYS_MS);
    const event = await Event.findByIdAndUpdate(
      id,
      { scheduledDeleteAt },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Event scheduled for deletion in 10 days",
      data: event,
    });
  } catch (error) {
    console.error("Schedule delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to schedule deletion",
    });
  }
};

/** Cancel scheduled deletion. */
const cancelScheduledDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndUpdate(
      id,
      { scheduledDeleteAt: null },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Deletion cancelled",
      data: event,
    });
  } catch (error) {
    console.error("Cancel delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel deletion",
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
};

const parseJson = (val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val || [];
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const {
      title,
      date,
      time,
      location,
      category,
      description,
      modalDescription,
      targetAudience,
      agenda,
      prerequisites,
      speakers,
    } = req.body;

    if (title !== undefined) event.title = title;
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (location !== undefined) event.location = location;
    if (category !== undefined) event.category = category;
    if (description !== undefined) event.description = description;
    if (modalDescription !== undefined) event.modalDescription = modalDescription;
    if (targetAudience !== undefined) event.targetAudience = targetAudience;
    if (agenda !== undefined) event.agenda = parseJson(agenda) || [];
    if (prerequisites !== undefined) event.prerequisites = parseJson(prerequisites) || [];
    if (speakers !== undefined) event.speakers = parseJson(speakers) || [];

    if (req.files && req.files.gallery && req.files.gallery.length) {
      const files = Array.isArray(req.files.gallery) ? req.files.gallery : [req.files.gallery];
      const galleryUrls = [];
      for (const file of files) {
        const ext = (file.name || "").split(".").pop().toLowerCase();
        const videoTypes = ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "mpeg", "mpg", "3gp", "m4v"];
        if (videoTypes.includes(ext)) {
          const result = await videoUpload(file, FOLDER);
          galleryUrls.push(result.secure_url);
        } else {
          const result = await imageUpload(file, FOLDER);
          galleryUrls.push(result.secure_url);
        }
      }
      if (galleryUrls.length > 0) event.galleryImages = galleryUrls;
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update event",
    });
  }
};

// ---------- Upload event by link (12h expiry) ----------
const createUploadLink = async (req, res) => {
  try {
    const expiresAt = new Date(Date.now() + UPLOAD_LINK_EXPIRY_HOURS * 60 * 60 * 1000);
    const token = EventUploadLink.generateToken();
    await EventUploadLink.create({ token, expiresAt });
    if (req.user?.id) {
      await logActivity(req.user.id, "event_upload_link_create", "event", {}, "", "EventUploadLink");
    }
    return res.status(201).json({
      success: true,
      message: "Link created. Valid for 12 hours.",
      data: { token, expiresAt },
    });
  } catch (error) {
    console.error("Create upload link error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create link",
    });
  }
};

const suspendUploadLink = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await EventUploadLink.deleteOne({ token });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Link not found or already suspended." });
    }
    if (req.user?.id) {
      await logActivity(req.user.id, "event_upload_link_suspend", "event", {}, "", "EventUploadLink");
    }
    return res.status(200).json({ success: true, message: "Link suspended." });
  } catch (error) {
    console.error("Suspend upload link error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to suspend link" });
  }
};

const validateUploadLink = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await EventUploadLink.findOne({ token });
    if (!link) {
      return res.status(404).json({ success: false, message: "Invalid link.", valid: false });
    }
    if (new Date() > link.expiresAt) {
      return res.status(400).json({ success: false, message: "Link has expired.", valid: false });
    }
    return res.status(200).json({
      success: true,
      valid: true,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error("Validate upload link error:", error);
    return res.status(500).json({ success: false, valid: false });
  }
};

const createEventByLink = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await EventUploadLink.findOne({ token });
    if (!link) {
      return res.status(404).json({ success: false, message: "Invalid link." });
    }
    if (new Date() > link.expiresAt) {
      return res.status(400).json({ success: false, message: "Link has expired." });
    }

    const {
      title,
      date,
      time,
      location,
      category,
      description,
      modalDescription,
      targetAudience,
      agenda,
      prerequisites,
      speakers,
    } = req.body;

    if (!title || !date || !time || !location || !category || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, date, time, location, category and description are required.",
      });
    }

    const galleryUrls = [];
    if (req.files && req.files.gallery) {
      const files = Array.isArray(req.files.gallery) ? req.files.gallery : [req.files.gallery];
      for (const file of files) {
        const ext = (file.name || "").split(".").pop().toLowerCase();
        const videoTypes = ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "mpeg", "mpg", "3gp", "m4v"];
        if (videoTypes.includes(ext)) {
          const result = await videoUpload(file, FOLDER);
          galleryUrls.push(result.secure_url);
        } else {
          const result = await imageUpload(file, FOLDER);
          galleryUrls.push(result.secure_url);
        }
      }
    }
    if (galleryUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one gallery image or video is required.",
      });
    }

    const parseJson = (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val || [];
    };

    const event = await Event.create({
      title,
      date,
      time,
      location,
      category,
      description,
      modalDescription: modalDescription || description,
      galleryImages: galleryUrls,
      speakers: parseJson(speakers) || [],
      agenda: parseJson(agenda) || [],
      prerequisites: parseJson(prerequisites) || [],
      targetAudience: targetAudience || "",
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    console.error("Create event by link error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create event",
    });
  }
};

// ---------- Event upload allowed departments (who can access /uploadevent) ----------
async function getEventUploadAllowedList() {
  const doc = await EventUploadConfig.findOne({ configKey: CONFIG_KEY });
  const extra = doc?.extraAllowedDepartments?.filter(Boolean) || [];
  return [...CORE_EVENT_UPLOAD_ROLES, ...extra];
}

async function requireEventUploadAccess(req, res, next) {
  try {
    const list = await getEventUploadAllowedList();
    if (!list.includes(req.user?.accountType)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to event upload.",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Access check failed.",
    });
  }
}

/** Only Faculty Incharge, Chairperson, Vice-Chairperson, Event Management can add/remove allowed departments. */
function requireCanManageEventUploadConfig(req, res, next) {
  if (!CORE_EVENT_UPLOAD_ROLES.includes(req.user?.accountType)) {
    return res.status(403).json({
      success: false,
      message: "Only Faculty Incharge, Chairperson, Vice-Chairperson and Event Management can manage this list.",
    });
  }
  next();
}

const getEventUploadAllowed = async (req, res) => {
  try {
    const list = await getEventUploadAllowedList();
    const doc = await EventUploadConfig.findOne({ configKey: CONFIG_KEY });
    const extra = doc?.extraAllowedDepartments?.filter(Boolean) || [];
    return res.status(200).json({
      success: true,
      data: {
        core: CORE_EVENT_UPLOAD_ROLES,
        extra,
        all: list,
      },
    });
  } catch (error) {
    console.error("Get event upload allowed error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch allowed departments.",
    });
  }
};

const addEventUploadDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    const dept = department?.trim();
    if (!dept) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
      });
    }
    if (CORE_EVENT_UPLOAD_ROLES.includes(dept)) {
      return res.status(400).json({
        success: false,
        message: "This department is already in the core list and cannot be added again.",
      });
    }
    let doc = await EventUploadConfig.findOne({ configKey: CONFIG_KEY });
    if (!doc) {
      doc = await EventUploadConfig.create({
        configKey: CONFIG_KEY,
        extraAllowedDepartments: [],
      });
    }
    if (doc.extraAllowedDepartments.includes(dept)) {
      return res.status(400).json({
        success: false,
        message: "Department is already in the allowed list.",
      });
    }
    doc.extraAllowedDepartments.push(dept);
    await doc.save();
    const extra = doc.extraAllowedDepartments.filter(Boolean);
    if (req.user?.id) {
      await logActivity(req.user.id, "event_upload_permission_add", "permission", { department: dept }, "", "EventUploadConfig");
    }
    return res.status(200).json({
      success: true,
      message: "Department added.",
      data: { core: CORE_EVENT_UPLOAD_ROLES, extra, all: [...CORE_EVENT_UPLOAD_ROLES, ...extra] },
    });
  } catch (error) {
    console.error("Add event upload department error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add department.",
    });
  }
};

const removeEventUploadDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    const dept = department?.trim();
    if (!dept) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
      });
    }
    if (CORE_EVENT_UPLOAD_ROLES.includes(dept)) {
      return res.status(400).json({
        success: false,
        message: "Core departments (Faculty Incharge, Chairperson, Vice-Chairperson, Event Management) cannot be removed.",
      });
    }
    const doc = await EventUploadConfig.findOne({ configKey: CONFIG_KEY });
    if (!doc) {
      return res.status(200).json({
        success: true,
        data: { core: CORE_EVENT_UPLOAD_ROLES, extra: [], all: CORE_EVENT_UPLOAD_ROLES },
      });
    }
    doc.extraAllowedDepartments = doc.extraAllowedDepartments.filter((d) => d !== dept);
    await doc.save();
    const extra = doc.extraAllowedDepartments.filter(Boolean);
    if (req.user?.id) {
      await logActivity(req.user.id, "event_upload_permission_remove", "permission", { department: dept }, "", "EventUploadConfig");
    }
    return res.status(200).json({
      success: true,
      message: "Department removed.",
      data: { core: CORE_EVENT_UPLOAD_ROLES, extra, all: [...CORE_EVENT_UPLOAD_ROLES, ...extra] },
    });
  } catch (error) {
    console.error("Remove event upload department error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove department.",
    });
  }
};

// ---------- Force delete (immediate) – only Faculty Incharge + allowed departments ----------
async function getForceDeleteAllowedList() {
  const doc = await EventUploadConfig.findOne({ configKey: FORCE_DELETE_CONFIG_KEY });
  const extra = doc?.extraAllowedDepartments?.filter(Boolean) || [];
  return [...CORE_FORCE_DELETE_ROLES, ...extra];
}

/** Only Faculty Incharge, Chairperson and Vice-Chairperson can manage the force-delete allowed list. */
function requireCanManageForceDeleteConfig(req, res, next) {
  if (!CORE_FORCE_DELETE_ROLES.includes(req.user?.accountType)) {
    return res.status(403).json({
      success: false,
      message: "Only Faculty Incharge, Chairperson and Vice-Chairperson can manage force-delete permissions.",
    });
  }
  next();
}

/** User must be in force-delete allowed list to call force-delete. */
async function requireCanForceDeleteEvent(req, res, next) {
  try {
    const list = await getForceDeleteAllowedList();
    if (!list.includes(req.user?.accountType)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to force-delete events.",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Access check failed.",
    });
  }
}

/** Permanently delete event immediately (no 10-day delay). */
const forceDeleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    await deleteEventGalleryFromCloudinary(event);
    const title = event.title;
    await Event.findByIdAndDelete(id);
    if (req.user?.id) {
      await logActivity(req.user.id, "event_force_delete", "event", { title }, id, "Event");
    }
    return res.status(200).json({
      success: true,
      message: "Event deleted permanently",
    });
  } catch (error) {
    console.error("Force delete event error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete event",
    });
  }
};

const getForceDeleteAllowed = async (req, res) => {
  try {
    const list = await getForceDeleteAllowedList();
    const doc = await EventUploadConfig.findOne({ configKey: FORCE_DELETE_CONFIG_KEY });
    const extra = doc?.extraAllowedDepartments?.filter(Boolean) || [];
    const canManage = CORE_FORCE_DELETE_ROLES.includes(req.user?.accountType);
    return res.status(200).json({
      success: true,
      allowed: list.includes(req.user?.accountType),
      canManage,
      ...(canManage && {
        data: {
          core: CORE_FORCE_DELETE_ROLES,
          extra,
          all: list,
        },
      }),
    });
  } catch (error) {
    console.error("Get force-delete allowed error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch force-delete permissions.",
    });
  }
};

const addForceDeleteDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    const dept = department?.trim();
    if (!dept) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
      });
    }
    if (CORE_FORCE_DELETE_ROLES.includes(dept)) {
      return res.status(400).json({
        success: false,
        message: "Faculty Incharge, Chairperson and Vice-Chairperson are already in the list and cannot be added again.",
      });
    }
    let doc = await EventUploadConfig.findOne({ configKey: FORCE_DELETE_CONFIG_KEY });
    if (!doc) {
      doc = await EventUploadConfig.create({
        configKey: FORCE_DELETE_CONFIG_KEY,
        extraAllowedDepartments: [],
      });
    }
    if (doc.extraAllowedDepartments.includes(dept)) {
      return res.status(400).json({
        success: false,
        message: "Department is already allowed to force-delete.",
      });
    }
    doc.extraAllowedDepartments.push(dept);
    await doc.save();
    const extra = doc.extraAllowedDepartments.filter(Boolean);
    if (req.user?.id) {
      await logActivity(req.user.id, "force_delete_permission_add", "permission", { department: dept }, "", "EventUploadConfig");
    }
    return res.status(200).json({
      success: true,
      message: "Department can now force-delete events.",
      data: { core: CORE_FORCE_DELETE_ROLES, extra, all: [...CORE_FORCE_DELETE_ROLES, ...extra] },
    });
  } catch (error) {
    console.error("Add force-delete department error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add.",
    });
  }
};

const removeForceDeleteDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    const dept = department?.trim();
    if (!dept) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
      });
    }
    if (CORE_FORCE_DELETE_ROLES.includes(dept)) {
      return res.status(400).json({
        success: false,
        message: "Faculty Incharge, Chairperson and Vice-Chairperson cannot be removed from force-delete permissions.",
      });
    }
    const doc = await EventUploadConfig.findOne({ configKey: FORCE_DELETE_CONFIG_KEY });
    if (!doc) {
      return res.status(200).json({
        success: true,
        data: { core: CORE_FORCE_DELETE_ROLES, extra: [], all: CORE_FORCE_DELETE_ROLES },
      });
    }
    doc.extraAllowedDepartments = doc.extraAllowedDepartments.filter((d) => d !== dept);
    await doc.save();
    const extra = doc.extraAllowedDepartments.filter(Boolean);
    if (req.user?.id) {
      await logActivity(req.user.id, "force_delete_permission_remove", "permission", { department: dept }, "", "EventUploadConfig");
    }
    return res.status(200).json({
      success: true,
      message: "Department removed from force-delete.",
      data: { core: CORE_FORCE_DELETE_ROLES, extra, all: [...CORE_FORCE_DELETE_ROLES, ...extra] },
    });
  } catch (error) {
    console.error("Remove force-delete department error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove.",
    });
  }
};

// ---------- Upcoming events (auto-delete on event date) ----------
const UPCOMING_FOLDER = "gfg-events/upcoming";

const getUpcomingEvents = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const toRemove = await UpcomingEvent.find({ date: { $lt: startOfToday } }).lean();
    for (const ev of toRemove) {
      if (ev.poster) await deleteImageByUrl(ev.poster);
    }
    await UpcomingEvent.deleteMany({ date: { $lt: startOfToday } });
    const list = await UpcomingEvent.find({ date: { $gte: startOfToday } }).sort({ date: 1 }).lean();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error("getUpcomingEvents error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createUpcomingEvent = async (req, res) => {
  try {
    const { title, date, description, location, time, targetAudience, otherLinks, otherDocs } = req.body;
    if (!title?.trim() || !date) {
      return res.status(400).json({ success: false, message: "Title and date are required." });
    }
    let poster = "";
    if (req.files?.poster) {
      const result = await imageUpload(req.files.poster, UPCOMING_FOLDER, 85);
      poster = result.secure_url;
    }
    const event = await UpcomingEvent.create({
      title: title.trim(),
      date: new Date(date),
      description: (description || "").trim(),
      poster,
      location: (location || "").trim(),
      time: (time || "").trim(),
      targetAudience: (targetAudience || "").trim(),
      otherLinks: (otherLinks || "").trim(),
      otherDocs: (otherDocs || "").trim(),
    });
    if (req.user?.id) {
      await logActivity(req.user.id, "upcoming_event_create", "event", { title: event.title }, event._id.toString(), "UpcomingEvent");
    }
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("createUpcomingEvent error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateUpcomingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, description, location, time, targetAudience, otherLinks, otherDocs } = req.body;
    const existing = await UpcomingEvent.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Upcoming event not found." });
    }
    let poster = existing.poster;
    if (req.files?.poster) {
      const result = await imageUpload(req.files.poster, UPCOMING_FOLDER, 85);
      poster = result.secure_url;
    }
    const updates = {
      ...(title !== undefined && { title: title.trim() }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(description !== undefined && { description: (description || "").trim() }),
      poster,
      ...(location !== undefined && { location: (location || "").trim() }),
      ...(time !== undefined && { time: (time || "").trim() }),
      ...(targetAudience !== undefined && { targetAudience: (targetAudience || "").trim() }),
      ...(otherLinks !== undefined && { otherLinks: (otherLinks || "").trim() }),
      ...(otherDocs !== undefined && { otherDocs: (otherDocs || "").trim() }),
    };
    const event = await UpcomingEvent.findByIdAndUpdate(id, updates, { new: true });
    if (req.user?.id) {
      await logActivity(req.user.id, "upcoming_event_update", "event", { title: event?.title }, id, "UpcomingEvent");
    }
    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error("updateUpcomingEvent error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUpcomingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await UpcomingEvent.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Upcoming event not found." });
    }
    if (event.poster) {
      await deleteImageByUrl(event.poster);
    }
    const title = event.title;
    await UpcomingEvent.findByIdAndDelete(id);
    if (req.user?.id) {
      await logActivity(req.user.id, "upcoming_event_delete", "event", { title }, id, "UpcomingEvent");
    }
    return res.status(200).json({ success: true, message: "Deleted." });
  } catch (error) {
    console.error("deleteUpcomingEvent error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  deleteEvent,
  scheduleDeleteEvent,
  cancelScheduledDelete,
  forceDeleteEvent,
  updateEvent,
  createUploadLink,
  validateUploadLink,
  createEventByLink,
  suspendUploadLink,
  getEventUploadAllowed,
  addEventUploadDepartment,
  removeEventUploadDepartment,
  requireEventUploadAccess,
  requireCanManageEventUploadConfig,
  getEventUploadAllowedList,
  getForceDeleteAllowed,
  addForceDeleteDepartment,
  removeForceDeleteDepartment,
  requireCanManageForceDeleteConfig,
  requireCanForceDeleteEvent,
  getUpcomingEvents,
  createUpcomingEvent,
  updateUpcomingEvent,
  deleteUpcomingEvent,
};
