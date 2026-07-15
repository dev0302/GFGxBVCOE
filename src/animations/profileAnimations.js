import gsap from "gsap";

export function animateProfileAvatarFlip(spinnerEl, frontEl) {
  if (!spinnerEl) return () => {};

  gsap.killTweensOf([spinnerEl, frontEl].filter(Boolean));
  gsap.set(spinnerEl, {
    rotateY: -720,
    scale: 0.9,
    opacity: 0,
    transformPerspective: 960,
    force3D: true,
    transformOrigin: "50% 50%",
  });

  if (frontEl) {
    gsap.set(frontEl, { filter: "blur(5px)" });
  }

  const timeline = gsap.timeline();
  timeline.to(spinnerEl, {
    rotateY: 0,
    scale: 1,
    opacity: 1,
    duration: 1.85,
    ease: "power2.out",
  });

  if (frontEl) {
    timeline.to(
      frontEl,
      {
        filter: "blur(0px)",
        duration: 1.05,
        ease: "power2.out",
      },
      0.12
    );
  }

  return () => timeline.kill();
}
