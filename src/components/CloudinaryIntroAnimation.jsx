import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";

const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;
const TOTAL_IMAGES = 20;

// Single source of truth for how much scroll the animation needs.
// This now drives BOTH the progress math and the pinned section height,
// so they can never fall out of sync.
const SCROLL_DISTANCE = 3200;
const CLOUDINARY_TRANSFORM = "w_128,h_128,c_fill,f_auto,q_auto";

const RAW_IMAGES = [
  "https://res.cloudinary.com/duwmby01d/image/upload/v1783760137/gfg-avatars/mskhuvj43hnoycxe0mtn.jpg",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1774978083/gfg-avatars/uj6gux97lrecvgio0sei.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1774973529/gfg-avatars/g6tt6x8itatqtjmgt2wm.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1774969269/gfg-avatars/ayuxiasqkmxsrhbk1elc.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1774940762/gfg-avatars/m263zehxnnnfu7ecf2sx.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1774873629/gfg-avatars/kegohysezqkks4kr7iv6.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1774810211/gfg-avatars/ltm1nbzlg535avr2vqag.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1774809335/gfg-avatars/axiufnktqq7k485ksmwm.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1773071409/gfg-avatars/ixfyhiuilrimdsunof9c.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1773412911/gfg-avatars/tnze2ztp4lwn0bhcvpfy.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1772024447/gfg-avatars/es0qdtjstittj8k5qiaq.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1771864701/gfg-avatars/c8mbazffvobzqhvl501w.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1772028823/gfg-avatars/qdszguldh9qnpudf4b1u.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1771695434/gfg-avatars/bdkprijuuchnkqggmar5.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1771267811/gfg-avatars/a9qwbpg6xpb9d7eiaeva.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1771308086/gfg-avatars/xzavxgsvwsqxppl4lh6m.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1771254332/gfg-avatars/g5s7eagxeabljn1n285w.jpg",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1771254113/gfg-avatars/n8ddryjhxpkc1hgjo4ro.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1771253483/gfg-avatars/u0y8pxtqzxwdulfjuydr.webp",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1781892760/gfg-avatars/esqurvehtciqhjnny4xn.jpg",
  "https://res.cloudinary.com/duwmby01d/image/upload/v1771241592/gfg-avatars/ljasaqmoc4yz2ldft396.webp",
];

const cloudinarySizedImage = (url) =>
  url.replace("/image/upload/", `/image/upload/${CLOUDINARY_TRANSFORM}/`);

const IMAGES = RAW_IMAGES.map(cloudinarySizedImage);

const lerp = (start, end, t) => start * (1 - t) + end * t;

