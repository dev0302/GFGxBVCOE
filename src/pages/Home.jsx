import GFGBentoGrid from "../components/GFGBentoGrid";
import { NavLink, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState, useEffect } from "react";
import Footer from "../components/Footer";
import ImageGrid from "../components/ImageGrid";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

function Home() {
  // Lenis smooth scroll setup
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

  // State for counters
  const [memberCount, setMemberCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [workshopCount, setWorkshopCount] = useState(0);

  // GSAP animations
  useGSAP(() => {
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
  }, []);

  return (
    <div className="relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1
          ref={titleRef}
          className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
        >
          Welcome to Horizon BVCOE 🚀
        </h1>

        <p
          ref={descRef}
          className="text-lg md:text-xl text-gray-600 max-w-2xl mb-8"
        >
          A vibrant community of learners, leaders, and creators. Join us to
          explore, grow, and make an impact.
        </p>

        <button
          ref={btnRef}
          onClick={() => navigate("/events")}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-indigo-700 transition"
        >
          Explore Events
        </button>

        {/* Counters Section */}
        <div className="mt-16 flex gap-12 text-center">
          <div>
            <h2 className="text-4xl font-bold text-indigo-600">{memberCount}+</h2>
            <p className="text-gray-500">Active Members</p>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-indigo-600">{eventCount}+</h2>
            <p className="text-gray-500">Events Hosted</p>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-indigo-600">{workshopCount}+</h2>
            <p className="text-gray-500">Workshops</p>
          </div>
        </div>
      </div>

      {/* Other Sections */}
      <GFGBentoGrid />
      <ImageGrid />
      <Footer />
    </div>
  );
}

export default Home;
