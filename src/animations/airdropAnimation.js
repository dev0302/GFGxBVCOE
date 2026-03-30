import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

let globalRunner = null;

export function registerAirdropRunner(runner) {
  globalRunner = runner;
  return () => {
    if (globalRunner === runner) globalRunner = null;
  };
}

export function triggerAirdropAnimation(payload) {
  if (typeof globalRunner !== "function") return Promise.resolve();
  return globalRunner(payload || {});
}

export function animateImageTransfer({
  layerEl,
  fromEl,
  toEl,
  fromAvatarRect,
  toAvatarRect,
  imageUrl,
}) {
  if (!layerEl) return Promise.resolve();
  const fromRect = fromAvatarRect || fromEl?.getBoundingClientRect?.();
  if (!fromRect) return Promise.resolve();

  const startX = fromRect.left + fromRect.width / 2;
  const startY = fromRect.top + fromRect.height / 2;

  // Focus point: top-center (slightly below top for iOS feel).
  const focusX = window.innerWidth / 2;
  // Aim for the visual center of the navbar: ~40–56px from top.
  const focusY = 48;

  const waveCount = 24; // 20–30 requested
  const waves = Array.from({ length: waveCount }, (_, i) => {
    const w = document.createElement("div");
    w.className = "pointer-events-none fixed rounded-full";
    w.style.left = `${startX}px`;
    w.style.top = `${startY}px`;
    w.style.width = "10px";
    w.style.height = "10px";
    w.style.opacity = "0";
    w.style.border = "1px solid rgba(125, 211, 252, 0.65)";
    w.style.boxShadow = "0 0 18px rgba(34,211,238,0.22)";
    w.style.filter = "blur(0px)";
    w.style.transform = "translate(-50%, -50%) scale(0.6)";
    w.style.zIndex = "150";
    w.dataset.idx = String(i);
    layerEl.appendChild(w);
    return w;
  });

  const motes = Array.from({ length: 14 }, (_, i) => {
    const p = document.createElement("div");
    p.className = "pointer-events-none fixed h-1.5 w-1.5 rounded-full";
    p.style.left = `${startX}px`;
    p.style.top = `${startY}px`;
    p.style.opacity = "0";
    p.style.background = "rgba(34,211,238,0.9)";
    p.style.boxShadow = "0 0 10px rgba(34,211,238,0.45)";
    p.style.transform = "translate(-50%, -50%) scale(0.6)";
    p.style.zIndex = "151";
    p.dataset.idx = String(i);
    layerEl.appendChild(p);
    return p;
  });

  // A subtle focal glow at the top-center during convergence.

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        waves.forEach((w) => w.remove());
        motes.forEach((m) => m.remove());
        resolve();
      },
    });

    // 0–0.3s: sender avatar grows + gentle glow
    if (fromEl) {
      tl.to(fromEl, { scale: 1.14, duration: 0.18, ease: "power3.out" }, 0);
      tl.to(fromEl, { scale: 1.02, duration: 0.18, ease: "power3.out" }, 0.18);
    }

    // 0.1–1.2s: emit 20–30 wave pulses (staggered)
    waves.forEach((w, i) => {
      const delay = 0.08 + i * 0.018;
      tl.fromTo(
        w,
        { opacity: 0, scale: 0.55, filter: "blur(0px)" },
        { opacity: 0.65, scale: 1.35, duration: 0.18, ease: "power3.out" },
        delay
      );
    });

    // 0.35–1.05s: slight horizontal spread (no downward scatter)
    motes.forEach((m, idx) => {
      const spread = (idx - (motes.length - 1) / 2) * 10;
      const scatterX = startX + spread;
      const scatterY = startY - 14 - (idx % 3) * 3;
      tl.fromTo(
        m,
        { opacity: 0, scale: 0.55 },
        { opacity: 0.85, scale: 1, duration: 0.18, ease: "power3.out" },
        0.35 + idx * 0.01
      );
      tl.to(
        m,
        {
          duration: 0.7,
          motionPath: {
            path: [
              { x: startX, y: startY },
              { x: scatterX, y: scatterY },
            ],
            curviness: 1.1,
          },
          ease: "power2.out",
        },
        0.38 + idx * 0.01
      );
    });

    // 0.95–2.0s: converge everything to top-center focus point

    // Make the wave rings themselves travel to the navbar focus point.
    // They start as rings near the sender, briefly expand, then arc upward and collapse into the focus glow.
    waves.forEach((w, i) => {
      const angle = (i / waves.length) * Math.PI * 2;
      const scatterRadius = 70 + (i % 8) * 10;
      const scatterX = startX + Math.cos(angle) * scatterRadius;
      const scatterY = startY + Math.sin(angle) * scatterRadius * 0.55;

      const startDelay = 0.72 + i * 0.012; // begins after initial emission is visible

      tl.to(
        w,
        {
          duration: 0.55,
          opacity: 0.55,
          scale: 2.1,
          filter: "blur(1px)",
          motionPath: {
            path: [
              { x: startX, y: startY },
              { x: scatterX, y: scatterY },
            ],
            curviness: 0.85,
          },
          ease: "power2.out",
        },
        startDelay
      );

      tl.to(
        w,
        {
          duration: 0.78,
          opacity: 0.18,
          scale: 0.65,
          filter: "blur(2px)",
          motionPath: {
            path: [
              { x: scatterX, y: scatterY },
              { x: (scatterX + focusX) / 2, y: focusY + 4 + (i % 2) * 2 },
              { x: focusX, y: focusY },
            ],
            curviness: 0.75,
          },
          ease: "power2.inOut",
        },
        startDelay + 0.38
      );

      tl.to(
        w,
        { opacity: 0, scale: 0.35, duration: 0.25, ease: "power3.out" },
        1.62 + i * 0.004
      );
    });

    motes.forEach((m, idx) => {
      const offset = (idx - motes.length / 2) * 6;
      tl.to(
        m,
        {
          duration: 1.05,
          opacity: 0.95,
          motionPath: {
            path: [
              { x: m.getBoundingClientRect().left, y: m.getBoundingClientRect().top },
              { x: focusX + offset, y: focusY + (idx % 2) * 2 },
            ],
            curviness: 0.65,
          },
          ease: "power2.inOut",
        },
        0.95 + idx * 0.012
      );
      tl.to(m, { opacity: 0, scale: 0.4, duration: 0.35, ease: "power3.out" }, 1.65 + idx * 0.01);
    });

    // Optional receiver pulse near end if toEl exists (subtle).
    if (toEl) {
      tl.to(
        toEl,
        {
          scale: 1.08,
          boxShadow: "0 0 0 10px rgba(34,211,238,0.18)",
          duration: 0.22,
          yoyo: true,
          repeat: 1,
          ease: "power3.out",
        },
        1.55
      );
    }

    if (fromEl) tl.to(fromEl, { scale: 1, duration: 0.35, ease: "power3.out" }, 1.65);
  });
}

