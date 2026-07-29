import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTeamDepartments, getTeamMembers, getDepartmentRoster, getAllPeople, getAccountTypeLabel, sendSignupInvite, applyNextSessionYearPromotion, getYearPromotionHistory, revertYearPromotion } from "../services/api";
import { isSocietyRole } from "../services/api";
import { toast } from "sonner";
import { Users, ChevronRight, Printer, FileText, X, Download, List, Mail, RefreshCw, RotateCcw, Clock } from "react-feather";
import { avatarPlaceholder, photoPreviewUrl } from "../utils/teamMemberUtils";
import ManageTeam from "./ManageTeam";
import Search from "../components/Search";
import { motion, AnimatePresence } from "framer-motion";
// import { Mail } from "lucide-react";
import { UserDetailModal, PredefinedOnlyDetailModal, MemberDetailModal, ActivityLogModal } from "../components/Search";
import {
  downloadTeamListPDF,
  downloadAllDepartmentsPDF,
  downloadAllDepartmentsExcel,
} from "../utils/teamListExport";
import { Spinner } from "@/components/ui/spinner";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import {
  setDepartments as setDepartmentsInStore,
  setDepartmentCounts as setDepartmentCountsInStore,
  setAllPeopleList as setAllPeopleListInStore,
} from "../redux/slices/manageSocietySlice.jsx";

const EXPORT_COLS = ["name", "department", "year", "branch", "section", "email", "contact", "non_tech_society"];
const EXPORT_LABELS = {
  name: "Name",
  department: "Department",
  year: "Year",
  branch: "Branch",
  section: "Section",
  email: "Email",
  contact: "Contact",
  non_tech_society: "Non-tech society",
};
const ORG_NAME = "GFG BVCOE";
const PREDEFINED_IMAGE_BASE = "https://www.gfg-bvcoe.com";

function formatSessionDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPromotionSummary(summary) {
  if (!summary || typeof summary !== "object") return "";
  const entries = summary instanceof Map ? [...summary.entries()] : Object.entries(summary);
  if (!entries.length) return "";
  return entries.map(([key, count]) => `${key} (${count})`).join(", ");
}

