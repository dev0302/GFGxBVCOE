import { useRef, useState } from "react";
import { Eye, Upload, X, Users, FileText } from "react-feather";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";

const HF_SPACE = "https://soumyasuryan-facerecognition.hf.space";
const API = `${HF_SPACE}/gradio_api`;
const MIN_CONFIDENCE = 15;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

function parseRecognizedMembers(rawText, minConfidence = MIN_CONFIDENCE) {
  if (!rawText || typeof rawText !== "string") return [];

  const faceRegex = /Thinks this is '([^']+)' with ([\d.]+)% confidence/gi;
  const bestByName = new Map();
  let match;

  while ((match = faceRegex.exec(rawText)) !== null) {
    const name = match[1].trim();
    const confidence = parseFloat(match[2]);
    if (!name || /^unknown$/i.test(name) || Number.isNaN(confidence)) continue;
    if (confidence <= minConfidence) continue;

    const prev = bestByName.get(name);
    if (prev == null || confidence > prev) bestByName.set(name, confidence);
  }

  return Array.from(bestByName.entries())
    .map(([name, confidence]) => ({ name, confidence }))
    .sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
}

function parseSsePayload(raw) {
  const events = [];
  let eventType = "message";
  let dataLines = [];

  const flush = () => {
    if (!dataLines.length) return;
    const data = dataLines.join("\n");
    events.push({ event: eventType, data });
    eventType = "message";
    dataLines = [];
  };

  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    } else if (line === "") {
      flush();
    }
  }
  flush();
  return events;
}

async function uploadImageToGradio(file) {
  const formData = new FormData();
  formData.append("files", file);

  const res = await fetch(`${API}/upload`, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error(
      res.status === 503
        ? "Model space is waking up. Please try again in a minute."
        : `Upload failed (${res.status})`
    );
  }

  const data = await res.json();
  const path = Array.isArray(data) ? data[0] : data?.path || data;
  if (!path || typeof path !== "string") throw new Error("Invalid upload response from model");
  return path;
}

async function callRecognize(filePath, file) {
  const imagePayload = {
    path: filePath,
    meta: { _type: "gradio.FileData" },
    orig_name: file.name,
    mime_type: file.type || "image/jpeg",
  };

  // Gradio 6 named (v2) endpoint first, then legacy data array
  let callRes = await fetch(`${API}/call/v2/recognize_people_in_group`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imagePayload }),
  });

  if (callRes.status === 404) {
    callRes = await fetch(`${API}/call/recognize_people_in_group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [imagePayload] }),
    });
  }

  if (!callRes.ok) {
    throw new Error(
      callRes.status === 503
        ? "Model space is waking up. Please try again in a minute."
        : `Recognition request failed (${callRes.status})`
    );
  }

  const callJson = await callRes.json();
  const eventId = callJson?.event_id;
  if (!eventId) throw new Error("No event id returned from model");

  const streamRes = await fetch(`${API}/call/recognize_people_in_group/${eventId}`);
  if (!streamRes.ok) throw new Error(`Failed to read recognition result (${streamRes.status})`);

  const raw = await streamRes.text();
  const events = parseSsePayload(raw);

  const errorEvent = events.find((e) => e.event === "error");
  if (errorEvent) {
    let message = errorEvent.data;
    try {
      const parsed = JSON.parse(errorEvent.data);
      message = parsed?.error || parsed?.message || errorEvent.data;
    } catch (_) {}
    throw new Error(typeof message === "string" ? message : "Recognition failed");
  }

  const completeEvent = [...events].reverse().find((e) => e.event === "complete");
  if (!completeEvent) throw new Error("Model did not return a complete result");

  const payload = JSON.parse(completeEvent.data);
  const text = Array.isArray(payload) ? payload[0] : payload;
  if (typeof text !== "string") throw new Error("Unexpected recognition result format");
  return text;
}

export default function VectorVision() {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawResult, setRawResult] = useState("");
  const [members, setMembers] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setRawResult("");
    setMembers([]);
    setShowLogs(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onPickFile = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
    setRawResult("");
    setMembers([]);
    setShowLogs(false);
  };

  const onRecognize = async () => {
    if (!selectedFile) {
      toast.error("Upload a group photo first");
      return;
    }

    setLoading(true);
    setRawResult("");
    setMembers([]);

    try {
      const path = await uploadImageToGradio(selectedFile);
      const text = await callRecognize(path, selectedFile);
      const parsed = parseRecognizedMembers(text);

      setRawResult(text);
      setMembers(parsed);

      if (parsed.length) {
        toast.success(`Found ${parsed.length} member${parsed.length === 1 ? "" : "s"} above ${MIN_CONFIDENCE}% confidence`);
      } else {
        toast.message("No members matched above the confidence threshold");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Face recognition failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-4xl py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-richblack-25">Vector Vision</h1>
          <p className="mt-2 text-gray-400 text-sm max-w-2xl">
            Upload a group photo to detect society members via face recognition.
          </p>
        </div>

        <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="👁️">Upload group photo</SectionTitle>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onPickFile(e.dataTransfer.files?.[0]);
            }}
            className={`relative rounded-xl border-2 border-dashed transition-colors ${
              dragOver
                ? "border-cyan-400 bg-cyan-500/10"
                : "border-gray-500/30 bg-[#252536]/60 hover:border-cyan-500/40"
            }`}
          >
            {previewUrl ? (
              <div className="relative p-4">
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="mx-auto max-h-80 w-full rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={loading}
                  className="absolute right-6 top-6 rounded-lg bg-[#1e1e2f]/90 p-2 text-gray-300 hover:text-white border border-gray-500/30 disabled:opacity-50"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="mt-3 text-center text-xs text-gray-500 truncate">{selectedFile?.name}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 px-6 py-14 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
                  <Upload className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-richblack-25">Drop an image here, or click to browse</span>
                <span className="text-xs text-gray-500">JPG, PNG, or WebP</span>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!previewUrl && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 font-medium text-sm"
              >
                <Upload className="h-4 w-4" />
                Choose image
              </button>
            )}
            <button
              type="button"
              onClick={onRecognize}
              disabled={loading || !selectedFile}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium text-sm disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              {loading ? "Recognizing…" : "Recognize faces"}
            </button>
          </div>

          {loading && (
            <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
              <p className="text-sm text-cyan-300">Running face recognition…</p>
              <p className="mt-1 text-xs text-gray-500">
                First request may take longer if the space is cold-starting.
              </p>
            </div>
          )}
        </section>

        {(members.length > 0 || rawResult) && (
          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="👥">Tagged members</SectionTitle>
            <p className="text-xs text-gray-400 mb-4">
              Vector vision may make mistakes.
            </p>

            {members.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {members.map(({ name, confidence }) => (
                  <li
                    key={name}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2"
                  >
                    <Users className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="text-sm font-medium text-richblack-25">{name}</span>
                    <span className="text-xs text-cyan-400/80 tabular-nums">{confidence.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No faces cleared the {MIN_CONFIDENCE}% confidence filter.</p>
            )}

            {rawResult && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowLogs((v) => !v)}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition"
                >
                  <FileText className="h-4 w-4" />
                  {showLogs ? "Hide detailed logs" : "Show detailed logs"}
                </button>
                {showLogs && (
                  <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-[#252536] border border-gray-500/20 p-4 text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {rawResult}
                  </pre>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
