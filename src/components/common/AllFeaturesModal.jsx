import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clipboard,
  Code,
  Database,
  Edit3,
  Eye,
  Film,
  Folder,
  Globe,
  Grid,
  HelpCircle,
  Image,
  Layout,
  Link2,
  List,
  Lock,
  Mail,
  Settings,
  Sliders,
  TrendingUp,
  Upload,
  User,
  UserCheck,
  Users,
  X,
} from "react-feather";
import { getVectorVisionAccess } from "../../services/api";
import { buildAllFeatures, FEATURE_CATEGORIES } from "../../utils/allFeatures";
import { markAllFeaturesPromoSeen } from "../../utils/allFeaturesPromo";

const ICONS = {
  user: User,
  settings: Settings,
  image: Image,
  clipboard: Clipboard,
  users: Users,
  sliders: Sliders,
  trending: TrendingUp,
  calendar: Calendar,
  upload: Upload,
  list: List,
  folder: Folder,
  link: Link2,
  grid: Grid,
  eye: Eye,
  "user-check": UserCheck,
  database: Database,
  layout: Layout,
  book: BookOpen,
  edit: Edit3,
  check: CheckCircle,
  code: Code,
  film: Film,
  help: HelpCircle,
  globe: Globe,
  mail: Mail,
};

const overlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const list = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.02, delayChildren: 0.02 },
  },
};

const tile = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function AllFeaturesModal({ open, onClose, user, tenureEnding }) {
  const navigate = useNavigate();
  const [hasVectorVisionAccess, setHasVectorVisionAccess] = useState(false);
  const [hint, setHint] = useState(null);
  const [activeCategory, setActiveCategory] = useState(FEATURE_CATEGORIES[0]);

  useEffect(() => {
    if (open) markAllFeaturesPromoSeen();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    getVectorVisionAccess()
      .then((allowed) => {
        if (active) setHasVectorVisionAccess(allowed);
      })
      .catch(() => {
        if (active) setHasVectorVisionAccess(false);
      });
    return () => {
      active = false;
    };
  }, [open, user?._id]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const features = useMemo(
    () => buildAllFeatures(user, { hasVectorVisionAccess, tenureEnding }),
    [user, hasVectorVisionAccess, tenureEnding],
  );

  const grouped = useMemo(
    () =>
      FEATURE_CATEGORIES.map((category) => ({
        category,
        items: features.filter((f) => f.category === category),
      })).filter((g) => g.items.length),
    [features],
  );

  useEffect(() => {
    if (!open) return;
    setHint(null);
    setActiveCategory((current) =>
      grouped.some((g) => g.category === current)
        ? current
        : grouped[0]?.category || FEATURE_CATEGORIES[0],
    );
  }, [open, grouped]);

  const activeGroup =
    grouped.find((g) => g.category === activeCategory) || grouped[0];

  const allowedCount = features.filter((f) => f.allowed).length;

  const openFeature = (feature) => {
    if (!feature.allowed) {
      const reason =
        feature.lockedReason ||
        "Not allowed for your role. A higher role is required.";
      setHint({ id: feature.id, reason });
      toast.error(reason);
      return;
    }
    onClose?.();
    navigate(feature.path);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="all-features-backdrop"
            type="button"
            aria-label="Close all features"
            variants={overlay}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[360] bg-black/55 backdrop-blur-[2px]"
            data-all-features-modal
            onClick={onClose}
          />
          <div
            className="pointer-events-none fixed inset-0 z-[361] flex items-center justify-center p-3 sm:p-6"
            data-all-features-modal
          >
            <motion.div
              key="all-features-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="all-features-title"
              variants={panel}
              initial="hidden"
              animate="show"
              exit="exit"
              onMouseDown={(e) => e.stopPropagation()}
              className="pointer-events-auto relative flex max-h-[min(86vh,720px)] w-full max-w-[40rem] flex-col overflow-hidden rounded-2xl bg-[#141622] shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.08] lg:min-h-[min(36rem,80vh)] lg:max-h-[min(90vh,840px)]"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative z-[1] flex items-start justify-between gap-3 px-5 pb-3 pt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
                    Shortcuts
                  </p>
                  <h2
                    id="all-features-title"
                    className="mt-0.5 font-montserrat text-lg font-bold text-richblack-25"
                  >
                    All features
                  </h2>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {allowedCount} of {features.length} available for your role
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-gray-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                role="tablist"
                aria-label="Feature categories"
                className="relative z-[1] mx-4 flex gap-0.5 overflow-x-auto rounded-xl bg-white/[0.04] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {grouped.map((group) => {
                  const selected = group.category === activeGroup?.category;
                  return (
                    <button
                      key={group.category}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => {
                        setHint(null);
                        setActiveCategory(group.category);
                      }}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
                        selected
                          ? "bg-white/[0.1] text-white shadow-none"
                          : "bg-transparent text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
                      }`}
                    >
                      {group.category}
                    </button>
                  );
                })}
              </div>

              <div
                data-lenis-prevent="true"
                className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
              >
                {activeGroup && (
                  <motion.div
                    key={activeGroup.category}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                    variants={list}
                    initial="hidden"
                    animate="show"
                    role="tabpanel"
                  >
                    {activeGroup.items.map((feature) => {
                      const Icon = ICONS[feature.icon] || Grid;
                      const locked = !feature.allowed;
                      const showHint = hint?.id === feature.id;
                      return (
                        <motion.button
                          key={feature.id}
                          type="button"
                          variants={tile}
                          onClick={() => openFeature(feature)}
                          onMouseEnter={() =>
                            locked &&
                            setHint({
                              id: feature.id,
                              reason:
                                feature.lockedReason ||
                                "Not allowed for your role.",
                            })
                          }
                          onMouseLeave={() =>
                            setHint((current) =>
                              current?.id === feature.id ? null : current,
                            )
                          }
                          className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left ring-1 ring-inset transition-colors duration-200 ${
                            locked
                              ? "bg-white/[0.02] text-gray-500 ring-white/[0.04]"
                              : "bg-white/[0.035] text-gray-100 ring-white/[0.06] hover:bg-cyan-500/[0.08] hover:ring-cyan-400/25 hover:text-cyan-50"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              locked
                                ? "bg-white/[0.04] text-gray-600"
                                : "bg-cyan-500/10 text-cyan-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-xs font-semibold ${
                                locked ? "text-gray-500" : "text-gray-100"
                              }`}
                            >
                              {feature.name}
                            </span>
                            <span
                              className={`block truncate text-[10px] ${
                                locked ? "text-gray-600" : "text-gray-500"
                              }`}
                            >
                              {locked ? "Restricted" : "Open"}
                            </span>
                          </span>
                          {locked && (
                            <Lock className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                          )}
                          {locked && showHint && (
                            <span className="pointer-events-none absolute inset-x-2 bottom-full z-20 mb-1 rounded-lg bg-[#1b1724] px-2 py-1.5 text-[10px] leading-snug text-amber-100 shadow-lg ring-1 ring-inset ring-amber-400/20">
                              {feature.lockedReason}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
