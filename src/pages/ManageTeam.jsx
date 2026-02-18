import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getDepartmentRoster,
  getTeamMembers,
  getTeamDepartments,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  uploadTeamExcel,
  downloadTeamTemplate,
  createTeamInviteLink,
  suspendTeamInviteLink,
  getAccountTypeLabel,
  sendSignupInvite,
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
} from "react-feather";
import {
  driveLinkToImageUrl,
  avatarPlaceholder,
  photoPreviewUrl,
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
} from "../components/Search";
import { createPortal } from "react-dom";
import imageCompression from "browser-image-compression";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { uploadTeamPhoto } from "../services/api";
import { Spinner } from "@/components/ui/spinner";

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

const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th"];
const BRANCH_OPTIONS = ["CSE", "AIML", "IT", "EEE", "ECE", "ICE"];
const ORG_NAME = "GFG BVCOE";
const EXPORT_COLS = COLS.filter((k) => k !== "photo");
const PREDEFINED_IMAGE_BASE = "https://www.gfg-bvcoe.com";

export default function ManageTeam({
  department: propDepartment,
  isSociety,
  onBack,
}) {
  const { user, loading: authLoading } = useAuth();
  const [roster, setRoster] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAllTeamOpen, setShowAllTeamOpen] = useState(false);
  const [wholeTeamLoading, setWholeTeamLoading] = useState(false);
  const [wholeTeamList, setWholeTeamList] = useState([]);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [sendingInviteTo, setSendingInviteTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const INVITE_LINK_STORAGE_PREFIX = "gfg_team_invite_link_";
  const [inviteLinkOpen, setInviteLinkOpen] = useState(false);
  const [inviteLinkData, setInviteLinkData] = useState(null);
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [inviteLinkSuspending, setInviteLinkSuspending] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
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
  const imgCropRef = useRef(null);
  const cropPxRef = useRef(null);

  const department = isSociety ? propDepartment : undefined;

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
      if (file.size > 500 * 1024) {
        toUse = await imageCompression(file, {
          maxSizeMB: 0.5,
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
      if (blob.size > 500 * 1024) {
        const f = new File([blob], "photo.jpg", { type: "image/jpeg" });
        blob = await imageCompression(f, { maxSizeMB: 0.5 });
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

  const load = async () => {
    try {
      const [rosterRes, membersRes] = await Promise.all([
        getDepartmentRoster(department),
        getTeamMembers(department),
      ]);
      setRoster(rosterRes.data || []);
      setMembers(membersRes.data || []);
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
        ? (await getTeamDepartments()).data || []
        : [user?.accountType].filter(Boolean);
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
      toast.error(e.message || "Failed to load whole team");
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
  }, [showAllTeamOpen, user]);

  useEffect(() => {
    if (showAllTeamOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showAllTeamOpen]);

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

  const handleExportPDF = () => {
    if (selectedExportFields.length === 0) {
      toast.error("Select at least one column to include");
      return;
    }
    if (tableRowCount() === 0) {
      toast.error("No one to export");
      return;
    }
    try {
      downloadTeamListPDF(
        rosterToExportRows(),
        selectedExportFields,
        LABELS,
        `${ORG_NAME} - ${displayDepartment} - Member List`,
      );
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e.message || "PDF download failed");
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

  const loadStoredInviteLink = () => {
    try {
      const key = INVITE_LINK_STORAGE_PREFIX + displayDepartment;
      const raw = localStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.token && d?.expiresAt && new Date(d.expiresAt) > new Date())
          return d;
        localStorage.removeItem(key);
      }
    } catch (_) {}
    return null;
  };

  const handleGenerateInviteLink = async () => {
    setInviteLinkLoading(true);
    try {
      const payload = department ? { department } : {};
      const res = await createTeamInviteLink(payload);
      if (res.success && res.data) {
        setInviteLinkData(res.data);
        try {
          localStorage.setItem(
            INVITE_LINK_STORAGE_PREFIX + displayDepartment,
            JSON.stringify(res.data),
          );
        } catch (_) {}
        toast.success("Invite link created. Valid for 12 hours.");
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
        try {
          localStorage.removeItem(
            INVITE_LINK_STORAGE_PREFIX + displayDepartment,
          );
        } catch (_) {}
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

  const handleDelete = async (id) => {
    try {
      await deleteTeamMember(id, department ? { department } : {});
      toast.success("Member removed");
      setDeleteConfirmId(null);
      load();
    } catch (e) {
      toast.error(e.message || "Failed to delete member");
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
    "w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 outline-none text-sm";

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16">
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
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Users className="h-8 w-8 text-cyan-400" />
                {isSociety
                  ? `Manage society › ${displayDepartment}`
                  : "Manage your team"}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Department:{" "}
                <span className="text-cyan-300 font-medium">
                  {displayDepartment}
                </span>
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
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600/40 border border-gray-500/40 text-gray-200 hover:bg-gray-500/40 transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Download template
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAddMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors"
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
                    <div className="absolute right-0 mt-2 w-56 rounded-xl darkthemebg border border-gray-500/30 shadow-xl py-1 z-50">
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
                          setInviteLinkData(loadStoredInviteLink());
                          setInviteLinkOpen(true);
                          setAddMenuOpen(false);
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
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="flex-1 min-w-0">
              <Search variant="manage-team" placeholder="Search members…" />
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
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-500/30 bg-[#252536]/80">
                        {COLS.map((k) => (
                          <th
                            key={k}
                            className="px-4 py-3 text-gray-300 font-semibold whitespace-nowrap"
                          >
                            {LABELS[k] || k}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-gray-300 font-semibold whitespace-nowrap">
                          Actions
                        </th>
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
                              {COLS.map((k) => (
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
                                      className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
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
                              <td className="px-4 py-3 align-middle">
                                {deleteConfirmId === m._id ? (
                                  <span className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400">
                                      Remove?
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(m._id)}
                                      className="text-red-400 hover:text-red-300 font-medium"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="text-gray-400 hover:text-gray-300"
                                    >
                                      No
                                    </button>
                                  </span>
                                ) : (
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
                                      onClick={() => setDeleteConfirmId(m._id)}
                                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </span>
                                )}
                              </td>
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
                            {COLS.map((k) => (
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
                                        ? photoUrl.startsWith("http")
                                          ? photoUrl
                                          : photoPreviewUrl(photoUrl)
                                        : avatarPlaceholder(name)
                                    }
                                    alt={name}
                                    className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
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
      </div>

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
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Printer className="h-5 w-5 text-cyan-400" />
                Print / Export list
              </h2>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30"
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
                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-200 hover:text-white"
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
                    members.length === 0 || selectedExportFields.length === 0
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="h-4 w-4" />
                  Generate & Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={
                    members.length === 0 || selectedExportFields.length === 0
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h2 className="text-lg font-bold text-white">
                Add member manually
              </h2>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors"
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
                          Max 500KB (auto compress) · then crop
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
                      placeholder={LABELS[k]}
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
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50"
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
            <h3 className="text-white font-semibold mb-3">Crop photo</h3>
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
                className="flex-1 py-2 rounded-xl bg-cyan-600 text-white font-medium disabled:opacity-50"
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
            <h2 className="text-lg font-bold text-white mb-2">
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
            <button
              type="button"
              onClick={handleGenerateInviteLink}
              disabled={inviteLinkLoading}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm disabled:opacity-50"
            >
              {inviteLinkLoading ? "Generating…" : "Generate invite link"}
            </button>
            {inviteLinkData?.token && (
              <div className="mt-4 p-4 rounded-xl bg-[#252536] border border-gray-500/20">
                <p className="text-xs text-gray-400 mb-2">
                  Share this link (valid for 12 hours):
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
              <h2 className="text-lg font-bold text-white">Edit member</h2>
              <button
                type="button"
                onClick={() => {
                  setEditMember(null);
                  setForm(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors"
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
                      placeholder={LABELS[k]}
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
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show all team modal */}
      {showAllTeamOpen && (
        <div
          className="fixed inset-0 z-[90] flex min-h-full items-center justify-center overflow-hidden p-4 py-8 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setShowAllTeamOpen(false);
            setSelectedDetailItem(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Whole team list"
        >
          <div
            className="bg-[#1e1e2f] rounded-2xl border border-gray-500/40 shadow-2xl w-full max-w-2xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 shrink-0">
              <h2 className="text-lg font-bold text-white">Whole team</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAllTeamOpen(false);
                  setSelectedDetailItem(null);
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
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
                    if (item.type === "registered") {
                      const u = item.data;
                      const name =
                        [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                        u.email ||
                        "—";
                      const src = u.image || avatarPlaceholder(name);
                      const roleLabel =
                        getAccountTypeLabel(u.accountType) ||
                        u.accountType ||
                        "Member";
                      return (
                        <li key={`reg-${u._id}-${idx}`}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-colors border border-transparent hover:border-gray-500/30"
                            onClick={() =>
                              setSelectedDetailItem({ type: "user", data: u })
                            }
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover border border-gray-500/50 shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = avatarPlaceholder(name);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="block truncate font-medium text-white">
                                {name}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {u.email}
                              </span>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              {roleLabel}
                            </span>
                          </button>
                        </li>
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
                      return (
                        <li key={`pre-${email}-${idx}`}>
                          <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-gray-500/30 hover:bg-gray-500/10 transition-colors">
                            <button
                              type="button"
                              className="flex-1 flex items-center gap-3 min-w-0 text-left"
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
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = avatarPlaceholder(name);
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block truncate font-medium text-white">
                                  {name}
                                </span>
                                <span className="block truncate text-xs text-gray-500">
                                  {pre.email}
                                </span>
                              </div>
                            </button>
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40">
                              Not registered yet
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!email || isSending) return;
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
                              title="Send signup invite email"
                              className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50 shrink-0"
                            >
                              {isSending ? (
                                <span className="text-xs">Sending…</span>
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </li>
                      );
                    }
                    if (item.type === "teamMember") {
                      const m = item.data;
                      const name = m.name || m.email || "—";
                      const photoUrl = m.photo || m.image_drive_link;
                      const src = photoUrl
                        ? photoPreviewUrl(photoUrl)
                        : avatarPlaceholder(name);
                      return (
                        <li key={`tm-${m._id}-${idx}`}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-gray-200 hover:bg-gray-500/20 transition-colors border border-transparent hover:border-gray-500/30"
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
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = avatarPlaceholder(name);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="block truncate font-medium text-white">
                                {name}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {m.email}
                              </span>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                              Team member
                            </span>
                          </button>
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
