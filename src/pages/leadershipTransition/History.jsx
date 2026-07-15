import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, TrendingUp, UserPlus, UserMinus, FileText, CheckCircle } from "react-feather";
import { Spinner } from "@/components/ui/spinner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import { getAccountTypeLabel, getLeadershipHistory, formatLeadershipRoleLabel, getLeadershipAppliedSessions, downloadLeadershipReport } from "../../services/api";
import { subscribeLeadershipUpdates } from "../../services/socket";
import { cloudinaryTinyAvatarUrl } from "../../utils/cloudinary";

const FILTERS = [
  { id: "all", label: "All events" },
  { id: "promotions", label: "Promotions" },
  { id: "sessions", label: "Applied sessions" },
  { id: "access", label: "Access" },
];

const ACTION_META = {
  leadership_promote: {
    label: "Promotion",
    icon: TrendingUp,
    filter: "promotions",
    dot: "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.45)]",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
    rowHover: "hover:border-cyan-500/30 hover:bg-cyan-500/[0.04]",
  },
  leadership_allowed_add: {
    label: "Access granted",
    icon: UserPlus,
    filter: "access",
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    rowHover: "hover:border-emerald-500/30 hover:bg-emerald-500/[0.04]",
  },
  leadership_allowed_remove: {
    label: "Access revoked",
    icon: UserMinus,
    filter: "access",
    dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.35)]",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    rowHover: "hover:border-amber-500/30 hover:bg-amber-500/[0.04]",
  },
  leadership_session_applied: {
    label: "Session applied",
    icon: CheckCircle,
    filter: "sessions",
    dot: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.4)]",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/25",
    rowHover: "hover:border-violet-500/30 hover:bg-violet-500/[0.04]",
  },
  leadership_draft_discarded: {
    label: "Draft discarded",
    icon: Clock,
    filter: "sessions",
    dot: "bg-gray-400",
    badge: "bg-gray-500/15 text-gray-300 border-gray-500/25",
    rowHover: "hover:border-gray-500/30 hover:bg-white/[0.03]",
  },
  leadership_draft_abandoned: {
    label: "Draft abandoned",
    icon: Clock,
    filter: "sessions",
    dot: "bg-gray-400",
    badge: "bg-gray-500/15 text-gray-300 border-gray-500/25",
    rowHover: "hover:border-gray-500/30 hover:bg-white/[0.03]",
  },
};

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(date) {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - entryDay) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function actorName(actor) {
  if (!actor) return "Someone";
  const name = `${actor.firstName || ""} ${actor.lastName || ""}`.trim();
  return name || actor.email || "Someone";
}

function subjectName(details = {}, actor) {
  if (details.name || details.email) return details.name || details.email;
  return actorName(actor) || "Unknown user";
}

function initialsFromName(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function Avatar({ image, name, size = "md" }) {
  const src = image ? cloudinaryTinyAvatarUrl(image) : "";
  const initials = initialsFromName(name);
  const sizeClass =
    size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover border border-gray-500/40`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-cyan-600/25 font-semibold text-cyan-100`}
    >
      {initials || "?"}
    </div>
  );
}

function RoleBadge({ value, muted = false }) {
  const label = formatLeadershipRoleLabel(value) || getAccountTypeLabel(value) || value;
  if (!label) return null;

  return (
    <span
      className={`inline-flex max-w-[140px] truncate rounded-md border px-2 py-0.5 text-[11px] font-medium sm:max-w-none ${
        muted
          ? "border-gray-500/25 bg-gray-500/10 text-gray-400"
          : "border-cyan-500/25 bg-cyan-500/10 text-cyan-200"
      }`}
      title={label}
    >
      {label}
    </span>
  );
}

