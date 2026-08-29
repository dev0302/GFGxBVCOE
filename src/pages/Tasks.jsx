import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Clipboard, Download, Search, UserPlus } from "react-feather";
import { completeTask, createTask, getTaskPeople, getTasks, deleteTask, getAuthToken } from "../services/api";
import { useAuth } from "../context/AuthContext";

const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function ExpandableDescription({ text }) {
  const [expanded, setExpanded] = useState(false);
  const words = useMemo(() => String(text || "").split(/\s+/).filter(Boolean), [text]);
  const isLong = words.length > 40;
  if (!isLong) return <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">{text}</p>;
  const displayText = expanded ? text : words.slice(0, 40).join(" ") + "...";
  return (
    <div className="mt-2 text-sm text-gray-400">
      <p className="whitespace-pre-wrap inline">{displayText}</p>
      <button onClick={() => setExpanded(!expanded)} className="ml-1 text-cyan-400 hover:text-cyan-300 font-semibold focus:outline-none">
        {expanded ? "Read less" : "Read more"}
      </button>
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
  const [title, setTitle] = useState(""), [description, setDescription] = useState(""), [priority, setPriority] = useState("MEDIUM"), [deadline, setDeadline] = useState(""), [loading, setLoading] = useState(false);
  
  const isCore = useMemo(() => ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"].includes(user?.accountType), [user]);
  const position = useMemo(() => String(user?.additionalDetails?.position || user?.additionalDetails?.role || user?.additionalDetails?.p0 || "").toLowerCase(), [user]);
  const isLeadOrHead = useMemo(() => position.includes("lead") || position.includes("head"), [position]);
  const isPrivileged = isCore || isLeadOrHead;

  const canAssign = people.length > 0 || open;
  const load = async () => { try { setTasks(await getTasks()); } catch (e) { toast.error(e.message); } };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!open) return; const timer = setTimeout(async () => { try { setPeople(await getTaskPeople(search)); } catch (e) { toast.error(e.message); } }, 180); return () => clearTimeout(timer); }, [open, search]);
  const invalidDetails = !title.trim() || !description.trim();
  const reset = () => { setOpen(false); setStep(0); setSelected(null); setTitle(""); setDescription(""); setDeadline(""); };
  const submit = async () => { setLoading(true); try { const data = await createTask({ title, description, priority, deadline: deadline || undefined, assignedToId: selected.id, assignedToDepartment: selected.department }); toast.success(data.message); reset(); load(); } catch (e) { toast.error(e.message); } finally { setLoading(false); } };
  
  const handleDownloadExcel = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/tasks/download-excel`, {
        headers: {
          Authorization: `Bearer ${getAuthToken() || ""}`
        }
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to download file");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Task_Assigining.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Excel report downloaded successfully");
    } catch (e) {
      toast.error(e.message || "Error downloading file");
    }
  };
  
  const ordered = useMemo(() => {
    let list = [...tasks];
    if (user?._id) {
      if (filterTab === "to-me") {
        list = list.filter((t) => String(t.assignedTo.id) === String(user._id));
      } else if (filterTab === "by-me") {
        list = list.filter((t) => String(t.assignedBy.id) === String(user._id));
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
    <div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">GFG BVCOE workspace</p><h1 className="mt-2 text-3xl font-bold">Task management</h1><p className="mt-1 text-sm text-gray-400">Track assignments, deadlines, and permanent task history.</p></div><div className="flex items-center gap-3 flex-wrap"><div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5"><button onClick={() => setFilterTab("to-me")} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === "to-me" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10" : "text-gray-400 hover:text-gray-200"}`}>Assigned to me</button><button onClick={() => setFilterTab("by-me")} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === "by-me" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10" : "text-gray-400 hover:text-gray-200"}`}>Assigned by me</button></div>{isPrivileged && <button onClick={handleDownloadExcel} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5 text-sm font-bold text-cyan-400 hover:bg-cyan-500/10"><Download size={16}/> Download Report</button>}<button onClick={() => { setOpen(true); setSearch(""); }} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><UserPlus size={16}/> Assign task</button></div></div><div className="grid gap-3 md:grid-cols-3">{ordered.map((task) => {
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
        
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.03] text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            {task.assignedBy.image ? (
              <img src={task.assignedBy.image} alt="" className="h-5 w-5 rounded-full object-cover border border-white/10" />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[8px] font-bold text-gray-200">
                {initials(task.assignedBy.name)}
              </span>
            )}
            <span className="font-semibold text-gray-300 truncate" title={task.assignedBy.name}>{task.assignedBy.name}</span>
          </div>
  
          <div className="flex items-center gap-1.5 min-w-0">
            {task.assignedTo.image ? (
              <img src={task.assignedTo.image} alt="" className="h-5 w-5 rounded-full object-cover border border-white/10" />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[8px] font-bold text-gray-200">
                {initials(task.assignedTo.name)}
              </span>
            )}
            <span className="font-semibold text-gray-300 truncate" title={task.assignedTo.name}>{task.assignedTo.name}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          {task.status === "ONGOING" && (
            <button onClick={async () => { try { await completeTask(task._id); toast.success("Task marked complete"); load(); } catch(e) { toast.error(e.message); } }} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20">
              <CheckCircle size={14}/> Mark complete
            </button>
          )}
          {isPrivileged && (String(task.assignedBy.id) === String(user?._id) || isCore) && (
            <button onClick={async () => { if (window.confirm("Are you sure you want to delete this task?")) { try { await deleteTask(task._id); toast.success("Task deleted successfully"); load(); } catch(e) { toast.error(e.message); } } }} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20">
              Delete task
            </button>
          )}
        </div>
      </div>
    </article>
  );
})}{!ordered.length && <div className="col-span-full rounded-2xl border border-dashed border-white/15 py-16 text-center text-gray-500"><Clipboard className="mx-auto mb-3"/>No tasks yet.</div>}</div></div>{open && <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#1e1e2f] to-[#101925] p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-semibold text-cyan-300">STEP {step + 1} OF 3</p><h2 className="text-xl font-bold">{["Select person", "Task details", "Deadline & review"][step]}</h2></div><button onClick={reset} className="text-sm text-gray-400">Cancel</button></div><div className="mb-6 flex gap-2">{[0,1,2].map((n) => <span key={n} className={`h-1 flex-1 rounded ${n <= step ? "bg-cyan-400" : "bg-white/10"}`}/>)}</div>{step === 0 && <><label className="relative block"><Search className="absolute left-3 top-3 text-gray-500" size={17}/><input autoFocus value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search name, department, year, or role" className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-400"/></label><div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{people.map((p) => <button key={`${p.department}-${p.id}`} onClick={()=>setSelected(p)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${selected?.id === p.id ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 hover:bg-white/5"}`}>{p.image ? <img src={p.image} alt="" className="h-10 w-10 rounded-full object-cover"/> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">{initials(p.name)}</span>}<span><b className="block text-sm">{p.name}</b><small className="text-gray-400">{[p.year, p.department, p.role].filter(Boolean).join(" • ")}</small></span></button>)}</div></>}{step === 1 && <div className="space-y-4"><label className="block text-sm">Task title<input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-cyan-400"/></label><label className="block text-sm">Description<textarea rows="6" value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-cyan-400"/></label><label className="block text-sm">Priority<select value={priority} onChange={e=>setPriority(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>{invalidDetails && <p className="text-xs text-rose-300">Title and description are required.</p>}</div>}{step === 2 && <div className="space-y-5"><label className="block text-sm">Deadline <span className="text-gray-500">(optional)</span><input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3"/></label><div className="rounded-xl bg-white/5 p-4 text-sm"><p>Assigned to: <b>{selected?.name}</b></p><p className="mt-2">Task: <b>{title}</b></p><p className="mt-2">Deadline: <b>{deadline ? new Date(deadline).toLocaleString() : "No deadline"}</b></p></div></div>}<div className="mt-7 flex justify-between"><button disabled={!step} onClick={()=>setStep(step-1)} className="text-sm text-gray-300 disabled:opacity-30">← Back</button>{step < 2 ? <button disabled={(step===0&&!selected)||(step===1&&invalidDetails)} onClick={()=>setStep(step+1)} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Next →</button> : <button disabled={loading} onClick={submit} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{loading ? "Assigning…" : "Assign task"}</button>}</div></div></div>}</section>;
}