/** Total members in a department: roster (signup config incl. heads/leads) + team members not in roster */
function getDepartmentMemberCount(roster, members) {
  const rosterArr = roster || [];
  const rosterEmails = new Set(rosterArr.map((r) => (r.email || "").toLowerCase()));
  const extraCount = (members || []).filter(
    (m) => !rosterEmails.has((m.email || "").toLowerCase()),
  ).length;
  return rosterArr.length + extraCount;
}

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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedDepartment = searchParams.get("department");
  const dispatch = useDispatch();
  const manageSociety = useSelector((state) => state.manageSociety);
  const [departments, setDepartments] = useState(manageSociety.departments || []);
  const [departmentCounts, setDepartmentCounts] = useState(manageSociety.departmentCounts || {});
  const [loading, setLoading] = useState(!manageSociety.departments?.length);
  const [printAllModalOpen, setPrintAllModalOpen] = useState(false);
  const [printAllSelectedFields, setPrintAllSelectedFields] = useState([...EXPORT_COLS]);
  const [printAllLoading, setPrintAllLoading] = useState(false);
  const [deptPdfLoading, setDeptPdfLoading] = useState(null);
  const [showListOpen, setShowListOpen] = useState(false);
  const [allPeopleLoading, setAllPeopleLoading] = useState(false);
  const [allPeopleList, setAllPeopleList] = useState(manageSociety.allPeopleList || []);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null); // { type: 'user'|'predefinedOnly'|'teamMember', data }
  const [sendingInviteTo, setSendingInviteTo] = useState(null);
  const [activityLogUser, setActivityLogUser] = useState(null);
  const [nextSessionModalOpen, setNextSessionModalOpen] = useState(false);
  const [nextSessionConfirmOpen, setNextSessionConfirmOpen] = useState(false);
  const [nextSessionApplying, setNextSessionApplying] = useState(false);
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [latestActivePromotionId, setLatestActivePromotionId] = useState(null);
  const [promotionHistoryLoading, setPromotionHistoryLoading] = useState(true);
  const [revertTargetId, setRevertTargetId] = useState(null);
  const [revertConfirmOpen, setRevertConfirmOpen] = useState(false);
  const [revertingPromotion, setRevertingPromotion] = useState(false);

  // Initial departments load: if Redux has nothing, show spinner; otherwise hydrate from Redux and refresh in background.
  useEffect(() => {
    if (!user || !isSocietyRole(user?.accountType)) return;
    if (!manageSociety.departments?.length) {
      console.log("redux has nothing");
      setLoading(true);
    }
    getTeamDepartments()
      .then((res) => {
        const next = res.data || [];
        setDepartments(next);
        dispatch(setDepartmentsInStore(next));
      })
      .catch((e) => {
        toast.error(e.message || "Failed to load departments");
        setDepartments([]);
        dispatch(setDepartmentsInStore([]));
      })
      .finally(() => setLoading(false));
  }, [user, location.pathname, manageSociety.departments?.length, dispatch]);

  useEffect(() => {
    if (!selectedDepartment || loading || departments.length === 0) return;
    if (!departments.includes(selectedDepartment)) {
      navigate("/manage-society", { replace: true });
    }
  }, [selectedDepartment, departments, loading, navigate]);

  // Department member counts: roster (heads/leads/members incl. not logged in) + extra team members, cached in Redux.
  useEffect(() => {
    if (!user || departments.length === 0) return;
    const counts = {};
    Promise.all(
      departments.map((dept) =>
        Promise.all([getDepartmentRoster(dept), getTeamMembers(dept)])
          .then(([rosterRes, membersRes]) => {
            counts[dept] = getDepartmentMemberCount(rosterRes.data, membersRes.data);
          })
          .catch(() => {
            counts[dept] = 0;
          }),
      ),
    ).then(() => {
      setDepartmentCounts({ ...counts });
      dispatch(setDepartmentCountsInStore(counts));
    });
  }, [user, departments, dispatch]);

  // All people list: if already present in Redux, show immediately and refresh in background.
  useEffect(() => {
    if (!user) return;
    const shouldLoadAll =
      (showListOpen || !selectedDepartment) && !manageSociety.allPeopleList?.length;
    if (shouldLoadAll) {
      setAllPeopleLoading(true);
    }
    if (showListOpen || !selectedDepartment) {
      getAllPeople()
        .then((res) => {
          const list = res.data || [];
          setAllPeopleList(list);
          dispatch(setAllPeopleListInStore(list));
        })
        .catch((e) => {
          toast.error(e.message || "Failed to load people");
          setAllPeopleList([]);
          dispatch(setAllPeopleListInStore([]));
        })
        .finally(() => setAllPeopleLoading(false));
    }
  }, [showListOpen, selectedDepartment, user, dispatch, manageSociety.allPeopleList?.length]);

  const refreshAllPeople = () => {
    return getAllPeople()
      .then((res) => {
        const list = res.data || [];
        setAllPeopleList(list);
        dispatch(setAllPeopleListInStore(list));
        return list;
      })
      .catch((e) => {
        toast.error(e.message || "Failed to refresh people list");
      });
  };

  const loadPromotionHistory = () => {
    setPromotionHistoryLoading(true);
    return getYearPromotionHistory()
      .then((res) => {
        setPromotionHistory(res.data || []);
        setLatestActivePromotionId(res.latestActiveId || null);
      })
      .catch((e) => {
        toast.error(e.message || "Failed to load session history");
        setPromotionHistory([]);
        setLatestActivePromotionId(null);
      })
      .finally(() => setPromotionHistoryLoading(false));
  };

  useEffect(() => {
    if (!user || !isSocietyRole(user?.accountType) || !nextSessionModalOpen) return;
    loadPromotionHistory();
  }, [user, nextSessionModalOpen]);

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

  const handleApplyNextSession = async () => {
    setNextSessionApplying(true);
    try {
      const res = await applyNextSessionYearPromotion();
      toast.success(res.message || "Next session changes applied.");
      setNextSessionConfirmOpen(false);
      setNextSessionModalOpen(false);
      await Promise.all([refreshAllPeople(), loadPromotionHistory()]);
    } catch (e) {
      toast.error(e.message || "Failed to apply next session changes");
    } finally {
      setNextSessionApplying(false);
    }
  };

  const handleRevertPromotion = async () => {
    if (!revertTargetId) return;
    setRevertingPromotion(true);
    try {
      const res = await revertYearPromotion(revertTargetId);
      toast.success(res.message || "Changes reverted.");
      setRevertConfirmOpen(false);
      setRevertTargetId(null);
      await Promise.all([refreshAllPeople(), loadPromotionHistory()]);
    } catch (e) {
      toast.error(e.message || "Failed to revert changes");
    } finally {
      setRevertingPromotion(false);
    }
  };

  /** Build department export rows from active registered users and team members only. */
  const buildDepartmentExportRows = (roster, members, department = "") => {
    const activeRoster = (roster || []).filter((row) => row.registered && row.user);
    const rosterEmails = new Set(activeRoster.map((r) => (r.email || "").toLowerCase()));
    const extraMembers = (members || []).filter(
      (m) => !rosterEmails.has((m.email || "").toLowerCase())
    );
    const fromRoster = activeRoster.map((row) => {
      const u = row.user;
      const profile = u?.additionalDetails || {};
      return {
        name: [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || row.email,
        department,
        year: profile?.year || profile?.yearOfStudy || "",
        branch: profile?.branch || "",
        section: profile?.section || "",
        email: row.email,
        contact: u?.contact || "",
        non_tech_society: profile?.non_tech_society || "",
        accountType: u?.accountType || "",
        role: profile?.position || profile?.p0 || u?.accountType || "Member",
      };
    });
    const fromMembers = (extraMembers || []).map((m) => ({
      name: m.name || "",
      department,
      year: m.year || "",
      branch: m.branch || "",
      section: m.section || "",
      email: m.email || "",
      contact: m.contact || "",
      non_tech_society: m.non_tech_society || "",
      accountType: "",
      role: m.position || "Member",
    }));
    return [...fromRoster, ...fromMembers];
  };

  const buildUserExportRow = (u) => {
    const profile = u?.additionalDetails || {};
    return {
      name: [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || u?.email || "",
      department: u?.accountType || "",
      year: profile.year || profile.yearOfStudy || "",
      branch: profile.branch || "",
      section: profile.section || "",
      email: u?.email || "",
      contact: u?.contact || "",
      non_tech_society: profile.non_tech_society || "",
      accountType: u?.accountType || "",
      role: profile.position || profile.p0 || u?.accountType || "Member",
    };
  };

  const isCoreTeamRow = (row) => {
    const role = String(row.role || "").toLowerCase();
    const accountType = String(row.accountType || "").toLowerCase();
    return accountType === "chairperson" || accountType === "vice-chairperson" ||
      accountType === "treasurer" || role === "chairperson" ||
      role === "vice-chairperson" || role === "treasurer" || role.includes("lead");
  };

  const isDepartmentHeadRow = (row) =>
    String(row.role || "").toLowerCase().includes("head");

  const uniqueRows = (rows) => {
    const seen = new Set();
    return rows.filter((row) => {
      const key = String(row.email || row.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const buildSocietyExportSections = async () => {
    const departmentRows = {};
    await Promise.all(
      departments.map(async (dept) => {
        const [rosterRes, membersRes] = await Promise.all([
          getDepartmentRoster(dept),
          getTeamMembers(dept),
        ]);
        departmentRows[dept] = buildDepartmentExportRows(
          rosterRes.data || [],
          membersRes.data || [],
          dept
        );
      })
    );

    const allPeopleRes = await getAllPeople();
    const activeUserRows = (allPeopleRes.data || [])
      .filter((item) => item.type === "user")
      .map((item) => buildUserExportRow(item.data));
    const leadershipRows = uniqueRows([
      ...activeUserRows,
      ...Object.values(departmentRows).flat(),
    ]);
    const coreTeam = leadershipRows.filter(isCoreTeamRow);
    const departmentHeads = leadershipRows.filter(
      (row) => !isCoreTeamRow(row) && isDepartmentHeadRow(row)
    );
    const leadershipEmails = new Set(
      [...coreTeam, ...departmentHeads]
        .map((row) => String(row.email || "").trim().toLowerCase())
        .filter(Boolean)
    );

    const sections = {
      "Core Team": coreTeam,
      "Department Heads": departmentHeads,
    };
    departments.forEach((dept) => {
      sections[dept] = (departmentRows[dept] || []).filter(
        (row) => !leadershipEmails.has(String(row.email || "").trim().toLowerCase())
      );
    });
    return sections;
  };

  const handlePrintAllPDF = async () => {
    if (printAllSelectedFields.length === 0) {
      toast.error("Select at least one column");
      return;
    }
    setPrintAllLoading(true);
    try {
      const map = await buildSocietyExportSections();
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
      const map = await buildSocietyExportSections();
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
      const list = buildDepartmentExportRows(roster, members, dept);
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
        <p className="text-gray-400">
          <Spinner className="size-4 text-gray-400" />
        </p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isSocietyRole(user.accountType)) return <Navigate to="/manage-team" replace />;

  if (selectedDepartment && departments.includes(selectedDepartment)) {
    return (
      <ManageTeam
        department={selectedDepartment}
        isSociety
        onBack={() => navigate("/manage-society")}
      />
    );
  }

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold text-richblack-25 flex items-center gap-2 mb-2">
          <Users className="h-10 w-10 text-cyan-400" />
          Manage society
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Select a department to view and manage its members (same as Manage team).
          {!allPeopleLoading && allPeopleList.length > 0 && (
            <>
              {" · "}
              <span className="text-gray-300 font-medium">
                {allPeopleList.length} total member{allPeopleList.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
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
          <button
            type="button"
            onClick={() => setNextSessionModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Apply next session
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
            <Spinner className="size-5 text-cyan-400" />
          </div>
        ) : (
          <div className="grid gap-3">
            {departments.map((dept, idx) => (
              <motion.div
                key={dept}
                onClick={() =>
                  navigate(`/manage-society?department=${encodeURIComponent(dept)}`)
                }
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  ease: "easeOut",
                  delay: Math.min(idx * 0.04, 0.4),
                }}
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
                  <span className="font-medium text-richblack-25">{dept}</span>
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
              </motion.div>
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
                  <h2 className="text-lg font-bold text-richblack-25">All people</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowListOpen(false);
                      setSelectedDetailItem(null);
                    }}
                    className="ios-close-dot"
                    aria-label="Close"
                  >
                    <span>×</span>
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
                          const src = u.image ? photoPreviewUrl(u.image) : avatarPlaceholder(name);
                          const position = u.additionalDetails?.position && String(u.additionalDetails.position).trim();
                          const tagLabel = position || getAccountTypeLabel(u.accountType) || u.accountType || "Member";
                          
                          content = (
                            <button
                              type="button"
                              className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-all border border-transparent hover:border-gray-500/30 active:scale-[0.98]"
                              onClick={() => setSelectedDetailItem({ type: "user", data: u })}
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover border border-gray-500/50 shrink-0"
                                onError={(e) => { e.target.onerror = null; e.target.src = avatarPlaceholder(name); }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block truncate font-medium text-richblack-25">{name}</span>
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
                                  className="h-8 w-8 rounded-full object-cover border border-gray-500/50 shrink-0"
                                  onError={(e) => { e.target.onerror = null; e.target.src = avatarPlaceholder(name); }}
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="block truncate font-medium text-richblack-25">{name}</span>
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
                          const tagLabel = (m.position && String(m.position).trim()) || item.department || "Team";
                          content = (
                            <button
                              type="button"
                              className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-all border border-transparent hover:border-gray-500/30 active:scale-[0.98]"
                              onClick={() => setSelectedDetailItem({ type: "teamMember", data: m })}
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover border border-gray-500/50 shrink-0"
                                onError={(e) => { e.target.onerror = null; e.target.src = avatarPlaceholder(name); }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block truncate font-medium text-richblack-25">{name}</span>
                                <span className="block truncate text-xs text-gray-500">{m.email}</span>
                              </div>
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                {tagLabel}
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
              onViewLogs={(userId, userName) => setActivityLogUser({ id: userId, name: userName })}
            />,
            document.body
          )}
        {activityLogUser &&
          createPortal(
            <ActivityLogModal
              userId={activityLogUser.id}
              userName={activityLogUser.name}
              onClose={() => setActivityLogUser(null)}
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

        {nextSessionModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !nextSessionApplying && setNextSessionModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="darkthemebg rounded-2xl border border-gray-500/30 w-full max-w-lg max-h-[min(90vh,720px)] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-500/30 shrink-0">
                <h2 className="text-lg font-bold text-richblack-25 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-cyan-400" />
                  Apply next session
                </h2>
                <button
                  type="button"
                  onClick={() => !nextSessionApplying && setNextSessionModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-richblack-25 hover:bg-gray-500/30"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto min-h-0">
                <p className="text-sm text-gray-300">
                  This promotes every member&apos;s year of study for the new academic session across all departments and all people in the society list.
                </p>
                <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                  <li>1st year → 2nd year</li>
                  <li>2nd year → 3rd year</li>
                  <li>3rd year → 4th year</li>
                  <li>4th year → 4+</li>
                </ul>
                <p className="text-sm text-gray-300 bg-gray-600/25 border border-gray-500/40 rounded-lg px-3 py-2">
                  This updates registered users, predefined profiles, and team member records. You can revert the most recent active change from the history below.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-500/30">
                  <button
                    type="button"
                    onClick={() => setNextSessionConfirmOpen(true)}
                    disabled={nextSessionApplying}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-richblack-25 font-medium text-sm disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Confirm & apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextSessionModalOpen(false)}
                    disabled={nextSessionApplying}
                    className="px-4 py-2.5 rounded-xl border border-gray-500/50 text-gray-400 hover:bg-gray-500/20 text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-cyan-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-richblack-25">Next session history</h3>
                  </div>
                  {promotionHistoryLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Spinner className="size-4 text-cyan-400" />
                      Loading history…
                    </div>
                  ) : promotionHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No next session changes have been applied yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {promotionHistory.map((session) => {
                        const isLatestActive =
                          session.status === "active" &&
                          String(session._id) === String(latestActivePromotionId);
                        return (
                          <li
                            key={session._id}
                            className="rounded-lg border border-gray-500/30 bg-[#252536]/60 px-4 py-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm text-richblack-25 font-medium">
                                  {formatSessionDate(session.appliedAt)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Applied by {session.appliedBy?.name || session.appliedBy?.email || "Unknown"}
                                  {" · "}
                                  {session.totalUpdated} member{session.totalUpdated === 1 ? "" : "s"} updated
                                </p>
                                {formatPromotionSummary(session.summary) && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatPromotionSummary(session.summary)}
                                  </p>
                                )}
                                {session.status === "reverted" && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Reverted on {formatSessionDate(session.revertedAt)} by{" "}
                                    {session.revertedBy?.name || session.revertedBy?.email || "Unknown"}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${
                                    session.status === "active"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                  }`}
                                >
                                  {session.status === "active" ? "Active" : "Reverted"}
                                </span>
                                {isLatestActive && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRevertTargetId(String(session._id));
                                      setRevertConfirmOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-300 transition-colors text-xs font-medium"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Revert
                                  </button>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmDeleteModal
          open={nextSessionConfirmOpen}
          title="Apply next session?"
          description={
            <>
              This will increase the year of study for every member by one year across all departments
              (1st → 2nd, 2nd → 3rd, 3rd → 4th, 4th → 4+). Registered users, predefined profiles, and
              team member records will all be updated.
            </>
          }
          confirmLabel={nextSessionApplying ? "Applying" : "Confirm & apply"}
          loading={nextSessionApplying}
          onConfirm={handleApplyNextSession}
          onClose={() => !nextSessionApplying && setNextSessionConfirmOpen(false)}
        />

        {revertConfirmOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !revertingPromotion && setRevertConfirmOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="darkthemebg rounded-2xl border border-gray-500/30 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-500/30">
                <h2 className="text-lg font-bold text-richblack-25 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-red-400" />
                  Revert next session changes
                </h2>
                <button
                  type="button"
                  onClick={() => !revertingPromotion && setRevertConfirmOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-richblack-25 hover:bg-gray-500/30"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-300">
                  This will restore every member&apos;s year to what it was before the most recent next session promotion.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-500/30">
                  <button
                    type="button"
                    onClick={handleRevertPromotion}
                    disabled={revertingPromotion}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-richblack-25 font-medium text-sm disabled:opacity-50"
                  >
                    <RotateCcw className={`h-4 w-4 ${revertingPromotion ? "animate-spin" : ""}`} />
                    {revertingPromotion ? "Reverting…" : "Confirm revert"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevertConfirmOpen(false)}
                    disabled={revertingPromotion}
                    className="px-4 py-2.5 rounded-xl border border-gray-500/50 text-gray-400 hover:bg-gray-500/20 text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                <h2 className="text-lg font-bold text-richblack-25 flex items-center gap-2">
                  <Printer className="h-5 w-5 text-cyan-400" />
                  Print whole list (all departments)
                </h2>
                <button
                  type="button"
                  onClick={() => setPrintAllModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-richblack-25 hover:bg-gray-500/30"
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
                      className="flex items-center gap-2 cursor-pointer text-sm text-gray-200 hover:text-richblack-25"
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
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-richblack-25 font-medium text-sm disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4" />
                    {printAllLoading ? "Generating…" : "Generate & Download PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintAllExcel}
                    disabled={printAllLoading || printAllSelectedFields.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-richblack-25 font-medium text-sm disabled:opacity-50"
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
