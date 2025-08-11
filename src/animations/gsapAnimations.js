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

  // title animation on entrance
  

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

// title animation
export const animateTitle = (titleEl) => {
  // Store original HTML
  const originalHTML = titleEl.innerHTML;
  const lines = originalHTML.split('<br>');
  titleEl.innerHTML = '';
  
  // Create character elements
  lines.forEach((line, i) => {
    const lineEl = document.createElement('div');
    lineEl.className = `line line-${i}`;
    lineEl.style.lineHeight = '1.1'; // Reduce line height
    lineEl.style.marginBottom = '0.1em'; // Minimal spacing between lines
    
    line.split(' ').forEach(word => {
      const wordEl = document.createElement('span');
      wordEl.className = 'word';
      wordEl.style.display = 'inline-block';
      wordEl.style.overflow = 'visible'; // Changed from 'hidden' to prevent clipping
      wordEl.style.marginRight = '0.25em';
      
      word.split('').forEach(char => {
        const charEl = document.createElement('span');
        charEl.className = 'char';
        charEl.style.display = 'inline-block';
        charEl.textContent = char;
        charEl.style.lineHeight = '1.3';
        
        // Apply gradient styling to each character
        charEl.style.background = 'linear-gradient(135deg, #22c55e, #10b981, #059669)';
        charEl.style.backgroundClip = 'text';
        charEl.style.webkitBackgroundClip = 'text';
        charEl.style.webkitTextFillColor = 'transparent';
        charEl.style.color = 'transparent';
        
        wordEl.appendChild(charEl);
      });
      
      lineEl.appendChild(wordEl);
    });
    
    titleEl.appendChild(lineEl);
    if (i < lines.length - 1) {
      // Add minimal spacing between lines
      const spacer = document.createElement('div');
      spacer.style.height = '0.2em'; // Very small gap
      titleEl.appendChild(spacer);
    }
  });

  // Set initial state
  gsap.set('.char', {
    y: '100%',
    opacity: 0,
    rotationX: 45,
    transformOrigin: 'bottom center'
  });

  // Create and return animation
  return gsap.to('.char', {
    y: '0%',
    opacity: 1,
    rotationX: 0,
    duration: 0.8,
    stagger: {
      amount: 1,
      from: 'random'
    },
    ease: 'back.out(2)'
  });
};

/**
 * Home UI animations: title, description, buttons, cards, and count-up.
 * Accepts DOM elements (not refs) for flexibility.
 */
export function animateHomeUI({ titleEl, descriptionEl, getStartedBtnEl, learnMoreBtnEl, statsGridEl, countEl, countProjectsEl, countWorkshopsEl }) {
  const listeners = [];
  const toCleanup = [];

  const safe = (el) => (el ? [el] : []);

  // Title animation with character-by-character reveal
  if (titleEl) {
    const titleAnimation = animateTitle(titleEl);
    toCleanup.push(titleAnimation);
  }

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

  if (countProjectsEl) {
    const counter = { value: 0 };
    const t = gsap.to(counter, {
      value: 50,
      duration: 1.6,
      ease: "power1.out",
      onUpdate: () => {
        countProjectsEl.textContent = `${Math.floor(counter.value)}+`;
      },
    });
    toCleanup.push(t);
  }

  if (countWorkshopsEl) {
    const counter = { value: 0 };
    const t = gsap.to(counter, {
      value: 100,
      duration: 1.6,
      ease: "power1.out",
      onUpdate: () => {
        countWorkshopsEl.textContent = `${Math.floor(counter.value)}+`;
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
    gsap.killTweensOf([titleEl, descriptionEl, ...buttons]);
    if (statsGridEl) {
      const cards = statsGridEl.querySelectorAll('div[class*="rounded-2xl"]');
      gsap.killTweensOf(cards);
    }
    if (countEl) gsap.killTweensOf(countEl);
  };
}
