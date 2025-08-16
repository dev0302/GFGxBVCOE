import { useGSAP } from "@gsap/react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef , useState } from "react";
import EventModal from "./EventModal";
import { useEffect } from "react";
import Lenis from "lenis";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);


const Events = () => {
  const containerRef = useRef();
  const heroRef = useRef();
  const eventsRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
      const lenis = new Lenis({
        // duration:4,
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


  // State to manage the selected event for the modal
  const [selectedEvent, setSelectedEvent] = useState(null);


  // Sample events data
  const events = [
  {
    id: 1,
    title: "InnoVogue",
    date: "March 5, 2024",
    time: "10:00",
    location: "BVCOE, New Delhi",
    category: "Ideathon",
    description: "Participants in the Ideathon collaborated to develop innovative solutions for real-world challenges.", // Short description for the card
    modalDescription: "The Geeks for Geeks Ideathon, in a unique collaboration with Venuva, our college's esteemed fashion society, was a dynamic event that brought together a diverse group of innovators and problem-solvers. This fusion of technology and creative design challenged participants to develop groundbreaking solutions at the intersection of their fields. Attendees engaged in intensive brainstorming, received invaluable guidance from industry mentors, and pitched their final concepts to a panel of expert judges, successfully fostering a spirit of cross-disciplinary innovation and community.", // Detailed description for the modal
    galleryImages: [
      "", // Main image
      "",
      "",
      ""
    ],
    speakers: [
      { name: "Mohit Tiwari", title: "Judge" },
    ],
    agenda: [
      "Team Formation & Ideation",
      "Mentorship Round",
      "Idea & Business Pitching",
      "Certificate Distribution & Closing",
    ],
    prerequisites: [
      "A passion for problem-solving and a drive to create innovative solutions.",
      "A collaborative mindset with a willingness to contribute skills and learn from others in a team environment.",
      "An interest in the intersection of technology and creative fields like fashion and design.",
    ],
    targetAudience: "Aspiring Entrepreneurs"
  },
  {
    id: 2,
    title: "Pyhunt",
    date: "March 6, 2024",
    time: "10:00",
    location: "BVCOE, New Delhi",
    category: "Quizzing",
    description: "PYHUNT was a competitive event that tested participants' Python skills through a challenging technical quiz and a final tech-themed Bingo round.",
    modalDescription: "PYHUNT was a highly engaging event designed to challenge and celebrate the Python 🐍 proficiency of our student community. With an impressive turnout of approximately 100 participants, the event aimed to test a wide range of skills through a unique two-round format: a comprehensive technical quiz followed by a fun, interactive Bingo round. The structure was crafted to engage enthusiasts of all levels, from beginners to advanced coders, while fostering a strong sense of community and encouraging critical thinking.",
    galleryImages: [
      "", // Main image
      "",
      "",
      ""
    ],
    speakers: [
      { name: "Dr. Shristi Vashishtha", title: "Faculty Advisor" }
    ],
    agenda: [
      "The Python Quiz",
      "Tech Bingo",
      "Feedback Session & Closing",
    ],
    prerequisites: [
      "Basic knowledge of Python",
    ],
    targetAudience: "tech Community looking for a fun and competitive event"
  },
  {
    id: 3,
    title: "AI Connect",
    date: "February 22, 2024",
    time: "2:00 PM - 4:00 PM", 
    location: "A-107, Bharati Vidyapeeth, Delhi",
    category: "Tech Talk / Workshop",
    description: "Dive into the fascinating world of Generative AI with live demos, expert insights, and engaging discussions.",
    modalDescription: "Embark on a journey through the realm of Generative AI as we kick off with a warm welcome and an introduction to the wonders of artificial creativity. We'll delve into the fundamentals, demystify core concepts, and showcase real-world applications through exciting live demonstrations. This event is a unique opportunity to understand how machines are capable of creating new and innovative content.",
    galleryImages: [
      "", // Main image
      "",
      "",
      ""
    ],
    speakers: [
      { name: "Mr. Ritik", title: "Guest Speaker, AI Specialist" },
      { name: "Ms. Manya", title: "Guest Speaker, AI Specialist" },
    ],
    agenda: [
      "Welcome & Introduction to Generative AI",
    "Live Demonstrations of AI Creativity",
    "Guest Speaker Session with Industry Experts",
    "Interactive Q&A and Discussion Panel",
    ],
    prerequisites: [
      "An interest in Artificial Intelligence and technology.",
    ],
    targetAudience: "Students and tech enthusiasts interested in the fundamentals and applications of Generative AI."
  },
  {
    id: 4,
    title: "AI & Machine Learning",
    date: "",
    time: "",
    location: "",
    category: "Workshop",
    description: "",
    modalDescription: "",
    galleryImages: [
      "/src/images/gfg4.jpg", // Main image
      "",
      "",
      ""
    ],
    speakers: [
      { name: "", title: "" }
    ],
    agenda: [
      "",
      "",
      "",
    ],
    prerequisites: [
      "",
    ],
    targetAudience: ""
  },
  {
    id: 5,
    title: "Code Review Session",
    date: "",
    time: "",
    location: "",
    category: "Session",
    description: "",
    modalDescription: "",
    galleryImages: [
      "/src/images/gfg5.jpg", // Main image
      "",
      "",
      ""
    ],
    speakers: [
      { name: "", title: "" }
    ],
    agenda: [
      "",
      "",
      "",
    ],
    prerequisites: [
      "",
    ],
    targetAudience: ""
  },
  {
    id: 6,
    title: "Career Fair",
    date: "",
    time: "",
    location: "",
    category: "Career",
    description: "",
    modalDescription: "",
    galleryImages: [
      "/src/images/gfgLogo.png", // Main image
      "",
      "",
      ""
    ],
    speakers: [
      { name: "", title: "" }
    ],
    agenda: [
      "",
      "",
      "",
    ],
    prerequisites: [
      "",
    ],
    targetAudience: ""
  }
];

  // GSAP animations
  useGSAP(() => {
    // Set initial states
    gsap.set([heroRef.current, eventsRef.current], { opacity: 0, y: 50 });

    // Hero section animation
    gsap.to(heroRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Events section animation
    gsap.to(eventsRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: eventsRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const handleNavigateToContact = () => {
    navigate('/contact');
  };

  const handleKnowMoreClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen darkthemebg">
      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] rounded-full border border-gray-400 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-300 uppercase tracking-wider">Previous Events</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Discover Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Events</span>
          </h1>
          
          <p className="text-xl text-richblack-100 max-w-3xl mx-auto leading-relaxed font-normal">
            Join our exciting workshops, hackathons, and masterclasses. Learn, grow, and connect with the tech community.
          </p>
        </div>
      </section>

      {/* Events Grid */}
<section ref={eventsRef} className="py-20 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] font-['Inter'] text-white">
  <div className="container mx-auto px-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-[#2a2a3d] border-2 border-gray-300 border-opacity-20 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 group"
        >
          {/* Event Image */}
          <div className="h-48 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
              style={{
                backgroundImage: `url('${event.image}')`,
              }}
            />
          </div>

          {/* Event Content */}
          <div className="p-6">
            {/* Category Badge */}
            <div className="inline-flex items-center px-3 py-1 bg-[#444] rounded-full border border-gray-500/30 mb-4">
              <span className="text-sm font-medium text-[#ccc]">{event.category}</span>
            </div>

            {/* Event Title */}
            <h3 className="text-xl font-bold text-red-400 mb-3 group-hover:text-cyan-400 transition-colors duration-300">
              {event.title}
            </h3>

            {/* Event Details */}
            <div className="space-y-2 mb-4 text-[#aaa]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">{event.date}</span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{event.time}</span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{event.location}</span>
              </div>
            </div>

            {/* Event Description */}
            <p className="text-sm text-[#aaa] leading-relaxed mb-6">
              {event.description}
            </p>

            {/* Register Button */}
            <button 
              onClick={() => handleKnowMoreClick(event)}
              className="w-full px-6 py-3 bg-cyan-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:opacity-95"
            >
              Know More
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* Call to Action */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border-2 border-gray-300 border-opacity-20 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Want to Host an Event?</h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Have an idea for a workshop or event? We'd love to hear from you! Let's collaborate to create amazing learning experiences.
            </p>
            <button
              onClick={handleNavigateToContact}
              className="px-8 py-4 bg-cyan-700 text-white hover:from-green-600 hover:to-emerald-600 font-semibold rounded-full text-lg border border-green-300/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>

    {/* RENDER THE MODAL */}
      <EventModal event={selectedEvent} onClose={handleCloseModal} />
    </div>
  );
};

export default Events;
