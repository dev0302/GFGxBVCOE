import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

export function animateAvatarHover(target, active) {
  if (!target) return;
  gsap.to(target, {
    scale: active ? 1.06 : 1,
    boxShadow: active
      ? "0 0 0 4px rgba(34,211,238,0.18), 0 0 24px rgba(34,211,238,0.32)"
      : "0 0 0 0 rgba(34,211,238,0)",
    duration: 0.45,
    ease: "power2.out",
  });
}

export function animateSendBeam({ fromEl, toEl, layerEl, onComplete }) {
  if (!fromEl || !toEl || !layerEl) {
    if (onComplete) onComplete();
    return;
  }
  const layerRect = layerEl.getBoundingClientRect();
  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();

  const start = {
    x: from.left + from.width / 2 - layerRect.left,
    y: from.top + from.height / 2 - layerRect.top,
  };
  const end = {
    x: to.left + to.width / 2 - layerRect.left,
    y: to.top + to.height / 2 - layerRect.top,
  };

  const beam = document.createElement("div");
  beam.className = "pointer-events-none absolute z-[90] h-2 w-2 rounded-full";
  beam.style.left = `${start.x}px`;
  beam.style.top = `${start.y}px`;
  beam.style.background =
    "radial-gradient(circle, rgba(125,211,252,1) 0%, rgba(34,211,238,0.8) 42%, rgba(34,211,238,0) 72%)";
  layerEl.appendChild(beam);

  const controlX = (start.x + end.x) / 2;
  const controlY = Math.min(start.y, end.y) - 80;

  gsap.fromTo(
    beam,
    { scale: 1, opacity: 0.95, filter: "blur(0px)" },
    {
      scale: 1.8,
      opacity: 0.15,
      filter: "blur(1.5px)",
      motionPath: {
        path: [
          { x: start.x, y: start.y },
          { x: controlX, y: controlY },
          { x: end.x, y: end.y },
        ],
        curviness: 1.3,
      },
      duration: 0.95,
      ease: "power2.out",
      onComplete: () => {
        beam.remove();
        if (onComplete) onComplete();
      },
    }
  );
}

export function animateModalOpen(modalEl) {
  if (!modalEl) return;
  gsap.fromTo(
    modalEl,
    { opacity: 0, scale: 0.92, y: 12, filter: "blur(5px)" },
    { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power2.out" }
  );
}

export function animateThumbIn(el) {
  if (!el) return;
  gsap.fromTo(
    el,
    { opacity: 0, scale: 0.88, y: 8, filter: "blur(4px)" },
    { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.48, ease: "power2.out" }
  );
}

export function animateSuccessBurst(el) {
  if (!el) return;
  gsap.fromTo(
    el,
    { scale: 0.9, opacity: 0.35, boxShadow: "0 0 0 0 rgba(74,222,128,0.4)" },
    {
      scale: 1,
      opacity: 1,
      boxShadow: "0 0 0 12px rgba(74,222,128,0)",
      duration: 0.65,
      ease: "power2.out",
    }
  );
}
