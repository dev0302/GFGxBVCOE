import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { submitPost } from "../services/blog_api";

const categories = [
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
};

const BlogForm = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [coverImage, setCoverImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      <main className="min-h-screen bg-[#090d10] px-4 py-24 text-richblack-5">
        <div className="mx-auto max-w-xl border border-white/10 bg-[#11171b] p-8 text-center shadow-2xl sm:p-12">
          <p className="mb-2 font-montserrat text-sm uppercase tracking-[0.2em] text-cyan-300">
            Writer access
          </p>
          <h1 className="font-audiowide text-3xl">Sign in to write</h1>
          <p className="mt-4 text-richblack-200">
            Join the GFG-BVCOE community to share your story.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-8 bg-cyan-400 px-6 py-3 font-montserrat font-bold text-[#071013] transition hover:bg-cyan-300"
          >
            Go to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090d10] px-4 pb-20 pt-24 text-richblack-5 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/blog")}
          className="mb-8 flex items-center gap-2 font-montserrat text-sm text-richblack-200 transition hover:text-cyan-300"
        >
          <ArrowLeft size={16} /> Back to journal
        </button>

        <div className="mb-10 max-w-2xl">
          <p className="mb-3 font-montserrat text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Community journal
          </p>
          <h1 className="font-audiowide text-3xl leading-tight sm:text-5xl">
            Tell a story worth sharing.
          </h1>
          <p className="mt-4 text-lg text-richblack-200">
            Write something useful, honest, and distinctly yours.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1fr_300px]"
        >
          <section className="border border-white/10 bg-[#11171b] p-5 shadow-2xl sm:p-8">
            <label
              className="mb-2 block font-montserrat text-sm font-bold text-richblack-25"
              htmlFor="title"
            >
              Title <span className="text-pink-200">*</span>
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={updateField}
              maxLength={150}
              required
              placeholder="Give your post a clear title"
              className="w-full border-b border-white/20 bg-transparent px-0 py-3 font-audiowide text-2xl outline-none transition placeholder:text-richblack-700 focus:border-cyan-300 sm:text-3xl"
            />
            <p className="mt-2 text-right text-xs text-richblack-200">
              {form.title.length}/150
            </p>

            <label
              className="mt-8 mb-2 block font-montserrat text-sm font-bold text-richblack-25"
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
              className="w-full resize-none border-b border-white/20 bg-transparent px-0 py-3 text-base outline-none transition placeholder:text-richblack-700 focus:border-cyan-300"
            />

            <label
              className="mt-8 mb-2 block font-montserrat text-sm font-bold text-richblack-25"
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
              className="w-full resize-y border border-white/10 bg-[#0b1013] p-4 text-base leading-7 outline-none transition placeholder:text-richblack-700 focus:border-cyan-300"
            />
            <p className="mt-2 text-xs text-richblack-200">
              You can use paragraphs, headings, and code snippets. Posts are
              reviewed before publishing.
            </p>
          </section>

          <aside className="space-y-6">
            <div className="border border-white/10 bg-[#11171b] p-5">
              <h2 className="font-montserrat text-sm font-bold uppercase tracking-wider text-richblack-25">
                Post details
              </h2>
              <label
                className="mt-5 mb-2 block text-sm text-richblack-200"
                htmlFor="category"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={updateField}
                className="w-full border border-white/15 bg-[#0b1013] px-3 py-3 text-sm outline-none focus:border-cyan-300"
              >
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <label
                className="mt-5 mb-2 block text-sm text-richblack-200"
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
                className="w-full border border-white/15 bg-[#0b1013] px-3 py-3 text-sm outline-none focus:border-cyan-300"
              />
              <p className="mt-2 text-xs text-richblack-200">
                Separate tags with commas.
              </p>
            </div>

            <div className="border border-white/10 bg-[#11171b] p-5">
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
                <div className="relative mt-4 overflow-hidden border border-white/10">
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
                    className="absolute right-2 top-2 bg-black/70 p-2 text-white hover:bg-pink-200 hover:text-black"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="coverImage"
                  className="mt-4 flex cursor-pointer flex-col items-center justify-center border border-dashed border-white/20 px-4 py-8 text-center transition hover:border-cyan-300"
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
              className="flex w-full items-center justify-center gap-2 bg-cyan-400 px-5 py-4 font-montserrat font-bold text-[#071013] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
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
