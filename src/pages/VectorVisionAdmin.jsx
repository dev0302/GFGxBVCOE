import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Database, Image as ImageIcon, Loader, Play, Shield, Users } from "react-feather";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { getPendingVectorVisionMembers, getVectorVisionAccess, triggerVectorVisionIngestion } from "../services/api";

function MemberImages({ urls = [] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleUrls = expanded ? urls : urls.slice(0, 4);

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {visibleUrls.map((url, index) => (
          <a key={url} href={url} target="_blank" rel="noreferrer" className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-500/30 bg-[#252536]">
            <img src={url} alt={`Face ${index + 1}`} className="h-full w-full object-cover transition duration-200 group-hover:scale-110" loading="lazy" />
          </a>
        ))}
        {!urls.length && <span className="text-xs text-gray-500">No images available</span>}
      </div>
      {urls.length > 4 && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Show fewer" : `Show all ${urls.length} images`}
        </button>
      )}
    </div>
  );
}

export default function VectorVisionAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = useState([]);
  const [hasAccess, setHasAccess] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [triggering, setTriggering] = useState(false);

  const loadMembers = async () => {
    setLoadingMembers(true);
    setLoadError("");
    try {
      const response = await getPendingVectorVisionMembers();
      setMembers(response.data || []);
    } catch (error) {
      setLoadError(error.message || "Unable to load registrations.");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    const verifyAccess = async () => {
      try {
        const allowed = await getVectorVisionAccess();
        if (!active) return;
        setHasAccess(allowed);
        if (allowed) loadMembers();
      } catch (error) {
        if (!active) return;
        setHasAccess(false);
        setLoadError(error.message || "Unable to verify access.");
        setLoadingMembers(false);
      }
    };

    verifyAccess();
    return () => { active = false; };
  }, [authLoading, user?._id]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerVectorVisionIngestion();
      toast.success("Pipeline awakened! Images are being vectorized and retraining is underway in GitHub Actions.");
    } catch (error) {
      toast.error(error.message || "Unable to trigger the ingestion pipeline.");
    } finally {
      setTriggering(false);
    }
  };

  if (authLoading) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#1e1e2f]"><Loader className="h-8 w-8 animate-spin text-cyan-400" /></div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (hasAccess === false) return <Navigate to="/" replace />;

  if (hasAccess === null) {
    return <div className="flex min-h-full items-center justify-center"><Loader className="h-8 w-8 animate-spin text-cyan-400" /></div>;
  }

  return (
    <div className="min-h-full bg-[#1e1e2f] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#252536] to-[#1e1e2f] p-6 shadow-xl sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300"><Shield className="h-3.5 w-3.5" /> Restricted access</div>
            <h1 className="text-2xl font-bold tracking-tight text-richblack-25 sm:text-3xl">VectorVision Core Administration Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">Review pending face enrollments and start the secure vector-processing workflow.</p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 lg:w-auto">
            <Users className="h-5 w-5 shrink-0 text-cyan-300" />
            <div><p className="text-2xl font-bold tabular-nums text-richblack-25">{loadingMembers ? "—" : members.length}</p><p className="text-xs font-medium text-cyan-200">Pending Registrations</p></div>
          </div>
        </header>

        {loadError ? (
          <section className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-center shadow-lg"><Shield className="mx-auto h-7 w-7 text-red-300" /><h2 className="mt-3 text-lg font-semibold text-richblack-25">Access unavailable</h2><p className="mx-auto mt-2 max-w-xl text-sm text-red-200/90">{loadError}</p></section>
        ) : (
          <>
            <section className="mb-7 flex flex-col gap-4 rounded-2xl border border-gray-500/20 bg-[#252536]/75 p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3"><Database className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><div><h2 className="font-semibold text-richblack-25">Ready for data ingestion</h2><p className="mt-1 text-sm text-gray-400">This dispatches the configured GitHub Actions workflow. Member records stay pending until processing completes.</p></div></div>
              <button type="button" onClick={handleTrigger} disabled={triggering || loadingMembers} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-richblack-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
                {triggering ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}{triggering ? "Awakening pipeline…" : "🚀 Trigger MLOps Data Ingestion Pipeline"}
              </button>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-500/20 bg-[#252536]/70 shadow-xl">
              <div className="flex items-center gap-3 border-b border-gray-500/20 px-5 py-4"><ImageIcon className="h-5 w-5 text-cyan-300" /><div><h2 className="font-semibold text-richblack-25">New member enrollments</h2><p className="text-xs text-gray-500">Cloudinary thumbnails open at full resolution in a new tab.</p></div></div>
              {loadingMembers ? <div className="flex min-h-48 items-center justify-center"><Loader className="h-7 w-7 animate-spin text-cyan-400" /></div> : members.length === 0 ? <div className="px-6 py-16 text-center text-sm text-gray-400">No registrations are waiting for vector processing.</div> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-[#1e1e2f]/70 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3 font-semibold">Member</th><th className="px-5 py-3 font-semibold">Email</th><th className="px-5 py-3 font-semibold">Roll number</th><th className="px-5 py-3 font-semibold">Face images</th></tr></thead><tbody className="divide-y divide-gray-500/15">{members.map((member) => <tr key={member._id} className="align-top transition hover:bg-cyan-400/[0.03]"><td className="px-5 py-4 font-medium text-richblack-25">{member.name}</td><td className="px-5 py-4 text-sm text-gray-300">{member.email}</td><td className="px-5 py-4 font-mono text-sm text-cyan-200">{member.rollNumber}</td><td className="px-5 py-4"><MemberImages urls={member.imageUrls} /></td></tr>)}</tbody></table></div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
