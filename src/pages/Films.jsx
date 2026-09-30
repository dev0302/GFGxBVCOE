import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clapperboard, Play, RotateCw, X } from "lucide-react";
import Footer from "../components/common/Footer";
import { getFilms } from "../services/filmsApi";

const displayTitle = (filename = "") =>
  filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Untitled film";

const formatDuration = (value) => {
  const seconds = Math.floor(Number(value) / 1000);
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

function FilmCard({ film, onPlay, index }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const duration = formatDuration(film.duration);

  return (
    <motion.button
      type="button"
      onClick={() => onPlay(film)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.045, 0.3) }}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101a17] text-left shadow-[0_14px_42px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:shadow-[0_22px_55px_rgba(0,0,0,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      aria-label={`Play ${displayTitle(film.name)}`}
    >
      <div className="relative aspect-video overflow-hidden bg-[#0b110f]">
        {!thumbnailFailed ? (
          <img
            src={film.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-950 via-[#10201a] to-[#171629]">
            <Clapperboard className="h-12 w-12 text-emerald-200/45" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-black/35 text-white shadow-lg backdrop-blur-sm transition duration-300 group-hover:scale-110 group-hover:border-emerald-200/70 group-hover:bg-emerald-500/75">
            <Play className="ml-1 h-6 w-6 fill-current" />
          </span>
        </span>
        {duration && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">
            {duration}
          </span>
        )}
      </div>
      <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <h2 className="line-clamp-2 text-sm font-bold leading-5 text-white sm:text-base">
          {displayTitle(film.name)}
        </h2>
        <ArrowRight className="h-4 w-4 shrink-0 text-emerald-300/65 transition group-hover:translate-x-1 group-hover:text-emerald-200" />
      </div>
    </motion.button>
  );
}

function FilmSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101a17]">
      <div className="aspect-video animate-pulse bg-white/[0.06]" />
      <div className="space-y-2 px-5 py-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.08]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

export default function Films() {
  const [films, setFilms] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedFilm, setSelectedFilm] = useState(null);

  const loadPage = async (pageToken, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const result = await getFilms({ pageToken });
      setFilms((current) => (append ? [...current, ...result.files] : result.files));
      setNextPageToken(result.nextPageToken);
    } catch (fetchError) {
      setError(fetchError.message || "We couldn't load the films right now.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!selectedFilm) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedFilm(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedFilm]);

  return (
    <>
      <main className="min-h-screen overflow-hidden bg-[#07100d] pt-24 text-white sm:pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-16 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.16),transparent_65%)]" />
        <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200 sm:text-sm">
              <Clapperboard className="h-4 w-4" />
              GFG AI Filmathon 2026
            </div>
            <h1 className="font-audiowide text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Films <span className="text-emerald-300">& Videos</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              Discover the stories, ideas, and films created for the GFG AI Filmathon.
              Pick a film to watch it right here.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => <FilmSkeleton key={index} />)}
            </div>
          ) : error ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-rose-300/15 bg-rose-300/[0.05] px-6 py-10 text-center">
              <Clapperboard className="mx-auto mb-4 h-9 w-9 text-rose-200/70" />
              <h2 className="text-lg font-bold text-white">Films are taking a break</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{error}</p>
              <button
                type="button"
                onClick={() => loadPage()}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-emerald-200/40 hover:bg-emerald-300/10"
              >
                <RotateCw className="h-4 w-4" /> Try again
              </button>
            </div>
          ) : films.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <Clapperboard className="mx-auto mb-4 h-10 w-10 text-emerald-200/55" />
              <h2 className="text-lg font-bold">No films yet</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Filmathon videos will appear here as soon as they’re available in the Drive folder.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">{films.length} {films.length === 1 ? "film" : "films"}</p>
                <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {films.map((film, index) => (
                  <FilmCard key={film.id} film={film} index={index} onPlay={setSelectedFilm} />
                ))}
              </div>
              {nextPageToken && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => loadPage(nextPageToken, true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/20 bg-emerald-300/[0.07] px-5 py-3 text-sm font-bold text-emerald-100 transition hover:border-emerald-200/40 hover:bg-emerald-300/15 disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Load more films"}
                    {!loadingMore && <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />

      <AnimatePresence>
        {selectedFilm && (
          <motion.div
            className="fixed inset-0 z-[250] flex items-center justify-center overflow-y-auto bg-black/95 p-0 backdrop-blur-md sm:bg-black/85 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedFilm(null);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Playing ${displayTitle(selectedFilm.name)}`}
              className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden border-0 border-white/15 bg-[#101713] shadow-[0_30px_100px_rgba(0,0,0,0.6)] sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-5xl sm:rounded-2xl sm:border"
              initial={{ y: 20, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
                <h2 className="truncate text-sm font-bold text-white sm:text-base">{displayTitle(selectedFilm.name)}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedFilm(null)}
                  aria-label="Close video player"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative min-h-0 w-full flex-1 bg-black sm:aspect-video sm:max-h-[calc(100dvh-6rem)] sm:flex-none">
                <iframe
                  key={selectedFilm.id}
                  src={`https://drive.google.com/file/d/${encodeURIComponent(selectedFilm.id)}/preview`}
                  title={displayTitle(selectedFilm.name)}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
