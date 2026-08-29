const Task = require("../models/Task");
const User = require("../models/User");
const { getTeamMemberModel } = require("../models/TeamMember");
const { TEAM_DEPARTMENTS, SOCIETY_ROLES, getDepartmentRankFromPosition } = require("../utils/leadershipPositions");
const mailSender = require("../utils/mailSender");
const XLSX = require("xlsx");
const ExcelFile = require("../models/ExcelFile");

const text = (value) => String(value || "").trim();
const escapeHtml = (value) => text(value).replace(/[&<>'"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));

function getRankValue(roleOrPosition) {
  const val = String(roleOrPosition || "").trim();
  if (!val) return 10;
  
  if (val === "ADMIN") return 100;
  if (val === "Chairperson") return 90;
  if (val === "Vice-Chairperson") return 80;
  if (val === "Treasurer") return 70;
  
  const lower = val.toLowerCase();
  if (lower.includes("head")) return 50;
  if (lower.includes("lead")) return 40;
  
  return 10; // Executive / Member
}

async function syncTaskExcel() {
  try {
    const tasks = await Task.find({}).lean();
    const rows = tasks.map(task => {
      const isCompleted = task.status === "COMPLETED";
      const hasDeadline = !!task.deadline;
      const now = new Date();
      
      let computedStatus = task.status;
      let onTime = "N/A";
      
      if (isCompleted) {
        const completedDate = new Date(task.completedAt || task.updatedAt);
        if (!hasDeadline || completedDate <= new Date(task.deadline)) {
          computedStatus = "Completed";
          onTime = "Yes";
        } else {
          computedStatus = "Completed Late";
          onTime = "No";
        }
      } else {
        const deadlineDate = hasDeadline ? new Date(task.deadline) : null;
        if (hasDeadline && now > deadlineDate) {
          computedStatus = "Overdue";
          onTime = "Deadline Missed";
        } else {
          computedStatus = "Ongoing";
          onTime = "Ongoing";
        }
      }
      
      return {
        "Task ID": String(task._id),
        "Title": task.title || "",
        "Description": task.description || "",
        "Priority": task.priority || "MEDIUM",
        "Department": task.department || "",
        "Assigned By Name": task.assignedBy?.name || "",
        "Assigned By Email": task.assignedBy?.email || "",
        "Assigned To Name": task.assignedTo?.name || "",
        "Assigned To Email": task.assignedTo?.email || "",
        "Assigned Date": task.createdAt ? new Date(task.createdAt).toLocaleString("en-IN") : "",
        "Deadline": task.deadline ? new Date(task.deadline).toLocaleString("en-IN") : "No deadline",
        "Completion Date": task.completedAt ? new Date(task.completedAt).toLocaleString("en-IN") : "Not completed",
        "Status": computedStatus,
        "Completed On Time": onTime
      };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Task Assigning");
    
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    await ExcelFile.findOneAndUpdate(
      { filename: "Task Assigining.xlsx" },
      { data: buffer, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    
    const fs = require("fs");
    const path = require("path");
    fs.writeFileSync(path.join(__dirname, "../Task Assigining.xlsx"), buffer);
    console.log("[Excel Sync] Synchronized Task Assigining.xlsx successfully.");
  } catch (error) {
    console.error("[Excel Sync] Error during synchronization:", error.message);
  }
}

async function currentPerson(user) {
  if (user.isDepartmentMember) {
    const member = await getTeamMemberModel(user.memberDepartment).findById(user.id).lean();
    if (!member) return null;
    return { id: member._id, name: member.name || member.email, email: member.email || "", image: member.photo || "", department: user.memberDepartment || "", role: member.profile?.role || member.profile?.position || member.profile?.p0 || "Member", year: member.profile?.yearOfStudy || member.profile?.year || member.year || "", isDepartmentMember: true };
  }
  const account = await User.findById(user.id).populate("additionalDetails").lean();
  if (!account) return null;
  return { id: account._id, name: `${account.firstName || ""} ${account.lastName || ""}`.trim(), email: account.email || "", image: account.image || "", department: TEAM_DEPARTMENTS.includes(account.accountType) ? account.accountType : "Core Team", role: account.additionalDetails?.position || account.additionalDetails?.p0 || account.accountType || "", year: account.additionalDetails?.year || "", isDepartmentMember: false };
}

async function canAssign(req) {
  const person = await currentPerson(req.user);
  if (!person) return false;
  return getRankValue(person.role) >= 40;
}

async function findAssignee(id, department) {
  const desiredDepartment = text(department);
  if (desiredDepartment && TEAM_DEPARTMENTS.includes(desiredDepartment)) {
    const member = await getTeamMemberModel(desiredDepartment).findById(id).lean();
    if (member && !member.deletedAt) return { id: member._id, name: member.name, email: member.email || "", image: member.photo || "", department: desiredDepartment, role: member.profile?.role || member.profile?.position || member.profile?.p0 || "Member", year: member.profile?.yearOfStudy || member.profile?.year || member.year || "", isDepartmentMember: true };
  }
  const user = await User.findById(id).populate("additionalDetails").lean();
  if (!user) return null;
  return { id: user._id, name: `${user.firstName || ""} ${user.lastName || ""}`.trim(), email: user.email || "", image: user.image || "", department: TEAM_DEPARTMENTS.includes(user.accountType) ? user.accountType : "Core Team", role: user.additionalDetails?.position || user.additionalDetails?.p0 || user.accountType || "", year: "", isDepartmentMember: false };
}

exports.getEligiblePeople = async (req, res) => {
  try {
    const assigner = await currentPerson(req.user);
    if (!assigner || getRankValue(assigner.role) < 40) return res.status(403).json({ success: false, message: "Only Heads, Leads, and society core roles can assign tasks." });
    
    const assignerRank = getRankValue(assigner.role);
    const query = text(req.query.search).toLowerCase();
    const isCore = SOCIETY_ROLES.includes(text(req.user.accountType));
    const allowedDept = req.user.isDepartmentMember ? req.user.memberDepartment : req.user.accountType;
    const departments = isCore ? TEAM_DEPARTMENTS : [allowedDept];
    const people = [];
    
    const userFilter = isCore ? {} : { accountType: allowedDept };
    const users = await User.find(userFilter).populate("additionalDetails").select("firstName lastName email image accountType additionalDetails").lean();
    users.forEach((u) => {
      const role = u.additionalDetails?.position || u.additionalDetails?.p0 || u.accountType || "";
      const rank = getRankValue(role);
      if (assignerRank > rank) {
        people.push({ id: u._id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim(), email: u.email || "", image: u.image || "", department: TEAM_DEPARTMENTS.includes(u.accountType) ? u.accountType : "Core Team", role, year: u.additionalDetails?.year || "", isDepartmentMember: false });
      }
    });
    
    for (const department of departments) {
      const rows = await getTeamMemberModel(department).find({ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }).select("name email photo year profile").lean();
      rows.forEach((m) => {
        const role = m.profile?.role || m.profile?.position || m.profile?.p0 || "Member";
        const rank = getRankValue(role);
        if (assignerRank > rank) {
          people.push({ id: m._id, name: m.name, email: m.email || "", image: m.photo || "", department, role, year: m.profile?.yearOfStudy || m.profile?.year || m.year || "", isDepartmentMember: true });
        }
      });
    }
    const filtered = query ? people.filter((p) => [p.name, p.department, p.role, p.year].some((v) => text(v).toLowerCase().includes(query))) : people;
    res.json({ success: true, people: filtered });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to load eligible people.", error: error.message }); }
};

async function triggerGithubEmailWorkflow(task, assignee, assignedBy) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.log("[tasks] GITHUB_TOKEN not set. Skipping GitHub workflow trigger.");
      return false;
    }
    const repoUrl = "https://api.github.com/repos/dev0302/GFGxBVCOE/dispatches";
    const response = await fetch(repoUrl, {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GFGxBVCOE-Backend"
      },
      body: JSON.stringify({
        event_type: "task-assigned",
        client_payload: {
          title: task.title,
          description: task.description.replace(/\n/g, "<br/>"),
          assignee_email: assignee.email,
          assigner_name: assignedBy.name,
          department: assignee.department || task.department,
          deadline: task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline"
        }
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("[tasks] GitHub workflow trigger failed:", response.status, errText);
      return false;
    }
    console.log("[tasks] GitHub email workflow triggered successfully.");
    return true;
  } catch (error) {
    console.error("[tasks] Error triggering GitHub workflow:", error.message);
    return false;
  }
}

exports.createTask = async (req, res) => {
  try {
    const assignedBy = await currentPerson(req.user);
    if (!assignedBy || getRankValue(assignedBy.role) < 40) return res.status(403).json({ success: false, message: "Only Heads, Leads, and society core roles can assign tasks." });
    
    const title = text(req.body.title), description = text(req.body.description);
    if (!title || !description) return res.status(400).json({ success: false, message: "Task title and description are required." });
    
    const deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    if (deadline && Number.isNaN(deadline.getTime())) return res.status(400).json({ success: false, message: "Deadline is invalid." });
    
    const assignedTo = await findAssignee(req.body.assignedToId, req.body.assignedToDepartment);
    if (!assignedTo) return res.status(404).json({ success: false, message: "The selected person no longer exists." });
    
    const assignerRank = getRankValue(assignedBy.role);
    const assigneeRank = getRankValue(assignedTo.role);
    if (assignerRank <= assigneeRank) return res.status(403).json({ success: false, message: "You can only assign tasks to members with a lower post/rank than yours." });
    
    const isCore = SOCIETY_ROLES.includes(text(req.user.accountType));
    if (!isCore) {
      const userDept = req.user.isDepartmentMember ? req.user.memberDepartment : req.user.accountType;
      if (assignedTo.department !== userDept) return res.status(403).json({ success: false, message: "Heads and Leads may only assign tasks inside their department." });
    }
    
    const task = await Task.create({ title, description, priority: ["LOW", "MEDIUM", "HIGH"].includes(req.body.priority) ? req.body.priority : "MEDIUM", assignedTo, assignedBy, department: assignedTo.department, deadline, history: [{ action: "ASSIGNED", by: assignedBy }] });
    await syncTaskExcel();
    let emailSent = false;
    if (assignedTo.email) {
      emailSent = await triggerGithubEmailWorkflow(task, assignedTo, assignedBy);
      if (!emailSent) {
        const result = await mailSender(assignedTo.email, "New Task Assigned — GFG BVCOE", `<h2>You are assigned to the task</h2><p><strong>Task:</strong> ${escapeHtml(title)}</p><p><strong>Description:</strong><br/>${escapeHtml(description).replace(/\n/g,"<br/>")}</p><p><strong>Assigned by:</strong> ${escapeHtml(assignedBy.name)}</p><p><strong>Department:</strong> ${escapeHtml(assignedTo.department)}</p><p><strong>Deadline:</strong> ${deadline ? deadline.toLocaleString() : "No deadline"}</p>`);
        emailSent = Boolean(result);
      }
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
    await syncTaskExcel();
    res.json({ success:true, task, message:"Task marked as completed." });
  } catch (error) { res.status(500).json({ success:false, message:"Unable to complete task.", error:error.message }); }
};

exports.deleteTask = async (req, res) => {
  try {
    const person = await currentPerson(req.user);
    if (!person || getRankValue(person.role) < 40) {
      return res.status(403).json({ success: false, message: "Only Heads, Leads, and society core roles can delete tasks." });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    
    const isCore = SOCIETY_ROLES.includes(text(req.user.accountType));
    const isAssigner = String(task.assignedBy.id) === String(person.id);
    const inSameDepartment = task.department === person.department;
    
    if (!isCore && !isAssigner && !inSameDepartment) {
      return res.status(403).json({ success: false, message: "You can only delete tasks that you assigned or that belong to your department." });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    await syncTaskExcel();
    res.json({ success: true, message: "Task deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to delete task.", error: error.message });
  }
};

exports.downloadExcel = async (req, res) => {
  try {
    const person = await currentPerson(req.user);
    if (!person || getRankValue(person.role) < 40) {
      return res.status(403).json({ success: false, message: "Only Leads, Heads, and Core roles can access this report." });
    }
    let excel = await ExcelFile.findOne({ filename: "Task Assigining.xlsx" });
    if (!excel) {
      await syncTaskExcel();
      excel = await ExcelFile.findOne({ filename: "Task Assigining.xlsx" });
      if (!excel) return res.status(404).json({ success: false, message: "Excel record not found." });
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Task_Assigining.xlsx");
    res.send(excel.data);
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to download Excel record.", error: error.message });
  }
};
