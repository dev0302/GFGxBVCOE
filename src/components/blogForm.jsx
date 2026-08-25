import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { submitPost } from "../services/blog_api";

const DEFAULT_CATEGORIES = [
  "Web Development",
  "React",
  "JavaScript",
  "CSS",
  "Design",
  "Community",
  "Career",
];

const initialForm = {
  title: "",
  summary: "",
  content: "",
  category: "",
  tags: "",
  fullName: "",
  notifyEmail: "",
};

const BlogForm = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [coverImage, setCoverImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryList, setCategoryList] = useState(DEFAULT_CATEGORIES);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customInputRef = useRef(null);

  useEffect(() => {
    if (!coverImage) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(coverImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverImage]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCategoryChange = (event) => {
    const { value } = event.target;
    if (value === "__custom__") {
      setShowCustomInput(true);
      setForm((current) => ({ ...current, category: "" }));
      setTimeout(() => customInputRef.current?.focus(), 50);
    } else {
      setShowCustomInput(false);
      setForm((current) => ({ ...current, category: value }));
    }
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed) {
      toast.error("Please enter a category name.");
      return;
    }
    const exists = categoryList.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      toast.error("This category already exists.");
      setForm((current) => ({ ...current, category: trimmed }));
      setShowCustomInput(false);
      setCustomCategory("");
      return;
    }
    setCategoryList((prev) => [...prev, trimmed]);
    setForm((current) => ({ ...current, category: trimmed }));
    setCustomCategory("");
    setShowCustomInput(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image must be smaller than 5 MB.");
      return;
    }
    setCoverImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and body text are required.");
      return;
    }
    if (!form.fullName.trim()) {
      toast.error("Your full name is required.");
      return;
    }
    if (!form.notifyEmail.trim()) {
      toast.error("Notification email is required.");
      return;
    }
    if (form.title.trim().length > 150) {
      toast.error("Title must be 150 characters or fewer.");
      return;
    }

    setSubmitting(true);
    try {
      await submitPost({
        ...form,
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content.trim(),
        fullName: form.fullName.trim(),
        notifyEmail: form.notifyEmail.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        coverImage,
      });
      toast.success("Your post was submitted for approval.", {
        duration: 2200,
      });
      setForm(initialForm);
      setCoverImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      window.setTimeout(() => navigate("/blog"), 2200);
    } catch (error) {
      toast.error(error.message || "Could not submit your post.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#090d10]" />;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090d10] px-4 py-24 text-richblack-5">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11171b] p-8 text-center shadow-2xl shadow-black/40 sm:p-12">
          <p className="mb-2 font-montserrat text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Writer access
          </p>
          <h1 className="font-audiowide text-3xl">Sign in to write</h1>
          <p className="mt-4 text-richblack-200">
            Join the GFG-BVCOE community to share your story.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-8 w-full rounded-xl bg-cyan-400 px-6 py-3 font-montserrat font-bold text-[#071013] transition hover:bg-cyan-300 sm:w-auto"
          >
            Go to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090d10] px-4 pb-20 pt-24 text-richblack-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/blog")}
          className="mb-8 flex items-center gap-2 rounded-full border border-transparent px-1 py-1 font-montserrat text-sm text-richblack-200 transition hover:border-white/10 hover:text-cyan-300"
        >
          <ArrowLeft size={16} /> Back to journal
        </button>

        <div className="mb-10 ">
          <p className="mb-3 font-montserrat text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Community journal
          </p>
          <h1 className="font-audiowide text-3xl leading-tight sm:text-4xl md:text-5xl">
            Tell a story worth sharing.
          </h1>
          <p className="mt-4 text-base text-richblack-200 sm:text-lg">
            Write something useful, honest, and distinctly yours.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8"
        >
          {/* Main editor card */}
          <section className="rounded-3xl border border-white/10 bg-[#11171b] p-5 shadow-2xl shadow-black/30 sm:p-8">
            <div className="flex flex-col gap-8">
              <div>
                <label
                  className="mb-2 flex items-center justify-between font-montserrat text-sm font-bold text-richblack-25"
                  htmlFor="title"
                >
                  <span>
                    Title <span className="text-pink-200">*</span>
                  </span>
                </label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  maxLength={150}
                  required
                  placeholder="Give your post a clear title"
                  className="w-full rounded-lg border-b border-white/20 bg-transparent px-0 py-3 font-audiowide text-xl outline-none transition placeholder:text-richblack-700 focus:border-cyan-300 sm:text-2xl md:text-3xl"
                />
                <p className="mt-2 text-right text-xs text-richblack-200">
                  {form.title.length}/150
                </p>
              </div>

              <div>
                <label
                  className="mb-2 block font-montserrat text-sm font-bold text-richblack-25"
                  htmlFor="summary"
                >
                  Short summary
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  value={form.summary}
                  onChange={updateField}
                  maxLength={500}
                  rows={2}
                  placeholder="What should readers know before they begin?"
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0b1013] px-4 py-3 text-base outline-none transition placeholder:text-richblack-700 focus:border-cyan-300"
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-montserrat text-sm font-bold text-richblack-25"
                  htmlFor="content"
                >
                  Body text <span className="text-pink-200">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={form.content}
                  onChange={updateField}
                  required
                  rows={15}
                  placeholder="Start writing here..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1013] p-4 text-base leading-7 outline-none transition placeholder:text-richblack-700 focus:border-cyan-300"
                />
                <p className="mt-2 text-xs text-richblack-200">
                  You can use paragraphs, headings, and code snippets. Posts
                  are reviewed before publishing.
                </p>
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#11171b] p-5 sm:p-6">
              <h2 className="font-montserrat text-sm font-bold uppercase tracking-wider text-richblack-25">
                Post details
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <label
                    className="mb-2 block text-sm text-richblack-200"
                    htmlFor="fullName"
                  >
                    Your full name <span className="text-pink-200">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={updateField}
                    required
                    placeholder="e.g. Riya Sharma"
                    className="w-full rounded-xl border border-white/15 bg-[#0b1013] px-3.5 py-3 text-sm outline-none transition focus:border-cyan-300"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm text-richblack-200"
                    htmlFor="category"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={showCustomInput ? "__custom__" : form.category}
                    onChange={handleCategoryChange}
                    className="w-full rounded-xl border border-white/15 bg-[#0b1013] px-3.5 py-3 text-sm outline-none transition focus:border-cyan-300"
                  >
                    <option value="">Choose a category</option>
                    {categoryList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">＋ Add custom…</option>
                  </select>

                  {showCustomInput && (
                    <div className="mt-3 flex flex-wrap gap-2 sm:flex-nowrap">
                      <input
                        ref={customInputRef}
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleAddCustomCategory())
                        }
                        placeholder="Enter category name"
                        className="min-w-0 flex-1 rounded-lg border border-cyan-300/40 bg-[#0b1013] px-3 py-2 text-sm outline-none focus:border-cyan-300"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-[#071013] transition hover:bg-cyan-300"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomCategory("");
                        }}
                        className="rounded-lg border border-white/15 px-3 py-2 text-xs text-richblack-200 transition hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm text-richblack-200"
                    htmlFor="tags"
                  >
                    Tags
                  </label>
                  <input
                    id="tags"
                    name="tags"
                    value={form.tags}
                    onChange={updateField}
                    placeholder="react, learning, community"
                    className="w-full rounded-xl border border-white/15 bg-[#0b1013] px-3.5 py-3 text-sm outline-none transition focus:border-cyan-300"
                  />
                  <p className="mt-2 text-xs text-richblack-200">
                    Separate tags with commas.
                  </p>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm text-richblack-200"
                    htmlFor="notifyEmail"
                  >
                    Notification email <span className="text-pink-200">*</span>
                  </label>
                  <input
                    id="notifyEmail"
                    name="notifyEmail"
                    type="email"
                    value={form.notifyEmail}
                    onChange={updateField}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/15 bg-[#0b1013] px-3.5 py-3 text-sm outline-none transition focus:border-cyan-300"
                  />
                  <p className="mt-2 text-xs text-richblack-200">
                    Email where you&apos;ll receive approval / rejection
                    updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#11171b] p-5 sm:p-6">
              <h2 className="font-montserrat text-sm font-bold uppercase tracking-wider text-richblack-25">
                Cover image
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
                id="coverImage"
              />
              {previewUrl ? (
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <img
                    src={previewUrl}
                    alt="Cover preview"
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Remove cover image"
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white transition hover:bg-pink-200 hover:text-black"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="coverImage"
                  className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 px-4 py-8 text-center transition hover:border-cyan-300 hover:bg-white/[0.02]"
                >
                  <ImagePlus className="mb-3 text-cyan-300" size={24} />
                  <span className="text-sm font-bold">Add a cover image</span>
                  <span className="mt-1 text-xs text-richblack-200">
                    PNG, JPG up to 5 MB
                  </span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-4 font-montserrat font-bold text-[#071013] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {submitting ? "Submitting..." : "Submit for review"}
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
};

export default BlogForm;
