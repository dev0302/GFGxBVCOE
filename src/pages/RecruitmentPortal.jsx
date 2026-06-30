import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  FileText,
  Users,
  Plus,
  MoreVertical,
  Link as LinkIcon,
  Pause,
  Play,
  Trash2,
  Edit2,
  ChevronRight,
  Clipboard,
  X,
  Search,
  Eye,
} from "react-feather";
import {
  createRecruitmentForm,
  getRecruitmentForms,
  updateRecruitmentForm,
  deleteRecruitmentForm,
  getRecruitmentSubmissions,
  userCanAccessLeadershipTransition,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { Navigate } from "react-router-dom";

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Long Text (Paragraph)" },
  { value: "select", label: "Dropdown Select" },
  { value: "checkbox", label: "Checkbox (Yes/No)" },
];

const DEFAULT_FIELDS = [
  { id: "first_name", label: "First Name", type: "text", required: true },
  { id: "last_name", label: "Last Name (Optional)", type: "text", required: false },
  { id: "phone_number", label: "Phone No", type: "number", required: true },
  { id: "email_id", label: "Email ID", type: "text", required: true },
  { id: "photo", label: "Photo", type: "text", required: true },
];

export default function RecruitmentPortal() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("forms"); // forms | submissions
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null); // for viewing submissions or editing
  const [submissionSearch, setSubmissionSearch] = useState("");
  
  // Modals state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formFields, setFormFields] = useState([]);
  const [activeMenuFormId, setActiveMenuFormId] = useState(null); // for three-dot menu

  // Photo viewer modal
  const [photoViewerUrl, setPhotoViewerUrl] = useState(null);

  useEffect(() => {
    if (user) {
      loadForms();
    }
  }, [user]);

  const loadForms = async () => {
    setLoadingForms(true);
    try {
      const res = await getRecruitmentForms();
      if (res.success) {
        setForms(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load forms");
    } finally {
      setLoadingForms(false);
    }
  };

  const loadSubmissions = async (formId) => {
    setLoadingSubmissions(true);
    try {
      const res = await getRecruitmentSubmissions(formId);
      if (res.success) {
        setSubmissions(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load responses");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCreateNewFormClick = () => {
    setIsEditing(false);
    setFormTitle("");
    setFormDesc("");
    setFormFields([]);
    setBuilderOpen(true);
  };

  const handleLoadTemplate = () => {
    setFormFields(DEFAULT_FIELDS);
    toast.success("Quick template preloaded. You can customize fields below.");
  };

  const handleAddField = () => {
    const newField = {
      id: `custom_field_${Date.now()}`,
      label: "New Question",
      type: "text",
      required: false,
      options: [],
    };
    setFormFields([...formFields, newField]);
  };

  const handleRemoveField = (id) => {
    setFormFields(formFields.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id, key, value) => {
    setFormFields(
      formFields.map((f) => {
        if (f.id === id) {
          return { ...f, [key]: value };
        }
        return f;
      })
    );
  };

  const handleAddSelectOption = (fieldId, optionText) => {
    if (!optionText.trim()) return;
    setFormFields(
      formFields.map((f) => {
        if (f.id === fieldId) {
          const opts = f.options || [];
          if (opts.includes(optionText.trim())) return f;
          return { ...f, options: [...opts, optionText.trim()] };
        }
        return f;
      })
    );
  };

  const handleRemoveSelectOption = (fieldId, optionIndex) => {
    setFormFields(
      formFields.map((f) => {
        if (f.id === fieldId) {
          return { ...f, options: (f.options || []).filter((_, i) => i !== optionIndex) };
        }
        return f;
      })
    );
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Form title is required.");
      return;
    }
    if (formFields.length === 0) {
      toast.error("Please add at least one field to the form.");
      return;
    }

    try {
      const payload = {
        title: formTitle.trim(),
        description: formDesc.trim(),
        fields: formFields,
      };

      let res;
      if (isEditing && selectedForm) {
        res = await updateRecruitmentForm(selectedForm.formId, payload);
      } else {
        res = await createRecruitmentForm(payload);
      }

      if (res.success) {
        toast.success(isEditing ? "Form updated successfully" : "Form generated successfully");
        setBuilderOpen(false);
        loadForms();
      }
    } catch (err) {
      toast.error(err.message || "Failed to save form");
    }
  };

  const handleEditFormClick = (form) => {
    setSelectedForm(form);
    setIsEditing(true);
    setFormTitle(form.title);
    setFormDesc(form.description || "");
    setFormFields(form.fields || []);
    setActiveMenuFormId(null);
    setBuilderOpen(true);
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm("Are you sure you want to delete this form and all its candidate responses? This cannot be undone.")) return;
    try {
      const res = await deleteRecruitmentForm(formId);
      if (res.success) {
        toast.success("Form deleted successfully.");
        loadForms();
        if (selectedForm?.formId === formId) {
          setSelectedForm(null);
          setSubmissions([]);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete form");
    }
  };

  const handleToggleStatus = async (form, currentStatus) => {
    let nextStatus = "ACTIVE";
    if (currentStatus === "ACTIVE") {
      nextStatus = "PAUSED";
    }
    try {
      const res = await updateRecruitmentForm(form.formId, { status: nextStatus });
      if (res.success) {
        toast.success(`Form responses ${nextStatus === "ACTIVE" ? "resumed" : "paused"} successfully.`);
        loadForms();
        setActiveMenuFormId(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleToggleSuspend = async (form, currentStatus) => {
    let nextStatus = "ACTIVE";
    if (currentStatus === "ACTIVE" || currentStatus === "PAUSED") {
      nextStatus = "SUSPENDED";
    }
    try {
      const res = await updateRecruitmentForm(form.formId, { status: nextStatus });
      if (res.success) {
        toast.success(`Form link ${nextStatus === "SUSPENDED" ? "suspended" : "reactivated"} successfully.`);
        loadForms();
        setActiveMenuFormId(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleCopyLink = (formId) => {
    const url = `${window.location.origin}/recruitment/form/${formId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Shareable form link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
    setActiveMenuFormId(null);
  };

  const handleSelectFormForSubmissions = (form) => {
    setSelectedForm(form);
    setActiveTab("submissions");
    loadSubmissions(form.formId);
  };

  // Close menus on clicking outside
  useEffect(() => {
    const onClick = () => setActiveMenuFormId(null);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 bg-[#1e1e2f] flex items-center justify-center">
        <Spinner className="size-6 text-cyan-400" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  const isAuthorized = userCanAccessLeadershipTransition(user);
  if (!isAuthorized) return <Navigate to="/profile" replace />;

  const filteredSubmissions = submissions.filter((sub) => {
    const search = submissionSearch.trim().toLowerCase();
    if (!search) return true;
    
    // search in answers or email
    const emailMatch = (sub.email || "").toLowerCase().includes(search);
    const answersMatch = Object.values(sub.answers || {}).some((val) =>
      String(val).toLowerCase().includes(search)
    );
    return emailMatch || answersMatch;
  });

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#1e1e2f] mt-16">
      
      {/* Sidebar Section */}
      <div className="flex h-[calc(100vh-5rem)] min-w-[60px] md:min-w-[220px] flex-col border-r border-gray-500/30 bg-[#1e1e2f]/95 py-6 transition-all duration-300">
        <div className="hidden md:block px-4 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80 font-nunito">Recruitment</p>
          <p className="text-[11px] text-gray-500">Chapter Portal</p>
        </div>
        <div className="flex flex-col gap-0.5 px-2 md:px-4">
          <button
            onClick={() => setActiveTab("forms")}
            className={`relative flex items-center gap-3 px-3 py-2.5 md:px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === "forms" ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:bg-gray-500/20 hover:text-gray-200"
            }`}
          >
            {activeTab === "forms" && (
              <span className="absolute left-0 top-0 h-full w-[3px] bg-cyan-400 rounded-r" />
            )}
            <FileText className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline truncate">Forms list</span>
          </button>
          
          <button
            onClick={() => {
              if (forms.length > 0 && !selectedForm) {
                setSelectedForm(forms[0]);
                loadSubmissions(forms[0].formId);
              }
              setActiveTab("submissions");
            }}
            className={`relative flex items-center gap-3 px-3 py-2.5 md:px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === "submissions" ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:bg-gray-500/20 hover:text-gray-200"
            }`}
          >
            {activeTab === "submissions" && (
              <span className="absolute left-0 top-0 h-full w-[3px] bg-cyan-400 rounded-r" />
            )}
            <Users className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline truncate">Submissions</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden">
        <div className="h-full w-full overflow-x-hidden px-4 sm:px-6 lg:px-10 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full w-full"
            >
        {activeTab === "forms" ? (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-richblack-25">Registration Forms</h1>
                <p className="text-gray-400 text-xs mt-1">Create dynamic invite forms and track candidates</p>
              </div>
              <button
                onClick={handleCreateNewFormClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-cyan-600/20"
              >
                <Plus className="h-4 w-4" />
                <span>Create Form</span>
              </button>
            </div>

            {loadingForms ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Spinner className="size-5 text-cyan-400" />
              </div>
            ) : forms.length === 0 ? (
              <div className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/85 to-[#2c2c3e]/85 p-12 text-center">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 font-medium">No forms created yet</p>
                <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">Generate a registration form or use our quick template to get started with freshers recruitment.</p>
                <button
                  onClick={handleCreateNewFormClick}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold"
                >
                  Create first form
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {forms.map((form) => (
                  <div
                    key={form.formId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 p-5 hover:border-cyan-500/30 transition-all duration-300 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-richblack-25 truncate">{form.title}</h2>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${
                            form.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : form.status === "PAUSED"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {form.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{form.description || "No description provided."}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
                        <span>{form.fields?.length || 0} Fields</span>
                        <span>·</span>
                        <span>Created on {new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleSelectFormForSubmissions(form)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-500/45 text-xs text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Submissions</span>
                      </button>

                      {/* Action Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuFormId(activeMenuFormId === form.formId ? null : form.formId);
                          }}
                          className="p-1.5 rounded-lg border border-gray-500/20 text-gray-400 hover:bg-gray-500/15"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                          {activeMenuFormId === form.formId && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-500/35 bg-[#1a1a29]/95 backdrop-blur-md shadow-xl z-30 p-1 flex flex-col gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleCopyLink(form.formId)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-200 hover:bg-cyan-500/20 hover:text-cyan-300"
                              >
                                <LinkIcon className="h-3.5 w-3.5" />
                                <span>Copy Public Link</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditFormClick(form)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-200 hover:bg-cyan-500/20 hover:text-cyan-300"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                <span>Edit fields</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(form, form.status)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-200 hover:bg-cyan-500/20 hover:text-cyan-300"
                              >
                                {form.status === "ACTIVE" ? (
                                  <>
                                    <Pause className="h-3.5 w-3.5 text-amber-400" />
                                    <span>Pause responses</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Resume responses</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleSuspend(form, form.status)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-200 hover:bg-cyan-500/20 hover:text-cyan-300"
                              >
                                {form.status === "SUSPENDED" ? (
                                  <>
                                    <Play className="h-3.5 w-3.5 text-cyan-400" />
                                    <span>Resume link sharing</span>
                                  </>
                                ) : (
                                  <>
                                    <Pause className="h-3.5 w-3.5 text-red-400" />
                                    <span>Suspend link sharing</span>
                                  </>
                                )}
                              </button>
                              <div className="border-t border-gray-500/20 my-0.5" />
                              <button
                                type="button"
                                onClick={() => handleDeleteForm(form.formId)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/20 hover:text-red-200"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Form</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Submissions Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-richblack-25">Submissions</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">Viewing responses for:</span>
                  <select
                    value={selectedForm?.formId || ""}
                    onChange={(e) => {
                      const f = forms.find((x) => x.formId === e.target.value);
                      if (f) {
                        setSelectedForm(f);
                        loadSubmissions(f.formId);
                      }
                    }}
                    className="bg-[#12121f]/50 border border-gray-500/20 rounded-lg px-2 py-0.5 text-xs text-cyan-300 font-semibold focus:outline-none"
                  >
                    {forms.map((f) => (
                      <option key={f.formId} value={f.formId}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submissions Search Bar */}
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search applicants…"
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="w-full rounded-xl border border-transparent bg-[#12121f]/50 py-2 pl-9 pr-4 text-xs text-richblack-25 placeholder:text-gray-500 focus:border-cyan-500/25 focus:bg-[#12121f] focus:outline-none"
                />
              </div>
            </div>

            {loadingSubmissions ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Spinner className="size-5 text-cyan-400" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/85 to-[#2c2c3e]/85 p-12 text-center">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 font-medium">No submissions found</p>
                <p className="text-gray-400 text-xs mt-1">Candidates who submit your generated recruitment form will appear here.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 shadow-xl">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-500/25 bg-gray-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="px-5 py-4">Photo</th>
                      <th className="px-5 py-4">Candidate Details</th>
                      {selectedForm?.fields
                        ?.filter((f) => f.id !== "first_name" && f.id !== "last_name" && f.id !== "email_id" && f.id !== "photo")
                        ?.map((f) => (
                          <th key={f.id} className="px-5 py-4">
                            {f.label}
                          </th>
                        ))}
                      <th className="px-5 py-4">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-500/10 text-gray-200">
                    {filteredSubmissions.map((sub) => {
                      const firstName = sub.answers?.get ? sub.answers.get("first_name") : sub.answers?.first_name;
                      const lastName = sub.answers?.get ? sub.answers.get("last_name") : sub.answers?.last_name;
                      const email = sub.email || (sub.answers?.get ? sub.answers.get("email_id") : sub.answers?.email_id);
                      const name = [firstName, lastName].filter(Boolean).join(" ") || "Applicant";
                      
                      return (
                        <tr key={sub._id} className="hover:bg-gray-500/5 transition-colors">
                          <td className="px-5 py-3 align-middle">
                            {sub.photo ? (
                              <button
                                type="button"
                                onClick={() => setPhotoViewerUrl(sub.photo)}
                                className="h-10 w-10 rounded-full border border-gray-500/50 bg-[#252536] overflow-hidden cursor-zoom-in"
                              >
                                <img
                                  src={sub.photo}
                                  alt={name}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-cyan-700/50 flex items-center justify-center text-cyan-200 font-semibold uppercase">
                                {name[0]}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-middle">
                            <div className="font-semibold text-richblack-25 text-sm">{name}</div>
                            <div className="text-gray-400 mt-0.5">{email}</div>
                          </td>
                          {selectedForm?.fields
                            ?.filter((f) => f.id !== "first_name" && f.id !== "last_name" && f.id !== "email_id" && f.id !== "photo")
                            ?.map((f) => {
                              const val = sub.answers?.get ? sub.answers.get(f.id) : sub.answers?.[f.id];
                              return (
                                <td key={f.id} className="px-5 py-3 align-middle text-gray-300 max-w-xs truncate">
                                  {val || "—"}
                                </td>
                              );
                            })}
                          <td className="px-5 py-3 align-middle text-gray-400">
                            {new Date(sub.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>

      {/* Form Builder / Editor Modal */}
      <AnimatePresence>
        {builderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setBuilderOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1e1e2f] border border-gray-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 z-10 rounded-t-2xl">
                <h2 className="text-lg font-bold text-richblack-25">
                  {isEditing ? "Edit Form Fields" : "Generate Registration Form"}
                </h2>
                <button
                  type="button"
                  onClick={() => setBuilderOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="p-6 space-y-5 flex-1 min-h-0">
                {/* Basic Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Form Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Freshers Recruitment 2026"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-gray-200 placeholder-gray-500 focus:border-cyan-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Description (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Provide instruction to candidates submitting this form..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-gray-200 placeholder-gray-500 focus:border-cyan-500 outline-none text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Fields Section */}
                <div className="border-t border-gray-500/25 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">Form Questions / Fields</h3>
                    {!isEditing && formFields.length === 0 && (
                      <button
                        type="button"
                        onClick={handleLoadTemplate}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold"
                      >
                        Quick Template
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {formFields.length === 0 ? (
                      <p className="text-center py-6 text-xs text-gray-500">
                        No fields added. Click "Quick Template" above or add custom questions below.
                      </p>
                    ) : (
                      formFields.map((field, idx) => (
                        <div
                          key={field.id}
                          className="p-4 rounded-xl bg-[#222235] border border-gray-500/20 flex flex-col gap-3 relative"
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveField(field.id)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors"
                            title="Remove Field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                                Question Label *
                              </label>
                              <input
                                type="text"
                                required
                                value={field.label}
                                onChange={(e) => handleFieldChange(field.id, "label", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a29] border border-gray-500/30 text-xs text-gray-200 outline-none focus:border-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                                Field Type
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) => handleFieldChange(field.id, "type", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a29] border border-gray-500/30 text-xs text-gray-200 outline-none focus:border-cyan-500"
                              >
                                {FIELD_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => handleFieldChange(field.id, "required", e.target.checked)}
                                className="rounded border-gray-500 bg-[#252536] text-cyan-500 focus:ring-cyan-500"
                              />
                              Required Field
                            </label>
                          </div>

                          {/* Options Builder for dropdown selection */}
                          {field.type === "select" && (
                            <div className="border-t border-gray-500/10 pt-2.5 mt-1">
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">
                                Dropdown Selection Options
                              </label>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {(field.options || []).map((opt, i) => (
                                  <span
                                    key={opt + i}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-500/15 border border-gray-500/20 text-[10px] text-gray-300"
                                  >
                                    {opt}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSelectOption(field.id, i)}
                                      className="text-gray-500 hover:text-white"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Type option and press Enter to add..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a29] border border-gray-500/30 text-xs text-gray-200 outline-none focus:border-cyan-500"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSelectOption(field.id, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddField}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Custom Question</span>
                  </button>
                </div>

                {/* Submit actions */}
                <div className="flex gap-3 pt-3 border-t border-gray-500/20">
                  <button
                    type="button"
                    onClick={() => setBuilderOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/20 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all"
                  >
                    {isEditing ? "Save changes" : "Generate Form"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {photoViewerUrl && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setPhotoViewerUrl(null)}
          >
            <div className="relative max-w-md w-full max-h-[80vh] flex items-center justify-center">
              <button
                onClick={() => setPhotoViewerUrl(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:text-red-400 z-10"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={photoViewerUrl}
                alt="Zoomed candidate avatar"
                className="rounded-2xl max-w-full max-h-[75vh] object-contain border border-gray-500/30 shadow-2xl"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
