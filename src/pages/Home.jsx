import GFGBentoGrid from "../components/GFGBentoGrid";
import TeamSection from "../components/TeamSection";
import { NavLink, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import Footer from "../components/Footer";



function Home() {
  const navigate = useNavigate();
  const titleRef = useRef();
  const descRef = useRef();
  const btnRef = useRef();

  // GSAP animations for smooth entrance
  useGSAP(() => {
    // Title animation
    gsap.from(titleRef.current, {
      y: 50,
      opacity: 0,
      duration: 1.2,
      ease: "power2.out"
    });

    // Description animation
    gsap.from(descRef.current, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      delay: 0.3
    });

    // Buttons animation
    gsap.from(btnRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.6
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden mt-5">
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

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6 pt-16 text-center">
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

        {/* CTAs */}
        <div ref={btnRef} className="flex flex-col sm:flex-row gap-6 mt-12 font-nunito">
          <NavLink to="notfound"><button
            id="btn-join"
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg border border-green-300/30 hover:from-green-600 hover:to-emerald-600 hover:scale-105 transition-all duration-300"
          >
            Join Now
          </button ></NavLink>
          <button
            id="btn-about"
            onClick={() => navigate('/about')}
            className="px-8 py-4 bg-transparent text-green-100 font-semibold rounded-full text-lg border-2 border-green-300/40 backdrop-blur-sm hover:bg-green-300/10 hover:scale-105 transition-all duration-300 font-nunito"
          >
            About Us
          </button>
        </div>

        {/* Stats */}
        <div
          id="stats-grid"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text- font-nunito"
        >
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300 hover:scale-105">
            <div
              id="count-members"
              className="text-3xl font-bold text-green-300 mb-2"
            >
              50+
            </div>
            <div className="text-green-100">Active Members</div>
          </div>
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300 hover:scale-105">
            <div
              id="count-events"
              className="text-3xl font-bold text-emerald-300 mb-2"
            >
              10+
            </div>
            <div className="text-green-100">Events Held</div>
          </div>
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20 hover:bg-green-800/40 transition-all duration-300 hover:scale-105">
            <div
              id="count-workshops"
              className="text-3xl font-bold text-green-300 mb-2"
            >
              10+
            </div>
            <div className="text-green-100">Workshops Conducted</div>
          </div>
        </div>
      </div>

      Bento Grid Section
      <div className="relative z-10">
        <GFGBentoGrid />
      </div>

      {/* Team Section */}
      {/* <div className="relative z-10">
        <TeamSection />
      </div> */}


      {/* footer */}

      <Footer></Footer>

  


    </div>
  );
}

export default Home;