function FlipCard({ src, index, target }) {
  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{
        type: "spring",
        stiffness: 40,
        damping: 15,
      }}
      style={{
        position: "absolute",
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="group cursor-pointer"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-xl border border-emerald-300/20 bg-emerald-950 shadow-[0_18px_34px_rgba(0,0,0,0.38)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img
            src={src}
            alt={`GFG event moment ${index + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
        </div>

        <div
          className="absolute inset-0 flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-emerald-300/25 bg-[#03140f] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.42)]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-center">
            <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-emerald-300">
              GFG
            </p>
            <p className="text-xs font-medium text-white">Moment</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CloudinaryIntroAnimation() {
  const [introPhase, setIntroPhase] = useState("scatter");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [morphValue, setMorphValue] = useState(0);
  const [rotateValue, setRotateValue] = useState(0);
  const [parallaxValue, setParallaxValue] = useState(0);
  const [pinState, setPinState] = useState("before");
  const sectionRef = useRef(null);
  const containerRef = useRef(null);

  const virtualScroll = useMotionValue(0);
  // progress now runs 0 -> SCROLL_DISTANCE, matching the pinned height exactly
const PRE_PIN_DISTANCE = 200;

// Part 1: section remains stuck only for this distance
const PIN_DISTANCE = SCROLL_DISTANCE * 0.19;

// Part 2: animation continues during normal scrolling
const PART_2_DISTANCE = 800;

const morphProgress = useTransform(
  virtualScroll,
  [-PRE_PIN_DISTANCE, PIN_DISTANCE],
  [0, 1]
);
  const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });
const scrollRotate = useTransform(
  virtualScroll,
  [PIN_DISTANCE, PIN_DISTANCE + PART_2_DISTANCE],
  [0, 360]
);
  const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });
  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });
  const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
  const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

  const backgroundColor = useTransform(
  virtualScroll,
  [-PRE_PIN_DISTANCE, -100, 80],
  ["#071426", "#071426", "#161629"]
);

const greenGlowOpacity = useTransform(
  virtualScroll,
  [-100, 80],
  [0, 1]
);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(containerRef.current);
    setContainerSize({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    let rafId = 0;

    const updateFromPageScroll = () => {
      rafId = 0;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      // progress is normalized against the SAME distance the section's
      // height is built from, so pin length and animation length always agree
      const scrolledInside = window.scrollY - sectionTop;
      const animationScroll = Math.min(
  Math.max(scrolledInside, -PRE_PIN_DISTANCE),
  PIN_DISTANCE + PART_2_DISTANCE
);

      if (scrolledInside < 0) {
  setPinState("before");
} else if (scrolledInside > PIN_DISTANCE) {
  setPinState("after");
} else {
  setPinState("active");
}

      virtualScroll.set(animationScroll);
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(updateFromPageScroll);
    };

    updateFromPageScroll();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [virtualScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseX.set(normalizedX * 100);
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX]);

  useEffect(() => {
    const timer1 = setTimeout(() => setIntroPhase("line"), 500);
    const timer2 = setTimeout(() => setIntroPhase("circle"), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const scatterPositions = useMemo(
    () =>
      IMAGES.map(() => ({
        x: (Math.random() - 0.5) * 1500,
        y: (Math.random() - 0.5) * 1000,
        rotation: (Math.random() - 0.5) * 180,
        scale: 0.6,
        opacity: 0,
      })),
    []
  );

  useEffect(() => {
    const unsubscribeMorph = smoothMorph.on("change", setMorphValue);
    const unsubscribeRotate = smoothScrollRotate.on("change", setRotateValue);
    const unsubscribeParallax = smoothMouseX.on("change", setParallaxValue);

    return () => {
      unsubscribeMorph();
      unsubscribeRotate();
      unsubscribeParallax();
    };
  }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

const pinClassName =
  pinState === "active"
    ? "fixed left-0 top-0 z-30"
    : "absolute left-0";

  return (
    <section
      ref={sectionRef}
      // height is 100vh (the pinned viewport) + SCROLL_DISTANCE (the extra
      // scroll room the animation consumes) — this is what actually locks
      // the pin duration to the animation duration, on any screen size
      style={{
  height: `calc(100vh + ${PIN_DISTANCE}px)`
}}
      className="relative overflow-visible border-t border-emerald-300/10 bg-[#020808]"
    >
      <motion.div
  ref={containerRef}
  style={{
    top: pinState === "after" ? `${PIN_DISTANCE}px` : "0px",
    backgroundColor,
  }}
  className={`${pinClassName} h-screen pb-40 min-h-[620px] w-full overflow-hidden`}
>
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(190,255,214,0.5)_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div className="pointer-events-none absolute top-1/2 z-0 flex -translate-y-1/2 flex-col items-center justify-center text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={
                introPhase === "circle"
                  ? {
                      opacity:
                        morphValue < 0.2
                          ? 0
                          : morphValue < 0.3
                            ? (morphValue - 0.2) * 10
                            : morphValue < 0.5
                              ? 1 - ((morphValue - 0.3) / 0.2)
                              : 0,
                      y: 0,
                      filter: morphValue < 0.5 ? "blur(0px)" : "blur(10px)",
                    }
                  : {
                      opacity: 0,
                      y: 20,
                      filter: "blur(10px)",
                    }
              }
              transition={{ duration: 1 }}
              className="text-2xl font-montserrat font-semibold tracking-tight text-richblack-200/60 md:text-4xl"
            >
              Meet the Minds Behind the Community.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={
                introPhase === "circle"
                  ? {
                      opacity:
                        morphValue < 0.2
                          ? 0
                          : morphValue < 0.3
                            ? (morphValue - 0.2) * 10
                            : morphValue < 0.5
                              ? 1 - ((morphValue - 0.3) / 0.2)
                              : 0,
                      y: 0,
                      filter: morphValue < 0.5 ? "blur(0px)" : "blur(10px)",
                    }
                  : {
                      opacity: 0,
                      y: 20,
                      filter: "blur(10px)",
                    }
              }
              transition={{ duration: 1, delay: 0.2 }}
              className="mt-4 text-xs font-bold tracking-[0.2em] text-emerald-300"
            >
              SCROLL TO EXPLORE
            </motion.p>
          </div>

          <motion.div
            style={{ opacity: contentOpacity, y: contentY }}
            className="pointer-events-none absolute top-[10%] z-10 flex flex-col items-center justify-center px-4 text-center"
          >
            <h2 className="mb-4 mt-10 text-3xl font-montserrat font-semibold tracking-tight text-richblack-200 md:text-4xl">
              Meet the Minds Behind the Community
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-richblack-200 md:text-base">
              The people who turn ideas into action. Meet our Society Heads, Core Team, and dedicated members who collaborate, create, and work together to make every initiative, event, and experience possible.
            </p>
          </motion.div>

          <div className="relative flex h-full w-full items-center justify-center">
            {IMAGES.slice(0, TOTAL_IMAGES).map((src, index) => {
              let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

              if (introPhase === "scatter") {
                target = scatterPositions[index];
              } else if (introPhase === "line") {
                const lineSpacing = 70;
                const lineTotalWidth = TOTAL_IMAGES * lineSpacing;
                const lineX = index * lineSpacing - lineTotalWidth / 2;
                target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
              } else {
                const isMobile = containerSize.width < 768;
                const minDimension = Math.min(containerSize.width, containerSize.height);
                const circleRadius = Math.min(minDimension * 0.35, 350);
                const circleAngle = (index / TOTAL_IMAGES) * 360;
                const circleRad = (circleAngle * Math.PI) / 180;
                const circlePos = {
                  x: Math.cos(circleRad) * circleRadius,
                  y: Math.sin(circleRad) * circleRadius,
                  rotation: circleAngle + 90,
                };

                const scrollProgress = Math.min(
  Math.max(rotateValue / 360, 0),
  1
);

// Move the entire flow from right to left
const movingIndex =
  index - scrollProgress * (TOTAL_IMAGES * 0.7);

const spacing = isMobile ? 90 : 130;

const x =
  movingIndex * spacing -
  (TOTAL_IMAGES * spacing) / 2 +
  containerSize.width / 2;

// Create a curved path instead of a horizontal line
const normalizedX =
  (x - containerSize.width / 2) /
  (containerSize.width * 0.7);

const curveAmount = isMobile ? 120 : 260;

const arcPos = {
  x: x - containerSize.width / 2 + parallaxValue,

  // Images curve downward when entering/leaving
  y:
    containerSize.height * 0.25 +
    Math.pow(normalizedX, 2) * curveAmount,

  // Slight rotation following the curve
  rotation: normalizedX * 25,

  scale: isMobile ? 1.4 : 1.8,
};

                target = {
                  x: lerp(circlePos.x, arcPos.x, morphValue),
                  y: lerp(circlePos.y, arcPos.y, morphValue),
                  rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                  scale: lerp(1, arcPos.scale, morphValue),
                  opacity: 1,
                };
              }

              return <FlipCard key={src} src={src} index={index} target={target} />;
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
