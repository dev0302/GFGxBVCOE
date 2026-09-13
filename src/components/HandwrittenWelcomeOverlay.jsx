import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { buildHandwritingWord } from "./handwritingFont";

// The greeting is vector artwork, not text: every letter is an open,
// single-stroke path (a real cursive skeleton, not a rough approximation)
// baked from a pen-plotter script font. Each path is drawn live with
// stroke-dasharray/dashoffset, exactly like a nib tracing paper — never an
// opacity fade, typewriter, or text reveal.
const TRAIL_COUNT = 6;
const SPEED = 10500; // rapid signature-like flourish, still eased through curves
const MIN_STROKE_DURATION = 0.06;
const MAX_STROKE_DURATION = 0.18;
const INK = "#f5f5f7";
const PAPER = "#090909";

export default function HandwrittenWelcomeOverlay({ firstName, greeting = "Hello", onComplete }) {
  const overlayRef = useRef(null);
  const penRef = useRef(null);
  const trailRefs = useRef([]);
  const uid = useRef(`hw-${Math.random().toString(36).slice(2, 9)}`);

  // pathsRef is rebuilt every render so it always matches the current
  // `strokes` array (its length changes with the name), then repopulated by
  // the callback refs below once React commits the new list of <path>s.
  const pathsRef = useRef([]);
  pathsRef.current = [];

  const text = firstName ? `${greeting}, ${firstName}` : greeting;
  const { strokes, viewBox } = useMemo(() => buildHandwritingWord(text), [text]);

  useLayoutEffect(() => {
    const paths = pathsRef.current.filter(Boolean);
    if (!paths.length) {
      onComplete?.();
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lengths = paths.map((path) => path.getTotalLength());

    paths.forEach((path, i) => {
      gsap.set(path, { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] });
    });
    gsap.set(penRef.current, { opacity: 0 });
    gsap.set(trailRefs.current.filter(Boolean), { opacity: 0 });

    const timeline = gsap.timeline({ onComplete: () => onComplete?.() });

    if (reducedMotion) {
      timeline
        .set(paths, { strokeDashoffset: 0 })
        .to(overlayRef.current, { opacity: 0, duration: 0.3, delay: 0.9, ease: "power1.inOut" });
      return () => timeline.kill();
    }

    // Small rolling history of recent pen positions for a faint ink trail —
    // deliberately subtle: short, fast-fading, and never mimicking a second
    // stroke of its own.
    const trailHistory = Array.from({ length: TRAIL_COUNT }, () => null);
    const updateTrail = (x, y) => {
      trailHistory.pop();
      trailHistory.unshift({ x, y });
      trailHistory.forEach((point, i) => {
        const dot = trailRefs.current[i];
        if (!dot) return;
        if (!point) {
          gsap.set(dot, { opacity: 0 });
          return;
        }
        gsap.set(dot, { x: point.x, y: point.y, opacity: 0.14 * (1 - i / TRAIL_COUNT) });
      });
    };

    let t = 0.12;
    timeline.to(penRef.current, { opacity: 0.7, duration: 0.16 }, t);

    paths.forEach((path, i) => {
      const length = lengths[i];
      // Each stroke eases in/out (sine.inOut): natural deceleration into
      // transitions and curves at the ends of a stroke, with more speed
      // through the middle — the closest a single easing curve gets to how
      // a hand actually varies pace across a letter.
      const duration = gsap.utils.clamp(MIN_STROKE_DURATION, MAX_STROKE_DURATION, length / SPEED);

      if (i > 0) {
        // A short pause between letters reads as the pen lifting; a longer
        // one at a word boundary reads as moving to the next word.
        t += strokes[i].isWordStart ? 0.04 : 0.01;
      }

      const proxy = { d: 0 };
      timeline.to(
        proxy,
        {
          d: length,
          duration,
          ease: "sine.inOut",
          onUpdate: () => {
            const point = path.getPointAtLength(proxy.d);
            gsap.set(penRef.current, { x: point.x, y: point.y });
            updateTrail(point.x, point.y);
          },
        },
        t
      );
      timeline.to(path, { strokeDashoffset: 0, duration, ease: "sine.inOut" }, t);
      t += duration;
    });

    timeline.to([penRef.current, ...trailRefs.current.filter(Boolean)], { opacity: 0, duration: 0.2 }, t + 0.05);
    timeline.to(overlayRef.current, { opacity: 0, duration: 0.22, delay: 0.24, ease: "power2.inOut" }, t + 0.08);

    return () => timeline.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[110] grid place-items-center px-6"
      style={{ backgroundColor: PAPER, color: INK }}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="w-full max-w-[640px]">
        <svg viewBox={viewBox} className="mx-auto block w-full overflow-visible" aria-hidden="true">
          <defs>
            <filter id={`${uid.current}-glow`} x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          <g fill="none" stroke={INK} strokeWidth="19" strokeLinecap="round" strokeLinejoin="round">
            {strokes.map((stroke, i) => (
              <path
                key={i}
                ref={(node) => {
                  pathsRef.current[i] = node;
                }}
                d={stroke.d}
              />
            ))}
          </g>

          {/* Faint trailing ink, faded soft-focus circles just behind the nib */}
          {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
            <circle
              key={i}
              ref={(node) => {
                trailRefs.current[i] = node;
              }}
              r={22 - i * 2}
              fill={INK}
              opacity={0}
              filter={`url(#${uid.current}-glow)`}
            />
          ))}

          {/* Pen tip */}
          <circle ref={penRef} r="15" fill={INK} opacity={0} />
        </svg>
      </div>
    </div>
  );
}
