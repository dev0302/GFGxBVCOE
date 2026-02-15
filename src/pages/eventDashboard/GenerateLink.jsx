import { useState } from "react";
import { createUploadLink, suspendUploadLink } from "../../services/api";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";

const STORAGE_KEY = "gfg_upload_event_link";

export default function GenerateLink() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.token && d?.expiresAt && new Date(d.expiresAt) > new Date()) return d;
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}
    return null;
  });
  const [disclosed, setDisclosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suspending, setSuspending] = useState(false);

  const onGenerate = () => {
    setLoading(true);
    createUploadLink()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data)); } catch (_) {}
          setDisclosed(false);
        }
        toast.success("Link generated. Valid for 12 hours.");
      })
      .catch((e) => toast.error(e.message || "Failed to generate link"))
      .finally(() => setLoading(false));
  };

  const onCopy = () => {
    if (!data?.token) return;
    const url = `${window.location.origin}/uploadevent/link/${data.token}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied")).catch(() => toast.error("Could not copy"));
  };

  const onTurnOff = () => {
    if (!data?.token) return;
    setSuspending(true);
    suspendUploadLink(data.token)
      .then(() => {
        setData(null);
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        setDisclosed(false);
        toast.success("Link turned off. It can no longer be used.");
      })
      .catch((e) => toast.error(e.message || "Failed to turn off link"))
      .finally(() => setSuspending(false));
  };

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-3xl py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Generate upload event link</h1>
          <p className="mt-2 text-gray-400 text-sm">Create a link that anyone can use to open the upload form without logging in. Expires in 12 hours.</p>
        </div>
        <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="🔗">Generate link</SectionTitle>
          <p className="text-sm text-gray-400 mb-4">Link is saved until it expires or you generate a new one.</p>
          <button type="button" onClick={onGenerate} disabled={loading} className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium disabled:opacity-50">
            {loading ? "Generating…" : "Generate link"}
          </button>
          {data?.token && (
            <div className="mt-4 p-4 rounded-xl bg-[#252536] border border-gray-500/20">
              <p className="text-xs text-gray-400 mb-2">Share this link (expires in 12 hours):</p>
              <p className="text-sm font-mono break-all mb-2">
                {disclosed && typeof window !== "undefined" ? <span className="text-cyan-300">{window.location.origin}/uploadevent/link/{data.token}</span> : <span className="text-gray-500">••••••••/uploadevent/link/••••••••</span>}
              </p>
              <p className="text-xs text-gray-500 mb-3">Expires: {data.expiresAt ? new Date(data.expiresAt).toLocaleString() : ""}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setDisclosed((p) => !p)} className="px-3 py-1.5 rounded-lg bg-gray-500/30 text-gray-300 hover:bg-gray-500/50 text-sm font-medium">{disclosed ? "Hide link" : "Disclose link"}</button>
                <button type="button" onClick={onCopy} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium">Copy link</button>
                <button type="button" onClick={onTurnOff} disabled={suspending} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50">Turn off link</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
