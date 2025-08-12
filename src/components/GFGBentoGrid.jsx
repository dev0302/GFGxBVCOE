import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const GFGBentoGrid = () => {
  const gridRef = useRef(null);
  const cardsRef = useRef([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    // Connect Lenis to GSAP ScrollTrigger
    lenisRef.current.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenisRef.current.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Optimized image preloading with better performance
    const imageUrls = [
      '/src/images/gfg1.jpg',
      '/src/images/gfg2.jpg',
      '/src/images/gfg3.jpg',
      '/src/images/gfg4.jpg',
      '/src/images/gfg5.jpg',
      '/src/images/gfgLogo.png'
    ];

    const preloadImages = async () => {
      setIsLoading(true);
      
      // Use Intersection Observer for better performance
      const imagePromises = imageUrls.map((url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails
          img.src = url;
          
          // Set low priority for non-critical images
          if (img.decode) {
            img.decode().then(resolve).catch(() => resolve());
          } else {
            resolve();
          }
        });
      });

      await Promise.all(imagePromises);
      setImagesLoaded(true);
      setIsLoading(false);
    };

    // Delay image loading slightly to prioritize initial render
    const timer = setTimeout(preloadImages, 100);

    return () => {
      clearTimeout(timer);
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  useEffect(() => {
    if (!imagesLoaded || !gridRef.current || isLoading) return;

    const cards = cardsRef.current;
    if (!cards.length) return;

    // Much simpler initial state - minimal transforms for better performance
    gsap.set(cards, {
      opacity: 0,
      y: 20, // Reduced from 40
      scale: 0.98, // Reduced from 0.95
    });

    // Simplified scroll trigger animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: gridRef.current,
        start: "top 90%", // Trigger later for better performance
        end: "bottom 10%",
        toggleActions: "play none none reverse",
        fastScrollEnd: true,
        preventOverlaps: true,
        // Reduce ScrollTrigger overhead
        onUpdate: () => {
          // Throttle updates for better performance
          if (lenisRef.current) {
            lenisRef.current.raf(performance.now());
          }
        },
      },
    });

    // Ultra-smooth animation with minimal complexity
    tl.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4, // Reduced from 0.6
      ease: "power1.out", // Simpler easing
      stagger: 0.08, // Reduced from 0.1
    });

    // Simplified hover animations with better performance
    cards.forEach((card) => {
      const cardEl = card;
      
      const onEnter = () => {
        gsap.to(cardEl, {
          y: -2, // Reduced from -4
          scale: 1.005, // Reduced from 1.01
          duration: 0.15, // Reduced from 0.2
          ease: "power1.out",
        });
      };

      const onLeave = () => {
        gsap.to(cardEl, {
          y: 0,
          scale: 1,
          duration: 0.15, // Reduced from 0.2
          ease: "power1.out",
        });
      };

      cardEl.addEventListener('mouseenter', onEnter);
      cardEl.addEventListener('mouseleave', onLeave);

      // Cleanup
      return () => {
        cardEl.removeEventListener('mouseenter', onEnter);
        cardEl.removeEventListener('mouseleave', onLeave);
      };
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [imagesLoaded, isLoading]);

  const addCardRef = (el) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  const handleViewAllEvents = () => {
    // Navigate to events page - you can replace this with your routing logic
    console.log('Navigating to events page...');
    // window.location.href = '/events'; // or use React Router navigation
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
            <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-light">
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
    <section className="relative py-20 bg-gradient-to-br from-green-950/50 via-green-900/30 to-emerald-900/50">
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
          <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-light">
            Discover the amazing work and achievements of our GFG community through our featured events and workshops
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-400/20 rounded-3xl p-8 mb-12 shadow-2xl">
          <div 
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
            style={{
              gridAutoRows: 'minmax(200px, auto)',
            }}
          >
            {/* Hero Card - Large */}
            <div 
              ref={addCardRef}
              className="card hero-card group relative overflow-hidden rounded-2xl col-span-2 row-span-2"
              style={{
                backgroundImage: `url('/src/images/gfg1.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="glass-overlay absolute bottom-0 left-0 right-0 p-6 bg-black/40 backdrop-blur-md border-t border-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-white mb-2">GFG Community</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Building a vibrant community of developers, learners, and innovators
                </p>
              </div>
            </div>

            {/* Vertical Card */}
            <div 
              ref={addCardRef}
              className="card vertical-card group relative overflow-hidden rounded-2xl row-span-2"
              style={{
                backgroundImage: `url('/src/images/gfg2.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="glass-overlay absolute bottom-0 left-0 right-0 p-6 bg-black/40 backdrop-blur-md border-t border-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Learning Hub</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Workshops, tutorials, and hands-on learning experiences
                </p>
              </div>
            </div>

            {/* Small Square Card */}
            <div 
              ref={addCardRef}
              className="card square-card group relative overflow-hidden rounded-2xl aspect-square"
              style={{
                backgroundImage: `url('/src/images/gfg3.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="glass-overlay absolute bottom-0 left-0 right-0 p-6 bg-black/40 backdrop-blur-md border-t border-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-lg font-bold text-white mb-2">Projects</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Showcasing innovative student projects
                </p>
              </div>
            </div>

            {/* Wide Card */}
            <div 
              ref={addCardRef}
              className="card wide-card group relative overflow-hidden rounded-2xl col-span-2"
              style={{
                backgroundImage: `url('/src/images/gfg4.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="glass-overlay absolute bottom-0 left-0 right-0 p-6 bg-black/40 backdrop-blur-md border-t border-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Events & Workshops</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Engaging events that bring the community together
                </p>
              </div>
            </div>

            {/* Tall Card */}
            <div 
              ref={addCardRef}
              className="card tall-card group relative overflow-hidden rounded-2xl row-span-2"
              style={{
                backgroundImage: `url('/src/images/gfg5.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="glass-overlay absolute bottom-0 left-0 right-0 p-6 bg-black/40 backdrop-blur-md border-t border-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white mb-2">Innovation</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Fostering creativity and technical excellence
                </p>
              </div>
            </div>

            {/* Small Square Card */}
            <div 
              ref={addCardRef}
              className="card square-card group relative overflow-hidden rounded-2xl aspect-square"
              style={{
                backgroundImage: `url('/src/images/gfgLogo.png')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="glass-overlay absolute bottom-0 left-0 right-0 p-6 bg-black/40 backdrop-blur-md border-t border-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-lg font-bold text-white mb-2">GFG BVCOE</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Your gateway to tech excellence
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-8 bg-gradient-to-r from-green-800/30 to-emerald-800/30 backdrop-blur-sm border border-green-400/20 rounded-3xl">
            <div className="text-left sm:text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Join More Events?</h3>
              <p className="text-green-100 text-lg">
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
