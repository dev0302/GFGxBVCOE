import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  getDepartmentRoster,
  getTeamMembers,
  getTeamDepartments,
  getAllPeople,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getDeletedTeamMembers,
  restoreTeamMember,
  restoreAllDeletedTeamMembers,
  uploadTeamExcel,
  downloadTeamTemplate,
  createTeamInviteLink,
  getActiveTeamInviteLink,
  suspendTeamInviteLink,
  getAccountTypeLabel,
  sendSignupInvite,
  broadcastNotificationToDepartment,
  broadcastNotificationToAll,
  getNotificationBroadcastAudience,
} from "../services/api";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Download,
  FileText,
  Edit3,
  Trash2,
  ArrowLeft,
  Link2,
  X,
  Printer,
  Mail,
  List,
  Grid,
  Phone,
  RotateCcw,
  Bell,
} from "react-feather";
import {
  driveLinkToImageUrl,
  avatarPlaceholder,
  photoPreviewUrl,
  photoPreviewLargeAvatarUrl,
} from "../utils/teamMemberUtils";
import {
  downloadTeamListPDF,
  downloadTeamListExcel,
} from "../utils/teamListExport";
import Search from "../components/Search";
import {
  MemberDetailModal,
  UserDetailModal,
  PredefinedOnlyDetailModal,
  ActivityLogModal,
} from "../components/Search";
import { createPortal } from "react-dom";
import imageCompression from "browser-image-compression";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { uploadTeamPhoto } from "../services/api";
import { Spinner } from "@/components/ui/spinner";
import TeamMemberCard from "../components/TeamMemberCard";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import ImageModal from "../components/ImageModal";

const DELETED_MEMBER_RETENTION_DAYS = 7;

function formatDeletedAt(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function daysUntilPermanentDelete(deletedAt, retentionDays = DELETED_MEMBER_RETENTION_DAYS) {
  const purgeAt = new Date(deletedAt).getTime() + retentionDays * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

const COLS = [
  "name",
  "year",
  "branch",
  "section",
  "email",
  "contact",
  "photo",
  "non_tech_society",
];

const LIST_COLS = ["photo", ...COLS.filter((k) => k !== "photo")];

const LABELS = {
  name: "Name",
  year: "Year",
  branch: "Branch",
  section: "Section",
  email: "Email",
  contact: "Contact",
  photo: "Photo",
  non_tech_society: "Non-tech society",
};
// lets see whats going on
const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th"];
const BRANCH_OPTIONS = ["CSE", "AIML", "IT", "EEE", "ECE", "ICE"];
const ORG_NAME = "GFG BVCOE";
const EXPORT_COLS = COLS.filter((k) => k !== "photo");
const PREDEFINED_IMAGE_BASE = "https://www.gfg-bvcoe.com";

const iosRowVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.96,
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
    },
  }),
};

