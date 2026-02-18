import { useGSAP } from "@gsap/react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState, useEffect } from "react";
import Lenis from "lenis";
import events from "../data/eventData";
import EventModal from "../components/EventModal";
import UpcomingEventSection from "../components/UpcomingEventSection";
import { getEvents } from "../services/api";

gsap.registerPlugin(ScrollTrigger);

const Events = () => {
  const containerRef = useRef();
  const heroRef = useRef();
  const eventsRef = useRef();
  const navigate = useNavigate();
  const [uploadedEvents, setUploadedEvents] = useState([]);

  useEffect(() => {
    getEvents()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setUploadedEvents(res.data);
        }
      })
      .catch(() => setUploadedEvents([]));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  };

  const allEvents = [
    ...uploadedEvents.map((e) => ({
      ...e,
      id: e._id || e.id,
      date: formatDate(e.date) || e.date,
      speakers: e.speakers?.length ? e.speakers : [],
      agenda: e.agenda?.length ? e.agenda : [],
      prerequisites: e.prerequisites?.length ? e.prerequisites : [],
    })),
    ...events,
  ];

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.05, smoothWheel: true });
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

  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleNavigateToContact = () => {
    navigate("/contact");
  };

  const handleKnowMoreClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div ref={containerRef} className="min-h-screen darkthemebg">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="pt-28 pb-16 md:pt-32 md:pb-20 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] rounded-full border border-gray-400 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-300 uppercase tracking-wider">
              Previous Events
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Discover Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Events
            </span>
          </h1>
          <p className="text-lg md:text-xl text-richblack-100 max-w-3xl mx-auto leading-relaxed font-normal">
            Join our exciting workshops, hackathons, and masterclasses. Learn,
            grow, and connect with the tech community.
          </p>
        </div>
      </section>

      <UpcomingEventSection variant="events" />

      {/* Events Grid */}
      <section
        ref={eventsRef}
        className="py-16 md:py-18 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] font-['Inter'] text-white w-10/12 mx-auto"
      >
        <div className="container mx-auto w-full px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 gap-y-16 md:gap-20">
            {allEvents.map((event) => (
              <div
                key={event.id}
                className="glowing-container w-[86%] mx-auto md:w-full"
                style={{ height: "100%", borderRadius: "1.25rem" }}
              >
                <div className="bg-[#2a2a3d] rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group h-full w-full flex flex-col">
                  <div className="h-40 sm:h-48 overflow-hidden flex-shrink-0">
                    <img
                      src={event.galleryImages[0]}
                      alt={event.title}
                      loading="eager"
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 md:p-6 flex flex-col flex-grow">
                    <div className="inline-flex items-center px-3 py-1 bg-[#444] rounded-full border border-gray-500/30 mb-4 self-start">
                      <span className="text-xs sm:text-sm font-medium text-[#ccc]">
                        {event.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                      {event.title}
                    </h3>
                    <div className="space-y-2 mb-4 text-[#aaa]">
                      <div className="flex items-center gap-2">
                        📅 <span className="text-sm">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        ⏰ <span className="text-sm">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        📍 <span className="text-sm">{event.location}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#aaa] leading-relaxed mb-6 flex-grow">
                      {event.description}
                    </p>
                    <div className="glowing-btn-wrapper green rounded-lg w-full mt-auto">
                      <button
                        onClick={() => handleKnowMoreClick(event)}
                        className="w-full px-6 py-3 bg-cyan-700 text-white font-semibold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
                      >
                        Know More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Want to Host an Event?
            </h2>
            <p className="text-base sm:text-lg text-green-100 mb-8 max-w-2xl mx-auto">
              Have an idea for a workshop or event? We'd love to hear from you!
              Let's collaborate to create amazing learning experiences.
            </p>
            <div className="glowing-btn-wrapper green rounded-full">
              <button
                onClick={handleNavigateToContact}
                className="px-8 py-4 bg-cyan-700 text-white font-semibold rounded-full text-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      <EventModal event={selectedEvent} onClose={handleCloseModal} />
    </div>
  );
};

export default Events;
