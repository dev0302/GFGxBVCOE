import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FileText, Clipboard, CheckCircle, Image, Upload, RotateCcw, AlertTriangle } from "react-feather";
import {
  getRecruitmentFormPublic,
  submitRecruitmentForm,
  getSubmissionByEditToken,
  updateSubmissionByEditToken,
  uploadRecruitmentSubmissionPhoto,
} from "../services/api";
import loadImage from "blueimp-load-image";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Spinner } from "@/components/ui/spinner";
import { motion, AnimatePresence } from "framer-motion";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PublicRecruitmentForm() {
  const { formId } = useParams();
  const [searchParams] = useSearchParams();
  const editToken = searchParams.get("editToken");

  const [formConfig, setFormConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [formState, setFormState] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdEditToken, setCreatedEditToken] = useState("");

  // Crop states
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const imgCropRef = useRef(null);
  const cropPxRef = useRef(null);

  // Duplicate Warning State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState("");

  console.log("PublicRecruitmentForm render: loadingConfig =", loadingConfig, "formConfig =", formConfig, "formId =", formId);

  useEffect(() => {
    loadFormDetails();
  }, [formId, editToken]);

  const loadFormDetails = async () => {
    console.log("loadFormDetails: fetching formId =", formId);
    setLoadingConfig(true);
    try {
      // 1. Fetch form structure
      const res = await getRecruitmentFormPublic(formId);
      console.log("loadFormDetails: fetch success res =", res);
      if (res.success) {
        setFormConfig(res.data);
        
        // Initialize fields
        const initialForm = {};
        const fields = res.data?.fields || [];
        fields.forEach((f) => {
          initialForm[f.id] = "";
        });
        setFormState(initialForm);

        // 2. If editToken is present, fetch and fill candidate's previous response
        if (editToken) {
          const subRes = await getSubmissionByEditToken(editToken);
          console.log("loadFormDetails: editToken fetch success subRes =", subRes);
          if (subRes.success && subRes.data?.submission) {
            const savedAnswers = subRes.data.submission.answers || {};
            // Answers can be map-like, so normalize
            const mapped = {};
            fields.forEach((f) => {
              mapped[f.id] = savedAnswers[f.id] || "";
            });
            setFormState(mapped);
          } else {
            toast.error("Invalid or expired edit link.");
          }
        }
      }
    } catch (err) {
      console.error("loadFormDetails error:", err);
      toast.error(err.message || "Failed to load form details");
    } finally {
      setLoadingConfig(false);
    }
  };

  // EXIF normalization and helper functions for image cropping
  const getCroppedImg = (imageEl, cropPx) => {
    if (!imageEl || !cropPx?.width || !cropPx?.height) return Promise.resolve(null);
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
      outH
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

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

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be under 5MB.");
      return;
    }
    try {
      const normalized = await normalizeImageForCrop(file);
      const blob = normalized instanceof Blob ? normalized : new Blob([normalized], { type: file.type });
      const src = URL.createObjectURL(blob);
      setCropImageSrc(src);
      setCrop(null);
    } catch (err) {
      toast.error("Failed to process image");
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, 1, width, height), width, height));
  };

  const handleCropApply = async () => {
    if (!imgCropRef.current || !crop?.width || !cropImageSrc) return;
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
      const file = new File([blob], "recruitment_photo.jpg", { type: "image/jpeg" });
      const res = await uploadRecruitmentSubmissionPhoto(file);
      if (res?.url) {
        setFormState((p) => ({ ...p, photo: res.url }));
        toast.success("Photo uploaded successfully");
      }
    } catch (err) {
      toast.error(err.message || "Photo upload failed");
    } finally {
      setPhotoUploading(false);
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const handleSubmit = async (e, override = false) => {
    if (e) e.preventDefault();
    
    // Validate required fields
    for (const f of formConfig.fields) {
      if (f.required && !formState[f.id]) {
        toast.error(`"${f.label}" is required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Find candidate's email field
      const emailField = formConfig.fields.find((f) => f.id === "email_id" || f.id.toLowerCase().includes("email"));
      const email = emailField ? formState[emailField.id] : "";

      if (editToken) {
        // Edit mode
        const payload = {
          answers: formState,
          photo: formState.photo || "",
        };
        const res = await updateSubmissionByEditToken(editToken, payload);
        if (res.success) {
          toast.success("Submission updated successfully!");
          setCreatedEditToken(editToken);
          setSubmitted(true);
        }
      } else {
        // Create mode
        const payload = {
          formId,
          email,
          answers: formState,
          photo: formState.photo || "",
          override,
        };
        const res = await submitRecruitmentForm(payload);
        if (res.success) {
          toast.success("Registration submitted successfully!");
          setCreatedEditToken(res.data.editToken);
          setSubmitted(true);
        }
      }
    } catch (err) {
      if (err.duplicate) {
        // Show overwrite confirmation modal
        setDuplicateMessage(err.message);
        setShowDuplicateModal(true);
      } else {
        toast.error(err.message || "Failed to submit registration");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmResubmit = () => {
    setShowDuplicateModal(false);
    handleSubmit(null, true); // Submit with override = true
  };

  const handleCopyEditLink = () => {
    const url = `${window.location.origin}/recruitment/form/${formId}?editToken=${createdEditToken}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Editable form link copied! Keep it safe."))
      .catch(() => toast.error("Failed to copy link"));
  };

  const inputClass =
    "w-full px-3.5 py-3 rounded-xl bg-[#252536] border border-gray-500/40 text-richblack-25 placeholder-gray-500 focus:border-cyan-500 outline-none text-sm";

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-[#1e1e2f] flex items-center justify-center pt-24">
        <Spinner className="size-6 text-cyan-400" />
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen bg-[#1e1e2f] flex items-center justify-center p-4 pt-24">
        <div className="rounded-2xl border border-gray-500/30 bg-[#1e1e2f]/85 p-8 text-center max-w-sm w-full">
          <p className="text-red-400 font-semibold">Form Not Found</p>
          <p className="text-gray-400 text-xs mt-2">This link does not exist or may have been deleted by the administrator.</p>
        </div>
      </div>
    );
  }

  if (formConfig.status === "SUSPENDED") {
    return (
      <div className="min-h-screen bg-[#1e1e2f] flex items-center justify-center p-4 pt-24">
        <div className="rounded-2xl border border-red-500/20 bg-[#1e1e2f]/85 p-8 text-center max-w-md w-full">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-bold text-lg">Sharing Suspended</p>
          <p className="text-gray-400 text-xs mt-2">The sharing link for this form has been suspended by the administrator. Contact your coordinator for details.</p>
        </div>
      </div>
    );
  }

  if (formConfig.status === "PAUSED") {
    return (
      <div className="min-h-screen bg-[#1e1e2f] flex items-center justify-center p-4 pt-24">
        <div className="rounded-2xl border border-amber-500/20 bg-[#1e1e2f]/85 p-8 text-center max-w-md w-full">
          <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <p className="text-amber-400 font-bold text-lg">Responses Paused</p>
          <p className="text-gray-400 text-xs mt-2">This form is currently not accepting new responses. Check back again later.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1e1e2f] flex items-center justify-center p-4 pt-24">
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#1e1e2f]/90 to-[#2c2c3e]/90 p-8 text-center max-w-md w-full shadow-2xl">
          <CheckCircle className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-richblack-25">Thank you!</h2>
          <p className="text-gray-400 text-xs mt-1.5">Your registration response has been saved successfully.</p>
          
          <div className="mt-6 p-4 rounded-xl bg-[#1d1d2c] border border-gray-500/30 text-left">
            <span className="block text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Your editable link</span>
            <span className="block text-[11px] text-gray-400 mt-1 leading-relaxed">Use this link to return and modify your answers at any point.</span>
            
            <button
              onClick={handleCopyEditLink}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold"
            >
              <Clipboard className="h-3.5 w-3.5" />
              <span>Copy Link & Save</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e2f] pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="rounded-2xl border border-gray-500/30 bg-gradient-to-br from-[#1e1e2f]/85 to-[#2c2c3e]/85 p-6 shadow-2xl">
          <h1 className="text-xl font-bold text-richblack-25 flex items-center gap-2 mb-1">
            <FileText className="h-6 w-6 text-cyan-400" />
            {formConfig.title}
          </h1>
          <p className="text-gray-400 text-xs mb-6">
            {formConfig.description || "Please fill out the recruitment details below."}
          </p>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            {(formConfig.fields || []).map((f) => (
              <div key={f.id}>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  {f.label} {f.required && " *"}
                </label>

                {f.id === "photo" ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <label className="px-3.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-xs font-semibold cursor-pointer">
                        {formState.photo ? "Reupload Photo" : "Upload Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoFileChange}
                          disabled={photoUploading}
                        />
                      </label>
                      <span className="text-[10px] text-gray-500">Max 5MB · square crop</span>
                    </div>

                    {formState.photo && (
                      <div className="relative w-20 h-20 rounded-full border border-cyan-500/40 overflow-hidden bg-[#252536]">
                        <img
                          src={formState.photo}
                          alt="Cropped profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ) : f.type === "select" ? (
                  <select
                    value={formState[f.id] || ""}
                    onChange={(e) => setFormState({ ...formState, [f.id]: e.target.value })}
                    required={f.required}
                    className={inputClass}
                  >
                    <option value="">Select option...</option>
                    {(f.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={formState[f.id] || ""}
                    onChange={(e) => setFormState({ ...formState, [f.id]: e.target.value })}
                    required={f.required}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#252536] border border-gray-500/40 text-richblack-25 placeholder-gray-500 focus:border-cyan-500 outline-none text-sm resize-none"
                    placeholder={f.label}
                  />
                ) : f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 cursor-pointer mt-1 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={!!formState[f.id]}
                      onChange={(e) => setFormState({ ...formState, [f.id]: e.target.checked ? "Yes" : "" })}
                      className="rounded border-gray-500 bg-[#252536] text-cyan-500 focus:ring-cyan-500"
                    />
                    I confirm/agree
                  </label>
                ) : (
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    value={formState[f.id] || ""}
                    onChange={(e) => setFormState({ ...formState, [f.id]: e.target.value })}
                    required={f.required}
                    className={inputClass}
                    placeholder={f.label}
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all disabled:opacity-50 mt-6 shadow-lg shadow-cyan-600/10"
            >
              {submitting ? "Submitting response..." : editToken ? "Save Changes" : "Submit response"}
            </button>
          </form>
        </div>
      </div>

      {/* Image Crop Overlay Modal */}
      <AnimatePresence>
        {cropImageSrc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => {
              URL.revokeObjectURL(cropImageSrc);
              setCropImageSrc(null);
              setCrop(null);
            }}
          >
            <div
              className="bg-[#1e1e2f] rounded-2xl border border-gray-500/30 p-5 max-w-lg w-full max-h-[90vh] overflow-auto flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-richblack-25 font-bold text-sm">Crop your Photo</h3>
              <div className="flex items-center justify-center bg-black/20 p-2 rounded-xl">
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
                    alt="Crop workspace"
                    style={{ maxHeight: "50vh", width: "auto" }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(cropImageSrc);
                    setCropImageSrc(null);
                    setCrop(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropApply}
                  disabled={photoUploading}
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {photoUploading ? (
                    <>
                      <Spinner className="size-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    "Apply & Crop"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Duplicate Warning Dialog Modal */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e1e2f] border border-gray-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
              <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-richblack-25">Already Registered</h3>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                {duplicateMessage}
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-500/40 text-gray-300 hover:bg-gray-500/15 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResubmit}
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/10"
                >
                  Yes, resubmit
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
