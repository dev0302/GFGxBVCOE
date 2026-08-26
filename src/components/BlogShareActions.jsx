import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { copyBlogPostLink } from "../utils/blogShare";
import BlogShareSheet from "./BlogShareSheet";

export default function BlogShareActions({ post, className = "" }) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const stop = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handleCopy = async (event) => {
    stop(event);
    try {
      await copyBlogPostLink(post);
      setCopied(true);
      toast.success("Link copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleShare = (event) => {
    stop(event);
    setShareOpen(true);
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          aria-label="Copy blog link"
          title="Copy link"
          onClick={handleCopy}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-105"
          style={{
            background: copied ? "rgba(34,197,94,0.75)" : "rgba(3,20,10,0.82)",
            border: "1px solid rgba(120,220,160,0.32)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
        <button
          type="button"
          aria-label="Share blog"
          title="Share"
          onClick={handleShare}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-105"
          style={{
            background: "rgba(3,20,10,0.82)",
            border: "1px solid rgba(120,220,160,0.32)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
          }}
        >
          <Share2 size={15} />
        </button>
      </div>
      <BlogShareSheet post={post} open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
