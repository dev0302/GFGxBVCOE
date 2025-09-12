import React, { useRef, useEffect, useState } from "react";
import teamData from "../data/teamData";
import NewCard from "../components/NewCard";
import headsData from "../data/headsData";
import FacultyIncharge from "../images/RachnaNarula.jpeg";
import Lenis from "lenis";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function Team2() {
  const [activeTab, setActiveTab] = useState("core");

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);

  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const teamGridRef = useRef(null);

  // useGSAP(
  //   () => {
  //     gsap.fromTo(
  //       heroRef.current,
  //       { opacity: 0, y: 50 },
  //       {
  //         opacity: 1,
  //         y: 0,
  //         duration: 1,
  //         ease: "power3.out",
  //         scrollTrigger: {
  //           trigger: heroRef.current,
  //           start: "top 85%",
  //         },
  //       }
  //     );

  //     if (teamGridRef.current) {
  //       gsap.fromTo(
  //         teamGridRef.current.children,
  //         { opacity: 0, y: 40 },
  //         {
  //           opacity: 1,
  //           y: 0,
  //           duration: 0.8,
  //           ease: "power2.out",
  //           stagger: 0.15,
  //           scrollTrigger: {
  //             trigger: teamGridRef.current,
  //             start: "top 80%",
  //           },
  //         }
  //       );
  //     }
  //   },
  //   { scope: containerRef }
  // );

  useEffect(() => {
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  }, [activeTab]);

  const displayedData = activeTab === "core" ? teamData : headsData;

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen darkthemebg pt-32 overflow-hidden"
    >
      {/* Hero Section */}
      <section ref={heroRef} className="pb-10 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight font-alfa tracking-tight">
            Meet Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
              Team
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-nunito font-normal">
            The passionate minds behind GFG BVCOE Student Chapter, driving
            innovation and fostering a community of learners.
          </p>
        </div>
      </section>

      {/* Faculty Card */}
      <div className="darkthemebg2 rounded-2xl px-8 py-6 max-w-4xl mx-auto border-2 border-gray-300 border-opacity-20 transition-shadow duration-300 hover:shadow-xl w-10/12 md:py-10 md:px-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative shrink-0">
            <img
              src={FacultyIncharge}
              alt="RachnaNarula"
              loading="eager"
              className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-indigo-500 object-cover"
            />
            <span className="absolute -bottom-2 right-0 w-4 h-4 bg-green-400 rounded-full ring-2 ring-gray-900"></span>
          </div>
          <div className="text-left md:text-left flex-1">
            <h2 className="text-white mb-1 text-center md:text-left text-lg font-bold font-montserrat">
              Ms. Rachna Narula
            </h2>
            <h3 className="text-indigo-400 text-base font-medium mb-3 text-center md:text-left">
              Faculty Incharge, GFGxBVCOE
            </h3>
            <p className="text-[12px] md:text-sm leading-relaxed text-center md:text-left text-gray-300 mt-1">
              Empowering students with mentorship that blends wisdom, empathy,
              and creativity. Her guidance fosters a culture of growth,
              collaboration, and emotional intelligence—making every student
              feel seen and supported.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 max-w-4xl mx-auto w-10/12 flex justify-center">
        <div className="inline-flex p-1 rounded-full border border-gray-300/20 bg-[#1e1e2f]">
          <button
            onClick={() => setActiveTab("core")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "core"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Core
          </button>
          <button
            onClick={() => setActiveTab("heads")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "heads"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Heads
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={teamGridRef}
        className="TEAM_SECTION mt-16 justify-center items-center flex flex-wrap w-10/12 mx-auto gap-16 pb-12 md:gap-y-20"
      >
        {displayedData && displayedData.length > 0 ? (
          displayedData.map((person, index) => (
            <NewCard key={`${activeTab}-${index}`} person={person} />
          ))
        ) : (
          <div className="text-center text-gray-300 w-full">
            Heads data coming soon.
          </div>
        )}
      </div>
    </div>
  );
}

export default Team2;
