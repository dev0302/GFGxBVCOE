import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { validateTeamInviteLink, addTeamMemberByInviteLink, uploadTeamPhotoByInviteLink } from "../services/api";
import { toast } from "sonner";
import { Users } from "react-feather";
import { photoPreviewUrl, avatarPlaceholder } from "../utils/teamMemberUtils";
import loadImage from "blueimp-load-image";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

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
  const [status, setStatus] = useState("loading"); // loading | valid | invalid | done
  const [department, setDepartment] = useState("");
  const [form, setForm] = useState(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
  const [saving, setSaving] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const imgCropRef = useRef(null);
  const cropPxRef = useRef(null);

  const getCroppedImg = (imageEl, cropPx) => {
    if (!imageEl || !cropPx?.width || !cropPx?.height) return Promise.resolve(null);
    const canvas = document.createElement("canvas");
    canvas.width = cropPx.width;
    canvas.height = cropPx.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);
    ctx.drawImage(
      imageEl,
      cropPx.x, cropPx.y, cropPx.width, cropPx.height,
      0, 0, cropPx.width, cropPx.height
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
      toast.error(`Image must be under 200MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
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
    const nw = imageEl.naturalWidth;
    const nh = imageEl.naturalHeight;
    const cropPx = px && px.width && px.height
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
      const blob = await getCroppedImg(imageEl, cropPx);
      if (!blob) return;
      setPhotoUploading(true);
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const res = await uploadTeamPhotoByInviteLink(token, file);
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

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    validateTeamInviteLink(token)
      .then((res) => {
        if (res.valid && res.department) {
          setStatus("valid");
          setDepartment(res.department);
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 outline-none text-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    if (!form.year?.trim()) { toast.error("Year is required"); return; }
    if (!form.branch?.trim()) { toast.error("Branch is required"); return; }
    if (!form.section?.trim()) { toast.error("Section is required"); return; }
    if (!form.email?.trim()) { toast.error("Email is required"); return; }
    if (!form.contact?.trim()) { toast.error("Contact is required"); return; }
    if (!form.photo?.trim()) { toast.error("Photo is required (upload or paste link)"); return; }
    setSaving(true);
    try {
      await addTeamMemberByInviteLink(token, form);
      toast.success("You have been added to the team.");
      setStatus("done");
      setForm(COLS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
    } catch (e) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-lg">
        {status === "loading" && (
          <div className="rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/80 p-12 text-center">
            <p className="text-gray-400">Checking invite link…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/80 p-8 text-center">
            <p className="text-red-400 font-medium">Invalid or expired link</p>
            <p className="text-gray-400 text-sm mt-2">This invite link may have expired or does not exist. Ask for a new link.</p>
          </div>
        )}

        {status === "valid" && (
          <div className="rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/80 p-6">
            <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Users className="h-6 w-6 text-cyan-400" />
              Join the team
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              You’re joining <span className="text-cyan-300 font-medium">{department}</span>. Fill in your details below.
            </p>
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
                        <label className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium cursor-pointer">
                          {form.photo ? "Reupload photo" : "Upload photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoFile}
                            disabled={photoUploading}
                          />
                        </label>
                        <span className="text-xs text-gray-500">Max 200MB · then crop</span>
                      </div>
                      <input
                        type="text"
                        value={form.photo}
                        onChange={(e) => setForm((p) => ({ ...p, photo: e.target.value }))}
                        className={inputClass}
                        placeholder="Or paste image link (Cloudinary or Drive URL)"
                        required
                      />
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
                      placeholder={LABELS[k]}
                      required
                    />
                  ) : k === "non_tech_society" ? (
                    <input
                      type="text"
                      value={form[k]}
                      onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                      className={inputClass}
                      placeholder={LABELS[k]}
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
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50 mt-4"
              >
                {saving ? "Submitting…" : "Submit"}
              </button>
            </form>
          </div>
        )}

        {status === "done" && (
          <div className="rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/80 p-8 text-center">
            <p className="text-cyan-400 font-medium">You’re in!</p>
            <p className="text-gray-400 text-sm mt-2">Your details have been added to the team. You can close this page.</p>
          </div>
        )}
      </div>

      {cropImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => { URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); setCrop(null); }}>
          <div className="bg-[#1e1e2f] rounded-2xl border border-gray-500/30 p-4 max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-3">Crop photo</h3>
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
              <button type="button" onClick={handleCropApply} disabled={photoUploading} className="flex-1 py-2 rounded-xl bg-cyan-600 text-white font-medium disabled:opacity-50">{photoUploading ? "Uploading…" : "Apply & upload"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
