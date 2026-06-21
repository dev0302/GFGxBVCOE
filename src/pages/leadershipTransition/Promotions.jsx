import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import { Spinner } from "@/components/ui/spinner";
import {
  getLeadershipPeople,
  getLeadershipPositions,
  promoteLeadershipPerson,
  endLeadershipSession,
  getLeadershipPendingEmails,
  sendLeadershipPromotionEmails,
  getAccountTypeLabel,
} from "../../services/api";
import { subscribeLeadershipUpdates } from "../../services/socket";
import { cloudinaryTinyAvatarUrl } from "../../utils/cloudinary";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search as SearchIcon, X, TrendingUp, LogOut } from "react-feather";

const GMAIL_ICON_SRC = "/gmail-icon.png";

function PersonAvatar({ image, name }) {
  const src = image ? cloudinaryTinyAvatarUrl(image) : "";
  const initials = String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-10 w-10 rounded-full object-cover border border-gray-500/40"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600/30 text-xs font-semibold text-cyan-100">
      {initials || "?"}
    </div>
  );
}

export default function Promotions() {
  const [people, setPeople] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personAction, setPersonAction] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [pendingEndSession, setPendingEndSession] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingEmails, setPendingEmails] = useState([]);
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [loadingPendingEmails, setLoadingPendingEmails] = useState(true);

  const loadPendingEmails = useCallback(async () => {
    try {
      const res = await getLeadershipPendingEmails();
      if (res.success) setPendingEmails(res.data || []);
    } catch (err) {
      console.error("Failed to load pending emails:", err);
    } finally {
      setLoadingPendingEmails(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [peopleRes, positionsRes] = await Promise.all([
        getLeadershipPeople(),
        getLeadershipPositions(),
      ]);
      if (peopleRes.success) setPeople(peopleRes.data || []);
      if (positionsRes.success) setPositions(positionsRes.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadPendingEmails();
  }, [loadData, loadPendingEmails]);

  useEffect(() => {
    return subscribeLeadershipUpdates((payload) => {
      loadData();
      if (
        payload?.type === "promotion" ||
        payload?.type === "end-session" ||
        payload?.type === "pending-emails-sent" ||
        payload?.pendingEmailCount != null
      ) {
        loadPendingEmails();
      }
    });
  }, [loadData, loadPendingEmails]);

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.position || "").toLowerCase().includes(q) ||
        (p.accountType || "").toLowerCase().includes(q)
    );
  }, [people, search]);

  const groupedPositions = useMemo(() => {
    const society = positions.filter((p) =>
      ["chairperson", "vice-chairperson"].includes(p.id)
    );
    const byDept = {};
    for (const pos of positions) {
      if (society.some((s) => s.id === pos.id)) continue;
      const dept = pos.accountType;
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(pos);
    }
    return { society, byDept };
  }, [positions]);

  const closePersonModal = () => {
    if (promoting || endingSession) return;
    setPendingPromotion(null);
    setPendingEndSession(false);
    setPersonAction(null);
    setSelectedPerson(null);
  };

  const handleEndSession = async () => {
    if (!selectedPerson || endingSession) return;
    setEndingSession(true);
    try {
      const res = await endLeadershipSession({
        personType: selectedPerson.type,
        personId: selectedPerson.id,
        sourceDepartment: selectedPerson.sourceDepartment || undefined,
      });
      if (res.success) {
        setPeople(res.data || []);
        if (res.pendingEmailCount != null) {
          await loadPendingEmails();
        }
        toast.success(res.message || "Session ended successfully");
        setPendingEndSession(false);
        setPersonAction(null);
        setSelectedPerson(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to end session");
    } finally {
      setEndingSession(false);
    }
  };

  const handlePromote = async (position) => {
    if (!selectedPerson || promoting) return;
    setPromoting(true);
    try {
      const res = await promoteLeadershipPerson({
        personType: selectedPerson.type,
        personId: selectedPerson.id,
        sourceDepartment: selectedPerson.sourceDepartment || undefined,
        targetPositionId: position.id,
      });
      if (res.success) {
        setPeople(res.data || []);
        if (res.pendingEmailCount != null) {
          await loadPendingEmails();
        }
        toast.success(res.message || "Promotion successful");
        setPendingPromotion(null);
        setSelectedPerson(null);
      }
    } catch (err) {
      toast.error(err.message || "Promotion failed");
    } finally {
      setPromoting(false);
    }
  };

  const handleSendAllEmails = async () => {
    if (sendingEmails || pendingEmails.length === 0) return;
    setSendingEmails(true);
    try {
      const res = await sendLeadershipPromotionEmails();
      if (res.success) {
        toast.success(res.message || "Promotion emails sent");
        setPendingEmails([]);
        setEmailPanelOpen(false);
      }
    } catch (err) {
      toast.error(err.message || "Failed to send emails");
    } finally {
      setSendingEmails(false);
    }
  };

  const pendingCount = pendingEmails.length;

  if (loading) {
    return (
      <div className="flex min-h-full w-full items-center justify-center bg-[#1e1e2f] pb-20">
        <Spinner className="size-6 text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-5xl py-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-richblack-25">
              Leadership promotions
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Click a person to promote them or end their tenure. Changes sync in real time for all
              authorized users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEmailPanelOpen(true)}
            disabled={loadingPendingEmails}
            className="shrink-0 self-start inline-flex items-center gap-2 rounded-lg border border-gray-500/30 bg-[#252540]/90 px-3 py-2 text-sm leading-none text-gray-300 shadow-sm transition hover:border-cyan-500/40 hover:bg-[#2a2a45] disabled:opacity-60"
            aria-label={`${pendingCount} queued emails`}
          >
            <img
              src={GMAIL_ICON_SRC}
              alt=""
              className="h-5 w-5 rounded-sm object-cover"
            />
            <span className="lowercase text-sm text-gray-400">gmail</span>
            <span className="font-medium text-cyan-300">
              ({pendingCount}{pendingCount > 0 ? "+" : ""})
            </span>
          </button>
        </div>

        <div className="group relative rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-[#252540]/80 to-[#151525]/90 p-1 shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-colors focus-within:border-cyan-500/35 focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_4px_24px_rgba(34,211,238,0.08)]">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-cyan-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role…"
            className="w-full rounded-xl border border-transparent bg-[#12121f]/70 py-3.5 pl-11 pr-4 text-sm text-richblack-25 placeholder:text-gray-500 transition-all hover:bg-[#12121f]/90 focus:border-cyan-500/25 focus:bg-[#12121f] focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
          />
        </div>

        <section className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 p-4 sm:p-6 shadow-xl">
          <SectionTitle icon="👥">
            Society roster ({filteredPeople.length})
          </SectionTitle>

          <div className="mt-4 grid gap-2">
            {filteredPeople.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No people found.</p>
            ) : (
              filteredPeople.map((person) => (
                <button
                  key={`${person.type}-${person.id}`}
                  type="button"
                  onClick={() => setSelectedPerson(person)}
                  className="group relative flex w-full items-center gap-3 rounded-xl border border-gray-500/20 bg-[#151525]/60 px-4 py-3 text-left transition hover:border-cyan-500/40 hover:bg-cyan-500/5"
                >
                  <PersonAvatar image={person.image} name={person.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-richblack-25">
                      {person.name || person.email}
                    </div>
                    <div className="truncate text-xs text-gray-500">{person.email}</div>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                      {person.position ||
                        getAccountTypeLabel(person.accountType) ||
                        person.accountType ||
                        "Member"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {person.registered ? "Signed up" : "Not signed up"}
                      {person.type === "teamMember" && person.sourceDepartment
                        ? ` · ${person.sourceDepartment}`
                        : person.accountType
                          ? ` · ${getAccountTypeLabel(person.accountType) || person.accountType}`
                          : ""}
                    </span>
                  </div>
                  <span className="pointer-events-none absolute inset-x-0 -top-8 mx-auto hidden w-fit rounded-md border border-cyan-500/30 bg-[#151525] px-2 py-1 text-[10px] font-medium text-cyan-300 shadow-lg group-hover:block">
                    Click to manage
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {emailPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={() => !sendingEmails && setEmailPanelOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-lg flex-col max-h-[85vh] rounded-2xl border border-gray-500/30 bg-[#1e1e2f] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-gray-500/20 px-5 py-4">
                <div className="flex items-center gap-2">
                  <img
                    src={GMAIL_ICON_SRC}
                    alt=""
                    className="h-6 w-6 rounded-sm object-cover"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-richblack-25">
                      Queued emails
                    </h2>
                    <p className="text-xs text-gray-500">
                      Promotions & tenure farewells · {pendingCount} waiting
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !sendingEmails && setEmailPanelOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-500/20 hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {loadingPendingEmails ? (
                  <div className="flex justify-center py-10">
                    <Spinner className="size-6 text-cyan-400" />
                  </div>
                ) : pendingEmails.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    Promote someone or end a tenure to queue emails here. The count
                    grows as more actions are taken.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {pendingEmails.map((item) => (
                      <li
                        key={item.id || item.email}
                        className="rounded-xl border border-gray-500/20 bg-[#151525]/70 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-richblack-25">
                              {item.name || item.email}
                            </p>
                            <p className="truncate text-xs text-gray-500">{item.email}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              item.emailType === "end_session"
                                ? "bg-fuchsia-500/15 text-fuchsia-300"
                                : item.registered
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-amber-500/15 text-amber-300"
                            }`}
                          >
                            {item.emailType === "end_session"
                              ? "Tenure end"
                              : item.registered
                                ? "Signed up"
                                : "Needs signup"}
                          </span>
                        </div>
                        {item.emailType === "end_session" ? (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="rounded-md bg-fuchsia-500/15 px-2 py-0.5 font-medium text-fuchsia-300">
                              {item.previousRole || "Member"}
                            </span>
                            {item.tenureDepartment && (
                              <span className="text-[10px] text-gray-500">
                                {getAccountTypeLabel(item.tenureDepartment) || item.tenureDepartment}
                              </span>
                            )}
                            {item.activityLogCount > 0 && (
                              <span className="text-[10px] text-gray-500">
                                · {item.activityLogCount} activities
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="rounded-md bg-gray-500/15 px-2 py-0.5 text-gray-400">
                              {item.previousRole || "Member"}
                            </span>
                            <span className="text-cyan-400">→</span>
                            <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 font-medium text-cyan-300">
                              {item.newRole}
                            </span>
                          </div>
                        )}
                        {item.emailType !== "end_session" && item.newDepartment && (
                          <p className="mt-1.5 text-[10px] text-gray-500">
                            {getAccountTypeLabel(item.newDepartment) || item.newDepartment}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-gray-500/20 px-5 py-4">
                <button
                  type="button"
                  onClick={handleSendAllEmails}
                  disabled={sendingEmails || pendingCount === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-50"
                >
                  {sendingEmails ? (
                    <>
                      <Spinner className="size-4 text-white" />
                      Sending emails…
                    </>
                  ) : (
                    <>Send email to all ({pendingCount})</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={closePersonModal}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-500/30 bg-[#1e1e2f] shadow-2xl"
            >
              <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-gray-500/20 bg-[#1e1e2f] px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-cyan-400">
                    {personAction === "promote"
                      ? "Promote to"
                      : personAction === "end_session"
                        ? "End tenure"
                        : "Choose action"}
                  </p>
                  <h2 className="text-lg font-semibold text-richblack-25">
                    {selectedPerson.name || selectedPerson.email}
                  </h2>
                  <p className="text-xs text-gray-500">{selectedPerson.email}</p>
                </div>
                <button
                  type="button"
                  onClick={closePersonModal}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-500/20 hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!personAction && (
                <div className="space-y-3 p-5">
                  <p className="text-sm text-gray-400">
                    What would you like to do with this person?
                  </p>
                  <button
                    type="button"
                    onClick={() => setPersonAction("promote")}
                    className="flex w-full items-center gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-4 text-left transition hover:border-cyan-500/40 hover:bg-cyan-500/10"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-richblack-25">Promote</span>
                      <span className="block text-xs text-gray-500">
                        Move to a new leadership role
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonAction("end_session")}
                    className="flex w-full items-center gap-3 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/5 px-4 py-4 text-left transition hover:border-fuchsia-500/40 hover:bg-fuchsia-500/10"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
                      <LogOut className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-richblack-25">End session</span>
                      <span className="block text-xs text-gray-500">
                        Archive to alumni, remove from society, 24h account grace
                      </span>
                    </span>
                  </button>
                </div>
              )}

              {personAction === "end_session" && (
                <div className="space-y-4 p-5">
                  <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-4 py-3 text-sm text-gray-300">
                    <p className="font-medium text-fuchsia-200">This will:</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-400">
                      <li>Archive their profile, timeline & activity logs to alumni</li>
                      <li>Remove them from signup configs, team roster & society</li>
                      <li>Queue a farewell email with their contributions</li>
                      {selectedPerson.registered && (
                        <li>Give them 24 hours before their account is deleted</li>
                      )}
                    </ul>
                  </div>
                  <button
                    type="button"
                    disabled={endingSession}
                    onClick={() => setPendingEndSession(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:from-fuchsia-400 hover:to-fuchsia-500 disabled:opacity-50"
                  >
                    {endingSession ? (
                      <>
                        <Spinner className="size-4 text-white" />
                        Ending session…
                      </>
                    ) : (
                      <>End tenure session</>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={endingSession}
                    onClick={() => setPersonAction(null)}
                    className="w-full rounded-xl border border-gray-500/40 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-500/15 disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              )}

              {personAction === "promote" && (
              <div className="space-y-5 p-5">
                <button
                  type="button"
                  disabled={promoting}
                  onClick={() => setPersonAction(null)}
                  className="text-xs font-medium text-gray-500 transition hover:text-gray-300 disabled:opacity-50"
                >
                  ← Back to actions
                </button>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Society core
                  </p>
                  <div className="grid gap-2">
                    {groupedPositions.society.map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        disabled={promoting}
                        onClick={() => setPendingPromotion(pos)}
                        className="rounded-xl border border-gray-500/25 px-4 py-3 text-left text-sm text-gray-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 disabled:opacity-50"
                      >
                        Promote to <span className="font-medium text-cyan-300">{pos.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {Object.entries(groupedPositions.byDept).map(([dept, deptPositions]) => (
                  <div key={dept}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {dept}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {deptPositions.map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          disabled={promoting}
                          onClick={() => setPendingPromotion(pos)}
                          className="rounded-xl border border-gray-500/25 px-4 py-3 text-left text-sm text-gray-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 disabled:opacity-50"
                        >
                          Promote to{" "}
                          <span className="font-medium text-cyan-300">{pos.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {(promoting || endingSession) && (
                <div className="flex items-center justify-center gap-2 border-t border-gray-500/20 px-5 py-4 text-sm text-gray-400">
                  <Spinner className="size-4 text-cyan-400" />
                  {endingSession ? "Archiving and removing access…" : "Updating roles and signup access…"}
                </div>
              )}
            </motion.div>

            <AnimatePresence>
              {pendingPromotion && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center p-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!promoting) setPendingPromotion(null);
                  }}
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="promote-confirm-title"
                  aria-describedby="promote-confirm-desc"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 12 }}
                    transition={{ type: "spring", damping: 22, stiffness: 340 }}
                    className="w-full max-w-sm rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-[#252540] to-[#1e1e2f] p-6 shadow-[0_0_40px_rgba(34,211,238,0.12)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-5 flex flex-col items-center text-center">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 260, delay: 0.05 }}
                        className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-violet-500/20 shadow-inner"
                      >
                        <Check className="h-7 w-7 text-cyan-300" strokeWidth={2.5} />
                      </motion.div>
                      <h3
                        id="promote-confirm-title"
                        className="text-lg font-semibold text-richblack-25"
                      >
                        Confirm promotion?
                      </h3>
                      <p
                        id="promote-confirm-desc"
                        className="mt-3 text-sm leading-relaxed text-gray-400"
                      >
                        Promote{" "}
                        <span className="font-medium text-gray-200">
                          {selectedPerson.name || selectedPerson.email}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-cyan-300">
                          {pendingPromotion.label}
                        </span>
                        ? Their role and signup access will update right away.
                      </p>
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setPendingPromotion(null)}
                        disabled={promoting}
                        className="w-full rounded-xl border border-gray-500/40 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-500/15 disabled:opacity-50 sm:w-auto"
                      >
                        Not yet
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromote(pendingPromotion)}
                        disabled={promoting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-50 sm:w-auto"
                      >
                        {promoting ? (
                          <>
                            <Spinner className="size-4 text-white" />
                            Promoting…
                          </>
                        ) : (
                          <>Yes, promote!</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {pendingEndSession && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center p-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!endingSession) setPendingEndSession(false);
                  }}
                  role="alertdialog"
                  aria-modal="true"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 12 }}
                    transition={{ type: "spring", damping: 22, stiffness: 340 }}
                    className="w-full max-w-sm rounded-3xl border border-fuchsia-500/25 bg-gradient-to-b from-[#252540] to-[#1e1e2f] p-6 shadow-[0_0_40px_rgba(244,114,182,0.12)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-5 flex flex-col items-center text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400/30 to-violet-500/20 shadow-inner">
                        <LogOut className="h-7 w-7 text-fuchsia-300" strokeWidth={2.5} />
                      </div>
                      <h3 className="text-lg font-semibold text-richblack-25">
                        End tenure session?
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-gray-400">
                        End{" "}
                        <span className="font-medium text-gray-200">
                          {selectedPerson.name || selectedPerson.email}
                        </span>
                        &apos;s tenure? They will be archived as alumni and removed from the society roster.
                        {selectedPerson.registered && (
                          <> Their account will be deleted after 24 hours.</>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setPendingEndSession(false)}
                        disabled={endingSession}
                        className="w-full rounded-xl border border-gray-500/40 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-500/15 disabled:opacity-50 sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleEndSession}
                        disabled={endingSession}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:from-fuchsia-400 hover:to-fuchsia-500 disabled:opacity-50 sm:w-auto"
                      >
                        {endingSession ? (
                          <>
                            <Spinner className="size-4 text-white" />
                            Ending…
                          </>
                        ) : (
                          <>Yes, end session</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
