import GFGBentoGrid from "../components/GFGBentoGrid";
import { NavLink, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import Footer from "../components/Footer";
import ImageGrid from "../components/ImageGrid";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function Home() {
  const navigate = useNavigate();
  const titleRef = useRef();
  const descRef = useRef();
  const btnRef = useRef();
  const aboutSectionRef = useRef();
  const teamSectionRef = useRef();

  // State for the counters
  const [memberCount, setMemberCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [workshopCount, setWorkshopCount] = useState(0);

  // GSAP animations
  useGSAP(() => {
    // Hero entrance animations
    gsap.from(titleRef.current, { y: 50, opacity: 0, duration: 1.2, ease: "power2.out" });
    gsap.from(descRef.current, { y: 40, opacity: 0, duration: 1, ease: "power2.out", delay: 0.3 });
    gsap.from(btnRef.current, { y: 30, opacity: 0, duration: 0.8, ease: "power2.out", delay: 0.6 });

    // Number counting animation
    const counters = { members: 0, events: 0, workshops: 0 };
    gsap.to(counters, {
      duration: 2,
      ease: "power2.out",
      delay: 0.8,
      members: 50,
      events: 10,
      workshops: 10,
      onUpdate: () => {
        setMemberCount(Math.ceil(counters.members));
        setEventCount(Math.ceil(counters.events));
        setWorkshopCount(Math.ceil(counters.workshops));
      },
    });

    // Animate sections on scroll
    const sections = [aboutSectionRef.current, teamSectionRef.current];
    sections.forEach(section => {
      if (section) {
        gsap.from(section, {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none none",
          }
        });
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
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-16 text-center">
          {/* Title */}
          <h1
            ref={titleRef}
            className="text-2xl md:text-5xl font-bold text-white mb-8 tracking-tight leading-tight md:leading-tight pb-1"
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

          {/* CTAs with new animations */}
          <div ref={btnRef} className="flex flex-col sm:flex-row gap-6 mt-12 font-nunito items-center">
            <NavLink to="notfound">
              <button
                id="btn-join"
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/40"
              >
                Join Now
              </button>
            </NavLink>
            <button
              id="btn-about"
              onClick={() => navigate("/about")}
              className="px-8 py-4 bg-transparent text-green-100 font-semibold rounded-full text-lg border-2 border-green-300/40 backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:bg-green-400/20 hover:border-green-300"
            >
              About Us
            </button>
          </div>

          {/* Stats */}
          <div
            id="stats-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text- font-nunito"
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
      <section ref={aboutSectionRef} className="py-20 bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Who We <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Are</span>
          </h2>
          <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-light font-nunito mb-12">
            GFG BVCOE is a community of tech enthusiasts dedicated to fostering a culture of learning, innovation, and collaboration. We organize workshops, hackathons, and speaker sessions to help students grow their skills and connect with like-minded peers.
          </p>
          <button
            onClick={() => navigate('/about')}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/40"
          >
            Learn More About Us
          </button>
        </div>
      </section>

      {/* Team Section */}
      <section ref={teamSectionRef} className="py-20 bg-[#161629] text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Team</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light font-nunito mb-12">
            We are a group of passionate students and faculty dedicated to guiding our community. Our diverse team works together to create impactful events and provide mentorship for all members.
          </p>
          <button
            onClick={() => navigate('/team')}
            className="px-8 py-4 bg-transparent text-green-100 font-semibold rounded-full text-lg border-2 border-green-300/40 backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:bg-green-400/20 hover:border-green-300"
          >
            See the Full Team
          </button>
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
