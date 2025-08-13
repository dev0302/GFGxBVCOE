import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState, useEffect } from "react";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const Team = () => {
  const containerRef = useRef();
  const heroRef = useRef();
  const teamRef = useRef();
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const members = [
    {
      name: "Toshika Goswami",
      branch: "CSE",
      year: "4th",
      position: "Chair Person",
      p0: "Chair Person",
      image: "/src/images/Toshika.webp",
      p1: "Social Media Lead",
      p2: "",
      email: "toshikagoswami4@gmail.com",
      instaLink: "nil",
      linkedinLink: "https://www.linkedin.com/in/toshika-goswami-39791022a"
    },
    {
      name: "Harsh Bhardwaj",
      branch: "CSE",
      year: "",
      position: "Marketing Lead",
      p0: "Marketing Lead",
      image: "/src/images/Harsh.jpg",
      p1: "Marketing Head",
      p2: "Marketing Head",
      email: "itzharsh045@gmail.com",
      instaLink: "https://www.instagram.com/mystic_harsh_45?igsh=d2Q3ZWdqd3FhazNu",
      linkedinLink: "https://www.linkedin.com/in/harsh-bhardwaj-255357292"
    },
    {
      name: "Aarti Singh",
      branch: "CSE",
      year: "2nd",
      position: "Social Media and Promotion Lead",
      p0: "Social Media and Promotion Lead",
      image: "/src/images/Aarti.jpg",
      p1: "Social Media Executive",
      p2: "",
      email: "37aartisingh121212@gmail.com",
      instaLink: "https://www.instagram.com/aartiii.60?utm_source=qr&igsh=bWsyajFvMjh2NWli",
      linkedinLink: "https://www.linkedin.com/in/aarti-singh-b7700b333"
    },
    {
      name: "Gaurav Karakoti",
      branch: "CSE",
      year: "2nd",
      position: "Event & Operations Head",
      p0: "Event & Operations Head",
      image: "/src/images/Gaurav.jpg",
      p1: "Technical Executive",
      p2: "",
      email: "karakotigaurav12@gmail.com",
      instaLink: "https://instagram.com/gaurav._.karakoti",
      linkedinLink: "https://linkedin.com/in/gaurav-karakoti"
    },
    {
      name: "Kartik Bhattacharya",
      branch: "CSE",
      year: "3rd",
      position: "Vice-Chairman and Technical Lead",
      p0: "Vice-Chairman and Technical Lead",
      image: "/src/images/Kartik.webp",
      p1: "Technical Executive",
      p2: "",
      email: "kartikbhattacharya10@gmail.com",
      instaLink: "https://www.instagram.com/_kafiltafish_21_/",
      linkedinLink: "https://linkedin.com/in/kafiltafish21"
    },
    {
      name: "Archita",
      branch: "Information Technology",
      year: "3rd",
      position: "Design and Creative Lead",
      p0: "Design and Creative Lead",
      image: "/src/images/Archita.jpg",
      p1: "Design + Marketing Executive",
      p2: "",
      email: "archita770@gmail.com",
      instaLink: "https://www.instagram.com/archiitta.r?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      linkedinLink: "https://www.linkedin.com/in/archita-337521376"
    },
    {
      name: "Piyush Kumar Singh",
      branch: "CSE",
      year: "2nd",
      position: "Public Relations & Outreach",
      p0: "Public Relations & Outreach",
      image: "/src/images/Piyush.jpg",
      p1: "Executive Technical",
      p2: "",
      email: "piyushksbvp@gmail.com",
      instaLink: "https://www.instagram.com/thepiyushks/",
      linkedinLink: "https://in.linkedin.com/in/piyush-kumar-singh1"
    }
  ];

  // Handle modal open/close
  const openTimelineModal = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const closeTimelineModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeTimelineModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  useGSAP(() => {
    // Set initial states
    gsap.set([heroRef.current, teamRef.current], {
      opacity: 0,
      y: 50
    });

    // Hero section animation
    gsap.fromTo(heroRef.current, 
      { opacity: 0, y: 100 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1.2, 
        ease: "power3.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none"
        }
      }
    );

    // Team section animation
    gsap.fromTo(teamRef.current, 
      { opacity: 0, y: 60 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: teamRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none"
        }
      }
    );

    // Animate individual team cards with stagger
    const teamCards = teamRef.current?.querySelectorAll('.team-card');
    if (teamCards) {
      gsap.fromTo(teamCards, 
        { opacity: 0, y: 40, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.8, 
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: teamRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none none"
          }
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Timeline Modal Component
  const TimelineModal = ({ member, isOpen, onClose }) => {
    const modalRef = useRef();

    useEffect(() => {
      if (isOpen && modalRef.current) {
        gsap.fromTo(modalRef.current, 
          { opacity: 0, scale: 0.8, y: 50 },
          { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 0.5, 
            ease: "back.out(1.7)" 
          }
        );
      }
    }, [isOpen]);

    if (!isOpen || !member) return null;

    const timelineData = [
      { position: member.p0, period: "Current", color: "from-green-500 to-emerald-500" },
      { position: member.p1, period: "Previous", color: "from-blue-500 to-cyan-500" },
      { position: member.p2, period: "Earlier", color: "from-purple-500 to-pink-500" }
    ].filter(item => item.position && item.position.trim() !== "");

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div 
          ref={modalRef}
          className="bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-xl border border-green-400/30 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={member.image} 
                alt={member.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-green-400"
                onError={(e) => {
                  e.target.src = '/src/images/gfgLogo.png';
                  e.target.className = 'w-16 h-16 rounded-full object-contain bg-gray-800 border-2 border-green-400';
                }}
              />
              <div>
                <h2 className="text-2xl font-bold text-white font-['Inter']">{member.name}</h2>
                <p className="text-green-300 text-sm">{member.branch} • {member.year} Year</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Timeline */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white text-center mb-6 font-['Inter']">
              Career Timeline
            </h3>
            
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 to-emerald-400"></div>
              
              {/* Timeline Items */}
              <div className="space-y-6">
                {timelineData.map((item, index) => (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* Timeline Dot */}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center flex-shrink-0 z-10`}>
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="bg-white/10 backdrop-blur-sm border border-green-400/20 rounded-xl p-4 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-white font-['Inter']">{item.position}</h4>
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full font-medium">
                          {item.period}
                        </span>
                      </div>
                      <p className="text-green-200 text-sm">
                        {item.period === "Current" ? "Currently serving as" : 
                         item.period === "Previous" ? "Previously served as" : 
                         "Earlier served as"} {item.position.toLowerCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white/5 rounded-xl p-4 border border-green-400/20">
              <h4 className="text-lg font-semibold text-white mb-3 font-['Inter']">Contact Information</h4>
              <div className="flex flex-wrap gap-3">
                {member.email && (
                  <a 
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Email
                  </a>
                )}
                
                {member.instaLink && member.instaLink !== "nil" && (
                  <a 
                    href={member.instaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                )}
                
                {member.linkedinLink && (
                  <a 
                    href={member.linkedinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section ref={heroRef} className="pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight font-['Inter'] tracking-tight">
              Meet Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                Team
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-4xl mx-auto leading-relaxed font-light">
              The passionate minds behind GFG BVCOE Student Chapter, driving innovation and fostering a community of learners.
            </p>
          </div>
        </section>

        {/* Team Section */}
        <section ref={teamRef} className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {members.map((member, index) => (
                <div key={index} className="team-card bg-white/10 backdrop-blur-xl border border-green-400/20 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/25">
                  {/* Image Section */}
                  <div className="relative">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.src = '/src/images/gfgLogo.png';
                        e.target.className = 'w-full h-64 object-contain bg-gray-800';
                      }}
                    />
                    {/* Verification Badge */}
                    <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* Information Section */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-white font-['Inter']">{member.name}</h3>
                    </div>
                    
                    <p className="text-green-200 text-sm mb-3 font-['Inter']">
                      {member.position}
                    </p>
                    
                    <div className="text-gray-300 text-xs mb-4 font-['Inter']">
                      <p>{member.branch} • {member.year} Year</p>
                      {member.p1 && <p className="mt-1">{member.p1}</p>}
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        {member.email && (
                          <a 
                            href={`mailto:${member.email}`}
                            className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center hover:bg-green-500/40 transition-colors"
                            title="Email"
                          >
                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </a>
                        )}
                        
                        {member.instaLink && member.instaLink !== "nil" && (
                          <a 
                            href={member.instaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center hover:bg-pink-500/40 transition-colors"
                            title="Instagram"
                          >
                            <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}
                        
                        {member.linkedinLink && (
                          <a 
                            href={member.linkedinLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center hover:bg-blue-500/40 transition-colors"
                            title="LinkedIn"
                          >
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                      
                      {/* Timeline Button */}
                      <button 
                        onClick={() => openTimelineModal(member)}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-full text-sm font-medium transition-colors border border-green-400/30 hover:scale-105"
                      >
                        Timeline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Timeline Modal */}
      <TimelineModal 
        member={selectedMember}
        isOpen={isModalOpen}
        onClose={closeTimelineModal}
      />
    </div>
  );
};

export default Team;
