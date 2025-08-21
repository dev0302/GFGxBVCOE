import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useEffect } from "react";
import Lenis from "lenis";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const containerRef = useRef();
  const heroRef = useRef();
  const visionRef = useRef();
  const missionRef = useRef();
  const featuresRef = useRef();
  const benefitsRef = useRef();
  const ctaRef = useRef();


  useEffect(() => {
        const lenis = new Lenis({
          // duration:5,
          lerp: 0.05,
          smoothWheel: true,
        });
    
        // Sync Lenis scroll with ScrollTrigger
        lenis.on("scroll", ScrollTrigger.update);
    
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    
      
      
    
        return () => {
          lenis.destroy(); // cleanup on unmount
        };
      });



  useGSAP(() => {
    // Set initial states
    gsap.set([heroRef.current, visionRef.current, missionRef.current, featuresRef.current, benefitsRef.current, ctaRef.current], {
      opacity: 0,
      y: 50
    });

    // Hero section animation
    gsap.fromTo(heroRef.current, 
      { opacity: 0, y: 100 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1.2, 
        ease: "power3.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none",
           
        }
      }
    );

    // Vision section animation
    gsap.fromTo(visionRef.current, 
      { opacity: 0, y: 60, scale: 0.95 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 1, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: visionRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none",
           
        }
      }
    );

    // Mission section animation
    gsap.fromTo(missionRef.current, 
      { opacity: 0, y: 60, scale: 0.95 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 1, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: missionRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none",
           
        }
      }
    );

    // Features section animation
    gsap.fromTo(featuresRef.current, 
      { opacity: 0, y: 60 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none",
           
        }
      }
    );

    // Benefits section animation
    gsap.fromTo(benefitsRef.current, 
      { opacity: 0, y: 60 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: benefitsRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none",
           
        }
      }
    );

    // Animate individual benefit cards with stagger
    const benefitCards = benefitsRef.current?.querySelectorAll('.benefits-grid > div');
    if (benefitCards) {
      gsap.fromTo(benefitCards, 
        { opacity: 0, y: 40, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.8, 
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: benefitsRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none none",
             
          }
        }
      );
    }

    // CTA section animation
    gsap.fromTo(ctaRef.current, 
      { opacity: 0, y: 60, scale: 0.95 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 1, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none",
           
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen darkthemebg overflow-hidden">

      <div className="relative z-10">
        {/* Hero Section */}
        <section ref={heroRef} className="pt-32 pb-6 px-6 md:pb-10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] rounded-full border border-gray-400 backdrop-blur-sm mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-300 uppercase tracking-wider">About GFG BVCOE</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight font-alfa tracking-tight">
              <span id="about_us_para" className=" bg-clip-text  font-alfa text-richblack-25">
                   ABOUT US    
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-normal font-nunito">
              Empowering students through collaborative learning, innovation, and knowledge sharing in a dynamic tech community.
            </p>
          </div>
        </section>

        <div className="Upper_div flex flex-col gap-0 md:flex-row mx-auto md:gap-10 md:max-w-[80%]">

          {/* Vision Section */}
        <section ref={visionRef} className="py-8 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-3xl p-6 md:px-6 py-10 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-400 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 font-nunito">
                  Our{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    Vision
                  </span>
                </h2>
              </div>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed text-center max-w-xl mx-auto font-nunito font-normal">
                The GFG BVCOE Student Chapter envisions a collaborative and dynamic learning environment where students continuously grow, innovate, and share knowledge. We aim to cultivate a community that fosters curiosity, skill enhancement, and the exchange of ideas, ensuring that every member contributes to a collective journey of learning and discovery.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section ref={missionRef} className="py-8 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-3xl p-6 md:px-6 py-10 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 font-nunito">
                  Our{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                    Mission
                  </span>
                </h2>
              </div>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed text-center max-w-xl mx-auto font-nunito font-normal">
                Our mission is to provide a supportive and engaging platform where students can learn, teach, and grow through seminars, workshops, talks, competitions, and project showcases. We are dedicated to fostering peer-driven learning, equipping students with the necessary guidance and resources to excel in their chosen fields while embracing the spirit of continuous innovation and teamwork.
              </p>
            </div>
          </div>
        </section>

        </div>

        {/* What Sets Us Apart Section */}
        <section ref={featuresRef} className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 font-nunito">
                What Sets Us{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  Apart?
                </span>
              </h2>
              <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-3xl p-6 max-w-4xl mx-auto md:p-12 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group">
                <p className="text-base md:text-2xl text-gray-300 leading-relaxed font-nunito font-normal">
                  Our dedication to create a society where anyone can work on their goals by learning and teaching while getting the guidance they need.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section ref={benefitsRef} className="py-6 px-6 font-nunito">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-8 font-nunito">
                What You'll Get from{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Geeks for Geeks
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 benefits-grid">
              <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-4 font-montserrat">Project Showcases</h3>
                <p className="text-center text-gray-300 leading-relaxed">
                  Engage in impactful project showcases, gaining recognition within our dynamic community.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-center text-xl font-bold text-white mb-4 font-montserrat">Personalized Mentorship</h3>
                <p className="text-center text-gray-300 leading-relaxed font-nunito">
                  Receive personalized mentorship tailored to your individual technical journey from experienced members.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-center text-xl font-bold text-white mb-4 font-montserrat">Community Connections</h3>
                <p className="text-center text-gray-300 leading-relaxed font-nunito">
                  Cultivate lasting connections within a close-knit community where collaboration and shared learning thrive.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-center text-xl font-bold text-white mb-4 font-montserrat">Exclusive Events</h3>
                <p className="text-center text-gray-300 leading-relaxed font-nunito">
                  Access exclusive events, workshops, and seminars for hands-on experiences and valuable networking opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section ref={ctaRef} className="py-6 mt-12 mb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-3xl p-8 md:p-12 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-8 font-nunito">
                Want to Join{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                  Geeks for Geeks?
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed font-alfa font-light">
                Connect with our team today to become a part of a society where you are the protagonist of your technical journey!
              </p>
              <button
  onClick={() =>
    window.open("https://chat.whatsapp.com/Dr1gPgzmQgtJyFoXAvAnDC", "_blank")
  }
  className="px-8 py-4 md:px-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg rounded-full border border-green-300/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 font-nunito md:text-xl"
>
  Get Started Today
</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