function HistoryEntry({ log, isLast }) {
  const meta = ACTION_META[log.action] || {
    label: log.action,
    icon: Clock,
    dot: "bg-gray-400",
    badge: "bg-gray-500/15 text-gray-300 border-gray-500/25",
    rowHover: "hover:border-gray-500/30 hover:bg-white/[0.03]",
  };
  const Icon = meta.icon;
  const details = log.details || {};
  const actor = log.userId;
  const subject = subjectName(details, actor);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`relative ${isLast ? "" : "pb-5"}`}
    >
      <span
        className={`absolute -left-[calc(1.5rem+5px)] top-4 z-[1] h-2.5 w-2.5 rounded-full ring-4 ring-[#232338] sm:-left-[calc(2rem+5px)] ${meta.dot}`}
        aria-hidden
      />

      <div
        className={`rounded-xl border border-gray-500/20 bg-[#151525]/50 px-3 py-3 transition sm:px-4 ${meta.rowHover}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar name={subject} size="md" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge}`}
                >
                  <Icon className="h-3 w-3" strokeWidth={2.5} />
                  {meta.label}
                </span>
                {log.action === "leadership_promote" && details.personType && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    {details.personType === "teamMember"
                      ? "Team member"
                      : details.personType === "predefinedOnly"
                        ? "Predefined"
                        : "Registered"}
                  </span>
                )}
              </div>

              <p className="mt-1.5 truncate text-sm font-semibold text-richblack-25">
                {subject}
              </p>

              {details.email && (
                <p className="truncate text-xs text-gray-500">{details.email}</p>
              )}

              {log.action === "leadership_promote" && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {details.from ? (
                    <>
                      <RoleBadge value={details.from} muted />
                      <span className="text-xs text-gray-500">→</span>
                      <RoleBadge value={details.to} />
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-gray-500">Promoted to</span>
                      <RoleBadge value={details.to} />
                    </>
                  )}
                </div>
              )}

              {log.action === "leadership_session_applied" && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-400">
                    Session {details.sessionId} · {details.changeCount} change(s) applied
                  </p>
                  {details.sessionId && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadLeadershipReport(details.sessionId).catch((e) =>
                          toast.error(e.message || "Download failed")
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200 hover:bg-violet-500/20"
                    >
                      <FileText className="h-3 w-3" />
                      Download PDF
                    </button>
                  )}
                </div>
              )}

              {log.action === "leadership_allowed_add" && (
                <p className="mt-1.5 text-xs text-gray-400">
                  Added to leadership transition access list
                </p>
              )}

              {log.action === "leadership_allowed_remove" && (
                <p className="mt-1.5 text-xs text-gray-400">
                  Removed from leadership transition access list
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-500/15 pt-2 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
            <time className="text-xs font-medium tabular-nums text-gray-500">
              {formatTime(log.createdAt)}
            </time>
            <div className="flex items-center gap-2">
              <Avatar image={actor?.image} name={actorName(actor)} size="sm" />
              <p className="max-w-[120px] truncate text-xs text-gray-500 sm:max-w-[140px]">
                <span className="text-gray-600">by </span>
                <span className="font-medium text-gray-300">{actorName(actor)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-500/25 bg-[#151525]/30 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
        <Clock className="h-5 w-5" />
      </div>
      <h2 className="text-base font-semibold text-richblack-25">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
    </div>
  );
}

export default function History() {
  const [logs, setLogs] = useState([]);
  const [appliedSessions, setAppliedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadHistory = useCallback(async () => {
    try {
      const [historyRes, sessionsRes] = await Promise.all([
        getLeadershipHistory(),
        getLeadershipAppliedSessions(),
      ]);
      if (historyRes.success) setLogs(historyRes.data || []);
      if (sessionsRes.success) setAppliedSessions(sessionsRes.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    return subscribeLeadershipUpdates(() => {
      loadHistory();
    });
  }, [loadHistory]);

  const stats = useMemo(() => {
    const promotions = logs.filter((l) => l.action === "leadership_promote").length;
    const access = logs.filter((l) =>
      ["leadership_allowed_add", "leadership_allowed_remove"].includes(l.action)
    ).length;
    const sessions = logs.filter((l) =>
      ["leadership_session_applied", "leadership_draft_discarded", "leadership_draft_abandoned"].includes(l.action)
    ).length + appliedSessions.length;
    return { total: logs.length, promotions, access, sessions };
  }, [logs, appliedSessions]);

  const filteredLogs = useMemo(() => {
    if (filter === "all") return logs;
    if (filter === "sessions") {
      return logs.filter((log) => {
        const meta = ACTION_META[log.action];
        return meta?.filter === "sessions";
      });
    }
    return logs.filter((log) => {
      const meta = ACTION_META[log.action];
      return meta?.filter === filter;
    });
  }, [logs, filter]);

  const groupedLogs = useMemo(() => {
    const groups = [];
    let currentKey = null;

    for (const log of filteredLogs) {
      const key = formatDateHeader(log.createdAt);
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ key, items: [] });
      }
      groups[groups.length - 1].items.push(log);
    }

    return groups;
  }, [filteredLogs]);

  const filterCounts = useMemo(
    () => ({
      all: stats.total,
      promotions: stats.promotions,
      sessions: stats.sessions,
      access: stats.access,
    }),
    [stats]
  );

  if (loading) {
    return (
      <div className="flex min-h-full w-full items-center justify-center bg-[#1e1e2f] pb-20">
        <Spinner className="size-6 text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="flex w-full max-w-4xl flex-col gap-8 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-richblack-25 sm:text-4xl">
            Leadership history
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Track promotions and access changes in one place. Updates appear in real time
            for all authorized users.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Total events", value: stats.total, accent: "text-richblack-25" },
            { label: "Promotions", value: stats.promotions, accent: "text-cyan-300" },
            { label: "Sessions", value: stats.sessions, accent: "text-violet-300" },
            { label: "Access changes", value: stats.access, accent: "text-emerald-300" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-500/20 bg-gradient-to-br from-[#252540]/60 to-[#151525]/80 px-4 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {stat.label}
              </p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.accent}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            const count = filterCounts[item.id] ?? 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`relative rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
                    : "border-gray-500/25 bg-[#151525]/50 text-gray-400 hover:border-gray-500/40 hover:text-gray-200"
                }`}
              >
                {item.label}
                <span
                  className={`ml-1.5 tabular-nums ${active ? "text-cyan-300/80" : "text-gray-600"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {appliedSessions.length > 0 && (filter === "all" || filter === "sessions") && (
          <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-[#151525]/80 p-4 sm:p-6">
            <SectionTitle icon="📄">Applied leadership sessions ({appliedSessions.length})</SectionTitle>
            <div className="mt-4 space-y-2">
              {appliedSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex flex-col gap-3 rounded-xl border border-gray-500/20 bg-[#151525]/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-richblack-25">{session.sessionId}</p>
                    <p className="text-xs text-gray-500">
                      {session.changeCount} changes · Applied by {session.appliedByName || "—"}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {session.appliedAt
                        ? new Date(session.appliedAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadLeadershipReport(session.sessionId).catch((e) =>
                        toast.error(e.message || "Download failed")
                      )
                    }
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 p-4 shadow-xl sm:p-6">
          <SectionTitle icon="🕐">
            Activity timeline ({filteredLogs.length})
          </SectionTitle>

          {logs.length === 0 ? (
            <EmptyState
              title="No history yet"
              description="Promotions and access updates will show up here once someone makes a change."
            />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              title="No matching events"
              description="Switch the filter to see more activity."
            />
          ) : (
            <div className="mt-2 space-y-8">
              <AnimatePresence mode="popLayout">
                {groupedLogs.map((group) => (
                  <motion.section
                    key={group.key}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400/90">
                        {group.key}
                      </h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
                      <span className="text-[11px] tabular-nums text-gray-600">
                        {group.items.length} {group.items.length === 1 ? "event" : "events"}
                      </span>
                    </div>

                    <ol className="relative border-l-2 border-cyan-500/25 pl-6 sm:pl-8">
                      {group.items.map((log, index) => (
                        <HistoryEntry
                          key={log._id}
                          log={log}
                          isLast={index === group.items.length - 1}
                        />
                      ))}
                    </ol>
                  </motion.section>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
