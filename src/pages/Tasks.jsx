import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Clipboard, Download, Search, UserPlus } from "react-feather";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { completeTask, createTask, getTaskPeople, getTasks, deleteTask, getAuthToken, getTaskConfig, updateTaskConfig, getTaskReportData } from "../services/api";
import { useAuth } from "../context/AuthContext";

const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function ExpandableDescription({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  const isLong = useMemo(() => {
    if (!text) return false;
    const str = String(text).trim();
    return str.length > 90 || str.includes("\n") || str.split(/\s+/).filter(Boolean).length > 16;
  }, [text]);

  useEffect(() => {
    if (textRef.current) {
      const hasOverflow = textRef.current.scrollHeight > textRef.current.clientHeight + 2;
      setIsOverflowing(hasOverflow || isLong);
    } else {
      setIsOverflowing(isLong);
    }
  }, [text, expanded, isLong]);

  if (!text) return null;

  return (
    <div className="mt-2 text-sm text-gray-400">
      <p
        ref={textRef}
        className={`whitespace-pre-wrap break-words transition-all duration-200 ${
          !expanded ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {(isOverflowing || isLong) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-1 inline-flex items-center text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none cursor-pointer"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function getTaskState(task) {
  const isCompleted = task.status === "COMPLETED";
  const hasDeadline = !!task.deadline;
  const now = new Date();
  
  if (isCompleted) {
    const completedDate = new Date(task.completedAt || task.updatedAt);
    const completedStr = completedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    
    if (!hasDeadline || completedDate <= new Date(task.deadline)) {
      return {
        cardClass: "border-emerald-500/80 bg-emerald-500/[0.04]",
        statusText: `Task completed on ${completedStr} before deadline`,
        statusColor: "bg-emerald-500/15 text-emerald-300",
        badge: "COMPLETED"
      };
    } else {
      return {
        cardClass: "border-emerald-500/80 bg-emerald-500/[0.04]",
        statusText: `Task completed after deadline`,
        statusColor: "bg-emerald-500/15 text-emerald-300",
        badge: "COMPLETED LATE"
      };
    }
  } else {
    // ONGOING
    const deadlineDate = hasDeadline ? new Date(task.deadline) : null;
    const deadlineStr = deadlineDate ? deadlineDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    
    if (hasDeadline && now > deadlineDate) {
      return {
        cardClass: "border-rose-500 bg-rose-500/[0.07] shadow-[0_0_12px_rgba(244,63,94,0.15)]",
        statusText: "Deadline missed.",
        statusColor: "bg-rose-500/20 text-rose-300",
        badge: "DEADLINE MISSED"
      };
    } else {
      return {
        cardClass: "task-pulse border-amber-500 bg-amber-500/[0.03]",
        statusText: hasDeadline ? `Due: ${deadlineStr}` : "No deadline",
        statusColor: "bg-amber-500/15 text-amber-300",
        badge: "ONGOING"
      };
    }
  }
}

export default function Tasks() {
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState("to-me");
  const [tasks, setTasks] = useState([]), [people, setPeople] = useState([]), [search, setSearch] = useState("");
  const [step, setStep] = useState(0), [open, setOpen] = useState(false), [selected, setSelected] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [title, setTitle] = useState(""), [description, setDescription] = useState(""), [priority, setPriority] = useState("MEDIUM"), [deadline, setDeadline] = useState(""), [loading, setLoading] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [allowExecutivesSeeAll, setAllowExecutivesSeeAll] = useState(() => {
    try {
      return localStorage.getItem("gfg_allow_executives_see_all") === "true";
    } catch {
      return false;
    }
  });
  
  const isCore = useMemo(() => ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"].includes(user?.accountType), [user]);
  const position = useMemo(() => String(user?.additionalDetails?.position || user?.additionalDetails?.role || user?.additionalDetails?.p0 || "").toLowerCase(), [user]);
  const isLeadOrHead = useMemo(() => position.includes("lead") || position.includes("head"), [position]);
  const isPrivileged = isCore || isLeadOrHead;

  const canAssign = people.length > 0 || open;
  const load = async () => {
    try {
      const res = await getTasks();
      const taskList = Array.isArray(res) ? res : res.tasks || [];
      setTasks(taskList);
      if (typeof res.allowExecutivesSeeAll === "boolean") {
        setAllowExecutivesSeeAll(res.allowExecutivesSeeAll);
        try {
          localStorage.setItem("gfg_allow_executives_see_all", String(res.allowExecutivesSeeAll));
        } catch (_) {}
      }
    } catch (e) {
      toast.error(e.message);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!open) return; const timer = setTimeout(async () => { try { setPeople(await getTaskPeople(search)); } catch (e) { toast.error(e.message); } }, 180); return () => clearTimeout(timer); }, [open, search]);
  const invalidDetails = !title.trim() || !description.trim();
  const reset = () => { setOpen(false); setStep(0); setSelected(null); setTitle(""); setDescription(""); setDeadline(""); setSuccessDetails(null); };
  const submit = async () => {
    setLoading(true);
    try {
      const data = await createTask({ title, description, priority, deadline: deadline || undefined, assignedToId: selected.id, assignedToDepartment: selected.department });
      setSuccessDetails({
        name: selected.name,
        email: selected.email,
        emailSent: data.emailSent
      });
      setStep(3);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    let toastId;
    try {
      toastId = toast.loading("Generating PDF table report...");
      const allTasks = await getTaskReportData();
      
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4"
      });

      // Header Banner
      doc.setFillColor(15, 23, 42); // Navy Dark
      doc.rect(0, 0, 842, 60, "F");

      doc.setTextColor(45, 212, 191); // Cyan #2dd4bf
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("GFG BVCOE — TASK DATABASE & ASSIGNMENT RECORDS", 36, 34);

      doc.setTextColor(148, 163, 184); // Slate #94a3b8
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const generatedDate = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
      doc.text(`Generated on: ${generatedDate}   |   Total Task Records: ${allTasks.length}`, 36, 48);

      const tableRows = allTasks.map((task, idx) => {
        const isDeleted = Boolean(task.isDeleted || task.status === "DELETED");
        const isCompleted = !isDeleted && task.status === "COMPLETED";
        const hasDeadline = Boolean(task.deadline);
        const now = new Date();

        let statusText = task.status;
        let onTime = "N/A";

        if (isDeleted) {
          statusText = "Deleted";
          onTime = "Deleted";
        } else if (isCompleted) {
          const completedDate = new Date(task.completedAt || task.updatedAt);
          if (!hasDeadline || completedDate <= new Date(task.deadline)) {
            statusText = "Completed";
            onTime = "Yes";
          } else {
            statusText = "Completed Late";
            onTime = "No";
          }
        } else {
          const deadlineDate = hasDeadline ? new Date(task.deadline) : null;
          if (hasDeadline && now > deadlineDate) {
            statusText = "Overdue";
            onTime = "Deadline Missed";
          } else {
            statusText = "Ongoing";
            onTime = "Ongoing";
          }
        }

        const titleText = isDeleted ? `(Deleted) ${task.title || ""}` : (task.title || "");
        const assignedToText = task.assignedTo?.name ? `${task.assignedTo.name} (${task.assignedTo.role || task.department || ""})` : "—";
        const assignedByText = task.assignedBy?.name ? `${task.assignedBy.name} (${task.assignedBy.role || ""})` : "—";
        const assignedDateText = task.createdAt ? new Date(task.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
        const deadlineText = task.deadline ? new Date(task.deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No deadline";

        return [
          idx + 1,
          titleText,
          task.description || "—",
          task.priority || "MEDIUM",
          task.department || "General",
          assignedToText,
          assignedByText,
          assignedDateText,
          deadlineText,
          statusText,
          onTime
        ];
      });

      autoTable(doc, {
        startY: 72,
        head: [["#", "Task Title", "Description", "Priority", "Dept", "Assigned To", "Assigned By", "Assigned", "Deadline", "Status", "On Time"]],
        body: tableRows,
        theme: "grid",
        styles: {
          fontSize: 7.5,
          cellPadding: 4,
          valign: "middle",
          overflow: "linebreak"
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left"
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 20, halign: "center" },
          1: { cellWidth: 100, fontStyle: "bold" },
          2: { cellWidth: 120 },
          3: { cellWidth: 46, halign: "center" },
          4: { cellWidth: 55 },
          5: { cellWidth: 105 },
          6: { cellWidth: 105 },
          7: { cellWidth: 58, halign: "center" },
          8: { cellWidth: 58, halign: "center" },
          9: { cellWidth: 55, halign: "center" },
          10: { cellWidth: 48, halign: "center" }
        },
        didParseCell: (data) => {
          if (data.section === "body") {
            const rawRow = allTasks[data.row.index];
            const isDel = Boolean(rawRow?.isDeleted || rawRow?.status === "DELETED");
            if (isDel) {
              if (data.column.index === 1) {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = "bold";
              }
              if (data.column.index === 9) {
                data.cell.styles.textColor = [220, 38, 38];
              }
            } else if (rawRow?.status === "COMPLETED") {
              if (data.column.index === 9) {
                data.cell.styles.textColor = [16, 185, 129];
              }
            }
          }
        },
        didDrawPage: (data) => {
          const totalPages = doc.internal.getNumberOfPages();
          const pageStr = `Page ${data.pageNumber} of ${totalPages}`;
          doc.setFontSize(8);
          doc.setTextColor(140);
          doc.text(pageStr, 842 - 70, 580);
        }
      });

      doc.save("Task_Database_Records.pdf");
      if (toastId) toast.dismiss(toastId);
      toast.success("Task database PDF report downloaded successfully!");
    } catch (e) {
      if (toastId) toast.dismiss(toastId);
      toast.error(e.message || "Failed to generate PDF report");
    }
  };
  
  const ordered = useMemo(() => {
    let list = [...tasks];
    if (user?._id) {
      if (filterTab === "to-me") {
        list = list.filter((t) => String(t.assignedTo?.id || "") === String(user._id));
      } else if (filterTab === "by-me") {
        list = list.filter((t) => String(t.assignedBy?.id || "") === String(user._id));
      }
    }
    return list.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  }, [tasks, filterTab, user]);

  return <section className="min-h-screen bg-[#0c0c18] px-4 py-24 text-gray-100 sm:px-8">
    <style>{`
      @keyframes borderPulse {
        0%, 100% { border-color: rgba(245, 158, 11, 0.35); box-shadow: 0 0 4px rgba(245, 158, 11, 0.05); }
        50% { border-color: rgba(245, 158, 11, 0.85); box-shadow: 0 0 16px rgba(245, 158, 11, 0.2); }
      }
      .task-pulse {
        animation: borderPulse 2.5s infinite ease-in-out;
      }
    `}</style>
    <div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">GFG BVCOE workspace</p><h1 className="mt-2 text-3xl font-bold">Task management</h1><p className="mt-1 text-sm text-gray-400">Track assignments, deadlines, and permanent task history.</p></div><div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
        <button onClick={() => setFilterTab("to-me")} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === "to-me" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10" : "text-gray-400 hover:text-gray-200"}`}>Assigned to me</button>
        {isPrivileged && (
          <button onClick={() => setFilterTab("by-me")} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === "by-me" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10" : "text-gray-400 hover:text-gray-200"}`}>Assigned by me</button>
        )}
        {(isPrivileged || allowExecutivesSeeAll) && (
          <button onClick={() => setFilterTab("all-tasks")} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === "all-tasks" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10" : "text-gray-400 hover:text-gray-200"}`}>All Tasks</button>
        )}
      </div>
    {isPrivileged && (
      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs font-bold text-gray-300">
        <span>Allow Executives to see all tasks</span>
        <button
          type="button"
          onClick={async () => {
            const nextVal = !allowExecutivesSeeAll;
            setAllowExecutivesSeeAll(nextVal);
            try {
              localStorage.setItem("gfg_allow_executives_see_all", String(nextVal));
            } catch (_) {}
            toast.success(`Executives ${nextVal ? "can now" : "can no longer"} see all tasks.`);
            try {
              await updateTaskConfig(nextVal);
              load();
            } catch (_) {}
          }}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${allowExecutivesSeeAll ? "bg-cyan-500" : "bg-white/10"}`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${allowExecutivesSeeAll ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </label>
    )}{isPrivileged && (
      <button onClick={handleDownloadPDF} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5 text-sm font-bold text-cyan-400 hover:bg-cyan-500/10"><Download size={16}/> Download PDF Report</button>
    )}{isPrivileged && (
      <button onClick={() => { setOpen(true); setSearch(""); }} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><UserPlus size={16}/> Assign task</button>
    )}</div></div><div className="grid gap-3 md:grid-cols-3">{ordered.map((task) => {
  const taskState = getTaskState(task);
  return (
    <article key={task._id} className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-300 ${taskState.cardClass}`}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold">{task.title}</h2>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${taskState.statusColor}`}>{taskState.badge}</span>
        </div>
        <ExpandableDescription text={task.description}/>
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
        <div className="flex flex-col text-[11px] text-gray-400 gap-1.5">
          <div className="flex items-center justify-between">
            <span>Assigned: {new Date(task.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            {task.deadline && <span>Limit: {new Date(task.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
          </div>
          <div className="text-gray-300 font-semibold text-center bg-white/[0.03] py-1 px-2 rounded border border-white/5 text-[10.5px]">
            {taskState.statusText}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.03] text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] text-gray-500 font-medium shrink-0 w-20">Assigned by:</span>
            {task.assignedBy?.image ? (
              <img src={task.assignedBy.image} alt="" className="h-5 w-5 rounded-full object-cover border border-white/10" />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[8px] font-bold text-gray-200">
                {initials(task.assignedBy?.name || "")}
              </span>
            )}
            <span className="font-semibold text-gray-300 truncate animate-fade-in" title={`${task.assignedBy?.name || "Unknown"}${task.assignedBy?.role ? ` (${task.assignedBy.role})` : ""}`}>
              {task.assignedBy?.name || "Unknown"}
              {task.assignedBy?.role && <span className="text-[10px] text-gray-400 font-normal ml-1">({task.assignedBy.role})</span>}
            </span>
          </div>
  
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] text-gray-500 font-medium shrink-0 w-20">Assigned to:</span>
            {task.assignedTo?.image ? (
              <img src={task.assignedTo.image} alt="" className="h-5 w-5 rounded-full object-cover border border-white/10" />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[8px] font-bold text-gray-200">
                {initials(task.assignedTo?.name || "")}
              </span>
            )}
            <span className="font-semibold text-gray-300 truncate animate-fade-in" title={`${task.assignedTo?.name || "Unknown"}${task.assignedTo?.role ? ` (${task.assignedTo.role})` : ""}`}>
              {task.assignedTo?.name || "Unknown"}
              {task.assignedTo?.role && <span className="text-[10px] text-gray-400 font-normal ml-1">({task.assignedTo.role})</span>}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          {task.status === "ONGOING" && (
            <button onClick={async () => { try { await completeTask(task._id); toast.success("Task marked complete"); load(); } catch(e) { toast.error(e.message); } }} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20">
              <CheckCircle size={14}/> Mark complete
            </button>
          )}
          {isPrivileged && (String(task.assignedBy?.id || "") === String(user?._id) || isCore) && (
            <button onClick={() => setConfirmDeleteId(task._id)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20">
              Delete task
            </button>
          )}
        </div>
      </div>
    </article>
  );
})}{!ordered.length && <div className="col-span-full rounded-2xl border border-dashed border-white/15 py-16 text-center text-gray-500"><Clipboard className="mx-auto mb-3"/>No tasks yet.</div>}</div></div>{open && (
  <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#1e1e2f] to-[#101925] p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        {step < 3 ? (
          <div>
            <p className="text-xs font-semibold text-cyan-300">STEP {step + 1} OF 3</p>
            <h2 className="text-xl font-bold">{["Select person", "Task details", "Deadline & review"][step]}</h2>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-emerald-400">ASSIGNMENT COMPLETE</p>
            <h2 className="text-xl font-bold">Confirmation</h2>
          </div>
        )}
        {step < 3 && (
          <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-200">Cancel</button>
        )}
      </div>
      
      {step < 3 && (
        <div className="mb-6 flex gap-2">
          {[0, 1, 2].map((n) => (
            <span key={n} className={`h-1 flex-1 rounded ${n <= step ? "bg-cyan-400" : "bg-white/10"}`} />
          ))}
        </div>
      )}
      
      {step === 0 && (
        <>
          <label className="relative block">
            <Search className="absolute left-3 top-3 text-gray-500" size={17} />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, department, year, or role" className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-400" />
          </label>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {people.map((p) => (
              <button key={`${p.department}-${p.id}`} onClick={() => setSelected(p)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${selected?.id === p.id ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 hover:bg-white/5"}`}>
                {p.image ? (
                  <img src={p.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">{initials(p.name)}</span>
                )}
                <span>
                  <b className="block text-sm">{p.name}</b>
                  <small className="text-gray-400">{[p.year, p.department, p.role].filter(Boolean).join(" • ")}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      
      {step === 1 && (
        <div className="space-y-4">
          <label className="block text-sm">Task title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-cyan-400" />
          </label>
          <label className="block text-sm">Description
            <textarea rows="6" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-cyan-400" />
          </label>
          <label className="block text-sm">Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3">
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
            </select>
          </label>
          {invalidDetails && <p className="text-xs text-rose-300">Title and description are required.</p>}
        </div>
      )}
      
      {step === 2 && (
        <div className="space-y-5">
          <label className="block text-sm">Deadline <span className="text-gray-500">(optional)</span>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" />
          </label>
          <div className="rounded-xl bg-white/5 p-4 text-sm">
            <p>Assigned to: <b>{selected?.name}</b></p>
            <p className="mt-2">Task: <b>{title}</b></p>
            <p className="mt-2">Deadline: <b>{deadline ? new Date(deadline).toLocaleString() : "No deadline"}</b></p>
          </div>
        </div>
      )}
      
      {step === 3 && (
        <div className="flex flex-col items-center text-center py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-6 animate-pulse">
            <CheckCircle size={36} />
          </div>
          <h3 className="text-xl font-bold text-gray-100">Task Assigned Successfully!</h3>
          <p className="mt-3 text-sm text-gray-400 max-w-md leading-relaxed">
            {successDetails?.emailSent ? (
              <>An email notification was successfully sent to <strong className="text-cyan-300">{successDetails.name}</strong> (<span className="text-cyan-300/80">{successDetails.email}</span>).</>
            ) : (
              <>The task was assigned to <strong className="text-cyan-300">{successDetails.name}</strong>, but the email notification could not be dispatched.</>
            )}
          </p>
          <button onClick={reset} className="mt-8 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/10">
            Done
          </button>
        </div>
      )}
      
      {step < 3 && (
        <div className="mt-7 flex justify-between">
          <button disabled={!step} onClick={() => setStep(step - 1)} className="text-sm text-gray-300 disabled:opacity-30">← Back</button>
          {step < 2 ? (
            <button disabled={(step === 0 && !selected) || (step === 1 && invalidDetails)} onClick={() => setStep(step + 1)} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Next →</button>
          ) : (
            <button disabled={loading} onClick={submit} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{loading ? "Assigning…" : "Assign task"}</button>
          )}
        </div>
      )}
    </div>
  </div>
)}{confirmDeleteId && <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-gradient-to-br from-[#1e141a] to-[#100f13] p-6 shadow-2xl"><h3 className="text-lg font-bold text-rose-300">Confirm task deletion</h3><p className="mt-2 text-sm text-gray-400">Are you sure you want to delete this task? This action is permanent and cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setConfirmDeleteId(null)} className="rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10">Cancel</button><button onClick={async()=>{try{await deleteTask(confirmDeleteId);toast.success("Task deleted successfully");setConfirmDeleteId(null);load();}catch(e){toast.error(e.message);}}} className="rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-rose-400">Delete task</button></div></div></div>}</section>;
}

