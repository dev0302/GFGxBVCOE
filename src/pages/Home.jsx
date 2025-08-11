import { useEffect, useRef } from "react";
import { gsap } from "gsap";

function Home() {
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const backgroundRef = useRef(null);
  const floatingElementsRef = useRef(null);

  useEffect(() => {
    // Create floating background elements
    const createFloatingElements = () => {
      const container = floatingElementsRef.current;
      if (!container) return;

      // Clear existing elements
      container.innerHTML = '';

      // Create multiple floating shapes
      for (let i = 0; i < 15; i++) {
        const element = document.createElement('div');
        element.className = 'absolute rounded-full opacity-15';
        
        // Random properties
        const size = Math.random() * 80 + 40;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.left = `${x}%`;
        element.style.top = `${y}%`;
        element.style.background = `linear-gradient(45deg, 
          hsl(${Math.random() * 40 + 140}, 70%, 60%), 
          hsl(${Math.random() * 40 + 160}, 70%, 60%))`;
        
        container.appendChild(element);
        
        // Animate floating
        gsap.to(element, {
          y: -80,
          x: Math.random() * 150 - 75,
          rotation: 360,
          duration: duration,
          delay: delay,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        });
      }
    };

    // Initial animation timeline
    const tl = gsap.timeline({ ease: "power3.out" });
    
    // Background entrance
    tl.fromTo(backgroundRef.current,
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }
    );
    
    // Create floating elements after background loads
    setTimeout(createFloatingElements, 500);
    
    // Title animation with text reveal effect
    tl.fromTo(titleRef.current,
      { 
        y: 100, 
        opacity: 0,
        scale: 0.8,
        rotationX: 90
      },
      { 
        y: 0, 
        opacity: 1, 
        scale: 1,
        rotationX: 0,
        duration: 1.2, 
        ease: "back.out(1.7)" 
      },
      "-=0.5"
    );
    
    // Description animation with staggered text reveal
    const descriptionText = descriptionRef.current;
    if (descriptionText) {
      const words = descriptionText.textContent.split(' ');
      descriptionText.innerHTML = '';
      
      words.forEach((word, index) => {
        const span = document.createElement('span');
        span.textContent = word + ' ';
        span.style.opacity = '0';
        span.style.display = 'inline-block';
        span.style.transform = 'translateY(20px)';
        descriptionText.appendChild(span);
        
        gsap.to(span, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 1.5 + (index * 0.1),
          ease: "power2.out"
        });
      });
    }

    // Continuous subtle animations
    gsap.to(titleRef.current, {
      y: -10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    // Parallax effect on scroll
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      
      if (backgroundRef.current) {
        gsap.to(backgroundRef.current, {
          y: rate,
          duration: 0.1
        });
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div 
        ref={backgroundRef}
        className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-900 to-emerald-900"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-transparent to-emerald-600/20"></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div ref={floatingElementsRef} className="absolute inset-0 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Main Title */}
        <h1 
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
          style={{
            textShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
            background: 'linear-gradient(135deg, #22c55e, #10b981, #059669)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          GFG x BVCOE
        </h1>

        {/* Description */}
        <p 
          ref={descriptionRef}
          className="text-lg md:text-xl text-green-100 max-w-3xl leading-relaxed font-light"
        >
          Empowering students with cutting-edge technology skills, fostering innovation, and building a community of passionate developers. Join us in shaping the future of software engineering through collaborative learning, hands-on projects, and industry connections.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mt-12">
          <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-xl hover:shadow-green-500/40 transform hover:scale-105 border border-green-300/30">
            Get Started
          </button>
          <button className="px-8 py-4 bg-transparent text-green-100 font-semibold rounded-full text-lg border-2 border-green-300/40 hover:bg-green-700/20 hover:text-white transition-all duration-300 backdrop-blur-sm">
            Learn More
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-center">
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300">
            <div className="text-3xl font-bold text-green-300 mb-2">500+</div>
            <div className="text-green-100">Active Members</div>
          </div>
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300">
            <div className="text-3xl font-bold text-emerald-300 mb-2">50+</div>
            <div className="text-green-100">Projects Completed</div>
          </div>
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300">
            <div className="text-3xl font-bold text-green-300 mb-2">100+</div>
            <div className="text-green-100">Workshops Conducted</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;