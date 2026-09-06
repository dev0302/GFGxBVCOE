import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clipboard, Clock, UserCheck } from "react-feather";
import { getTasks } from "../services/api";
import { useAuth } from "../context/AuthContext";

const DISPLAY_DELAY_MS = 1500;
const DISPLAY_DURATION_MS = 8000;
const COLLAPSE_DURATION_MS = 850;
const FLY_DURATION_MS = 1750;
const MotionDiv = motion.div;
const MotionSection = motion.section;

function isAssignedToUser(task, userId, userEmail) {
  const assignedId = String(task.assignedTo?.id || "");
  const currentId = String(userId || "");
  if (assignedId && currentId && assignedId === currentId) return true;
  return Boolean(
    task.assignedTo?.email &&
      userEmail &&
      task.assignedTo.email.toLowerCase() === userEmail.toLowerCase(),
  );
}

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";
  const value = new Date(deadline);
  if (Number.isNaN(value.getTime())) return "No deadline";
  return value.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function TaskAssignmentPrompt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [extraTaskCount, setExtraTaskCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(8);
  const [exitPhase, setExitPhase] = useState("show");
  const userId = user?._id;
  const userEmail = user?.email;

  useEffect(() => {
    if (!userId) {
      setTask(null);
      setIsOpen(false);
      return undefined;
    }

    let cancelled = false;
    let revealTimer;
    let dismissTimer;
    let flyTimer;
    let closeTimer;

    const loadPendingAssignment = async () => {
      try {
        const response = await getTasks("ONGOING");
        const assignedTasks = (response.tasks || [])
          .filter((item) => item.status === "ONGOING" && isAssignedToUser(item, userId, userEmail))
          .sort((a, b) => {
            const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
          });
        if (cancelled || !assignedTasks.length) return;

        const taskIds = assignedTasks.map((item) => item._id).filter(Boolean).sort().join(",");
        const storageKey = `gfg-task-assignment-prompt:${userId}`;
        if (sessionStorage.getItem(storageKey) === taskIds) return;
        sessionStorage.setItem(storageKey, taskIds);

        setTask(assignedTasks[0]);
        setExtraTaskCount(Math.max(0, assignedTasks.length - 1));
        revealTimer = window.setTimeout(() => {
          if (cancelled) return;
          setSecondsRemaining(8);
          setExitPhase("show");
          setIsOpen(true);
          dismissTimer = window.setTimeout(() => {
            setExitPhase("collapse");
            flyTimer = window.setTimeout(() => setExitPhase("fly"), COLLAPSE_DURATION_MS);
            closeTimer = window.setTimeout(
              () => setIsOpen(false),
              COLLAPSE_DURATION_MS + FLY_DURATION_MS,
            );
          }, DISPLAY_DURATION_MS);
        }, DISPLAY_DELAY_MS);
      } catch {
        // A task prompt must never block the site if task data is unavailable.
      }
    };

    loadPendingAssignment();
    return () => {
      cancelled = true;
      window.clearTimeout(revealTimer);
      window.clearTimeout(dismissTimer);
      window.clearTimeout(flyTimer);
      window.clearTimeout(closeTimer);
    };
  }, [userId, userEmail]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const countdown = window.setInterval(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [isOpen]);

  const openTasks = () => {
    setIsOpen(false);
    navigate("/tasks");
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={`fixed inset-0 z-[250] flex items-center justify-center p-4 ${
            exitPhase === "show" ? "bg-black/35" : "bg-transparent"
          }`}
          aria-live="polite"
        >
          <MotionSection
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={
              exitPhase === "collapse"
                ? { width: 96, height: 96, padding: 0, borderRadius: "999px", scale: 1, y: 0, x: 0 }
                : exitPhase === "fly"
                  ? { width: 36, height: 36, padding: 0, borderRadius: "999px", scale: 0.45, x: "42vw", y: "-38vh", opacity: 0.65 }
                  : { width: "100%", height: "auto", borderRadius: 24, scale: 1, y: 0, x: 0, opacity: 1 }
            }
            exit={{ opacity: 0 }}
            transition={{
              duration: exitPhase === "collapse" ? COLLAPSE_DURATION_MS / 1000 : exitPhase === "fly" ? FLY_DURATION_MS / 1000 : 0.48,
              ease: exitPhase === "show" ? [0.22, 1, 0.36, 1] : [0.4, 0, 0.2, 1],
            }}
            className={`w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl will-change-transform ${
              exitPhase === "show"
                ? "border-amber-300/30 bg-gradient-to-br from-[#292139] via-[#1e1e2f] to-[#152a32] shadow-black/60"
                : "border-amber-100 bg-amber-400 shadow-[0_0_42px_rgba(251,191,36,0.8)]"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="New task assignment"
          >
            <MotionDiv
              animate={{ opacity: exitPhase === "show" ? 1 : 0, scale: exitPhase === "show" ? 1 : 0.75 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="relative p-6"
            >
              <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-amber-400/15 blur-3xl" />
              <div className="relative flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30">
                  <Clipboard className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Task assigned to you</p>
                  <h2 className="mt-1 text-xl font-bold text-richblack-25">{task.title || "New task"}</h2>
                  {extraTaskCount > 0 && (
                    <p className="mt-1 text-xs text-gray-400">Plus {extraTaskCount} more active task{extraTaskCount === 1 ? "" : "s"}.</p>
                  )}
                </div>
                <span className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 text-sm font-bold tabular-nums text-amber-200">
                  {secondsRemaining}s
                </span>
              </div>

              {task.description && <p className="relative mt-5 line-clamp-3 text-sm leading-6 text-gray-300">{task.description}</p>}

              <div className="relative mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm">
                <p className="flex items-center gap-2 text-gray-300"><UserCheck className="h-4 w-4 text-cyan-300" /> Assigned by <span className="font-medium text-richblack-25">{task.assignedBy?.name || "Your team"}</span></p>
                <p className="flex items-center gap-2 text-gray-300"><Clock className="h-4 w-4 text-amber-300" /> Deadline <span className="font-medium text-richblack-25">{formatDeadline(task.deadline)}</span></p>
              </div>

              <button
                type="button"
                onClick={openTasks}
                className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-[#221b10] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                View task & mark complete
                <ArrowRight className="h-4 w-4" />
              </button>
            </MotionDiv>
          </MotionSection>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
