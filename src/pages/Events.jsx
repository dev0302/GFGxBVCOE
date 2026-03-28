import { useGSAP } from "@gsap/react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useState, useRef } from "react";
import Lenis from "lenis";
import events from "../data/eventData";
import EventModal from "../components/EventModal";
import UpcomingEventSection from "../components/UpcomingEventSection";
import { getEvents } from "../services/api";
import { cloudinaryEventCardImageUrl } from "../utils/cloudinary";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";

/** Sub-component to detect overflow and show Read More button accurately */
const EventDescription = ({ event, isExpanded, toggleExpand }) => {
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current && !isExpanded) {
      // Check if text is actually clamped
      const isOverflowing = textRef.current.scrollHeight > textRef.current.clientHeight;
      setShowButton(isOverflowing);
    } else if (isExpanded) {
      setShowButton(true);
    }
  }, [event.description, isExpanded]);

  return (
    <div className="relative">
      <p
        ref={textRef}
        className={`text-sm text-[#aaa] leading-relaxed mb-1 font-nunito transition-all duration-300 break-words ${
          !isExpanded ? "line-clamp-3" : ""
        }`}
      >
        {event.description}
      </p>
      {showButton && (
        <button
          onClick={() => toggleExpand(event.id)}
          className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-2 text-cyan-400 hover:text-cyan-300 transition-colors font-nunito"       >
          {isExpanded ? "Show Less" : "Read More"}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
    </div>
  );
};


gsap.registerPlugin(ScrollTrigger);

const Events = () => {
  const containerRef = useRef();
  const heroRef = useRef();
  const eventsRef = useRef();
  const navigate = useNavigate();
  const [uploadedEvents, setUploadedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState({});

  const toggleExpand = (id) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getLeaderboardLink = (event) => {
    if (event.leaderboardLink) return event.leaderboardLink;
    if (event.title?.toLowerCase().includes("jam the web")) return "/jam-the-web";
    if (event.description?.toLowerCase().includes("leaderboard")) return "/leaderboard";
    return null;
  };

  useEffect(() => {
    setLoading(true);
    getEvents()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setUploadedEvents(res.data);
        }
      })
      .catch(() => setUploadedEvents([]))
      .finally(() => setLoading(false));
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
    
      loading ? <div className="flex items-center justify-center min-h-screen text-richblack-25 text-2xl">
    <Spinner className="size-4 text-richblack-25 animate-spin" />
  </div>
       :
        (
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
              <h1 className="font-audiowide text-4xl sm:text-5xl md:text-6xl font-bold text-richblack-25 mb-6">
                Discover Our{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  Events
                </span>
              </h1>
              <p className="text-lg md:text-xl font-nunito text-richblack-100 max-w-3xl mx-auto leading-relaxed font-normal">
                Join our exciting workshops, hackathons, and masterclasses. Learn,
                grow, and connect with the tech community.
              </p>
            </div>
          </section>

          <UpcomingEventSection variant="events" />

          {/* Events Grid */}
          <section
            ref={eventsRef}
            className="py-16 md:py-18 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] font-['Inter'] text-richblack-25 w-[95%] sm:w-11/12 mx-auto"
          >
            <div className=" mx-auto w-[98%] px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 gap-y-16 md:gap-20 max events-grid">
                {allEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="glowing-container w-[86%] mx-auto md:w-full event-card"
                    style={{ height: "100%", borderRadius: "1.25rem", "--stagger-index": index }}
                  >
                    <div className="bg-[#2a2a3d] rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group h-full w-full flex flex-col">
                      <div className="h-40 sm:h-48 overflow-hidden flex-shrink-0">
                        <img
                          src={cloudinaryEventCardImageUrl(event.galleryImages[0])}
                          alt={event.title}
                          loading="eager"
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 md:p-6 flex flex-col flex-grow">
                        <div className=" items-center justify-center px-3 py-[2px] 
                        bg-white/10 backdrop-blur-md 
                        rounded-lg border border-white/10 
                        mb-4 self-start">
                          
                          <span className="text-xs sm:text-xs font-normal text-richblack-25/80 font-nunito">
                            {event.category}
                          </span>

                        </div>
                        <h3 className="text-xl font-bold text-gray-300 mb-3 group-hover:text-cyan-400 transition-colors duration-300 font-changa">
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
                        <EventDescription 
                          event={event} 
                          isExpanded={expandedEvents[event.id]} 
                          toggleExpand={toggleExpand} 
                        />
                        <div className="flex flex-col gap-2 mt-auto w-full">
                          <div className=" green rounded-lg w-full">
                            <button
                              onClick={() => handleKnowMoreClick(event)}
                              className="w-full px-6 py-2.5 bg-cyan-700 text-richblack-25 font-semibold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 font-nunito flex items-center justify-center gap-2"
                            >
                              Know More
                            </button>
                          </div>
                          {getLeaderboardLink(event) && (
                            <div className="blue rounded-lg w-full">
                              <button
                                onClick={() => navigate(getLeaderboardLink(event))}
                                className="w-full px-6 py-2.5 bg-slate-700 text-richblack-25 font-semibold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 font-nunito flex items-center justify-center gap-2"
                              >
                                <Trophy size={16} className="text-amber-400" />
                                Leaderboard
                              </button>
                            </div>
                          )}
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
                <h2 className="text-2xl sm:text-3xl font-bold text-richblack-25 mb-4">
                  Want to Host an Event?
                </h2>
                <p className="text-base sm:text-lg text-green-100 mb-8 max-w-2xl mx-auto">
                  Have an idea for a workshop or event? We'd love to hear from you!
                  Let's collaborate to create amazing learning experiences.
                </p>
                <div className="glowing-btn-wrapper green rounded-full">
                  <button
                    onClick={handleNavigateToContact}
                    className="px-8 py-4 bg-cyan-700 text-richblack-25 font-semibold rounded-full text-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
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
      )
      
    
  );
};

export default Events;
