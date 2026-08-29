const Task = require("../models/Task");
const User = require("../models/User");
const { getTeamMemberModel } = require("../models/TeamMember");
const { TEAM_DEPARTMENTS, SOCIETY_ROLES, getDepartmentRankFromPosition } = require("../utils/leadershipPositions");
const mailSender = require("../utils/mailSender");

const text = (value) => String(value || "").trim();
const escapeHtml = (value) => text(value).replace(/[&<>'"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));

async function currentPerson(user) {
  if (user.isDepartmentMember) {
    const member = await getTeamMemberModel(user.memberDepartment).findById(user.id).lean();
    if (!member) return null;
    return { id: member._id, name: member.name || member.email, email: member.email || "", image: member.photo || "", department: user.memberDepartment || "", role: member.profile?.role || member.profile?.position || member.profile?.p0 || "Member", year: member.profile?.yearOfStudy || member.profile?.year || member.year || "", isDepartmentMember: true };
  }
  const account = await User.findById(user.id).lean();
  if (!account) return null;
  return { id: account._id, name: `${account.firstName || ""} ${account.lastName || ""}`.trim(), email: account.email || "", image: account.image || "", department: TEAM_DEPARTMENTS.includes(account.accountType) ? account.accountType : "Core Team", role: account.accountType || "", year: account.additionalDetails?.year || "", isDepartmentMember: false };
}

async function canAssign(req) {
  const role = text(req.user.accountType);
  if (SOCIETY_ROLES.includes(role)) return true;
  if (req.user.isDepartmentMember) {
    const person = await currentPerson(req.user);
    return /\b(head|lead)\b/i.test(text(person?.role));
  }
  const user = await User.findById(req.user.id)
    .populate("additionalDetails", "position p0")
    .lean();
  if (!user) return false;
  const position = user.additionalDetails?.position || user.additionalDetails?.p0 || "";
  const rank = getDepartmentRankFromPosition(position);
  return rank === "Head" || rank === "Lead";
}

async function findAssignee(id, department) {
  const desiredDepartment = text(department);
  if (desiredDepartment && TEAM_DEPARTMENTS.includes(desiredDepartment)) {
    const member = await getTeamMemberModel(desiredDepartment).findById(id).lean();
    if (member && !member.deletedAt) return { id: member._id, name: member.name, email: member.email || "", image: member.photo || "", department: desiredDepartment, role: member.profile?.role || member.profile?.position || member.profile?.p0 || "Member", year: member.profile?.yearOfStudy || member.profile?.year || member.year || "", isDepartmentMember: true };
  }
  const user = await User.findById(id).lean();
  if (!user) return null;
  return { id: user._id, name: `${user.firstName || ""} ${user.lastName || ""}`.trim(), email: user.email || "", image: user.image || "", department: TEAM_DEPARTMENTS.includes(user.accountType) ? user.accountType : "Core Team", role: user.accountType || "", year: "", isDepartmentMember: false };
}

exports.getEligiblePeople = async (req, res) => {
  try {
    if (!(await canAssign(req))) return res.status(403).json({ success: false, message: "Only Heads, Leads, and society core roles can assign tasks." });
    const query = text(req.query.search).toLowerCase();
    const isCore = SOCIETY_ROLES.includes(text(req.user.accountType));
    const allowedDept = req.user.isDepartmentMember ? req.user.memberDepartment : req.user.accountType;
    const departments = isCore ? TEAM_DEPARTMENTS : [allowedDept];
    const people = [];
    const userFilter = isCore ? {} : { accountType: allowedDept };
    const users = await User.find(userFilter).select("firstName lastName email image accountType additionalDetails").lean();
    users.forEach((u) => people.push({ id: u._id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim(), email: u.email || "", image: u.image || "", department: TEAM_DEPARTMENTS.includes(u.accountType) ? u.accountType : "Core Team", role: u.accountType || "", year: "", isDepartmentMember: false }));
    for (const department of departments) {
      const rows = await getTeamMemberModel(department).find({ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }).select("name email photo year profile").lean();
      rows.forEach((m) => people.push({ id: m._id, name: m.name, email: m.email || "", image: m.photo || "", department, role: m.profile?.role || m.profile?.position || m.profile?.p0 || "Member", year: m.profile?.yearOfStudy || m.profile?.year || m.year || "", isDepartmentMember: true }));
    }
    const filtered = query ? people.filter((p) => [p.name, p.department, p.role, p.year].some((v) => text(v).toLowerCase().includes(query))) : people;
    res.json({ success: true, people: filtered });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to load eligible people.", error: error.message }); }
};

exports.createTask = async (req, res) => {
  try {
    if (!(await canAssign(req))) return res.status(403).json({ success: false, message: "Only Heads, Leads, and society core roles can assign tasks." });
    const title = text(req.body.title), description = text(req.body.description);
    if (!title || !description) return res.status(400).json({ success: false, message: "Task title and description are required." });
    const deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    if (deadline && Number.isNaN(deadline.getTime())) return res.status(400).json({ success: false, message: "Deadline is invalid." });
    const assignedTo = await findAssignee(req.body.assignedToId, req.body.assignedToDepartment);
    if (!assignedTo) return res.status(404).json({ success: false, message: "The selected person no longer exists." });
    const assignedBy = await currentPerson(req.user);
    if (!assignedBy) return res.status(401).json({ success: false, message: "Your account could not be verified." });
    const isCore = SOCIETY_ROLES.includes(text(req.user.accountType));
    if (!isCore) {
      const userDept = req.user.isDepartmentMember ? req.user.memberDepartment : req.user.accountType;
      if (assignedTo.department !== userDept) {
        return res.status(403).json({ success: false, message: "Heads and Leads may only assign tasks inside their department." });
      }
    }
    const task = await Task.create({ title, description, priority: ["LOW", "MEDIUM", "HIGH"].includes(req.body.priority) ? req.body.priority : "MEDIUM", assignedTo, assignedBy, department: assignedTo.department, deadline, history: [{ action: "ASSIGNED", by: assignedBy }] });
    let emailSent = false;
    if (assignedTo.email) {
      const result = await mailSender(assignedTo.email, "New Task Assigned — GFG BVCOE", `<h2>New task assigned</h2><p><strong>Task:</strong> ${escapeHtml(title)}</p><p><strong>Description:</strong><br/>${escapeHtml(description).replace(/\n/g,"<br/>")}</p><p><strong>Assigned by:</strong> ${escapeHtml(assignedBy.name)}</p><p><strong>Department:</strong> ${escapeHtml(assignedTo.department)}</p><p><strong>Deadline:</strong> ${deadline ? deadline.toLocaleString() : "No deadline"}</p>`);
      emailSent = Boolean(result);
      if (!emailSent) console.error(`[tasks] Task ${task._id} created but notification email failed.`);
    }
    res.status(201).json({ success: true, task, emailSent, message: emailSent ? "Task assigned successfully. Email notification sent." : "Task assigned successfully. Email notification could not be sent." });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to assign task.", error: error.message }); }
};

exports.getTasks = async (req, res) => {
  try {
    const person = await currentPerson(req.user); if (!person) return res.status(401).json({ success:false, message:"Account not found." });
    const privileged = await canAssign(req);
    const filter = privileged && !req.user.isDepartmentMember ? {} : privileged ? { department: person.department } : { "assignedTo.id": person.id };
    if (text(req.query.status)) filter.status = text(req.query.status);
    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success:true, tasks });
  } catch (error) { res.status(500).json({ success:false, message:"Unable to load tasks.", error:error.message }); }
};

exports.completeTask = async (req, res) => {
  try {
    const person = await currentPerson(req.user); const task = await Task.findById(req.params.id);
    if (!person || !task) return res.status(404).json({ success:false, message:"Task not found." });
    if (String(task.assignedTo.id) !== String(person.id)) return res.status(403).json({ success:false, message:"Only the assignee can complete this task." });
    if (task.status === "COMPLETED") return res.json({ success:true, task, message:"Task is already completed." });
    task.status = "COMPLETED"; task.completedAt = new Date(); task.completedBy = person; task.history.push({ action:"COMPLETED", by:person }); await task.save();
    res.json({ success:true, task, message:"Task marked as completed." });
  } catch (error) { res.status(500).json({ success:false, message:"Unable to complete task.", error:error.message }); }
};
