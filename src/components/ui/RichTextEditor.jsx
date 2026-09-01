import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Node, mergeAttributes } from "@tiptap/core";
import { useEffect, useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadBlogInlineImage } from "../../services/blog_api";

const lowlight = createLowlight(common);

const BlogImage = Node.create({
  name: "blogImage",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      crop: { default: "original" },
      rounded: { default: true },
    };
  },
  addCommands() {
    return {
      setBlogImage:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: attributes }),
    };
  },
  parseHTML() {
    return [{
      tag: "figure[data-blog-image]",
      getAttrs: (element) => {
        const image = element.querySelector("img");
        return {
          src: image?.getAttribute("src"),
          alt: image?.getAttribute("alt") || "",
          crop: element.getAttribute("data-crop") || "original",
          rounded: element.getAttribute("data-rounded") !== "false",
        };
      },
    }];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, crop, rounded } = HTMLAttributes;
    return [
      "figure",
      mergeAttributes({
        "data-blog-image": "true",
        "data-crop": crop,
        "data-rounded": String(rounded),
        class: `blog-image blog-image--${crop}${rounded ? " is-rounded" : ""}`,
      }),
      ["img", { src, alt: alt || "Blog image" }],
    ];
  },
});

// ── Toolbar button helper ─────────────────────────────────────────────────────
const ToolBtn = ({ onClick, active, title, children, disabled = false }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    title={title}
    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all duration-150 disabled:opacity-30"
    style={
      active
        ? { background: "rgba(34,212,136,0.18)", color: "#34d488", border: "1px solid rgba(34,212,136,0.35)" }
        : { color: "#94a3b8", border: "1px solid transparent" }
    }
  >
    {children}
  </button>
);

const Divider = () => (
  <div className="mx-1 h-5 w-px self-center" style={{ background: "rgba(255,255,255,0.1)" }} />
);

// ── Main component ────────────────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange, placeholder = "Start writing here…" }) {
  const imageInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by CodeBlockLowlight
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      CodeBlockLowlight.configure({ lowlight }),
      BlogImage,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-editor-content focus:outline-none",
      },
    },
  });

  // Sync external value changes (e.g. form reset) without cursor jump
  useEffect(() => {
    if (!editor) return;
    if (value === "" && editor.getHTML() !== "<p></p>") {
      editor.commands.clearContent(true);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const uploadImage = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      window.alert("Inline images must be smaller than 8 MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const response = await uploadBlogInlineImage(file);
      editor.chain().focus().setBlogImage({
        src: response.image.url,
        alt: response.image.alt || "",
        crop: "original",
        rounded: true,
      }).run();
    } catch (error) {
      window.alert(error.message || "Could not upload the image.");
    } finally {
      setUploadingImage(false);
    }
  }, [editor]);

  const imageAttrs = editor?.getAttributes("blogImage") || {};
  const imageSelected = editor?.isActive("blogImage");

  if (!editor) return null;

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: "1px solid rgba(255,255,255,0.1)", background: "#0b1013" }}
    >
      {/* ── TOOLBAR ── */}
      <div
        className="flex flex-wrap gap-0.5 border-b px-2 py-2"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0d1418" }}
      >
        {/* Headings */}
        <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolBtn>
        <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolBtn>
        <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolBtn>

        <Divider />

        {/* Inline marks */}
        <ToolBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolBtn>
        <ToolBtn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <span style={{ background: "#facc15", color: "#000", borderRadius: "2px", padding: "0 2px", fontSize: "11px", fontWeight: 700 }}>A</span>
        </ToolBtn>
        <ToolBtn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <span style={{ fontFamily: "monospace", fontSize: "13px" }}>`</span>
        </ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn title="Align left"   active={editor.isActive({ textAlign: "left" })}    onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <span style={{ fontSize: "13px", letterSpacing: "-1px" }}>⬅</span>
        </ToolBtn>
        <ToolBtn title="Align center" active={editor.isActive({ textAlign: "center" })}  onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <span style={{ fontSize: "13px" }}>⬌</span>
        </ToolBtn>
        <ToolBtn title="Align right"  active={editor.isActive({ textAlign: "right" })}   onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <span style={{ fontSize: "13px", letterSpacing: "-1px" }}>➡</span>
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <span style={{ fontSize: "15px" }}>≡</span>
        </ToolBtn>
        <ToolBtn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <span style={{ fontSize: "12px" }}>1.</span>
        </ToolBtn>

        <Divider />

        {/* Block */}
        <ToolBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <span style={{ fontSize: "16px" }}>"</span>
        </ToolBtn>
        <ToolBtn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{`</>`}</span>
        </ToolBtn>
        <ToolBtn title="Link" active={editor.isActive("link")} onClick={setLink}>
          <span style={{ fontSize: "13px" }}>🔗</span>
        </ToolBtn>
        <ToolBtn title="Insert image" active={false} disabled={uploadingImage} onClick={() => imageInputRef.current?.click()}>
          {uploadingImage ? <Loader2 className="animate-spin" size={15} /> : <ImagePlus size={16} />}
        </ToolBtn>
        <ToolBtn title="Horizontal rule" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <span style={{ fontSize: "13px" }}>—</span>
        </ToolBtn>

        <Divider />

        {/* Undo / Redo */}
        <ToolBtn title="Undo" active={false} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>↩</ToolBtn>
        <ToolBtn title="Redo" active={false} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>↪</ToolBtn>

        {/* Clear formatting */}
        <ToolBtn title="Clear formatting" active={false} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <span style={{ fontSize: "13px", textDecoration: "line-through" }}>T</span>
        </ToolBtn>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" onChange={uploadImage} className="sr-only" />

      {imageSelected && (
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0b1013" }}>
          <span className="text-slate-400">Selected image</span>
          <label className="flex items-center gap-2 text-slate-300">
            Crop
            <select
              value={imageAttrs.crop || "original"}
              onChange={(e) => editor.chain().focus().updateAttributes("blogImage", { crop: e.target.value }).run()}
              className="rounded border border-white/15 bg-[#121a1f] px-2 py-1 text-slate-200 outline-none"
            >
              <option value="original">Original</option>
              <option value="landscape">Landscape</option>
              <option value="square">Square</option>
              <option value="portrait">Portrait</option>
            </select>
          </label>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().updateAttributes("blogImage", { rounded: !imageAttrs.rounded }).run(); }} className="rounded border border-white/15 px-2 py-1 text-slate-200">
            {imageAttrs.rounded ? "Rounded border: on" : "Rounded border: off"}
          </button>
          <button type="button" title="Remove image" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteSelection().run(); }} className="ml-auto rounded border border-rose-300/30 p-1 text-rose-300"><Trash2 size={14} /></button>
        </div>
      )}

      {/* ── EDITOR AREA ── */}
      <EditorContent
        editor={editor}
        className="rich-editor-wrapper"
        style={{ minHeight: "360px", maxHeight: "600px", overflowY: "auto", padding: "18px 20px" }}
      />
    </div>
  );
}
