import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTeamDepartments, getTeamMembers, getDepartmentRoster, getAllPeople, getAccountTypeLabel, sendSignupInvite } from "../services/api";
import { isSocietyRole } from "../services/api";
import { toast } from "sonner";
import { Users, ChevronRight, Printer, FileText, X, Download, List, Mail } from "react-feather";
import { avatarPlaceholder, photoPreviewUrl } from "../utils/teamMemberUtils";
import ManageTeam from "./ManageTeam";
import Search from "../components/Search";
import { motion, AnimatePresence } from "framer-motion";
// import { Mail } from "lucide-react";
import { UserDetailModal, PredefinedOnlyDetailModal, MemberDetailModal } from "../components/Search";
import {
  downloadTeamListPDF,
  downloadAllDepartmentsPDF,
  downloadAllDepartmentsExcel,
} from "../utils/teamListExport";
import { Spinner } from "@/components/ui/spinner";

const EXPORT_COLS = ["name", "year", "branch", "section", "email", "contact", "non_tech_society"];
const EXPORT_LABELS = {
  name: "Name",
  year: "Year",
  branch: "Branch",
  section: "Section",
  email: "Email",
  contact: "Contact",
  non_tech_society: "Non-tech society",
};
const ORG_NAME = "GFG BVCOE";
const PREDEFINED_IMAGE_BASE = "https://www.gfg-bvcoe.com";

const iosRowVariants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.96 
  },
  visible: (idx) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      mass: 0.8,
      delay: Math.min(idx * 0.06, 0.8), 
    }
  })
};

