import { useEffect } from "react";
import Lenis from "lenis";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { NavLink } from "react-router-dom";


gsap.registerPlugin(ScrollTrigger);

function ImageGrid() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    // Sync Lenis scroll with ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Refresh ScrollTrigger after Lenis is initialized
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 50);

    return () => {
      lenis.destroy(); // cleanup on unmount
    };
  }, []); // run only once

  useGSAP(() => {
    const createAnimations = () => {
      // Kill existing ScrollTriggers
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      
      document.querySelectorAll(".elem").forEach((elem) => {
        let image = elem.querySelector("img");
        let xTransform = gsap.utils.random(-100, 100);

        // Check if it's mobile screen
        const isMobile = window.innerWidth <= 768;

        // Scale animation
        gsap
          .timeline({
            scrollTrigger: {
              trigger: image,
              start: isMobile ? "top 15%" : "top 20%",
              end: "bottom top",
              scrub: true,
              // markers: true,
            },
          })
          .set(image, {
            transformOrigin: `${xTransform < 0 ? "0%" : "100%"}`,
          })
          .to(image, {
            scale: 0,
            ease: "none",
          });

        // Horizontal move
        gsap.to(elem, {
          xPercent: xTransform,
          ease: "none",
          scrollTrigger: {
            trigger: image,
            start: isMobile ? "top 15%" : "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    };

    // Initial setup
    createAnimations();

    // Handle resize events
    const handleResize = () => {
      createAnimations();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  });

  return (
    <div className="w-full bg-[#161629] pt-20 relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <NavLink to="/gallery"><button>
          <h1 className="text-5xl mb-4">Click to View All Images</h1>
        </button></NavLink>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 grid-rows-6 gap-2 md:gap-2 mobile-grid relative z-0">
        {/* Your image grid items here */}
        <div className="elem my-grid-item" style={{ "--r": 1, "--c": 3 }}>
          <img src="/gridimg1.webp" alt="Image 1" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 1, "--c": 7 }}>
          <img src="/gridimg2.webp" alt="Image 2" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 2, "--c": 1 }}>
          <img src="/gridimg3.webp" alt="Image 3" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 2, "--c": 6 }}>
          <img src="/gridimg4.webp" alt="Image 4" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 3, "--c": 2 }}>
          <img src="/gridimg5.webp" alt="Image 5" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 4, "--c": 4 }}>
             <img src="/gridimg6.webp" alt="Image 7" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 4, "--c": 1 }}>
          <img src="/gridimg7.webp" alt="Image 7" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 2, "--c": 5 }}>
          <img src="/gridimg8.webp" alt="Image 8" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 5, "--c": 1 }}>
          <img src="/gridimg9.webp" alt="Image 9" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 5, "--c": 6 }}>
          <img src="/gridimg10.webp" alt="Image 1" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 6, "--c": 3 }}>
          <img src="/gridimg11.webp" alt="Image 2" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 6, "--c": 7 }}>
          <img src="/gridimg12.webp" alt="Image 3" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 7, "--c": 2 }}>
          <img src="/gridimg13.webp" alt="Image 4" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 7, "--c": 5 }}>
          <img src="/gridimg14.webp" alt="Image 5" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 8, "--c": 1 }}>
          <img src="/gridimg15.webp" alt="Image 6" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 8, "--c": 8 }}>
          <img src="/gridimg16.webp" alt="Image 7" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 9, "--c": 4 }}>
          <img src="/gridimg17.webp" alt="Image 8" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 9, "--c": 6 }}>
          <img src="/gridimg18.webp" alt="Image 9" className="w-full h-full object-cover rounded-lg" />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 10, "--c": 3 }}>
          <img src="/gridimg19.webp" alt="Image 1" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 10, "--c": 7 }}>
          <img src="/gridimg20.webp" alt="Image 2" className="w-full h-full object-cover rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default ImageGrid;
