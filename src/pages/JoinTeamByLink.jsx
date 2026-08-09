import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { addTeamMemberByInviteLink, uploadTeamPhotoByInviteLink } from "../services/api";
import { useTeamInviteValidation } from "../hooks/useTeamInviteValidation";
import { toast } from "sonner";
import { Users, AlertCircle } from "react-feather";
import { photoPreviewUrl, avatarPlaceholder } from "../utils/teamMemberUtils";
import loadImage from "blueimp-load-image";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Spinner } from "@/components/ui/spinner";


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max

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

export default function JoinTeamByLink() {
  const { token } = useParams();
  const validation = useTeamInviteValidation(token);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [form, setForm] = useState(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
  const [saving, setSaving] = useState(false);
  const [alreadyEnrolledModal, setAlreadyEnrolledModal] = useState(null);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const imgCropRef = useRef(null);
  const cropPxRef = useRef(null);
  const formDisabled = validation.status === "invalid";

  /** cropPx = crop in display pixels (as ReactCrop reports). Output is full-resolution crop. */
  const getCroppedImg = (imageEl, cropPx) => {
    if (!imageEl || !cropPx?.width || !cropPx?.height)
      return Promise.resolve(null);

    const scaleX = imageEl.naturalWidth / imageEl.width;
    const scaleY = imageEl.naturalHeight / imageEl.height;
    const outW = Math.round(cropPx.width * scaleX);
    const outH = Math.round(cropPx.height * scaleY);
    if (outW <= 0 || outH <= 0) return Promise.resolve(null);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);

    ctx.drawImage(
      imageEl,
      cropPx.x * scaleX,
      cropPx.y * scaleY,
      cropPx.width * scaleX,
      cropPx.height * scaleY,
      0,
      0,
      outW,
      outH,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  /** Normalize EXIF orientation (fixes random crop on phone photos) */
  const normalizeImageForCrop = (file) => {
    return new Promise((resolve, reject) => {
      loadImage(file, (img) => {
        if (img?.type === "error") {
          reject(new Error("Failed to load image"));
          return;
        }
        if (img?.tagName === "CANVAS" && img.toBlob) {
          img.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.95);
        } else {
          resolve(file);
        }
      }, { orientation: true, canvas: true });
    });
  };

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Image must be under 5MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    try {
      const normalized = await normalizeImageForCrop(file);
      const blob = normalized instanceof Blob ? normalized : new Blob([normalized], { type: file.type });
      const src = URL.createObjectURL(blob);
      setCropImageSrc(src);
      setCrop(null); // Set on image load via onImageLoad
    } catch (err) {
      toast.error(err.message || "Failed to process image");
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, 1, width, height), width, height));
  };

  const handleCropApply = async () => {
    if (!imgCropRef.current || !crop?.width || !cropImageSrc || !token) return;
    const imageEl = imgCropRef.current;
    const px = cropPxRef.current;
    const dw = imageEl.width;
    const dh = imageEl.height;
    const cropPx = px && px.width && px.height
      ? { x: px.x, y: px.y, width: px.width, height: px.height }
      : crop.unit === "px"
        ? { x: crop.x, y: crop.y, width: crop.width, height: crop.height }
        : {
            x: (crop.x / 100) * dw,
            y: (crop.y / 100) * dh,
            width: (crop.width / 100) * dw,
            height: (crop.height / 100) * dh,
          };
    try {
      const blob = await getCroppedImg(imageEl, cropPx);
      if (!blob) return;
      setPhotoUploading(true);
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const previousUrl = form.photo?.trim() || "";
      const res = await uploadTeamPhotoByInviteLink(token, file, previousUrl);
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

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-richblack-25 placeholder-gray-500 focus:border-cyan-500 outline-none text-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    if (!form.year?.trim()) { toast.error("Year is required"); return; }
    if (!form.branch?.trim()) { toast.error("Branch is required"); return; }
    if (!form.section?.trim()) { toast.error("Section is required"); return; }
    if (!form.email?.trim()) { toast.error("Email is required"); return; }
    if (!form.contact?.trim()) { toast.error("Contact is required"); return; }
    if (!form.photo?.trim()) { toast.error("Photo is required (please upload a photo)"); return; }
    setSaving(true);
    try {
      await addTeamMemberByInviteLink(token, form);
      toast.success("You have been added to the team.");
      setSubmittedEmail(form.email?.trim() || "");
      setSubmitted(true);
      setForm(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
    } catch (e) {
      if (e.code === "TEAM_INVITE_ALREADY_ENROLLED") {
        setAlreadyEnrolledModal({
          department: e.department || "another",
          message: e.message,
        });
      } else {
        toast.error(e.message || "Failed to submit");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-lg">
        {submitted ? (
          <div className="rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/80 p-8 text-center flex flex-col items-center gap-4">
            {/* Success icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><polyline points="20 6 9 17 4 12" /></svg>
            </div>

            <div>
              <p className="text-cyan-400 font-semibold text-lg">You're in!</p>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Your form has been submitted. You are now a member of the{" "}
                <span className="text-cyan-300 font-medium">
                  {validation.department || "team"}
                </span>{" "}
                department.
              </p>
            </div>

            <div className="w-full rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                Sign up on our website to stay updated with events, announcements, and everything happening in the society!
              </p>
              <Link
                to={`/signup?email=${encodeURIComponent(submittedEmail)}&department=${encodeURIComponent(validation.department || "")}`}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 py-2.5 text-sm font-semibold text-richblack-25 hover:from-cyan-500 hover:to-cyan-400 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Sign Up
              </Link>
            </div>

            <p className="text-gray-500 text-xs">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/80 p-6">
            <h1 className="text-xl font-bold text-richblack-25 flex items-center gap-2 mb-1">
              <Users className="h-6 w-6 text-cyan-400" />
              Join the team
            </h1>
            {validation.status === "pending" && (
              <p className="text-gray-500 text-xs mb-2 flex items-center gap-1.5">
                <Spinner className="size-3.5 text-cyan-400 animate-spin" />
                Verifying link…
              </p>
            )}
            <p className="text-gray-400 text-sm mb-6">
              {validation.status === "valid" ? (
                <>
                  You’re joining <span className="text-cyan-300 font-medium">{validation.department}</span>{" "}
                  <span className="text-cyan-300 font-medium">department</span>. Fill in your details below.
                </>
              ) : (
                "Fill in your details below."
              )}
            </p>

            {validation.status === "invalid" && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
                <p className="text-red-400 font-medium">{validation.message || "Invalid or expired link"}</p>
                <p className="text-gray-400 text-sm mt-1">
                  This invite link may have expired or does not exist. Ask for a new link.
                </p>
              </div>
            )}

            {validation.status === "error" && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
                <p className="text-amber-400 font-medium text-sm">{validation.message}</p>
              </div>
            )}

            <fieldset disabled={formDisabled} className="space-y-3 border-0 p-0 m-0 min-w-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                {COLS.map((k) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{LABELS[k]}{k !== "non_tech_society" ? " *" : ""}</label>
                    {k === "year" ? (
                      <select
                        value={form[k]}
                        onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                        className={inputClass}
                        required
                      >
                        <option value="">Select year</option>
                        {YEAR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : k === "branch" ? (
                      <select
                        value={form[k]}
                        onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                        className={inputClass}
                        required
                      >
                        <option value="">Select branch</option>
                        {BRANCH_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : k === "photo" ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <label className={`px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium ${formDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-cyan-500/30 cursor-pointer"}`}>
                            {form.photo ? "Reupload photo" : "Upload photo"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlePhotoFile}
                              disabled={photoUploading || formDisabled}
                            />
                          </label>
                          <span className="text-xs text-gray-500">Max 5MB · then crop</span>
                        </div>
                        {form.photo && (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-500/50 bg-[#252536]">
                            <img
                              src={photoPreviewUrl(form.photo)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(ev) => { ev.target.onerror = null; ev.target.src = avatarPlaceholder(""); }}
                            />
                          </div>
                        )}
                      </div>
                    ) : k === "section" ? (
                      <input
                        type="text"
                        value={form[k]}
                        onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                        className={inputClass}
                        placeholder="e.g. CSE-4"
                        required
                      />
                    ) : k === "non_tech_society" ? (
                      <input
                        type="text"
                        value={form[k]}
                        onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                        className={inputClass}
                        placeholder="if any"
                      />
                    ) : (
                      <input
                        type={k === "email" ? "email" : "text"}
                        value={form[k]}
                        onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                        className={inputClass}
                        placeholder={LABELS[k]}
                        required
                      />
                    )}
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={saving || formDisabled}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-richblack-25 font-semibold disabled:opacity-50 mt-4"
                >
                  {saving ? "Submitting…" : "Submit"}
                </button>
              </form>
            </fieldset>
          </div>
        )}
      </div>

      {alreadyEnrolledModal && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="already-enrolled-title"
          onClick={() => setAlreadyEnrolledModal(null)}
        >
          <div
            className="bg-[#1e1e2f] rounded-2xl border border-amber-500/30 p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 id="already-enrolled-title" className="text-lg font-semibold text-richblack-25">
                  Form already submitted
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  You have already submitted this form earlier and cannot re-submit.
                </p>
                <p className="text-sm text-gray-300 mt-3">
                  You are already enrolled in the{" "}
                  <span className="text-cyan-300 font-medium">{alreadyEnrolledModal.department}</span> department.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAlreadyEnrolledModal(null)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-richblack-25 font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {cropImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => { URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); setCrop(null); }}>
          <div className="bg-[#1e1e2f] rounded-2xl border border-gray-500/30 p-4 max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-richblack-25 font-semibold mb-3">Crop photo</h3>
            <ReactCrop
              crop={crop}
              onChange={(pixelCrop) => { cropPxRef.current = pixelCrop; setCrop(pixelCrop); }}
              aspect={1}
              circularCrop
              className="max-h-[50vh]"
            >
              <img ref={imgCropRef} src={cropImageSrc} alt="Crop" style={{ maxHeight: "50vh", width: "auto" }} onLoad={onImageLoad} />
            </ReactCrop>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => { URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); setCrop(null); }} className="flex-1 py-2 rounded-xl border border-gray-500/50 text-gray-300">Cancel</button>
              <button type="button" onClick={handleCropApply} disabled={photoUploading} className="flex-1 py-2 rounded-xl bg-cyan-600 text-richblack-25 font-medium disabled:opacity-50">{photoUploading ? <div className="flex items-center justify-center h-full w-full gap-2">
  <Spinner className="size-4 text-richblack-25 animate-spin" />
  <span className="text-richblack-25 text-sm font-medium">Uploading</span>
</div> : "Apply & upload"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