const PrintingLoader = ({ isPrinting }) => (
  <AnimatePresence>
    {isPrinting && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1e1e2f]/80 backdrop-blur-md"
      >
        <div className="relative flex flex-col items-center">
          <div className="relative p-8 bg-[#2c2c3e] rounded-3xl border border-gray-500/30 shadow-2xl">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <FileText className="h-16 w-16 text-red-500" />
            </motion.div>
            <motion.div
              initial={{ top: "20%" }}
              animate={{ top: "70%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="absolute left-6 right-6 h-1 bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)] rounded-full z-10"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <h3 className="text-richblack-25 font-bold text-lg flex items-center gap-2">
              <Printer className="h-5 w-5 animate-pulse" />
              Generating PDF...
            </h3>
            <p className="text-gray-400 text-sm">
              Please do not close this tab
            </p>
          </motion.div>
          <div className="w-48 h-1.5 bg-gray-700 rounded-full mt-4 overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-full h-full bg-gradient-to-r from-transparent via-red-500 to-transparent"
            />
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function ManageTeam({
  department: propDepartment,
  isSociety,
  onBack,
  readOnly = false,
}) {
  const { user, loading: authLoading } = useAuth();
  const isReadOnly = readOnly || !!user?.isDepartmentMember;
  const [viewMode, setViewMode] = useState(window.innerWidth > 640 ? "list" : "grid");
  const [roster, setRoster] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAllTeamOpen, setShowAllTeamOpen] = useState(false);
  const [wholeTeamLoading, setWholeTeamLoading] = useState(false);
  const [wholeTeamList, setWholeTeamList] = useState([]);
  const [showSocietyListOpen, setShowSocietyListOpen] = useState(false);
  const [societyListLoading, setSocietyListLoading] = useState(false);
  const [societyList, setSocietyList] = useState([]);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [photoModalData, setPhotoModalData] = useState(null);
  const [sendingInviteTo, setSendingInviteTo] = useState(null);
  const [activityLogUser, setActivityLogUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [inviteLinkOpen, setInviteLinkOpen] = useState(false);
  const [inviteLinkData, setInviteLinkData] = useState(null);
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [inviteLinkFetching, setInviteLinkFetching] = useState(false);
  const [inviteLinkSuspending, setInviteLinkSuspending] = useState(false);
  const [expiresIn, setExpiresIn] = useState("12h");
  const [editMember, setEditMember] = useState(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [deletedMembers, setDeletedMembers] = useState([]);
  const [deletedRetentionDays, setDeletedRetentionDays] = useState(DELETED_MEMBER_RETENTION_DAYS);
  const [deletedMembersLoading, setDeletedMembersLoading] = useState(false);
  const [restoringMemberId, setRestoringMemberId] = useState(null);
  const [restoringAllDeleted, setRestoringAllDeleted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(
    COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}),
  );
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState([
    ...EXPORT_COLS,
  ]);
  const [isPrinting, setIsPrinting] = useState(false);
  const imgCropRef = useRef(null);
  const cropPxRef = useRef(null);

  // Department notification broadcast state
  const [deptNotifModalOpen, setDeptNotifModalOpen] = useState(false);
  const [deptNotifSending, setDeptNotifSending] = useState(false);
  const [deptNotifError, setDeptNotifError] = useState("");
  const [deptNotifSuccess, setDeptNotifSuccess] = useState("");
  const [deptNotifForm, setDeptNotifForm] = useState({ title: "", body: "" });
  const [deptNotifTarget, setDeptNotifTarget] = useState("members"); // "members" | "all"
  const [deptBroadcastAudience, setDeptBroadcastAudience] = useState(null);

  const department = isSociety ? propDepartment : user?.accountType;
  // console.log(department);

  const getCroppedImg = (imageEl, cropPx) => {
    if (!imageEl || !cropPx?.width || !cropPx?.height)
      return Promise.resolve(null);

    const canvas = document.createElement("canvas");
    canvas.width = cropPx.width;
    canvas.height = cropPx.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);

    // Scale factors between displayed size and natural size
    const scaleX = imageEl.naturalWidth / imageEl.width;
    const scaleY = imageEl.naturalHeight / imageEl.height;

    ctx.drawImage(
      imageEl,
      cropPx.x * scaleX,
      cropPx.y * scaleY,
      cropPx.width * scaleX,
      cropPx.height * scaleY,
      0,
      0,
      cropPx.width,
      cropPx.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, etc.)");
      return;
    }
    try {
      let toUse = file;
      if (file.size > 5 * 1024 * 1024) {
        toUse = await imageCompression(file, {
          maxSizeMB: 5,
          maxWidthOrHeight: 1200,
        });
      }
      const src = URL.createObjectURL(toUse);
      setCropImageSrc(src);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
    } catch (err) {
      toast.error(err.message || "Failed to process image");
    }
  };

  const handleCropApply = async () => {
    if (!imgCropRef.current || !crop?.width || !cropImageSrc) return;
    const imageEl = imgCropRef.current;
    const nw = imageEl.naturalWidth;
    const nh = imageEl.naturalHeight;
    const px = cropPxRef.current;
    const cropPx =
      px && px.width && px.height
        ? { x: px.x, y: px.y, width: px.width, height: px.height }
        : crop.unit === "px"
          ? { x: crop.x, y: crop.y, width: crop.width, height: crop.height }
          : {
              x: (crop.x / 100) * nw,
              y: (crop.y / 100) * nh,
              width: (crop.width / 100) * nw,
              height: (crop.height / 100) * nh,
            };
    try {
      let blob = await getCroppedImg(imageEl, cropPx);
      if (!blob) return;
      if (blob.size > 5 * 1024 * 1024) {
        const f = new File([blob], "photo.jpg", { type: "image/jpeg" });
        blob = await imageCompression(f, { maxSizeMB: 5 });
      }
      setPhotoUploading(true);
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const res = await uploadTeamPhoto(file);
      if (res?.url) {
        setForm((p) => ({ ...p, photo: res.url }));
        toast.success("Photo uploaded");
      }
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setPhotoUploading(false);
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const loadDeletedMembers = async () => {
    if (!department) return;
    setDeletedMembersLoading(true);
    try {
      const res = await getDeletedTeamMembers(department);
      setDeletedMembers(res.data || []);
      setDeletedRetentionDays(res.retentionDays ?? DELETED_MEMBER_RETENTION_DAYS);
    } catch {
      setDeletedMembers([]);
    } finally {
      setDeletedMembersLoading(false);
    }
  };

  const load = async () => {
    try {
      const [rosterRes, membersRes] = await Promise.all([
        getDepartmentRoster(department),
        getTeamMembers(department),
      ]);
      setRoster(rosterRes.data || []);
      setMembers(membersRes.data || []);
      if (!isReadOnly) await loadDeletedMembers();
    } catch (e) {
      toast.error(e.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const loadWholeTeam = async () => {
    setWholeTeamLoading(true);
    try {
      const departments = isSociety
        ? department
          ? [department]
          : (await getTeamDepartments()).data || []
        : [department].filter(Boolean);
      if (!departments.length) {
        setWholeTeamList([]);
        return;
      }
      const byEmail = new Map();
      for (const dept of departments) {
        const [rosterRes, membersRes] = await Promise.all([
          getDepartmentRoster(dept),
          getTeamMembers(dept),
        ]);
        const rosterData = rosterRes.data || [];
        const membersData = membersRes.data || [];
        for (const row of rosterData) {
          const email = (row.email || "").trim().toLowerCase();
          if (!email) continue;
          if (row.registered && row.user) {
            byEmail.set(email, {
              type: "registered",
              data: row.user,
              department: dept,
            });
          } else {
            const pre = row.predefinedProfile || {};
            byEmail.set(email, {
              type: "predefinedOnly",
              data: { ...pre, email: row.email },
              department: dept,
            });
          }
        }
        for (const m of membersData) {
          const email = (m.email || "").trim().toLowerCase();
          if (!email || byEmail.has(email)) continue;
          byEmail.set(email, { type: "teamMember", data: m, department: dept });
        }
      }
      setWholeTeamList(Array.from(byEmail.values()));
    } catch (e) {
      toast.error(e.message || `Failed to load ${displayDepartment} team`);
      setWholeTeamList([]);
    } finally {
      setWholeTeamLoading(false);
    }
  };

  useEffect(() => {
    if (user && (!isSociety || propDepartment)) load();
  }, [user, propDepartment, isSociety]);

  useEffect(() => {
    if (showAllTeamOpen && user) loadWholeTeam();
  }, [showAllTeamOpen, user, department]);

  useEffect(() => {
    if (showAllTeamOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showAllTeamOpen]);

  useEffect(() => {
    if (showSocietyListOpen && user) {
      setSocietyListLoading(true);
      getAllPeople()
        .then((res) => setSocietyList(res.data || []))
        .catch((e) => {
          toast.error(e.message || "Failed to load society list");
          setSocietyList([]);
        })
        .finally(() => setSocietyListLoading(false));
    }
  }, [showSocietyListOpen, user]);

  useEffect(() => {
    if (showSocietyListOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showSocietyListOpen]);

  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.year?.trim()) {
      toast.error("Year is required");
      return;
    }
    if (!form.branch?.trim()) {
      toast.error("Branch is required");
      return;
    }
    if (!form.section?.trim()) {
      toast.error("Section is required");
      return;
    }
    if (!form.email?.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!form.contact?.trim()) {
      toast.error("Contact is required");
      return;
    }
    if (!form.photo?.trim()) {
      toast.error("Photo is required (upload or paste link)");
      return;
    }
    setSaving(true);
    try {
      const payload = department ? { ...form, department } : form;
      await addTeamMember(payload);
      toast.success("Member added");
      setForm(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
      setManualOpen(false);
      setAddMenuOpen(false);
      load();
    } catch (e) {
      toast.error(e.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadTeamExcel(file, department);
      toast.success(res.message || "Members added");
      setAddMenuOpen(false);
      load();
    } catch (e) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTeamTemplate();
      toast.success("Template downloaded");
    } catch (e) {
      toast.error(e.message || "Download failed");
    }
  };

  const toggleExportField = (k) => {
    setSelectedExportFields((prev) =>
      prev.includes(k) ? prev.filter((f) => f !== k) : [...prev, k],
    );
  };
  const selectAllExportFields = () => setSelectedExportFields([...EXPORT_COLS]);
  const deselectAllExportFields = () => setSelectedExportFields([]);

  const rosterToExportRows = () => {
    const rosterEmails = new Set(
      (roster || []).map((r) => (r.email || "").toLowerCase()),
    );
    const extraMembers = (members || []).filter(
      (m) => !rosterEmails.has((m.email || "").toLowerCase()),
    );
    const fromRoster = (roster || []).map((row) => {
      const u = row.user;
      const profile = u?.additionalDetails || {};
      const pre = row.predefinedProfile || {};
      const name = row.registered
        ? [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
          row.email
        : pre?.name || row.email;
      return {
        name,
        year: row.registered
          ? profile?.year || profile?.yearOfStudy || ""
          : pre?.year || "",
        branch: row.registered ? profile?.branch || "" : pre?.branch || "",
        section: row.registered ? profile?.section || "" : "",
        email: row.email,
        contact: row.registered ? u?.contact || "" : "",
        non_tech_society: row.registered ? profile?.non_tech_society || "" : "",
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

  const tableRowCount = () => {
    const rosterEmails = new Set(
      (roster || []).map((r) => (r.email || "").toLowerCase()),
    );
    const extra = (members || []).filter(
      (m) => !rosterEmails.has((m.email || "").toLowerCase()),
    );
    return (roster || []).length + extra.length;
  };

  const handleExportPDF = async () => {
    if (selectedExportFields.length === 0) {
      toast.error("Select at least one column to include");
      return;
    }
    if (tableRowCount() === 0) {
      toast.error("No one to export");
      return;
    }
    setIsPrinting(true);
    try {
      // Let overlay paint before sync PDF generation starts.
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      downloadTeamListPDF(
        rosterToExportRows(),
        selectedExportFields,
        LABELS,
        `${ORG_NAME} - ${displayDepartment} - Member List`,
      );
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e.message || "PDF download failed");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportExcel = () => {
    if (selectedExportFields.length === 0) {
      toast.error("Select at least one column to include");
      return;
    }
    if (tableRowCount() === 0) {
      toast.error("No one to export");
      return;
    }
    try {
      downloadTeamListExcel(
        rosterToExportRows(),
        selectedExportFields,
        LABELS,
        `${ORG_NAME} - ${displayDepartment} - Member List`,
      );
      toast.success("Excel downloaded");
    } catch (e) {
      toast.error(e.message || "Excel download failed");
    }
  };

  const displayDepartment = department || user?.accountType || "";

  useEffect(() => {
    if (!displayDepartment) {
      setDeptBroadcastAudience(null);
      return;
    }
    getNotificationBroadcastAudience(displayDepartment)
      .then((res) => setDeptBroadcastAudience(res?.data || null))
      .catch(() => setDeptBroadcastAudience(null));
  }, [displayDepartment]);

  const fetchActiveInviteLink = async () => {
    setInviteLinkFetching(true);
    try {
      const payload = displayDepartment ? { department: displayDepartment } : {};
      const res = await getActiveTeamInviteLink(payload.department);
      setInviteLinkData(res.data || null);
    } catch (e) {
      toast.error(e.message || "Failed to load invite link");
      setInviteLinkData(null);
    } finally {
      setInviteLinkFetching(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    setInviteLinkLoading(true);
    try {
      const payload = {
        ...(department ? { department } : {}),
        expiresIn,
      };
      const res = await createTeamInviteLink(payload);
      if (res.success && res.data) {
        setInviteLinkData(res.data);
        if (res.existing) {
          toast.info("An active invite link already exists for this department.");
        } else {
          toast.success(`Invite link created. Valid for ${expiresIn}.`);
        }
      }
    } catch (e) {
      toast.error(e.message || "Failed to create invite link");
    } finally {
      setInviteLinkLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!inviteLinkData?.token) return;
    const url = `${window.location.origin}/join-team/${inviteLinkData.token}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy"));
  };

  const handleSuspendInviteLink = () => {
    if (!inviteLinkData?.token) return;
    setInviteLinkSuspending(true);
    suspendTeamInviteLink(inviteLinkData.token)
      .then(() => {
        setInviteLinkData(null);
        toast.success("Link suspended. It can no longer be used.");
      })
      .catch((e) => toast.error(e.message || "Failed to suspend link"))
      .finally(() => setInviteLinkSuspending(false));
  };

  const openEdit = (m) => {
    setEditMember(m);
    setForm(
      COLS.reduce(
        (acc, k) => ({
          ...acc,
          [k]:
            k === "photo"
              ? (m.photo ?? m.image_drive_link ?? "")
              : (m[k] ?? ""),
        }),
        {},
      ),
    );
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editMember?._id) return;
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.year?.trim()) {
      toast.error("Year is required");
      return;
    }
    if (!form.branch?.trim()) {
      toast.error("Branch is required");
      return;
    }
    if (!form.section?.trim()) {
      toast.error("Section is required");
      return;
    }
    if (!form.email?.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!form.contact?.trim()) {
      toast.error("Contact is required");
      return;
    }
    if (!form.photo?.trim()) {
      toast.error("Photo is required");
      return;
    }
    setSaving(true);
    try {
      const payload = department ? { ...form, department } : form;
      await updateTeamMember(editMember._id, payload);
      toast.success("Member updated");
      setEditMember(null);
      setForm(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
      load();
    } catch (e) {
      toast.error(e.message || "Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!deleteConfirmMember?._id) return;
    setDeletingMember(true);
    try {
      await deleteTeamMember(
        deleteConfirmMember._id,
        department ? { department } : {},
      );
      toast.success("Member moved to deleted list");
      setDeleteConfirmMember(null);
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to delete member");
    } finally {
      setDeletingMember(false);
    }
  };

  const handleRestoreMember = async (id) => {
    setRestoringMemberId(id);
    try {
      await restoreTeamMember(id, department ? { department } : {});
      toast.success("Member restored");
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to restore member");
    } finally {
      setRestoringMemberId(null);
    }
  };

  const handleRestoreAllDeleted = async () => {
    setRestoringAllDeleted(true);
    try {
      const res = await restoreAllDeletedTeamMembers(
        department ? { department } : {},
      );
      toast.success(res.message || "Members restored");
      if (res.skipped?.length) {
        toast.message(
          `${res.skipped.length} member(s) skipped (email already in use).`,
        );
      }
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to restore members");
    } finally {
      setRestoringAllDeleted(false);
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
  if (isSociety && !propDepartment) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-richblack-25 placeholder-gray-500 focus:border-cyan-500 outline-none text-sm";

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16">
      <PrintingLoader isPrinting={isPrinting} />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {isSociety && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-2 text-gray-400 hover:text-cyan-300 text-sm mb-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to departments
                </button>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-richblack-25 flex items-center gap-2">
                <Users className="h-10 w-10 text-cyan-400" />
                {isSociety
                  ? `Manage society › ${displayDepartment}`
                  : isReadOnly ? "View your team" : "Manage your team"}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Department:{" "}
                <span className="text-cyan-300 font-medium">
                  {displayDepartment}
                </span>
                {(() => {
                  const rosterArr = roster || [];
                  const rosterEmails = new Set(
                    rosterArr.map((r) => (r.email || "").toLowerCase()),
                  );
                  const extraCount = (members || []).filter(
                    (m) => !rosterEmails.has((m.email || "").toLowerCase()),
                  ).length;
                  const totalMembers = rosterArr.length + extraCount;
                  return totalMembers > 0 ? (
                    <>
                      {" · "}
                      <span className="text-gray-300 font-medium">
                        {totalMembers} member{totalMembers !== 1 ? "s" : ""}
                      </span>
                    </>
                  ) : null;
                })()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-gray-500/40 transition-colors text-sm font-medium"
              >
                <Printer className="h-4 w-4" />
                Print / Export list
              </button>
              {(isSociety || !isReadOnly) && (
                <>
                <button
  type="button"
  onClick={() => {
    setDeptNotifTarget("members");
    setDeptNotifForm({ title: "", body: "" });
    setDeptNotifError("");
    setDeptNotifSuccess("");
    setDeptNotifModalOpen(true);
  }}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-200 hover:bg-sky-500/25 hover:border-sky-400/50 transition-colors text-sm font-medium"
>
  <Bell className="h-4 w-4" />
  Notify {displayDepartment} Members
  {deptBroadcastAudience?.members != null ? ` (${deptBroadcastAudience.members})` : ""}
</button>
                <button
  type="button"
  onClick={() => {
    setDeptNotifTarget("all");
    setDeptNotifForm({ title: "", body: "" });
    setDeptNotifError("");
    setDeptNotifSuccess("");
    setDeptNotifModalOpen(true);
  }}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25 hover:border-emerald-400/50 transition-colors text-sm font-medium"
>
  <Bell className="h-4 w-4" />
  Send notification to all
  {deptBroadcastAudience?.total != null ? ` (${deptBroadcastAudience.total})` : ""}
</button>
                </>
              )}
              {!isReadOnly && <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-gray-500/40 transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Download template
              </button>}
              {!isReadOnly && <div className="relative">
                <button
                  type="button"
                  onClick={() => setAddMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-richblack-25 font-semibold text-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add team
                </button>
                {addMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setAddMenuOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 rounded-xl darkthemebg border border-gray-500/30 shadow-xl py-1 z-50">
                      <button
                        type="button"
                        onClick={() => {
                          setManualOpen(true);
                          setAddMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-500/20"
                      >
                        <Edit3 className="h-4 w-4 text-cyan-400" />
                        Add manually
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInviteLinkOpen(true);
                          setAddMenuOpen(false);
                          fetchActiveInviteLink();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-500/20"
                      >
                        <Link2 className="h-4 w-4 text-cyan-400" />
                        Add by invite link
                      </button>
                      <label className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-500/20 cursor-pointer">
                        <FileText className="h-4 w-4 text-cyan-400" />
                        Upload Excel
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="flex-1 min-w-0 i-fonts">
              <Search variant="manage-team" placeholder="Search members…" department={department} />
            </div>
            <div className="flex items-center bg-[#1e1e2f] border border-gray-500/40 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-gray-500/30 text-gray-200"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="List view"
              >
                <List className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Grid view"
              >
                <Grid className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAllTeamOpen(true)}
              className="shrink-0 p-2.5 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
              title="Show all team"
              aria-label="Show all team"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowSocietyListOpen(true)}
              className="shrink-0 p-2.5 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors"
              title="Show whole society (core/heads, all dept members, unregistered)"
              aria-label="Show whole society"
            >
              <Users className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/80 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <Spinner className="size-4 text-gray-400" />
            </div>
          ) : (
            (() => {
              const rosterEmails = new Set(
                (roster || []).map((r) => (r.email || "").toLowerCase()),
              );
              const extraMembers = (members || []).filter(
                (m) => !rosterEmails.has((m.email || "").toLowerCase()),
              );
              const tableRows = [
                ...roster.map((r) => ({ type: "roster", ...r })),
                ...extraMembers.map((m) => ({
                  type: "teamMember",
                  teamMember: m,
                })),
              ];
              if (tableRows.length === 0) {
                return (
                  <div className="p-12 text-center text-gray-400">
                    No one yet. Add allowed emails from Dashboard (signup
                    config) or add team members below.
                  </div>
                );
              }
              
              if (viewMode === "grid") {
                return (
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-4 p-1.5 sm:p-4 bg-[#181824]">
                    {tableRows.map((row) => {
                      const isTeamMember = row.type === "teamMember";
                      const m = isTeamMember ? row.teamMember : row;
                      return (
                        <TeamMemberCard
                          key={isTeamMember ? `tm-${m._id}` : `roster-${row.email}`}
                          row={row}
                          openEdit={openEdit}
                          onRequestDelete={(member) => setDeleteConfirmMember(member)}
                          onOpenPhotoModal={(photoUrl, name) => setPhotoModalData({ src: photoUrl, name })}
                          readOnly={isReadOnly}
                        />
                      );
                    })}
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-500/30 bg-[#252536]/80">
                        {LIST_COLS.map((k) => (
                          <th
                            key={k}
                            className="px-4 py-3 text-gray-300 font-semibold whitespace-nowrap"
                          >
                            {LABELS[k] || k}
                          </th>
                        ))}
                        {!isReadOnly && <th className="px-4 py-3 text-gray-300 font-semibold whitespace-nowrap">
                          Actions
                        </th>}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => {
                        if (row.type === "teamMember") {
                          const m = row.teamMember;
                          const name = m.name || m.email || "—";
                          const photoUrl = m.photo || m.image_drive_link;
                          return (
                            <tr
                              key={`tm-${m._id}`}
                              className="border-b border-gray-500/20 hover:bg-gray-500/10"
                            >
                              {LIST_COLS.map((k) => (
                                <td
                                  key={k}
                                  className="px-4 py-3 text-gray-200 max-w-[200px] truncate align-middle"
                                  title={
                                    k === "photo"
                                      ? m.photo || m.image_drive_link
                                      : undefined
                                  }
                                >
                                  {k === "name" ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="truncate">{name}</span>
                                      <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                        Team member
                                      </span>
                                    </div>
                                  ) : k === "photo" ? (
                                    <img
                                      src={
                                        photoUrl
                                          ? photoPreviewUrl(photoUrl)
                                          : avatarPlaceholder(name)
                                      }
                                      alt={name}
                                      className={`h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0 ${
                                        photoUrl ? "cursor-pointer hover:scale-105 hover:border-cyan-400 transition-all" : ""
                                      }`}
                                      onClick={(e) => {
                                        if (!photoUrl) return;
                                        e.stopPropagation();
                                        setPhotoModalData({ src: photoUrl, name });
                                      }}
                                      title={photoUrl ? `Click to view photo of ${name}` : name}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = avatarPlaceholder(name);
                                      }}
                                    />
                                  ) : (
                                    m[k] || "—"
                                  )}
                                </td>
                              ))}
                              {!isReadOnly && <td className="px-4 py-3 align-middle">
                                <span className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(m)}
                                    className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmMember(m)}
                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </span>
                              </td>}
                            </tr>
                          );
                        }
                        const u = row.user;
                        const profile = u?.additionalDetails || {};
                        const pre = row.predefinedProfile || {};
                        const name = row.registered
                          ? [u?.firstName, u?.lastName]
                              .filter(Boolean)
                              .join(" ")
                              .trim() || row.email
                          : pre?.name || row.email;
                        const tagLabel = row.registered
                          ? profile?.position ||
                            getAccountTypeLabel(u?.accountType) ||
                            u?.accountType ||
                            ""
                          : null;
                        const photoUrl = row.registered
                          ? u?.image
                          : pre?.image
                            ? pre.image.startsWith("http")
                              ? pre.image
                              : `https://www.gfg-bvcoe.com${pre.image.startsWith("/") ? "" : "/"}${pre.image}`
                            : null;
                        const cell = (k) => {
                          if (k === "name") return name;
                          if (!row.registered)
                            return k === "email" ? row.email : "—";
                          if (k === "year")
                            return profile?.year || profile?.yearOfStudy || "—";
                          if (k === "branch") return profile?.branch || "—";
                          if (k === "section") return profile?.section ?? "—";
                          if (k === "email") return u?.email || "—";
                          if (k === "contact") return u?.contact || "—";
                          if (k === "photo") return null;
                          if (k === "non_tech_society")
                            return profile?.non_tech_society ?? "—";
                          return "—";
                        };
                        return (
                          <tr
                            key={`roster-${row.email}`}
                            className="border-b border-gray-500/20 hover:bg-gray-500/10"
                          >
                            {LIST_COLS.map((k) => (
                              <td
                                key={k}
                                className="px-4 py-3 text-gray-200 max-w-[200px] align-middle"
                                title={
                                  k === "photo" ? photoUrl || "" : undefined
                                }
                              >
                                {k === "name" ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="truncate">
                                      {cell(k) || "—"}
                                    </span>
                                    {tagLabel != null && tagLabel !== "" ? (
                                      <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                        {tagLabel}
                                      </span>
                                    ) : !row.registered ? (
                                      <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40">
                                        Not registered yet
                                      </span>
                                    ) : null}
                                  </div>
                                ) : k === "photo" ? (
                                  <img
                                     src={
                                       photoUrl
                                         ? photoPreviewUrl(photoUrl)
                                         : avatarPlaceholder(name)
                                     }
                                     alt={name}
                                     className={`h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0 ${
                                       photoUrl ? "cursor-pointer hover:scale-105 hover:border-cyan-400 transition-all" : ""
                                     }`}
                                     onClick={(e) => {
                                       if (!photoUrl) return;
                                       e.stopPropagation();
                                       setPhotoModalData({ src: photoUrl, name });
                                     }}
                                     title={photoUrl ? `Click to view photo of ${name}` : name}
                                     onError={(e) => {
                                       e.target.onerror = null;
                                       e.target.src = avatarPlaceholder(name);
                                     }}
                                   />
                                ) : (
                                  <span className="truncate block">
                                    {cell(k) || "—"}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3 align-middle text-gray-500">
                              —
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()
          )}
        </div>

        {!isReadOnly && <section className="mt-8 rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/80 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-500/30">
            <div>
              <h2 className="text-sm font-semibold text-richblack-25 flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-gray-400" />
                Deleted members
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Removed team members stay here for {deletedRetentionDays} days, then are deleted permanently.
              </p>
            </div>
            {deletedMembers.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreAllDeleted}
                disabled={restoringAllDeleted || restoringMemberId}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors text-xs font-medium disabled:opacity-50 shrink-0"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${restoringAllDeleted ? "animate-spin" : ""}`} />
                {restoringAllDeleted ? "Restoring…" : "Restore all"}
              </button>
            )}
          </div>
          <div className="p-4">
            {deletedMembersLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Spinner className="size-4 text-cyan-400" />
                Loading…
              </div>
            ) : deletedMembers.length === 0 ? (
              <p className="text-sm text-gray-500">No deleted members.</p>
            ) : (
              <ul className="space-y-3">
                {deletedMembers.map((m) => {
                  const daysLeft = daysUntilPermanentDelete(m.deletedAt, deletedRetentionDays);
                  const name = m.name || m.email || "—";
                  return (
                    <li
                      key={m._id}
                      className="rounded-lg border border-gray-500/30 bg-[#252536]/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-richblack-25 truncate">{name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{m.email || "—"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Deleted {formatDeletedAt(m.deletedAt)}
                          {" · "}
                          {daysLeft <= 0
                            ? "Purging soon"
                            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} until permanent removal`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreMember(m._id)}
                        disabled={restoringMemberId === m._id || restoringAllDeleted}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors text-xs font-medium disabled:opacity-50 shrink-0"
                      >
                        <RotateCcw
                          className={`h-3.5 w-3.5 ${restoringMemberId === m._id ? "animate-spin" : ""}`}
                        />
                        {restoringMemberId === m._id ? "Restoring…" : "Restore"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>}
      </div>

      <ConfirmDeleteModal
        open={!!deleteConfirmMember}
        title="Remove team member?"
        description={
          deleteConfirmMember ? (
            <>
              <span className="font-medium text-gray-300 line-clamp-3 break-words">
                &ldquo;{deleteConfirmMember.name || deleteConfirmMember.email}&rdquo;
              </span>{" "}
              will be removed from the team list immediately and moved to{" "}
              <span className="font-medium text-gray-300">Deleted members</span> at the bottom of this page for{" "}
              <span className="font-medium text-gray-300">{deletedRetentionDays} days</span>. You can restore them
              before then; after that they are deleted permanently from the database.
            </>
          ) : null
        }
        confirmLabel={deletingMember ? "Removing" : "Remove"}
        loading={deletingMember}
        onConfirm={handleConfirmDeleteMember}
        onClose={() => !deletingMember && setDeleteConfirmMember(null)}
      />

      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setExportModalOpen(false)}
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
                Print / Export list
              </h2>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-richblack-25 hover:bg-gray-500/30"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-400">
                Select columns to include in the export. Then generate PDF or
                Excel.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllExportFields}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={deselectAllExportFields}
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
                      checked={selectedExportFields.includes(k)}
                      onChange={() => toggleExportField(k)}
                      className="rounded border-gray-500 bg-[#252536] text-cyan-500 focus:ring-cyan-500"
                    />
                    {LABELS[k] || k}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-500/30">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={
                    isPrinting ||
                    members.length === 0 ||
                    selectedExportFields.length === 0
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-richblack-25 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="h-4 w-4" />
                  {isPrinting ? "Processing..." : "Generate & Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={
                    members.length === 0 || selectedExportFields.length === 0
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-richblack-25 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  Generate & Download Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {manualOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setManualOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="darkthemebg rounded-2xl border border-gray-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-richblack-25">
                Add member manually
              </h2>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-richblack-25 hover:bg-gray-500/30 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddManual} className="p-6 space-y-3">
              {COLS.map((k) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    {LABELS[k]}
                    {k !== "non_tech_society" ? " *" : ""}
                  </label>
                  {k === "year" ? (
                    <select
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">Select year</option>
                      {YEAR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : k === "branch" ? (
                    <select
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">Select branch</option>
                      {BRANCH_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : k === "photo" ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <label className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium cursor-pointer">
                          Upload photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoFile}
                            disabled={photoUploading}
                          />
                        </label>
                        <span className="text-xs text-gray-500">
                          Max 5MB (auto compress) · then crop
                        </span>
                      </div>
                      <input
                        type="text"
                        value={form.photo}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, photo: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="Or paste image link (Cloudinary / Drive)"
                      />
                      {form.photo && (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-500/50 bg-[#252536]">
                          <img
                            src={photoPreviewUrl(form.photo)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(ev) => {
                              ev.target.onerror = null;
                              ev.target.src = avatarPlaceholder("");
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : k === "section" ? (
                    <input
                      type="text"
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="e.g. CSE-4"
                      required
                    />
                  ) : k === "non_tech_society" ? (
                    <input
                      type="text"
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      placeholder={LABELS[k]}
                    />
                  ) : (
                    <input
                      type={k === "email" ? "email" : "text"}
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      placeholder={LABELS[k]}
                      required
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-richblack-25 font-semibold disabled:opacity-50"
                >
                  {saving ? "Adding…" : "Add member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropImageSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={() => {
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
            setCrop(null);
          }}
        >
          <div
            className="bg-[#1e1e2f] rounded-2xl border border-gray-500/30 p-4 max-w-lg w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-richblack-25 font-semibold mb-3">Crop photo</h3>
            <ReactCrop
              crop={crop}
              onChange={(pixelCrop) => {
                cropPxRef.current = pixelCrop;
                setCrop(pixelCrop);
              }}
              aspect={1}
              circularCrop
              className="max-h-[50vh]"
            >
              <img
                ref={imgCropRef}
                src={cropImageSrc}
                alt="Crop"
                style={{ maxHeight: "50vh", width: "auto" }}
              />
            </ReactCrop>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(cropImageSrc);
                  setCropImageSrc(null);
                  setCrop(null);
                }}
                className="flex-1 py-2 rounded-xl border border-gray-500/50 text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropApply}
                disabled={photoUploading}
                className="flex-1 py-2 rounded-xl bg-cyan-600 text-richblack-25 font-medium disabled:opacity-50"
              >
                {photoUploading ? (
                  <Spinner className="size-4 text-gray-400" />
                ) : (
                  "Apply & upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteLinkOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setInviteLinkOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="darkthemebg rounded-2xl border border-gray-500/30 p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-richblack-25 mb-2">
              Add team by invite link
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Generate a link for{" "}
              <span className="text-cyan-300 font-medium">
                {displayDepartment}
              </span>
              . Anyone who opens it can fill the same form and get added to this
              department.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Link Expiry Time
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                disabled={!!inviteLinkData?.token || inviteLinkFetching}
                className="w-full rounded-xl border border-gray-500/30 bg-[#1e1e2f] px-3.5 py-2.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              >
                <option value="12h">12 hours (Default)</option>
                <option value="24h">24 hours</option>
                <option value="36h">36 hours</option>
                <option value="48hr">48 hours</option>
                <option value="3d">3 days</option>
                <option value="4d">4 days</option>
                <option value="7d">7 days</option>
              </select>
            </div>
            {!inviteLinkData?.token && (
              <button
                type="button"
                onClick={handleGenerateInviteLink}
                disabled={inviteLinkLoading || inviteLinkFetching}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-richblack-25 font-semibold text-sm disabled:opacity-50 w-full"
              >
                {inviteLinkLoading ? "Generating…" : inviteLinkFetching ? "Loading…" : "Generate invite link"}
              </button>
            )}
            {inviteLinkFetching && !inviteLinkData?.token && (
              <p className="mt-3 text-sm text-gray-400 text-center">Checking for an active link…</p>
            )}
            {inviteLinkData?.token && (
              <div className="mt-4 p-4 rounded-xl bg-[#252536] border border-gray-500/20">
                <p className="text-xs text-gray-400 mb-2">
                  Active invite link for this department:
                </p>
                <p className="text-sm font-mono break-all text-cyan-300 mb-2">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/join-team/${inviteLinkData.token}`
                    : ""}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Expires:{" "}
                  {inviteLinkData.expiresAt
                    ? new Date(inviteLinkData.expiresAt).toLocaleString()
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium"
                  >
                    Copy link
                  </button>
                  <button
                    type="button"
                    onClick={handleSuspendInviteLink}
                    disabled={inviteLinkSuspending}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
                  >
                    Suspend link
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setInviteLinkOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/20 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setEditMember(null);
            setForm(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="darkthemebg rounded-2xl border border-gray-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-richblack-25">
                Edit member
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditMember(null);
                  setForm(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-richblack-25 hover:bg-gray-500/30 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-3">
              {COLS.map((k) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    {LABELS[k]}
                    {k !== "non_tech_society" ? " *" : ""}
                  </label>
                  {k === "year" ? (
                    <select
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">Select year</option>
                      {YEAR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : k === "branch" ? (
                    <select
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">Select branch</option>
                      {BRANCH_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : k === "photo" ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <label className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium cursor-pointer">
                          Upload photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoFile}
                            disabled={photoUploading}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={form.photo}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, photo: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="Or paste image link"
                        required
                      />
                      {form.photo && (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-500/50 bg-[#252536]">
                          <img
                            src={photoPreviewUrl(form.photo)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(ev) => {
                              ev.target.onerror = null;
                              ev.target.src = avatarPlaceholder("");
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : k === "section" ? (
                    <input
                      type="text"
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="e.g. CSE-4"
                      required
                    />
                  ) : k === "non_tech_society" ? (
                    <input
                      type="text"
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      placeholder={LABELS[k]}
                    />
                  ) : (
                    <input
                      type={k === "email" ? "email" : "text"}
                      value={form[k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [k]: e.target.value }))
                      }
                      className={inputClass}
                      placeholder={LABELS[k]}
                      required
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditMember(null);
                    setForm(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-richblack-25 font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show all team modal */}
      <AnimatePresence>
        {showAllTeamOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex min-h-full items-center justify-center overflow-hidden p-4 py-8 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowAllTeamOpen(false);
              setSelectedDetailItem(null);
            }}
            role="dialog"
            aria-modal="true"
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
                <h2 className="text-lg font-bold text-richblack-25">
                  {displayDepartment} team
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllTeamOpen(false);
                    setSelectedDetailItem(null);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-richblack-25 hover:bg-gray-500/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* List Content */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 custom-scrollbar">
                {wholeTeamLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="size-4 text-gray-400" />
                  </div>
                ) : wholeTeamList.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No one in the list.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {wholeTeamList.map((item, idx) => {
                      let content = null;
                      let key = "";

                      // Logic for Registered Users
                      if (item.type === "registered") {
                        const u = item.data;
                        key = `reg-${u._id}-${idx}`;
                        const name =
                          [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                          u.email ||
                          "—";
                        const src = u.image
                          ? photoPreviewUrl(u.image)
                          : avatarPlaceholder(name);
                        const position =
                          u.additionalDetails?.position &&
                          String(u.additionalDetails.position).trim();
                        const roleLabel =
                          position ||
                          item.department ||
                          getAccountTypeLabel(u.accountType) ||
                          u.accountType ||
                          "Member";

                        content = (
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-all border border-transparent hover:border-gray-500/30 active:scale-[0.98]"
                            onClick={() =>
                              setSelectedDetailItem({ type: "user", data: u })
                            }
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="block truncate font-medium text-richblack-25">
                                {name}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {u.email}
                              </span>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {roleLabel}
                            </span>
                          </button>
                        );
                      }

                      // Logic for Predefined
                      if (item.type === "predefinedOnly") {
                        const pre = item.data;
                        const email = (pre.email || "").trim().toLowerCase();
                        key = `pre-${email}-${idx}`;
                        const name = pre.name || pre.email || "—";
                        const isSending = sendingInviteTo === email;
                        const imagePath = (pre.image || "").trim();
                        const src = imagePath
                          ? imagePath.startsWith("http")
                            ? imagePath
                            : `${PREDEFINED_IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
                          : avatarPlaceholder(name);

                        content = (
                          <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-gray-500/30 hover:bg-gray-500/10 transition-all">
                            <button
                              type="button"
                              className="flex-1 flex items-center gap-3 min-w-0 text-left active:scale-[0.98]"
                              onClick={() =>
                                setSelectedDetailItem({
                                  type: "predefinedOnly",
                                  data: pre,
                                })
                              }
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block truncate font-medium text-richblack-25">
                                  {name}
                                </span>
                                <span className="block truncate text-xs text-gray-500">
                                  {pre.email}
                                </span>
                              </div>
                            </button>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              Unregistered
                            </span>
                            <button
                              onClick={async () => {
                                if (!email) return;
                                setSendingInviteTo(email);
                                try {
                                  await sendSignupInvite(email);
                                  toast.success("Invite email sent.");
                                } catch (err) {
                                  toast.error(
                                    err.message || "Failed to send invite",
                                  );
                                } finally {
                                  setSendingInviteTo(null);
                                }
                              }}
                              disabled={isSending}
                              className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                            >
                              {isSending ? (
                                <Spinner className="h-4 w-4 text-cyan-400" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        );
                      }

                      // Logic for Team Members
                      if (item.type === "teamMember") {
                        const m = item.data;
                        key = `tm-${m._id}-${idx}`;
                        const name = m.name || m.email || "—";
                        const photoUrl = m.photo || m.image_drive_link;
                        const src = photoUrl
                          ? photoPreviewUrl(photoUrl)
                          : avatarPlaceholder(name);
                        const tagLabel =
                          (m.position && String(m.position).trim()) ||
                          item.department ||
                          "Team";

                        content = (
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-all border border-transparent hover:border-gray-500/30 active:scale-[0.98]"
                            onClick={() =>
                              setSelectedDetailItem({
                                type: "teamMember",
                                data: m,
                              })
                            }
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="block truncate font-medium text-richblack-25">
                                {name}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {m.email}
                              </span>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {tagLabel}
                            </span>
                          </button>
                        );
                      }

                      return content ? (
                        <motion.li
                          key={key}
                          variants={iosRowVariants}
                          initial="hidden"
                          animate="visible"
                          custom={idx}
                        >
                          {content}
                        </motion.li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show whole society modal (society roles only) */}
      <AnimatePresence>
        {showSocietyListOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex min-h-full items-center justify-center overflow-hidden p-4 py-8 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowSocietyListOpen(false);
              setSelectedDetailItem(null);
            }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#1e1e2f] rounded-2xl border border-gray-500/40 shadow-2xl w-full max-w-2xl h-5/6 flex flex-col overflow-hidden shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 shrink-0">
                <h2 className="text-lg font-bold text-richblack-25">
                  Whole society
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowSocietyListOpen(false);
                    setSelectedDetailItem(null);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-richblack-25 hover:bg-gray-500/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 custom-scrollbar">
                {societyListLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="size-4 text-gray-400" />
                  </div>
                ) : societyList.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No one in the list.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {societyList.map((item, idx) => {
                      let content = null;
                      let key = "";

                      if (item.type === "user") {
                        const u = item.data;
                        key = `user-${u._id}-${idx}`;
                        const name =
                          [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                          u.email ||
                          "—";
                        const src = u.image
                          ? photoPreviewLargeAvatarUrl(u.image)
                          : avatarPlaceholder(name);
                        const position =
                          u.additionalDetails?.position &&
                          String(u.additionalDetails.position).trim();
                        const roleLabel =
                          position ||
                          item.department ||
                          getAccountTypeLabel(u.accountType) ||
                          u.accountType ||
                          "Member";
                        content = (
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-all border border-transparent hover:border-gray-500/30 active:scale-[0.98]"
                            onClick={() =>
                              setSelectedDetailItem({ type: "user", data: u })
                            }
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="block truncate font-medium text-richblack-25">
                                {name}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {u.email}
                              </span>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {roleLabel}
                            </span>
                          </button>
                        );
                      }

                      if (item.type === "predefinedOnly") {
                        const pre = item.data;
                        const email = (pre.email || "").trim().toLowerCase();
                        key = `pre-${email}-${idx}`;
                        const name = pre.name || pre.email || "—";
                        const isSending = sendingInviteTo === email;
                        const imagePath = (pre.image || "").trim();
                        const src = imagePath
                          ? imagePath.startsWith("http")
                            ? imagePath
                            : `${PREDEFINED_IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
                          : avatarPlaceholder(name);
                        content = (
                          <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-gray-500/30 hover:bg-gray-500/10 transition-all">
                            <button
                              type="button"
                              className="flex-1 flex items-center gap-3 min-w-0 text-left active:scale-[0.98]"
                              onClick={() =>
                                setSelectedDetailItem({
                                  type: "predefinedOnly",
                                  data: pre,
                                })
                              }
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block truncate font-medium text-richblack-25">
                                  {name}
                                </span>
                                <span className="block truncate text-xs text-gray-500">
                                  {pre.email}
                                </span>
                              </div>
                            </button>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              Unregistered
                            </span>
                            <button
                              onClick={async () => {
                                if (!email) return;
                                setSendingInviteTo(email);
                                try {
                                  await sendSignupInvite(email);
                                  toast.success("Invite email sent.");
                                } catch (err) {
                                  toast.error(
                                    err.message || "Failed to send invite",
                                  );
                                } finally {
                                  setSendingInviteTo(null);
                                }
                              }}
                              disabled={isSending}
                              className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                            >
                              {isSending ? (
                                <Spinner className="h-4 w-4 text-cyan-400" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        );
                      }

                      if (item.type === "teamMember") {
                        const m = item.data;
                        const dept = item.department || "";
                        key = `tm-${m._id}-${dept}-${idx}`;
                        const name = m.name || m.email || "—";
                        const photoUrl = m.photo || m.image_drive_link;
                        const src = photoUrl
                          ? photoPreviewLargeAvatarUrl(photoUrl)
                          : avatarPlaceholder(name);
                        const tagLabel =
                          (m.position && String(m.position).trim()) ||
                          dept ||
                          "Team";
                        content = (
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-all border border-transparent hover:border-gray-500/30 active:scale-[0.98]"
                            onClick={() =>
                              setSelectedDetailItem({
                                type: "teamMember",
                                data: m,
                              })
                            }
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="block truncate font-medium text-richblack-25">
                                {name}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {m.email}
                              </span>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {tagLabel}
                            </span>
                          </button>
                        );
                      }

                      return content ? (
                        <motion.li
                          key={key}
                          variants={iosRowVariants}
                          initial="hidden"
                          animate="visible"
                          custom={idx}
                        >
                          {content}
                        </motion.li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedDetailItem?.type === "teamMember" &&
        createPortal(
          <MemberDetailModal
            member={selectedDetailItem.data}
            onClose={() => setSelectedDetailItem(null)}
          />,
          document.body,
        )}
      {selectedDetailItem?.type === "user" &&
        createPortal(
          <UserDetailModal
            user={selectedDetailItem.data}
            onClose={() => setSelectedDetailItem(null)}
            onViewLogs={(userId, userName) =>
              setActivityLogUser({ id: userId, name: userName })
            }
          />,
          document.body,
        )}
      {activityLogUser &&
        createPortal(
          <ActivityLogModal
            userId={activityLogUser.id}
            userName={activityLogUser.name}
            onClose={() => setActivityLogUser(null)}
          />,
          document.body,
        )}
      {selectedDetailItem?.type === "predefinedOnly" &&
        createPortal(
          <PredefinedOnlyDetailModal
            predefined={selectedDetailItem.data}
            onClose={() => setSelectedDetailItem(null)}
          />,
          document.body,
        )}
      <ImageModal
        open={!!photoModalData}
        src={photoModalData?.src}
        name={photoModalData?.name}
        onClose={() => setPhotoModalData(null)}
      />

      {/* Department notification compose modal */}
      <AnimatePresence>
        {deptNotifModalOpen && (
          <motion.div
            key="dept-notif-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
            onClick={() => { if (!deptNotifSending) setDeptNotifModalOpen(false); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dept-notif-modal-title"
          >
            <motion.div
              key="dept-notif-panel"
              initial={{ opacity: 0, scale: 0.94, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-pink-400/25 bg-gradient-to-br from-[#18101c] via-[#1e1e2f] to-[#150d1e] shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative glows */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-pink-500/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-purple-500/10 blur-2xl" />

              {/* Header */}
              <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/20 text-pink-300">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 id="dept-notif-modal-title" className="text-sm font-bold text-richblack-25">
                      {deptNotifTarget === "all"
                        ? "Notify Everyone"
                        : "Notify Department Members"}
                    </h2>
                    <p className="text-[10px] text-pink-300 font-medium">
                      {deptNotifTarget === "all"
                        ? `→ All ${displayDepartment} members + heads/leads/core${deptBroadcastAudience?.total != null ? ` (${deptBroadcastAudience.total})` : ""}`
                        : `→ ${displayDepartment} members only (heads/leads/core get a copy tagged “Sent to members only”)`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeptNotifModalOpen(false)}
                  disabled={deptNotifSending}
                  className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-gray-200 disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="relative px-5 py-4 space-y-4">
                {deptNotifError && (
                  <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {deptNotifError}
                  </div>
                )}
                {deptNotifSuccess && (
                  <div className="rounded-lg border border-pink-400/20 bg-pink-500/10 px-3 py-2 text-xs text-pink-200 font-medium">
                    🎉 {deptNotifSuccess}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={deptNotifForm.title}
                    onChange={(e) => setDeptNotifForm((p) => ({ ...p, title: e.target.value }))}
                    maxLength={120}
                    placeholder="e.g. Department Meeting"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-richblack-25 outline-none transition placeholder:text-gray-500 focus:border-pink-400/40 focus:bg-white/[0.055]"
                    disabled={deptNotifSending}
                  />
                  <p className="mt-1 text-right text-[10px] text-gray-500">{deptNotifForm.title.length}/120</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Message
                  </label>
                  <textarea
                    value={deptNotifForm.body}
                    onChange={(e) => setDeptNotifForm((p) => ({ ...p, body: e.target.value }))}
                    maxLength={500}
                    rows={4}
                    placeholder="Write your notification message…"
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm leading-6 text-richblack-25 outline-none transition placeholder:text-gray-500 focus:border-pink-400/40 focus:bg-white/[0.055]"
                    disabled={deptNotifSending}
                  />
                  <p className="mt-1 text-right text-[10px] text-gray-500">{deptNotifForm.body.length}/500</p>
                </div>
              </div>

              {/* Footer */}
              <div className="relative flex items-center justify-between border-t border-white/10 px-5 py-3.5">
                {/* <p className="text-[10px] text-gray-500 leading-snug max-w-[200px]">
                  Only members with a{" "}
                  <span className="text-pink-300 font-semibold">website account</span> will receive this.
                </p> */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeptNotifModalOpen(false)}
                    disabled={deptNotifSending}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deptNotifSending || !deptNotifForm.title.trim() || !deptNotifForm.body.trim()}
                    onClick={async () => {
                      setDeptNotifSending(true);
                      setDeptNotifError("");
                      setDeptNotifSuccess("");
                      try {
                        const payload = {
                          department: displayDepartment,
                          title: deptNotifForm.title.trim(),
                          body: deptNotifForm.body.trim(),
                        };
                        const result =
                          deptNotifTarget === "all"
                            ? await broadcastNotificationToAll(payload)
                            : await broadcastNotificationToDepartment(payload);
                        setDeptNotifSuccess(result.message || "Notification sent!");
                        setDeptNotifForm({ title: "", body: "" });
                        toast.success(result.message || "Notification sent!");
                        setTimeout(() => setDeptNotifModalOpen(false), 1800);
                      } catch (err) {
                        setDeptNotifError(err?.message || "Failed to send notification");
                      } finally {
                        setDeptNotifSending(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {deptNotifSending
                      ? "Sending…"
                      : deptNotifTarget === "all"
                        ? `Send to all${deptBroadcastAudience?.total != null ? ` (${deptBroadcastAudience.total})` : ""}`
                        : "Send to members"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
