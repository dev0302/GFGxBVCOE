"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { toast } from "sonner";

const MIN_IMAGES = 6;
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const ROLL_NUMBER_PATTERN = /^\d{11}$/;

type PreviewFile = { file: File; previewUrl: string; id: string };

// Kept local so this TypeScript component does not require declarations for the
// project's existing JavaScript API module.
function getAuthToken() {
  try {
    return localStorage.getItem("gfg_auth_token") || sessionStorage.getItem("gfg_auth_token") || null;
  } catch {
    return null;
  }
}

const API_BASE_URL = (import.meta as ImportMeta & {
  env: { VITE_API_BASE_URL?: string };
}).env.VITE_API_BASE_URL || "";

export default function MemberEnrollForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<PreviewFile[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [images, setImages] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => () => imagesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl)), []);

  const addFiles = (fileList: FileList | File[]) => {
    setError("");
    const selected = Array.from(fileList);
    const invalid = selected.find((file) => !IMAGE_TYPES.has(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      const message = `${invalid.name} must be a JPG, JPEG, or PNG image no larger than 5 MB.`;
      setError(message);
      toast.error(message);
      return;
    }
    if (images.length + selected.length > MAX_IMAGES) {
      const message = `You can enroll a maximum of ${MAX_IMAGES} images. Remove an image before adding more.`;
      setError(message);
      toast.error(message);
      return;
    }
    setImages((current) => [
      ...current,
      ...selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file), id: crypto.randomUUID() })),
    ]);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  };

  const imageCountMessage = images.length < MIN_IMAGES
    ? `Add ${MIN_IMAGES - images.length} more image${MIN_IMAGES - images.length === 1 ? "" : "s"} to continue.`
    : images.length > MAX_IMAGES ? `A maximum of ${MAX_IMAGES} images is allowed.` : "Ready for enrollment.";
  const canSubmit = images.length >= MIN_IMAGES && images.length <= MAX_IMAGES && !isSubmitting;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !email.trim() || !ROLL_NUMBER_PATTERN.test(rollNumber)) {
      setError("Enter your full name, a valid email address, and an 11-digit roll number.");
      return;
    }
    if (!canSubmit) {
      setError(`Please select between ${MIN_IMAGES} and ${MAX_IMAGES} face images before submitting.`);
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim().toLowerCase());
    formData.append("rollNumber", rollNumber);
    images.forEach(({ file }) => formData.append("faces", file));

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/members/enroll`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Enrollment could not be completed.");

      const message = result.message || "Member enrolled successfully.";
      setSuccess(message);
      toast.success(message);
      images.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
      setImages([]);
      setName("");
      setEmail("");
      setRollNumber("");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Enrollment failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] p-5 shadow-xl sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-richblack-25">Member face enrollment</h2>
        <p className="mt-2 text-sm text-gray-400">Upload varied, clear face photos for the VectorVision processing queue.</p>
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {success && <div role="status" className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium text-gray-200">Full name</span><input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className="w-full rounded-xl border border-gray-500/30 bg-[#252536] px-3 py-2.5 text-white outline-none transition focus:border-emerald-400" /></label>
        <label><span className="mb-1.5 block text-sm font-medium text-gray-200">Email address</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-gray-500/30 bg-[#252536] px-3 py-2.5 text-white outline-none transition focus:border-emerald-400" /></label>
        <label><span className="mb-1.5 block text-sm font-medium text-gray-200">Roll number</span><input inputMode="numeric" pattern="[0-9]{11}" title="Use your 11-digit BVCOE roll number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value.replace(/\D/g, "").slice(0, 11))} required className="w-full rounded-xl border border-gray-500/30 bg-[#252536] px-3 py-2.5 text-white outline-none transition focus:border-emerald-400" /></label>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-medium text-gray-200">Face images</span><span className={`text-xs ${canSubmit ? "text-emerald-300" : "text-amber-300"}`}>{images.length}/{MAX_IMAGES}</span></div>
        <div onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }} className={`rounded-xl border-2 border-dashed p-7 text-center transition ${isDragging ? "border-emerald-400 bg-emerald-500/10" : "border-gray-500/30 bg-[#252536]/70 hover:border-emerald-400/60"}`}>
          <p className="text-sm font-medium text-gray-200">Drop images here, or choose files</p><p className="mt-1 text-xs text-gray-500">JPG, JPEG, or PNG · maximum 5 MB each · {MIN_IMAGES}–{MAX_IMAGES} images required</p>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={isSubmitting} className="mt-4 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50">Choose images</button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple className="hidden" onChange={onFileChange} />
        </div>
        <p className={`mt-2 text-xs ${canSubmit ? "text-emerald-300" : "text-amber-300"}`}>{imageCountMessage}</p>
      </div>

      {images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{images.map(({ id, file, previewUrl }, index) => <div key={id} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-500/30 bg-[#252536]"><img src={previewUrl} alt={`Selected face ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => removeImage(id)} disabled={isSubmitting} className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-2 py-1 text-xs text-white opacity-100 transition hover:bg-red-500 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Remove ${file.name}`}>Remove</button></div>)}</div>}

      <button type="submit" disabled={!canSubmit} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-[#102019] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300">{isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />} {isSubmitting ? "Uploading enrollment…" : "Submit enrollment"}</button>
    </form>
  );
}
