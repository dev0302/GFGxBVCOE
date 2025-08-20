import { useEffect, useRef } from "react";
//import Lenis from "lenis";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { NavLink } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

function ImageGrid() {
  const containerRef = useRef(null);

  //useEffect(() => {
    //const lenis = new Lenis({
      //lerp : 0.1,
     // smoothWheel: true,
    //});

    

    //function raf(time) {
      //lenis.raf(time);
      //ScrollTrigger.update(); // 🔥
     // requestAnimationFrame(raf);
   // }
   // requestAnimationFrame(raf);

   // setTimeout(() => {
   //   ScrollTrigger.refresh();
   // }, 50);

   //return () => {
   //   lenis.destroy()
 //   };
//  }, []);

  

  useGSAP(() => {
    const createAnimations = () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

      document.querySelectorAll(".elem").forEach((elem) => {
        let image = elem.querySelector("img");
        let xTransform = gsap.utils.random(-100, 100);
        const isMobile = window.innerWidth <= 768;

        gsap
          .timeline({
            scrollTrigger: {
              trigger: image,
               
              start: isMobile ? "top 15%" : "top 20%",
              end: "bottom top",
              scrub: true,
               
            },
          })
          .set(image, {
            transformOrigin: `${xTransform < 0 ? "0%" : "100%"}`,
          })
          .to(image, {
            scale: 0,
            ease: "none",
          });

        gsap.to(elem, {
          xPercent: xTransform,
          ease: "none",
          scrollTrigger: {
            trigger: image,
            start: isMobile ? "top bottom" : "top bottom",
            end: "bottom top",
            scrub: true,
             
          },
        });
      });
    };

    createAnimations();
    const handleResize = () => createAnimations();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  });

  useGSAP(
    () => {
      gsap.from("button", {
        
        opacity: 0,
        scale: 0.5,
        y: 50,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".elem", {
  scrollTrigger: {
    trigger: containerRef.current,
    start: "top 75%",
    end: "bottom 75%",   // gives a whole range, not a single pixel
    toggleActions: "play none none none",
    once: true,
  },
  opacity: 0,
  scale: 0.8,
  y: 30,
  duration: 1,
  ease: "power3.out",
  stagger: 0.05,
});
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full bg-[#161629] py-20 relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <NavLink to="/gallery">
          <button className="relative overflow-hidden px-8 py-3 rounded-full group transition-all duration-500 ease-in-out font-bold text-lg md:text-2xl text-white backdrop-blur-sm bg-white/20 hover:bg-white/40 border border-transparent hover:border-white/50">
            <span className="relative z-10">Click to View All Images</span>
            <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out bg-white/10"></span>
          </button>
        </NavLink>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-8 lg:grid-cols-8 grid-rows-6 gap-2 md:gap-2 mobile-grid relative z-0">
        {/* Your image grid items here */}
        <div className="elem my-grid-item" style={{ "--r": 1, "--c": 3 }}>
          <img
            src="/gridimg1.webp"
            alt="Image 1"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 1, "--c": 7 }}>
          <img
            src="/gridimg2.webp"
            alt="Image 2"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 2, "--c": 1 }}>
          <img
            src="/gridimg3.webp"
            alt="Image 3"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 2, "--c": 6 }}>
          <img
            src="/gridimg4.webp"
            alt="Image 4"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 3, "--c": 2 }}>
          <img
            src="/gridimg5.webp"
            alt="Image 5"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 4, "--c": 4 }}>
          <img
            src="/gridimg6.webp"
            alt="Image 6"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 4, "--c": 1 }}>
          <img
            src="/gridimg7.webp"
            alt="Image 7"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 2, "--c": 5 }}>
          <img
            src="/gridimg8.webp"
            alt="Image 8"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 5, "--c": 1 }}>
          <img
            src="/gridimg9.webp"
            alt="Image 9"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 5, "--c": 6 }}>
          <img
            src="/gridimg10.webp"
            alt="Image 1"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 6, "--c": 3 }}>
          <img
            src="/gridimg11.webp"
            alt="Image 2"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 6, "--c": 7 }}>
          <img
            src="/gridimg12.webp"
            alt="Image 3"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 7, "--c": 2 }}>
          <img
            src="/gridimg13.webp"
            alt="Image 4"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 7, "--c": 5 }}>
          <img
            src="/gridimg14.webp"
            alt="Image 5"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 8, "--c": 1 }}>
          <img
            src="/gridimg15.webp"
            alt="Image 6"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 8, "--c": 8 }}>
          <img
            src="/gridimg16.webp"
            alt="Image 7"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 9, "--c": 4 }}>
          <img
            src="/gridimg17.webp"
            alt="Image 8"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 9, "--c": 6 }}>
          <img
            src="/gridimg18.webp"
            alt="Image 9"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="elem my-grid-item" style={{ "--r": 10, "--c": 3 }}>
          <img
            src="/gridimg19.webp"
            alt="Image 1"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="elem my-grid-item" style={{ "--r": 10, "--c": 7 }}>
          <img
            src="/gridimg20.webp"
            alt="Image 2"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

export default ImageGrid;