export default function ManageSociety() {
  const { user, loading: authLoading } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [departmentCounts, setDepartmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [printAllModalOpen, setPrintAllModalOpen] = useState(false);
  const [printAllSelectedFields, setPrintAllSelectedFields] = useState([...EXPORT_COLS]);
  const [printAllLoading, setPrintAllLoading] = useState(false);
  const [deptPdfLoading, setDeptPdfLoading] = useState(null);
  const [showListOpen, setShowListOpen] = useState(false);
  const [allPeopleLoading, setAllPeopleLoading] = useState(false);
  const [allPeopleList, setAllPeopleList] = useState([]);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null); // { type: 'user'|'predefinedOnly'|'teamMember', data }
  const [sendingInviteTo, setSendingInviteTo] = useState(null);

  useEffect(() => {
    if (!user || !isSocietyRole(user?.accountType)) return;
    getTeamDepartments()
      .then((res) => setDepartments(res.data || []))
      .catch((e) => {
        toast.error(e.message || "Failed to load departments");
        setDepartments([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || departments.length === 0) return;
    const counts = {};
    Promise.all(
      departments.map((dept) =>
        getTeamMembers(dept)
          .then((res) => {
            counts[dept] = (res.data || []).length;
          })
          .catch(() => {
            counts[dept] = 0;
          })
      )
    ).then(() => setDepartmentCounts({ ...counts }));
  }, [user, departments]);

  useEffect(() => {
    if (showListOpen && user) {
      setAllPeopleLoading(true);
      getAllPeople()
        .then((res) => setAllPeopleList(res.data || []))
        .catch((e) => {
          toast.error(e.message || "Failed to load people");
          setAllPeopleList([]);
        })
        .finally(() => setAllPeopleLoading(false));
    }
  }, [showListOpen, user]);

  useEffect(() => {
    if (showListOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [showListOpen]);

  const togglePrintAllField = (k) => {
    setPrintAllSelectedFields((prev) =>
      prev.includes(k) ? prev.filter((f) => f !== k) : [...prev, k]
    );
  };
  const selectAllPrintFields = () => setPrintAllSelectedFields([...EXPORT_COLS]);
  const deselectAllPrintFields = () => setPrintAllSelectedFields([]);

  /** Build combined export rows for a department: roster (signup config + registered/predefined) + team members not in roster */
  const buildDepartmentExportRows = (roster, members) => {
    const rosterEmails = new Set((roster || []).map((r) => (r.email || "").toLowerCase()));
    const extraMembers = (members || []).filter(
      (m) => !rosterEmails.has((m.email || "").toLowerCase())
    );
    const fromRoster = (roster || []).map((row) => {
      const u = row.user;
      const profile = u?.additionalDetails || {};
      const pre = row.predefinedProfile || {};
      const name = row.registered
        ? [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || row.email
        : (pre?.name || row.email);
      return {
        name,
        year: row.registered ? (profile?.year || profile?.yearOfStudy || "") : (pre?.year || ""),
        branch: row.registered ? (profile?.branch || "") : (pre?.branch || ""),
        section: row.registered ? (profile?.section || "") : "",
        email: row.email,
        contact: row.registered ? (u?.contact || "") : "",
        non_tech_society: row.registered ? (profile?.non_tech_society || "") : "",
      };
    });
    const fromMembers = (extraMembers || []).map((m) => ({
      name: m.name || "",
      year: m.year || "",
      branch: m.branch || "",
      section: m.section || "",
      email: m.email || "",
      contact: m.contact || "",
      non_tech_society: m.non_tech_society || "",
    }));
    return [...fromRoster, ...fromMembers];
  };

  const handlePrintAllPDF = async () => {
    if (printAllSelectedFields.length === 0) {
      toast.error("Select at least one column");
      return;
    }
    setPrintAllLoading(true);
    try {
      const map = {};
      await Promise.all(
        departments.map(async (dept) => {
          const [rosterRes, membersRes] = await Promise.all([
            getDepartmentRoster(dept),
            getTeamMembers(dept),
          ]);
          const roster = rosterRes.data || [];
          const members = membersRes.data || [];
          map[dept] = buildDepartmentExportRows(roster, members);
        })
      );
      downloadAllDepartmentsPDF(
        map,
        printAllSelectedFields,
        EXPORT_LABELS,
        `${ORG_NAME} - Society Member List (All Departments)`
      );
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e.message || "Download failed");
    } finally {
      setPrintAllLoading(false);
    }
  };

  const handlePrintAllExcel = async () => {
    if (printAllSelectedFields.length === 0) {
      toast.error("Select at least one column");
      return;
    }
    setPrintAllLoading(true);
    try {
      const map = {};
      await Promise.all(
        departments.map(async (dept) => {
          const [rosterRes, membersRes] = await Promise.all([
            getDepartmentRoster(dept),
            getTeamMembers(dept),
          ]);
          const roster = rosterRes.data || [];
          const members = membersRes.data || [];
          map[dept] = buildDepartmentExportRows(roster, members);
        })
      );
      downloadAllDepartmentsExcel(
        map,
        printAllSelectedFields,
        EXPORT_LABELS,
        `${ORG_NAME} - Society Member List`
      );
      toast.success("Excel downloaded");
    } catch (e) {
      toast.error(e.message || "Download failed");
    } finally {
      setPrintAllLoading(false);
    }
  };

  const handleDeptPdf = async (dept) => {
    setDeptPdfLoading(dept);
    try {
      const [rosterRes, membersRes] = await Promise.all([
        getDepartmentRoster(dept),
        getTeamMembers(dept),
      ]);
      const roster = rosterRes.data || [];
      const members = membersRes.data || [];
      const list = buildDepartmentExportRows(roster, members);
      downloadTeamListPDF(
        list,
        EXPORT_COLS,
        EXPORT_LABELS,
        `${ORG_NAME} - ${dept} - Member List`
      );
      toast.success(`${dept} PDF downloaded`);
    } catch (e) {
      toast.error(e.message || "Download failed");
    } finally {
      setDeptPdfLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen darkthemebg pt-24 flex items-center justify-center">
        <p className="text-gray-400"><Spinner className="size-4 text-gray-400" /></p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isSocietyRole(user.accountType)) return <Navigate to="/manage-team" replace />;

  if (selectedDepartment) {
    return (
      <ManageTeam
        department={selectedDepartment}
        isSociety
        onBack={() => setSelectedDepartment(null)}
      />
    );
  }

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 mb-2">
          <Users className="h-8 w-8 text-cyan-400" />
          Manage society
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Select a department to view and manage its members (same as Manage team).
        </p>

        <div className="flex flex-col sm:flex-wrap sm:flex-row items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-md">
            <div className="flex-1 min-w-0">
              <Search variant="manage-team" placeholder="Search members…" />
            </div>
            <button
              type="button"
              onClick={() => setShowListOpen(true)}
              className="shrink-0 p-2.5 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
              title="Show all users"
              aria-label="Show all users"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPrintAllModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-gray-500/40 transition-colors text-sm font-medium"
          >
            <Printer className="h-4 w-4" />
            Print whole list (all departments)
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading departments…</div>
        ) : (
          <div className="grid gap-3">
            {departments.map((dept) => (
              <div
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className="flex items-center justify-between w-full rounded-xl
                 border border-gray-500/40 bg-[#1e1e2f]/80
                 px-5 py-4 text-left text-gray-200
                 hover:border-cyan-500/50 transition-colors
                 cursor-pointer group"
              >
                <button
                  // type="button"
                  // onClick={() => setSelectedDepartment(dept)}
                  className="flex-1 flex items-center justify-between text-left min-w-0"
                >
                  <span className="font-medium text-white">{dept}</span>
                  <span className="flex items-center gap-2 text-sm text-gray-400 shrink-0 ml-2">
                    <span className="flex items-center gap-1">
                      {departmentCounts[dept] ?? (
                        <Spinner className="size-2 text-gray-200" />
                      )}
                      <span>members</span>
                    </span>

                    <ChevronRight className="h-4 w-4 text-cyan-400" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeptPdf(dept);
                  }}
                  disabled={deptPdfLoading === dept}
                  title={`Download ${dept} as PDF`}
                  className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50 shrink-0"
                >
                  {deptPdfLoading === dept ? (
                    <span className="text-xs">…</span>
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Show all people modal: users (position/accountType tag) + predefined-only + members, sorted */}
        <AnimatePresence>
          {showListOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 z-[90] flex min-h-full items-center justify-center overflow-hidden p-4 py-8 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowListOpen(false);
                setSelectedDetailItem(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-label="All people list"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#1e1e2f] rounded-2xl border border-gray-500/40 shadow-2xl w-full max-w-2xl h-5/6 flex flex-col overflow-hidden shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 shrink-0">
                  <h2 className="text-lg font-bold text-white">All people</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowListOpen(false);
                      setSelectedDetailItem(null);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* List Content */}
                <div 
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 custom-scrollbar" 
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {allPeopleLoading ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-3 py-24 text-center text-gray-400 flex-col"
                    >
                      <div className="relative flex items-center justify-center">
                        {/* iOS-style Spinner */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="size-8 border-2 border-gray-500/30 border-t-cyan-400 rounded-full"
                        />
                      </div>
                      <motion.span 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm font-medium tracking-wide"
                      >
                        Loading People...
                      </motion.span>
                    </motion.div>
                  ) : allPeopleList.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center text-gray-500"
                    >
                      No one in the list.
                    </motion.div>
                  ) : (
                    <ul className="space-y-1">
                      {allPeopleList.map((item, idx) => {
                        let content = null;

                        if (item.type === "user") {
                          const u = item.data;
                          const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "—";
                          const src = u.image || avatarPlaceholder(name);
                          const tagLabel = (u.additionalDetails && u.additionalDetails.position) || getAccountTypeLabel(u.accountType) || u.accountType || "Member";
                          
                          content = (
                            <button
                              type="button"
                              className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-all border border-transparent hover:border-gray-500/30 active:scale-[0.98]"
                              onClick={() => setSelectedDetailItem({ type: "user", data: u })}
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                                onError={(e) => { e.target.onerror = null; e.target.src = avatarPlaceholder(name); }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block truncate font-medium text-white">{name}</span>
                                <span className="block truncate text-xs text-gray-500">{u.email}</span>
                              </div>
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {tagLabel}
                              </span>
                            </button>
                          );
                        }

                        if (item.type === "predefinedOnly") {
                          const pre = item.data;
                          const name = pre.name || pre.email || "—";
                          const imagePath = (pre.image || "").trim();
                          const src = imagePath
                            ? imagePath.startsWith("http")
                              ? imagePath
                              : `${PREDEFINED_IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
                            : avatarPlaceholder(name);
                          const email = (pre.email || "").trim().toLowerCase();
                          const isSending = sendingInviteTo === email;
                          
                          content = (
                            <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-gray-500/30 hover:bg-gray-500/10 transition-all">
                              <button
                                type="button"
                                className="flex-1 flex items-center gap-3 min-w-0 text-left active:scale-[0.98]"
                                onClick={() => setSelectedDetailItem({ type: "predefinedOnly", data: pre })}
                              >
                                <img
                                  src={src}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                                  onError={(e) => { e.target.onerror = null; e.target.src = avatarPlaceholder(name); }}
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="block truncate font-medium text-white">{name}</span>
                                  <span className="block truncate text-xs text-gray-500">{pre.email}</span>
                                </div>
                              </button>
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                Unregistered
                              </span>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!email || isSending) return;
                                  setSendingInviteTo(email);
                                  try {
                                    await sendSignupInvite(email);
                                    toast.success("Invite email sent.");
                                  } catch (err) {
                                    toast.error(err.message || "Failed to send invite");
                                  } finally {
                                    setSendingInviteTo(null);
                                  }
                                }}
                                disabled={isSending}
                                className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50 shrink-0"
                              >
                                {isSending ? <div className="size-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /> : <Mail className="h-4 w-4" />}
                              </button>
                            </div>
                          );
                        }

                        if (item.type === "teamMember") {
                          const m = item.data;
                          const name = m.name || m.email || "—";
                          const photoUrl = m.photo || m.image_drive_link;
                          const src = photoUrl ? photoPreviewUrl(photoUrl) : avatarPlaceholder(name);
                          
                          content = (
                            <button
                              type="button"
                              className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-all border border-transparent hover:border-gray-500/30 active:scale-[0.98]"
                              onClick={() => setSelectedDetailItem({ type: "teamMember", data: m })}
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                                onError={(e) => { e.target.onerror = null; e.target.src = avatarPlaceholder(name); }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block truncate font-medium text-white">{name}</span>
                                <span className="block truncate text-xs text-gray-500">{m.email}</span>
                              </div>
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Team
                              </span>
                            </button>
                          );
                        }

                        return (
          <motion.li
            key={item.type + (item.data._id || item.data.email) + idx}
            variants={iosRowVariants}
            initial="hidden"
            animate="visible"
            custom={idx} // This passes 'idx' to the visible function above
            className="list-none" // Ensure no default bullet points
          >
            {content}
          </motion.li>
        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedDetailItem?.type === "user" &&
          createPortal(
            <UserDetailModal
              user={selectedDetailItem.data}
              onClose={() => setSelectedDetailItem(null)}
            />,
            document.body
          )}
        {selectedDetailItem?.type === "predefinedOnly" &&
          createPortal(
            <PredefinedOnlyDetailModal
              predefined={selectedDetailItem.data}
              onClose={() => setSelectedDetailItem(null)}
            />,
            document.body
          )}
        {selectedDetailItem?.type === "teamMember" &&
          createPortal(
            <MemberDetailModal
              member={selectedDetailItem.data}
              onClose={() => setSelectedDetailItem(null)}
            />,
            document.body
          )}

        {printAllModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setPrintAllModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="darkthemebg rounded-2xl border border-gray-500/30 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-500/30">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Printer className="h-5 w-5 text-cyan-400" />
                  Print whole list (all departments)
                </h2>
                <button
                  type="button"
                  onClick={() => setPrintAllModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-400">
                  Select columns to include. Export will list all departments with their members.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllPrintFields}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllPrintFields}
                    className="px-3 py-1.5 rounded-lg border border-gray-500/50 text-gray-400 hover:bg-gray-500/20 text-sm"
                  >
                    Deselect all
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {EXPORT_COLS.map((k) => (
                    <label
                      key={k}
                      className="flex items-center gap-2 cursor-pointer text-sm text-gray-200 hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={printAllSelectedFields.includes(k)}
                        onChange={() => togglePrintAllField(k)}
                        className="rounded border-gray-500 bg-[#252536] text-cyan-500 focus:ring-cyan-500"
                      />
                      {EXPORT_LABELS[k] || k}
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-500/30">
                  <button
                    type="button"
                    onClick={handlePrintAllPDF}
                    disabled={printAllLoading || printAllSelectedFields.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4" />
                    {printAllLoading ? "Generating…" : "Generate & Download PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintAllExcel}
                    disabled={printAllLoading || printAllSelectedFields.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium text-sm disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {printAllLoading ? "Generating…" : "Generate & Download Excel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
