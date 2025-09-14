import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const IMAGE_URLS = [
  "/gridimg12.webp",
  "/gfg4.jpg",
  "/gridimg18.webp",
  "/gridimg3.webp",
  "/gridimg9.webp",
  "/vichaarx.webp",
];

const debounce = (fn, wait = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

const GFGBentoGrid = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const gsapCtx = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    Promise.all(
      IMAGE_URLS.map(
        (src) =>
          new Promise((res) => {
            const img = new Image();
            img.src = src;
            img.onload = res;
            img.onerror = res;
          })
      )
    ).then(() => {
      if (!mounted) return;
      setImagesLoaded(true);
      setIsLoading(false);
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  // ❌ Commented out GSAP init
  // const initGsap = useCallback(() => {
  //   if (gsapCtx.current) {
  //     try {
  //       gsapCtx.current.revert();
  //     } catch (e) {
  //       console.error("GSAP context revert failed:", e);
  //     }
  //     gsapCtx.current = null;
  //   }

  //   const scopeNode = containerRef.current;
  //   if (!scopeNode) return;

  //   gsapCtx.current = gsap.context(() => {
  //     gsap.set(cardsRef.current.filter(Boolean), {
  //       x: (i) => (i % 2 === 0 ? 600 : -600),
  //       y: (i) => (i % 3 === 0 ? 300 : -300),
  //       opacity: 0,
  //       scale: 0.85,
  //       rotation: (i) => (i % 2 === 0 ? 12 : -12),
  //     });

  //     gsap.to(cardsRef.current.filter(Boolean), {
  //       x: 0,
  //       y: 0,
  //       opacity: 1,
  //       scale: 1,
  //       rotation: 0,
  //       duration: 0.9,
  //       ease: "power2.out",
  //       stagger: 0.08,
  //       scrollTrigger: {
  //         trigger: scopeNode,
  //         start: "top 70%",
  //         end: "bottom 20%",
  //         scrub: 1.2,
  //         toggleActions: "play none none none",
  //         markers: false,
  //       },
  //     });

  //     ScrollTrigger.refresh();
  //   }, scopeNode);
  // }, []);

  // ❌ Disable GSAP animation on images load
  // useEffect(() => {
  //   if (!imagesLoaded) return;
  //   initGsap();

  //   return () => {
  //     if (gsapCtx.current) {
  //       try {
  //         gsapCtx.current.revert();
  //         gsapCtx.current = null;
  //       } catch (e) {}
  //     }
  //   };
  // }, [imagesLoaded, initGsap]);

  // ❌ Disable resize re-init GSAP
  // useEffect(() => {
  //   if (!imagesLoaded) return;
  //   const handleResize = debounce(() => {
  //     initGsap();
  //     ScrollTrigger.refresh();
  //   }, 150);

  //   window.addEventListener("resize", handleResize);
  //   window.addEventListener("orientationchange", handleResize);
  //   return () => {
  //     window.removeEventListener("resize", handleResize);
  //     window.removeEventListener("orientationchange", handleResize);
  //   };
  // }, [imagesLoaded, initGsap]);

  const handleViewAllEvents = () => navigate("/events");

  if (isLoading) {
    return (
      <section className="relative py-20 bg-gradient-to-br from-green-950/50 via-green-900/30 to-emerald-900/50">
        {/* Loader skeleton remains same */}
        <div className="relative z-10 container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-400/30 backdrop-blur-sm mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-300 uppercase tracking-wider">Featured Events</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Highlights</span>
            </h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-nunito">
              Discover the amazing work and achievements of our GFG community through our featured events and workshops
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-400/20 rounded-3xl p-8 mb-12 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto auto-rows-fr">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`bg-green-800/20 rounded-2xl animate-pulse ${
                    i === 0
                      ? "md:col-span-2 md:row-span-2"
                      : i === 1
                      ? "md:row-span-2"
                      : i === 4
                      ? "md:row-span-2"
                      : i === 3
                      ? "md:col-span-2"
                      : "aspect-square"
                  }`}
                  style={{ minHeight: i === 0 ? "320px" : "180px" }}
                >
                  <div className="h-full bg-gradient-to-br from-green-700/30 to-emerald-700/30 rounded-2xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative py-20 bg-gradient-to-br from-green-950/50 via-green-900/30 to-emerald-900/50"
    >
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-400/30 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-300 uppercase tracking-wider">
              Featured Events
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Highlights
            </span>
          </h2>
          <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-light font-nunito">
            Discover the amazing work and achievements of our GFG community
            through our featured events and workshops
          </p>
        </div>

        {/* Cards Grid */}
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-400/20 rounded-3xl p-8 mb-12 shadow-2xl">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto "
            style={{ gridAutoRows: "minmax(150px, auto)" }}
          >
            <div
              ref={(el) => (cardsRef.current[0] = el)}
              className="card hero-card relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group "
              style={{
                backgroundImage: `url('/gridimg12.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "220px",
              }}
            />

            <div
              ref={(el) => (cardsRef.current[1] = el)}
              className="card vertical-card relative overflow-hidden rounded-2xl md:row-span-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
              style={{
                backgroundImage: `url('FreshersMeet.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "220px",
              }}
            />

            <div
              ref={(el) => (cardsRef.current[2] = el)}
              className="card square-card relative overflow-hidden rounded-2xl  transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
              style={{
                backgroundImage: `url('/gridimg18.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "240px",
              }}
            />

            <div
              ref={(el) => (cardsRef.current[3] = el)}
              className="card wide-card relative overflow-hidden rounded-2xl md:col-span-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
              style={{
                backgroundImage: `url('/gridimg3.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "260px",
              }}
            />
            <div
              ref={(el) => (cardsRef.current[6] = el)}
              className="card hero-card relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
              style={{
                backgroundImage: `url('teampic_2.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                maxHeight: "300px",
                minHeight: "220px",
                // maxWidth: "440px",
                // backgroundColor: "rgba(255, 255, 255, 0.03)",
              }}
            />

            <div
              ref={(el) => (cardsRef.current[7] = el)}
              className="card tall-card relative overflow-hidden rounded-2xl md:row-span-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
              style={{
                backgroundImage: `url('/teampic_1.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "220px",
                // maxHeight: "300px",
                // width: "400px"
              }}
            />

            <div
              ref={(el) => (cardsRef.current[4] = el)}
              className="card tall-card relative overflow-hidden rounded-2xl md:row-span-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
              style={{
                backgroundImage: `url('/FreshersMeet8.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                maxHeight: "300px",
                minHeight: "260px",
              }}
            />

            <div
              ref={(el) => (cardsRef.current[5] = el)}
              className="card hero-card relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
              style={{
                backgroundImage: `url('/pwgatefft.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                maxHeight: "300px",
                minHeight: "260px",
                // maxWidth: "480px",
                // backgroundColor: "rgba(255, 255, 255, 0.03)",
              }}
            />

            
            
{/* 
            <div
              ref={(el) => (cardsRef.current[5] = el)}
              className="card  relative overflow-hidden rounded-2xl  transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
              style={{
                backgroundImage: `url('/FreshersMeet3.webp')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "300px",
                // backgroundColor: "rgba(255, 255, 255, 0.03)",
              }}
            /> */}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center font-nunito">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-8 bg-gradient-to-r from-green-800/30 to-emerald-800/30 backdrop-blur-sm border border-green-400/20 rounded-3xl">
            <div className="text-left sm:text-center">
              <h3 className="text-2xl font-bold text-white mb-2 font-nunito">
                Explore all events in our Events section.
              </h3>
              <p className="text-green-100 text-lg font-nunito">
                Explore our full calendar of workshops, Events, and meetups.
              </p>
            </div>
            <div className="glowing-btn-wrapper blue rounded-full">
              <button
                onClick={handleViewAllEvents}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-full text-lg transition-all duration-300 flex justify-center items-center group"
              >
                <span>View All Events</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GFGBentoGrid;
