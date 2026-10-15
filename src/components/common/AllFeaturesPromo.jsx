import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Grid } from "react-feather";
import { useAuth } from "../../context/AuthContext";
import {
  getVisibleProfileMenuTrigger,
  hasSeenAllFeaturesPromo,
  markAllFeaturesPromoSeen,
} from "../../utils/allFeaturesPromo";

gsap.registerPlugin(MotionPathPlugin);

const SKIP_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/share/",
  "/share-target",
];

const TILES = ["Profile", "Tasks", "Dashboards", "Team", "Events", "Vault"];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function AllFeaturesPromo() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [phase, setPhase] = useState("idle");
  const cardRef = useRef(null);
  const overlayRef = useRef(null);
  const beamLayerRef = useRef(null);
  const navbarLiftRef = useRef(null);
  const timersRef = useRef([]);
  const timelineRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const skipRoute = SKIP_PREFIXES.some(
    (prefix) =>
      location.pathname === prefix || location.pathname.startsWith(prefix),
  );

  useEffect(() => {
    if (loading || !user || skipRoute) return undefined;
    if (hasSeenAllFeaturesPromo()) return undefined;

    let cancelled = false;
    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      if (!getVisibleProfileMenuTrigger()) return;
      setPhase("show");
    }, 700);
    timersRef.current.push(startTimer);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
    };
  }, [loading, user?._id, skipRoute]);

  useEffect(() => {
    if (phase !== "show") return undefined;

    const navbar = document.querySelector(".NAVBAR_CONTAINER");
    if (navbar) {
      navbarLiftRef.current = {
        zIndex: navbar.style.zIndex,
        pointerEvents: navbar.style.pointerEvents,
      };
      navbar.style.zIndex = "140";
      navbar.style.pointerEvents = "none";
    }

    return () => {
      if (navbar) {
        navbar.style.zIndex = navbarLiftRef.current?.zIndex || "";
        navbar.style.pointerEvents = navbarLiftRef.current?.pointerEvents || "";
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "show") return undefined;

    const reduced = prefersReducedMotion();
    const hold = window.setTimeout(
      () => {
        if (phaseRef.current !== "show") return;
        if (reduced) {
          finishPromo();
          return;
        }
        playBeamThenFinish();
      },
      reduced ? 1600 : 2600,
    );
    timersRef.current.push(hold);

    return () => {
      window.clearTimeout(hold);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  const finishPromo = () => {
    markAllFeaturesPromoSeen();
    const trigger = getVisibleProfileMenuTrigger();
    if (trigger) {
      trigger.style.boxShadow = "";
      trigger.classList.add("all-features-promo-hit");
      window.setTimeout(() => {
        trigger.classList.remove("all-features-promo-hit");
      }, 1600);
    }
    setPhase("idle");
  };

  const playBeamThenFinish = () => {
    const card = cardRef.current;
    const layer = beamLayerRef.current;
    const trigger = getVisibleProfileMenuTrigger();
    if (!card || !layer || !trigger) {
      finishPromo();
      return;
    }

    const layerRect = layer.getBoundingClientRect();
    const from = card.getBoundingClientRect();
    const to = trigger.getBoundingClientRect();
    const start = {
      x: from.left + from.width / 2 - layerRect.left,
      y: from.top + from.height / 2 - layerRect.top,
    };
    const end = {
      x: to.left + to.width / 2 - layerRect.left,
      y: to.top + to.height / 2 - layerRect.top,
    };
    const control = {
      x: (start.x + end.x) / 2 + 24,
      y: Math.min(start.y, end.y) - 90,
    };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute(
      "class",
      "pointer-events-none absolute inset-0 h-full w-full overflow-visible",
    );
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(34,211,238,0.55)");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linecap", "round");
    path.style.filter = "drop-shadow(0 0 8px rgba(34,211,238,0.85))";
    path.style.strokeDasharray = "8 10";
    svg.appendChild(path);

    const beam = document.createElement("div");
    beam.className = "pointer-events-none absolute z-[2] h-3 w-3 rounded-full";
    beam.style.left = "-6px";
    beam.style.top = "-6px";
    beam.style.background =
      "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(52,211,153,0.95) 38%, rgba(34,211,238,0) 72%)";
    beam.style.boxShadow =
      "0 0 18px 6px rgba(52,211,153,0.55), 0 0 36px 10px rgba(34,211,238,0.35)";

    const trail = document.createElement("div");
    trail.className = "pointer-events-none absolute z-[1] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full";
    trail.style.background =
      "radial-gradient(circle, rgba(34,211,238,0.45) 0%, rgba(34,211,238,0) 70%)";

    layer.appendChild(svg);
    layer.appendChild(trail);
    layer.appendChild(beam);

    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    const tl = gsap.timeline({
      onComplete: () => {
        svg.remove();
        beam.remove();
        trail.remove();
        timelineRef.current = null;
        finishPromo();
      },
    });
    timelineRef.current = tl;

    tl.to(
      card,
      { opacity: 0.2, scale: 0.92, duration: 0.35, ease: "power2.inOut" },
      0,
    );
    tl.to(
      overlayRef.current,
      { opacity: 0.35, duration: 0.35, ease: "power2.out" },
      0,
    );
    tl.to(
      path,
      { strokeDashoffset: 0, duration: 0.55, ease: "power2.out" },
      0.05,
    );
    tl.fromTo(
      beam,
      { opacity: 1, scale: 1 },
      {
        opacity: 0.2,
        scale: 1.7,
        duration: 0.95,
        ease: "power2.inOut",
        motionPath: {
          path: [
            { x: start.x, y: start.y },
            { x: control.x, y: control.y },
            { x: end.x, y: end.y },
          ],
          curviness: 1.4,
          autoRotate: false,
        },
      },
      0.08,
    );
    tl.to(
      trail,
      {
        duration: 0.95,
        ease: "power2.inOut",
        motionPath: {
          path: [
            { x: start.x, y: start.y },
            { x: control.x, y: control.y },
            { x: end.x, y: end.y },
          ],
          curviness: 1.4,
        },
      },
      0.08,
    );
    tl.to(
      trigger,
      {
        boxShadow:
          "0 0 0 3px rgba(52,211,153,0.55), 0 0 28px 8px rgba(34,211,238,0.45)",
        duration: 0.28,
        ease: "power2.out",
      },
      0.88,
    );
    tl.to(
      trigger,
      {
        boxShadow: "0 0 0 0 rgba(34,211,238,0)",
        duration: 0.55,
        ease: "power2.inOut",
      },
      1.16,
    );
  };

  const dismiss = () => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    const trigger = getVisibleProfileMenuTrigger();
    if (trigger) trigger.style.boxShadow = "";
    if (beamLayerRef.current) beamLayerRef.current.replaceChildren();
    markAllFeaturesPromoSeen();
    setPhase("idle");
  };

  if (typeof document === "undefined") return null;
  const visible = phase === "show";

  return createPortal(
    <AnimatePresence>
      {visible && (
        <div key="all-features-promo" className="contents">
        <div className="pointer-events-none fixed inset-0 z-[120]">
          <motion.button
            ref={overlayRef}
            type="button"
            aria-label="Dismiss feature highlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={dismiss}
            className="pointer-events-auto absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.86, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute left-1/2 top-[46%] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-emerald-300/25 bg-[#07110e]/92 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            role="dialog"
            aria-labelledby="all-features-promo-title"
          >
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              <span className="mb-3 inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                New
              </span>
              <span className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_32px_rgba(34,211,238,0.35)]">
                <span className="absolute inset-0 animate-ping rounded-2xl bg-cyan-400/10" />
                <Grid className="relative h-7 w-7" />
              </span>
              <h2
                id="all-features-promo-title"
                className="font-montserrat text-2xl font-bold text-white"
              >
                All features
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
                Every tool now lives in one place for quick access — open your
                profile menu anytime.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {TILES.map((label, i) => (
                  <motion.span
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.06, duration: 0.28 }}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-slate-200"
                  >
                    {label}
                  </motion.span>
                ))}
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="mt-5 text-[11px] font-medium text-slate-400 underline-offset-2 transition hover:text-white hover:underline"
              >
                Skip
              </button>
            </div>
          </motion.div>
        </div>
        <div
          ref={beamLayerRef}
          className="pointer-events-none fixed inset-0 z-[150]"
        />
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
