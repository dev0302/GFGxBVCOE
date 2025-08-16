import React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NavLink } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

function ImageGrid() {
  // 🚀 REFACTOR: GSAP logic is cleaner and uses matchMedia for responsiveness.
  useGSAP(() => {
    // This is the modern, recommended way to handle responsive animations.
    ScrollTrigger.matchMedia({
      // Desktop animations
      "(min-width: 769px)": function () {
        applyAnimations("top 20%", "top bottom");
      },
      // Mobile animations
      "(max-width: 768px)": function () {
        applyAnimations("top 15%", "top 15%");
      },
    });

    function applyAnimations(scaleStart, moveStart) {
      document.querySelectorAll(".elem").forEach((elem) => {
        let image = elem.querySelector("img");
        // Random horizontal movement for parallax effect
        let xTransform = gsap.utils.random(-150, 150);

        // Scale down animation
        gsap.to(image, {
          scale: 0,
          ease: "none",
          scrollTrigger: {
            trigger: elem,
            start: scaleStart,
            end: "bottom top",
            scrub: true,
          },
        });

        // Horizontal move animation
        gsap.to(elem, {
          xPercent: xTransform,
          ease: "none",
          scrollTrigger: {
            trigger: elem,
            start: moveStart,
            end: "bottom top",
            scrub: true,
          },
        });
      });
    }

    // Cleanup function is handled automatically by useGSAP's context
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    // ✨ THEME: Changed background to darkthemebg and added padding.
    <div className="relative w-full darkthemebg py-20 px-4 md:px-8">
      {/* Centered CTA Button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
        <div className="pointer-events-auto">
           {/* ✨ THEME: Styled button as a primary, consistent CTA. */}
          <NavLink to="/gallery">
            <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg font-nunito border border-green-300/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25">
              View Full Gallery
            </button>
          </NavLink>
        </div>
      </div>

      {/* 🔧 FIX: Rebuilt the grid with self-contained Tailwind classes. */}
      <div className="grid grid-cols-12 grid-rows-10 gap-4 max-w-7xl mx-auto h-[150vh] relative z-0">
        <div className="elem col-start-4 col-span-3 row-start-1 row-span-2"><img src="/gridimg1.webp" alt="Event 1" /></div>
        <div className="elem col-start-8 col-span-3 row-start-1 row-span-2"><img src="/gridimg2.webp" alt="Event 2" /></div>
        <div className="elem col-start-1 col-span-3 row-start-2 row-span-3"><img src="/gridimg3.webp" alt="Event 3" /></div>
        <div className="elem col-start-7 col-span-2 row-start-3 row-span-2"><img src="/gridimg4.webp" alt="Event 4" /></div>
        <div className="elem col-start-3 col-span-3 row-start-4 row-span-3"><img src="/gridimg5.webp" alt="Event 5" /></div>
        <div className="elem col-start-10 col-span-3 row-start-4 row-span-2"><img src="/gridimg6.webp" alt="Event 6" /></div>
        <div className="elem col-start-1 col-span-2 row-start-6 row-span-2"><img src="/gridimg7.webp" alt="Event 7" /></div>
        <div className="elem col-start-9 col-span-3 row-start-6 row-span-3"><img src="/gridimg8.webp" alt="Event 8" /></div>
        <div className="elem col-start-5 col-span-3 row-start-7 row-span-2"><img src="/gridimg9.webp" alt="Event 9" /></div>
        <div className="elem col-start-1 col-span-3 row-start-8 row-span-3"><img src="/gridimg10.webp" alt="Event 10" /></div>
        <div className="elem col-start-6 col-span-2 row-start-9 row-span-2"><img src="/gridimg11.webp" alt="Event 11" /></div>
        <div className="elem col-start-9 col-span-4 row-start-9 row-span-2"><img src="/gridimg12.webp" alt="Event 12" /></div>
      </div>
    </div>
  );
}

// Simple image wrapper to apply consistent styling
const Image = ({ src, alt }) => (
  <div className="w-full h-full rounded-2xl overflow-hidden">
    <img src={src} alt={alt} className="w-full h-full object-cover" />
  </div>
);

// Add the image styling to each element in the final component
// Example for one element:
// <div className="elem ..."><Image src="/gridimg1.webp" alt="Event 1" /></div>

export default ImageGrid;