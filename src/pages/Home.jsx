import GFGBentoGrid from "../components/GFGBentoGrid";
import { NavLink, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState, useEffect } from "react";
import Footer from "../components/Footer";
import ImageGrid from "../components/ImageGrid";
import Lenis from "lenis";
import { useFeatureFlags } from "../context/FeatureFlags.jsx";


gsap.registerPlugin(ScrollTrigger);

function Home() {
  const { leaderboardEnabled } = useFeatureFlags();

  useEffect(() => {
  const lenis = new Lenis({ lerp: 0.05, smoothWheel: true });

  lenis.on("scroll", ScrollTrigger.update);

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  ScrollTrigger.refresh();

  return () => {
    lenis.destroy();
  };
}, []);

  
  const navigate = useNavigate();
  const titleRef = useRef();
  const descRef = useRef();
  const btnRef = useRef();
  const teamTitleRef = useRef();
  const teamCardsRef = useRef();

  // State for the counters
  const [memberCount, setMemberCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [workshopCount, setWorkshopCount] = useState(0);

  // GSAP animations
  useGSAP(() => {
    // Hero entrance animations
    gsap.from(titleRef.current, {
      y: 50,
      opacity: 0,
      duration: 1.2,
      ease: "power2.out",
    });
    gsap.from(descRef.current, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      delay: 0.3,
    });
    gsap.from(btnRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.6,
    });

    // Number counting animation
    const counters = { members: 0, events: 0, workshops: 0 };
    gsap.to(counters, {
      duration: 4,
      ease: "power2.out",
      delay: 0.8,
      members: 100,
      events: 10,
      workshops: 10,
      onUpdate: () => {
        setMemberCount(Math.ceil(counters.members));
        setEventCount(Math.ceil(counters.events));
        setWorkshopCount(Math.ceil(counters.workshops));
      },
    });

    // Team section animations
    gsap.from(teamTitleRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: teamTitleRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });

    gsap.from(teamCardsRef.current?.children, {
      y: 80,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.2,
      scrollTrigger: {
        trigger: teamCardsRef.current,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  }, []);

  return (
    <div className="relative overflow-x-hidden">
      {/* Hero Section with Background */}
      <div className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-900 to-emerald-900">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-transparent to-emerald-600/20"></div>
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-20 text-center">
          {/* Title */}
          <h1
            ref={titleRef}
            className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight pt-8 leading-tight md:leading-tight pb-1"
            style={{
              background: "linear-gradient(135deg, #22c55e, #10b981, #059669)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Empowering Students for
            <br />
            a Brighter Future
          </h1>

          {/* Description */}
          <p
            ref={descRef}
            id="home-desc"
            className="text-lg md:text-xl text-green-100 max-w-3xl leading-relaxed font-light font-nunito"
          >
            Join GFG BVCOE - learn, teach, and collaborate through workshops, events, project showcases and mentorship.
          </p>

          {/* CTAs */}
          <div
            ref={btnRef}
            className="flex flex-col sm:flex-row gap-6 mt-12 font-nunito items-center"
          >
            <NavLink to="/results">
              <button
            id="btn-join"
            class="relative px-5 py-4 bg-gradient-to-r
                   text-white font-bold text- rounded-full transition-all duration-500 ease-in-out 
                   transform hover:-translate-y-2 hover:scale-110 
                   shadow-lg 
                   border-2 border-white/20
                   overflow-hidden group
                   "
        >
            <span class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></span>
            
          
            <span class="relative z-10 flex items-center justify-center">
                <span class="mr-3">2025 Execoms Result out</span>
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
            </span>
        </button>
            </NavLink>
            <button
              id="btn-about"
              onClick={() => navigate("/about")}
              className="px-8 py-4 bg-transparent text-green-100 font-semibold rounded-full text-lg border-2 border-green-300/40 backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:bg-green-400/20 hover:border-green-300"
            >
              About Us
            </button>
            {leaderboardEnabled && (
              <button
                onClick={() => navigate('/leaderboard')}
                className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-full hover:bg-white/15 transition-all"
              >
                View Leaderboard
              </button>
            )}
          </div>

          {/* Stats */}
          <div
            id="stats-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 font-nunito"
          >
            <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group">
              <div
                id="count-members"
                className="text-3xl font-bold text-green-300 mb-2"
              >
                {memberCount}+
              </div>
              <div className="text-green-100">Active Members</div>
            </div>
            <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group">
              <div
                id="count-events"
                className="text-3xl font-bold text-emerald-300 mb-2"
              >
                {eventCount}+
              </div>
              <div className="text-green-100">Events Held</div>
            </div>
            <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group">
              <div
                id="count-workshops"
                className="text-3xl font-bold text-green-300 mb-2"
              >
                {workshopCount}+
              </div>
              <div className="text-green-100">Workshops Conducted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Section */}
      <div className="relative z-10">
        <GFGBentoGrid />
      </div>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Who We{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Are
            </span>
          </h2>
          <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-light font-nunito mb-12">
            GFG BVCOE is a community of tech enthusiasts dedicated to fostering
            a culture of learning, innovation, and collaboration. We organize
            workshops, hackathons, and speaker sessions to help students grow
            their skills and connect with like-minded peers.
          </p>
          <button
            onClick={() => navigate("/about")}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/40"
          >
            Learn More About Us
          </button>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-[#161629] text-white relative overflow-hidden border-b-2 border-gray-600 border-opacity-40">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-green-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>

        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <div ref={teamTitleRef} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Meet Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-pulse">
                Team
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light font-nunito mb-8">
              We are a group of passionate students and faculty dedicated to
              guiding our community. Our diverse team works together to create
              impactful events and provide mentorship for all members.
            </p>
          </div>

          {/* Team Preview Grid */}
          <div ref={teamCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {/* Chair Person - Featured */}
            <div className="lg:col-span-1 md:col-span-2 group">
              <div className="relative bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-3xl p-8 border border-green-400/30 hover:border-green-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 backdrop-blur-sm">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-green-400/50 shadow-lg group-hover:border-green-400 transition-colors duration-300">
                    <img 
                      src="/Toshika.webp" 
                      alt="Toshika Goswami"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors duration-300">
                    Toshika Goswami
                  </h3>
                  <p className="text-green-300 text-lg font-semibold mb-2">Chair Person</p>
                  <p className="text-gray-300 text-sm mb-4">CSE • 4th Year</p>
                  
                  {/* Social Links */}
                  <div className="flex justify-center gap-3">
                    <a 
                      href="mailto:toshikagoswami4@gmail.com"
                      className="w-10 h-10 bg-green-500/80 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-110 transition-all duration-300"
                      title="Email"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/toshika-goswami-39791022a"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-600/80 rounded-full flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300"
                      title="LinkedIn"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.328v15.344C1 18.4 1.595 19 2.328 19h15.34c.734 0 1.332-.6 1.332-1.328V2.328C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Vice Chair Person */}
            <div className="group">
              <div className="relative bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl p-6 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-3 border-blue-400/50 shadow-lg group-hover:border-blue-400 transition-colors duration-300">
                    <img 
                      src="/Kartik.webp" 
                      alt="Kartik Bhattacharya"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">
                    Kartik Bhattacharya
                  </h3>
                  <p className="text-blue-300 font-semibold mb-1">Vice-Chairperson</p>
                  <p className="text-gray-300 text-sm mb-3">CSE • 3rd Year</p>
                  
                  <div className="flex justify-center gap-2">
                    <a 
                      href="mailto:kartikbhattacharya10@gmail.com"
                      className="w-8 h-8 bg-blue-500/80 rounded-full flex items-center justify-center hover:bg-blue-400 hover:scale-110 transition-all duration-300"
                      title="Email"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                    <a 
                      href="https://linkedin.com/in/kafiltafish21"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-blue-600/80 rounded-full flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300"
                      title="LinkedIn"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.328v15.344C1 18.4 1.595 19 2.328 19h15.34c.734 0 1.332-.6 1.332-1.328V2.328C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/_kafiltafish_21_/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-pink-600/80 rounded-full flex items-center justify-center hover:bg-pink-500 hover:scale-110 transition-all duration-300"
                      title="Instagram"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2C6.686 2 6.343 2.014 5.514 2.072 4.69 2.13 4.188 2.333 3.77 2.551a2.5 2.5 0 0 0-.919.919C2.333 4.188 2.13 4.69 2.072 5.514 2.014 6.343 2 6.686 2 10s.014 3.657.072 4.486c.058.824.261 1.326.479 1.744a2.5 2.5 0 0 0 .919.919c.418.218.92.421 1.744.479.829.058 1.168.072 4.486.072s3.657-.014 4.486-.072c.824-.058 1.326-.261 1.744-.479a2.5 2.5 0 0 0 .919-.919c.218-.418.421-.92.479-1.744.058-.829.072-1.168.072-4.486s-.014-3.657-.072-4.486c-.058-.824-.261-1.326-.479-1.744a2.5 2.5 0 0 0-.919-.919c-.418-.218-.92-.421-1.744-.479C13.657 2.014 13.314 2 10 2zm0 1.5c3.136 0 3.389.007 4.61.045.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.919.11.281.24.705.275 1.485.038 1.22.045 1.475.045 4.61s-.007 3.389-.045 4.61c-.035.78-.166 1.204-.275 1.486a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.919.598-.28.11-.704.24-1.485.275-1.22.038-1.475.045-4.61.045s-3.389-.007-4.61-.045c-.78-.035-1.203-.166-1.485-.275a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.704-.275-1.485-.038-1.22-.045-1.475-.045-4.61s.007-3.389.045-4.61c.035-.78.166-1.203.275-1.485.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.281-.11.704-.24 1.485-.275C6.611 3.507 6.864 3.5 10 3.5z" clipRule="evenodd"/>
                        <path d="M10 5.838a4.162 4.162 0 1 0 0 8.324 4.162 4.162 0 0 0 0-8.324zM10 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4.208-7.208a.972.972 0 1 1-1.944 0 .972.972 0 0 1 1.944 0z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Lead */}
            <div className="group">
              <div className="relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl p-6 border border-purple-400/30 hover:border-purple-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-3 border-purple-400/50 shadow-lg group-hover:border-purple-400 transition-colors duration-300">
                    <img 
                      src="/Archita.webp" 
                      alt="Archita"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors duration-300">
                    Archita
                  </h3>
                  <p className="text-purple-300 font-semibold mb-1">Design & Creative Lead</p>
                  <p className="text-gray-300 text-sm mb-3">IT • 3rd Year</p>
                  
                  <div className="flex justify-center gap-2">
                    <a 
                      href="mailto:archita770@gmail.com"
                      className="w-8 h-8 bg-purple-500/80 rounded-full flex items-center justify-center hover:bg-purple-400 hover:scale-110 transition-all duration-300"
                      title="Email"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/archita-337521376"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-blue-600/80 rounded-full flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300"
                      title="LinkedIn"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.328v15.344C1 18.4 1.595 19 2.328 19h15.34c.734 0 1.332-.6 1.332-1.328V2.328C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/archiitta.r?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-pink-600/80 rounded-full flex items-center justify-center hover:bg-pink-500 hover:scale-110 transition-all duration-300"
                      title="Instagram"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2C6.686 2 6.343 2.014 5.514 2.072 4.69 2.13 4.188 2.333 3.77 2.551a2.5 2.5 0 0 0-.919.919C2.333 4.188 2.13 4.69 2.072 5.514 2.014 6.343 2 6.686 2 10s.014 3.657.072 4.486c.058.824.261 1.326.479 1.744a2.5 2.5 0 0 0 .919.919c.418.218.92.421 1.744.479.829.058 1.168.072 4.486.072s3.657-.014 4.486-.072c.824-.058 1.326-.261 1.744-.479a2.5 2.5 0 0 0 .919-.919c.218-.418.421-.92.479-1.744.058-.829.072-1.168.072-4.486s-.014-3.657-.072-4.486c-.058-.824-.261-1.326-.479-1.744a2.5 2.5 0 0 0-.919-.919c-.418-.218-.92-.421-1.744-.479C13.657 2.014 13.314 2 10 2zm0 1.5c3.136 0 3.389.007 4.61.045.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.919.11.281.24.705.275 1.485.038 1.22.045 1.475.045 4.61s-.007 3.389-.045 4.61c-.035.78-.166 1.204-.275 1.486a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.919.598-.28.11-.704.24-1.485.275-1.22.038-1.475.045-4.61.045s-3.389-.007-4.61-.045c-.78-.035-1.203-.166-1.485-.275a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.704-.275-1.485-.038-1.22-.045-1.475-.045-4.61s.007-3.389.045-4.61c.035-.78.166-1.203.275-1.485.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.281-.11.704-.24 1.485-.275C6.611 3.507 6.864 3.5 10 3.5z" clipRule="evenodd"/>
                        <path d="M10 5.838a4.162 4.162 0 1 0 0 8.324 4.162 4.162 0 0 0 0-8.324zM10 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4.208-7.208a.972.972 0 1 1-1.944 0 .972.972 0 0 1 1.944 0z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <button
              onClick={() => navigate("/team")}
              className="group relative px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-full text-lg transition-all duration-500 ease-in-out transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40 border-2 border-transparent hover:border-emerald-300/50 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></span>
              <span className="relative z-10 flex items-center justify-center">
                <span className="mr-3">Meet the Full Team</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Image Grid */}
      <ImageGrid />

      {/* Footer */}
      <Footer />
    </div>

  );
}

export default Home;
