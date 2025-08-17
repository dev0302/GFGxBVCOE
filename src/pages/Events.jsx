import { useGSAP } from "@gsap/react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState, useEffect } from "react";
import EventModal from "./EventModal";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const Events = () => {
  const containerRef = useRef();
  const heroRef = useRef();
  const eventsRef = useRef();
  const navigate = useNavigate();

  // Lenis smooth scroll setup
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

  // Sample events data (remains the same)
  const events = [
    {
      id: 1,
      title: "Inaugration Day",
      date: "Feburary 6, 2024",
      time: "10:00 am",
      location: "BVCOE, New Delhi",
      category: "Speaker Session",
      description: "Celebrating the grand inauguration where we proudly introduced our society’s mission and vision to the college community",
      modalDescription: "The event marked the beginning of an exciting journey, fostering innovation, collaboration, and growth. With an overwhelming response, we set the stage for future achievements and impactful initiatives.",
      galleryImages: ["/src/images/inaugration.webp","/src/images/inaugration1.webp","/src/images/inaugration2.webp","/src/images/inaugration3.webp","/src/images/inaugration4.webp"],
      speakers: [{ name: "Dr. Shristi Vashishtha", title: "Faculty Advisor"}],
      agenda: ["Forming a community for Tech Enthusiasts"],
      prerequisites: [""],
      targetAudience: "Anyone with a young and curious mind."
    },
    {
      id: 2,
      title: "GeekHunt: A Tech Fiesta",
      date: "April 12, 2025",
      time: "10:00 AM - 3:00 PM",
      location: "Main Auditorium, Bharati Vidyapeeth, Delhi",
      category: "Tech Fest / Community Event",
      description: "A vibrant tech fest designed to foster community and knowledge sharing through fun events like TechMeme and TechQuizzee.",
      modalDescription: "GeekHunt fosters a vibrant community of tech enthusiasts while promoting creativity and knowledge sharing. Participants learn the importance of engaging with current tech trends and the power of humor in making complex topics relatable. The interactive formats enhance information retention, highlight knowledge gaps, and encourage collaboration. The event underscores effective communication skills and the value of peer feedback, creating a dynamic environment where participants can connect, learn, and grow together.",
      galleryImages: ["/src/images/geekhunt.webp"],
      speakers: [{ name: "Dr. Shristi Vashishtha", title: "Faculty Advisor"}],
      agenda: ["Event Kick-off & Introduction","TechMeme: Meme Creation & Submission Showcase","TechQuizzee: Interactive Tech Trivia Challenge","Winner Announcements & Networking Session"],
      prerequisites: ["A love for technology and a good sense of humor."],
      targetAudience: "All tech enthusiasts, from beginners to experts, looking to connect, learn, and have fun in a vibrant community setting."
    },
    {
      id: 3,
      title: "Pyhunt: A Python Challenge",
      date: "March 6, 2024",
      time: "10:00 AM - 4:00 PM",
      location: "C-105, Bharati Vidyapeeth, Delhi",
      category: "Quiz / Programming Competition",
      description: "A two-round event designed to test Python proficiency through a challenging traditional quiz and a fun, interactive tech bingo.",
      modalDescription: "Pyhunt is designed to assess and celebrate Python proficiency through two engaging rounds. The event kicks off with a comprehensive quiz featuring challenging questions, jumbled-code puzzles, and rapid-fire queries. Top teams advance to an exhilarating Bingo round, adding a thrilling and strategic twist to the competition. The event aims to engage participants of all skill levels and foster a sense of community among tech enthusiasts.",
      galleryImages: ["src/images/Pyhunt.webp","src/images/Pyhunt1.webp","src/images/Pyhunt2.webp","src/images/Pyhunt3.webp","src/images/Pyhunt4.webp"],
      speakers: [{ name: "Dr. Shristi Vashishtha", title: "Faculty Advisor" }],
      agenda: ["Offline Registration (10 AM - 1 PM)","Round 1: Comprehensive Python Quiz","Round 2: The Bingo Challenge (Top 9 Teams)","Feedback Session & Winner Announcements"],
      prerequisites: ["Basic to intermediate knowledge of Python programming concepts."],
      targetAudience: "Students and programmers of all skill levels looking to test and showcase their Python knowledge in a fun, competitive environment."
    },
    {
      id: 4,
      title: "AI Connect",
      date: "February 22, 2024",
      time: "2:00 PM - 4:00 PM",
      location: "A-107, Bharati Vidyapeeth, Delhi",
      category: "Tech Talk / Workshop",
      description: "Dive into the fascinating world of Generative AI with live demos, expert insights, and engaging discussions.",
      modalDescription: "Embark on a journey through the realm of Generative AI as we kick off with a warm welcome and an introduction to the wonders of artificial creativity. We'll delve into the fundamentals, demystify core concepts, and showcase real-world applications through exciting live demonstrations. This event is a unique opportunity to understand how machines are capable of creating new and innovative content.",
      galleryImages: ["/src/images/aiconnect.webp","/src/images/aiconnect1.webp","/src/images/aiconnect2.webp","/src/images/aiconnect4.webp"],
      speakers: [{ name: "Mr. Ritik", title: "Guest Speaker, AI Specialist" },{ name: "Ms. Manya", title: "Guest Speaker, AI Specialist" },],
      agenda: ["Welcome & Introduction to Generative AI","Live Demonstrations of AI Creativity","Guest Speaker Session with Industry Experts","Interactive Q&A and Discussion Panel",],
      prerequisites: ["An interest in Artificial Intelligence and technology."],
      targetAudience: "Students and tech enthusiasts interested in the fundamentals and applications of Generative AI."
    },
    {
      id: 5,
      title: "InnoVogue: The Ideathon",
      date: "March 5, 2024",
      time: "10:00 AM - 4:00 PM",
      location: "B-403, Bharati Vidyapeeth, Delhi",
      category: "Ideathon / Pitching Competition",
      description: "An exciting Ideathon to foster innovation and problem-solving through creative ideation, collaboration, and mentorship.",
      modalDescription: "InnoVogue is an Ideathon designed to foster innovation and problem-solving. Participants will engage in dynamic brainstorming sessions, develop creative solutions to real-world challenges, and present their ideas in both idea pitching and business pitching rounds. The event promotes networking, community building, and entrepreneurship, with guidance from seasoned mentors.",
      galleryImages: ["src/images/Innovogue.webp","src/images/Innovogue1.webp","src/images/Innovogue2.webp","src/images/Innovogue3.webp","src/images/Innovogue4.webp","src/images/Innovogue5.webp"],
      speakers: [{ name: "Charvi", title: "Event Mentor" },{ name: "Dhruv", title: "Event Mentor" },{ name: "Mohit Tiwari", title: "Guest Judge" }],
      agenda: ["Offline Registration (10 AM - 1 PM)","Mentorship Round with Industry Experts","Idea & Business Pitching Rounds","Winner Announcements & Certificate Distribution"],
      prerequisites: ["A creative mindset and a passion for problem-solving."],
      targetAudience: "Aspiring innovators, student entrepreneurs, and anyone with a passion for developing solutions to real-world problems."
    },
    {
      id: 6,
      title: "VichaarX: SDG Innovation Challenge",
      date: "October 19, 2024",
      time: "9:00 AM - 5:00 PM",
      location: "C-103, Bharati Vidyapeeth, Delhi",
      category: "Innovation Challenge / Hackathon",
      description: "A multi-round innovation challenge focused on developing feasible and scalable solutions for the UN's Sustainable Development Goals.",
      modalDescription: "Participants will gain skills in analyzing technical feasibility, aligning solutions with global sustainability goals, and presenting ideas clearly to stakeholders. They will enhance their ability to develop actionable implementation plans and simulate real-world deployments. The event fosters creativity, critical thinking, and collaborative problem-solving within diverse teams.",
      galleryImages: ["/src/images/vichaarx.webp","/src/images/vichaarx1.webp","/src/images/vichaarx2.webp","/src/images/vichaarx3.webp","/src/images/vichaarx4.webp"],
      speakers: [{ name: "Vinamra Sharma", title: "Tech Innovator & Hackathon Veteran" }],
      agenda: ["Introduction to UN SDGs & Problem Statements","Workshop on Technical & Financial Feasibility","Team Brainstorming & Solution Development","Final Pitch Presentations & Judging"],
      prerequisites: ["A passion for technology and sustainable development."],
      targetAudience: "Students and innovators eager to tackle global challenges through technology, strategy, and business planning."
    },
    {
      id: 7,
      title: "GFG HQ Visit",
      date: "January 11, 2025",
      time: "10::00 ",
      location: "GFG HQ, Noida",
      category: "HQ Visit",
      description: "An exclusive opportunity to explore the Geeks for Geeks headquarters, meet the team, and get a behind-the-scenes look at a leading tech company.",
      modalDescription: "Join us for an inspiring industrial visit to the heart of Geeks for Geeks. This exclusive tour offers a unique chance to witness the inner workings of a top ed-tech company, from its innovative work culture to its state-of-the-art infrastructure. You'll have the opportunity to interact with GFG's talented professionals, gain insights into various tech roles, and understand the real-world processes behind their renowned platform.",
      galleryImages: ["/src/images/hqvisit.webp","/src/images/hqvisit1.webp","/src/images/hqvisit2.webp","/src/images/hqvisit3.webp","/src/images/hqvisit4.webp","/src/images/hqvisit5.webp",],
      speakers: [{name: "Sandeep Jain", title:"Founder & CEO, GFG"}],
      agenda:["Arrival & Welcome Reception","Guided Tour of the GFG Campus","Interactive Session with the GFG Tech Team","Networking Lunch & Q&A Session"],
      prerequisites: ["Must be a registered member of the GFG BVCOE society."],
      targetAudience: "Students passionate about software development and ed-tech, eager to understand the culture and operations of a leading tech company."
    }
  ];


  // GSAP scroll-triggered animations
  useGSAP(() => {
    const sections = [heroRef.current, eventsRef.current];
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
      <section ref={heroRef} className="pt-28 pb-16 md:pt-32 md:pb-20 relative overflow-hidden">
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
            <span className="text-sm font-medium text-green-300 uppercase tracking-wider">Previous Events</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Discover Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Events</span>
          </h1>
          <p className="text-lg md:text-xl text-richblack-100 max-w-3xl mx-auto leading-relaxed font-normal">
            Join our exciting workshops, hackathons, and masterclasses. Learn, grow, and connect with the tech community.
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section ref={eventsRef} className="py-16 md:py-20 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] font-['Inter'] text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="glowing-container w-86% mx-auto md:w-full" 
                style={{ height: '100%', borderRadius: '1.25rem' }}
              >
                <div className="bg-[#2a2a3d] rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group h-full w-full flex flex-col">
                  <div className="h-40 sm:h-48 overflow-hidden flex-shrink-0">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundImage: `url('${event.galleryImages[0]}')` }}
                    />
                  </div>
                  <div className="p-5 md:p-6 flex flex-col flex-grow">
                    <div className="inline-flex items-center px-3 py-1 bg-[#444] rounded-full border border-gray-500/30 mb-4 self-start">
                      <span className="text-xs sm:text-sm font-medium text-[#ccc]">{event.category}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                      {event.title}
                    </h3>
                    <div className="space-y-2 mb-4 text-[#aaa]">
                      <div className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm">{event.date}</span></div>
                      <div className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-sm">{event.time}</span></div>
                      <div className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="text-sm">{event.location}</span></div>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Want to Host an Event?</h2>
            <p className="text-base sm:text-lg text-green-100 mb-8 max-w-2xl mx-auto">
              Have an idea for a workshop or event? We'd love to hear from you! Let's collaborate to create amazing learning experiences.
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

      {/* RENDER THE MODAL */}
      <EventModal event={selectedEvent} onClose={handleCloseModal} />
    </div>
  );
};

export default Events;