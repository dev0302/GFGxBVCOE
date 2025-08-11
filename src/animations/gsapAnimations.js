import { gsap } from "gsap";

/**
 * Animations for the Navbar component.
 * Centralizes entrance and hover interactions for cleanliness and reuse.
 * Returns a cleanup function that removes listeners and kills tweens.
 */
export function animateNavbar({ navbarRef, logoRef, titleRef, navRef, buttonRef }) {
  const createdListeners = [];

  // Main entrance timeline
  const timeline = gsap.timeline({ ease: "power3.out" });

  timeline.fromTo(
    navbarRef.current,
    { y: -100, opacity: 0, backdropFilter: "blur(0px)" },
    { y: 0, opacity: 1, backdropFilter: "blur(20px)", duration: 1 }
  );

  timeline.fromTo(
    logoRef.current,
    { scale: 0, rotation: -180 },
    { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" },
    "-=0.5"
  );

  timeline.fromTo(
    titleRef.current,
    { x: -50, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
    "-=0.6"
  );

  if (navRef.current?.children?.length) {
    timeline.fromTo(
      navRef.current.children,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      "-=0.4"
    );
  }

  timeline.fromTo(
    buttonRef.current,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
    "-=0.3"
  );

  // Attach hover animations for nav links, logo, and CTA button
  const attachHover = (element, enterVars, leaveVars) => {
    if (!element) return;
    const onEnter = () => gsap.to(element, { ...enterVars });
    const onLeave = () => gsap.to(element, { ...leaveVars });
    element.addEventListener("mouseenter", onEnter);
    element.addEventListener("mouseleave", onLeave);
    createdListeners.push({ element, onEnter, onLeave });
  };

  // Nav links hover
  const navItems = navRef.current?.children;
  if (navItems) {
    Array.from(navItems).forEach((item) => {
      const link = item.querySelector("a");
      attachHover(
        link,
        { y: -2, scale: 1.05, duration: 0.3, ease: "power2.out" },
        { y: 0, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    });
  }

  // Logo hover
  attachHover(
    logoRef.current,
    { rotation: 360, scale: 1.1, duration: 0.6, ease: "power2.out" },
    { rotation: 0, scale: 1, duration: 0.6, ease: "power2.out" }
  );

  // CTA hover
  attachHover(
    buttonRef.current,
    { scale: 1.05, duration: 0.3, ease: "power2.out" },
    { scale: 1, duration: 0.3, ease: "power2.out" }
  );

  // Cleanup removes listeners and kills animations
  return function cleanupNavbarAnimations() {
    createdListeners.forEach(({ element, onEnter, onLeave }) => {
      element.removeEventListener("mouseenter", onEnter);
      element.removeEventListener("mouseleave", onLeave);
    });

    timeline.kill();
    gsap.killTweensOf([
      navbarRef.current,
      logoRef.current,
      titleRef.current,
      ...(navRef.current ? Array.from(navRef.current.children) : []),
      buttonRef.current,
    ]);
  };
}

/**
 * Home UI animations: description, buttons, cards, and count-up.
 * Accepts DOM elements (not refs) for flexibility.
 */
export function animateHomeUI({ descriptionEl, getStartedBtnEl, learnMoreBtnEl, statsGridEl, countEl }) {
  const listeners = [];
  const toCleanup = [];

  const safe = (el) => (el ? [el] : []);

  // Description entrance
  if (descriptionEl) {
    const t = gsap.from(descriptionEl, {
      opacity: 0,
      y: 20,
      duration: 0.9,
      ease: "power3.out",
      delay: 0.2,
    });
    toCleanup.push(t);
  }

  // Buttons entrance + hover
  const buttons = [...safe(getStartedBtnEl), ...safe(learnMoreBtnEl)];
  if (buttons.length) {
    const t = gsap.from(buttons, {
      opacity: 0,
      y: 24,
      scale: 0.98,
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.1,
      delay: 0.35,
    });
    toCleanup.push(t);

    const attachHover = (el, enterVars, leaveVars) => {
      if (!el) return;
      const onEnter = () => gsap.to(el, { ...enterVars });
      const onLeave = () => gsap.to(el, { ...leaveVars });
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      listeners.push({ el, onEnter, onLeave });
    };

    buttons.forEach((el, idx) => {
      attachHover(
        el,
        { y: -2, scale: idx === 0 ? 1.03 : 1.02, duration: 0.22, ease: "power2.out" },
        { y: 0, scale: 1, duration: 0.22, ease: "power2.out" }
      );
    });
  }

  // Cards entrance + hover
  if (statsGridEl) {
    const cards = statsGridEl.querySelectorAll('div[class*="rounded-2xl"]');
    if (cards.length) {
      const t = gsap.from(cards, {
        opacity: 0,
        y: 28,
        scale: 0.98,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.12,
        delay: 0.5,
      });
      toCleanup.push(t);

      cards.forEach((card) => {
        const onEnter = () => gsap.to(card, { y: -4, scale: 1.02, duration: 0.22, ease: "power2.out" });
        const onLeave = () => gsap.to(card, { y: 0, scale: 1, duration: 0.22, ease: "power2.out" });
        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
        listeners.push({ el: card, onEnter, onLeave });
      });
    }
  }

  // Count-up (0 → 50+)
  if (countEl) {
    const counter = { value: 0 };
    const t = gsap.to(counter, {
      value: 50,
      duration: 1.6,
      ease: "power1.out",
      onUpdate: () => {
        countEl.textContent = `${Math.floor(counter.value)}+`;
      },
    });
    toCleanup.push(t);
  }

  // Cleanup
  return () => {
    listeners.forEach(({ el, onEnter, onLeave }) => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    });
    toCleanup.forEach((t) => t.kill && t.kill());
    gsap.killTweensOf([descriptionEl, ...buttons]);
    if (statsGridEl) {
      const cards = statsGridEl.querySelectorAll('div[class*="rounded-2xl"]');
      gsap.killTweensOf(cards);
    }
    if (countEl) gsap.killTweensOf(countEl);
  };
}
