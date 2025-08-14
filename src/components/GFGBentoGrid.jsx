import { useState, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const GFGBentoGrid = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef();
  const cardsRef = useRef([]);
  const navigate = useNavigate();

  // Simple image loading without GSAP
  useEffect(() => {
    const timer = setTimeout(() => {
      setImagesLoaded(true);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // GSAP animations for smooth entrance
  useGSAP(() => {
    // Set initial states - images start from infinity
    gsap.set(cardsRef.current, {
      x: (i) => (i % 2 === 0 ? 1000 : -1000), // Alternate left/right infinity
      y: (i) => (i % 3 === 0 ? 500 : -500),    // Alternate top/bottom infinity
      opacity: 0,
      scale: 0.5,
      rotation: (i) => (i % 2 === 0 ? 45 : -45) // Alternate rotation
    });

    // Animate images to their positions with stagger and scrub
    gsap.to(cardsRef.current, {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 1,
      ease: "power2.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 50%",
        end: "bottom 10%",
        scrub: 2,
        toggleActions: "play none none none"
      }
    });

    // Pin the section after animation completes so images stick in place
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "bottom 10%",
      end: "bottom -20%",
      pin: true,
      pinSpacing: true
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [imagesLoaded]);

  const handleViewAllEvents = () => {
    navigate('/events');
  };

  // Loading skeleton while images are loading
  if (isLoading) {
    return (
      <section className="relative py-20 bg-gradient-to-br from-green-950/50 via-green-900/30 to-emerald-900/50">
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

          {/* Loading skeleton */}
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-400/20 rounded-3xl p-8 mb-12 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`bg-green-800/20 rounded-2xl animate-pulse ${
                    i === 0 ? 'col-span-2 row-span-2' : 
                    i === 1 ? 'row-span-2' : 
                    i === 4 ? 'row-span-2' : 
                    i === 3 ? 'col-span-2' : 'aspect-square'
                  }`}
                  style={{ minHeight: i === 0 ? '400px' : i === 1 || i === 4 ? '300px' : '200px' }}
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
    <section ref={containerRef} className="relative py-20 bg-gradient-to-br from-green-950/50 via-green-900/30 to-emerald-900/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Section Container */}
      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-400/30 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-300 uppercase tracking-wider">Featured Events</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Highlights</span>
          </h2>
          <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-light font-nunito">
            Discover the amazing work and achievements of our GFG community through our featured events and workshops
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-400/20 rounded-3xl p-8 mb-12 shadow-2xl">
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
            style={{
              gridAutoRows: 'minmax(200px, auto)',
            }}
          >
            {/* Hero Card - Large */}
            <div 
              ref={el => cardsRef.current[0] = el}
              className="card hero-card relative overflow-hidden rounded-2xl col-span-2 row-span-2"
              style={{
                backgroundImage: `url('/src/images/gfg1.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Vertical Card */}
            <div 
              ref={el => cardsRef.current[1] = el}
              className="card vertical-card relative overflow-hidden rounded-2xl row-span-2"
              style={{
                backgroundImage: `url('/src/images/gfg2.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Small Square Card */}
            <div 
              ref={el => cardsRef.current[2] = el}
              className="card square-card relative overflow-hidden rounded-2xl aspect-square"
              style={{
                backgroundImage: `url('/src/images/gfg3.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Wide Card */}
            <div 
              ref={el => cardsRef.current[3] = el}
              className="card wide-card relative overflow-hidden rounded-2xl col-span-2"
              style={{
                backgroundImage: `url('/src/images/gfg4.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Tall Card */}
            <div 
              ref={el => cardsRef.current[4] = el}
              className="card tall-card relative overflow-hidden rounded-2xl row-span-2"
              style={{
                backgroundImage: `url('/src/images/gfg5.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Small Square Card */}
            <div 
              ref={el => cardsRef.current[5] = el}
              className="card square-card relative overflow-hidden rounded-2xl aspect-square"
              style={{
                backgroundImage: `url('/src/images/gfgLogo.png')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="text-center font-nunito">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-8 bg-gradient-to-r from-green-800/30 to-emerald-800/30 backdrop-blur-sm border border-green-400/20 rounded-3xl">
            <div className="text-left sm:text-center">
              <h3 className="text-2xl font-bold text-white mb-2 font-nunito">Ready to Join More Events?</h3>
              <p className="text-green-100 text-lg font-nunito">
                Explore our full calendar of workshops, hackathons, and community meetups
              </p>
            </div>
            <button
              onClick={handleViewAllEvents}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-full text-lg border border-green-300/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 flex items-center gap-3 group"
            >
              <span>View All Events</span>
              <svg 
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GFGBentoGrid;
