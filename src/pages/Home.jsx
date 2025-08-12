import { useEffect } from "react";
import { animateHomeUI } from "../animations/gsapAnimations";
import GFGBentoGrid from "../components/GFGBentoGrid";

function Home() {
  useEffect(() => {
    // Home UI animations
    const cleanup = animateHomeUI({
      titleEl: document.querySelector("h1"),
      descriptionEl: document.getElementById("home-desc"),
      getStartedBtnEl: document.getElementById("btn-join"),
      learnMoreBtnEl: document.getElementById("btn-events"),
      statsGridEl: document.getElementById("stats-grid"),
      countEl: document.getElementById("count-members"),
      countProjectsEl: document.getElementById("count-projects"),
      countWorkshopsEl: document.getElementById("count-workshops"),
    });

    return () => cleanup && cleanup();
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
          id="home-desc"
          className="text-lg md:text-xl text-green-100 max-w-3xl leading-relaxed font-light"
        >
          Join GFG BVCOE - learn, teach, and collaborate through workshops, events, project showcases and mentorship.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-6 mt-12">
          <button
            id="btn-join"
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg border border-green-300/30"
          >
            Join Now
          </button>
          <button
            id="btn-events"
            className="px-8 py-4 bg-transparent text-green-100 font-semibold rounded-full text-lg border-2 border-green-300/40 backdrop-blur-sm"
          >
            Explore Events
          </button>
        </div>

        {/* Stats */}
        <div
          id="stats-grid"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-center"
        >
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
            <div
              id="count-members"
              className="text-3xl font-bold text-green-300 mb-2"
            >
              0+
            </div>
            <div className="text-green-100">Active Members</div>
          </div>
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
            <div
              id="count-projects"
              className="text-3xl font-bold text-emerald-300 mb-2"
            >
              0+
            </div>
            <div className="text-green-100">Projects Completed</div>
          </div>
          <div className="bg-green-800/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
            <div
              id="count-workshops"
              className="text-3xl font-bold text-green-300 mb-2"
            >
              100+
            </div>
            <div className="text-green-100">Workshops Conducted</div>
          </div>
        </div>
      </div>

      {/* Bento Grid Section */}
      <div className="relative z-10">
        <GFGBentoGrid />
      </div>
    </div>
  );
}

export default Home;
