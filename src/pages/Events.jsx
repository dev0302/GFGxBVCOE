import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const Events = () => {
  const containerRef = useRef();
  const heroRef = useRef();
  const eventsRef = useRef();

  // Sample events data
  const events = [
    {
      id: 1,
      title: "Web Development Workshop",
      date: "March 15, 2024",
      time: "2:00 PM - 5:00 PM",
      location: "Room 301, Block A",
      description: "Learn modern web development techniques with hands-on projects using React, Node.js, and MongoDB.",
      category: "Workshop",
      image: "/src/images/gfg1.jpg"
    },
    {
      id: 2,
      title: "Hackathon 2024",
      date: "March 22-23, 2024",
      time: "24 Hours",
      location: "Main Auditorium",
      description: "Join our annual hackathon and build innovative solutions. Great prizes and networking opportunities!",
      category: "Hackathon",
      image: "/src/images/gfg2.jpg"
    },
    {
      id: 3,
      title: "DSA Masterclass",
      date: "March 30, 2024",
      time: "10:00 AM - 1:00 PM",
      location: "Computer Lab 2",
      description: "Master Data Structures and Algorithms with our expert-led session. Perfect for interview preparation.",
      category: "Masterclass",
      image: "/src/images/gfg3.jpg"
    },
    {
      id: 4,
      title: "AI & Machine Learning",
      date: "April 5, 2024",
      time: "3:00 PM - 6:00 PM",
      location: "Room 205, Block B",
      description: "Explore the world of Artificial Intelligence and Machine Learning with practical examples.",
      category: "Workshop",
      image: "/src/images/gfg4.jpg"
    },
    {
      id: 5,
      title: "Code Review Session",
      date: "April 12, 2024",
      time: "4:00 PM - 6:00 PM",
      location: "Online (Zoom)",
      description: "Get your code reviewed by industry professionals and learn best practices.",
      category: "Session",
      image: "/src/images/gfg5.jpg"
    },
    {
      id: 6,
      title: "Career Fair",
      date: "April 20, 2024",
      time: "10:00 AM - 4:00 PM",
      location: "Main Campus",
      description: "Connect with top tech companies and explore internship and job opportunities.",
      category: "Career",
      image: "/src/images/gfgLogo.png"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-400/30 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-300 uppercase tracking-wider">Previous Events</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Discover Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Events</span>
          </h1>
          
          <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-light">
            Join our exciting workshops, hackathons, and masterclasses. Learn, grow, and connect with the tech community.
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section ref={eventsRef} className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-400/20 rounded-3xl overflow-hidden shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 group"
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
                  <div className="inline-flex items-center px-3 py-1 bg-green-500/20 rounded-full border border-green-400/30 mb-4">
                    <span className="text-sm font-medium text-green-300">{event.category}</span>
                  </div>

                  {/* Event Title */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors duration-300">
                    {event.title}
                  </h3>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-green-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">{event.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">{event.time}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{event.location}</span>
                    </div>
                  </div>

                  {/* Event Description */}
                  <p className="text-green-100 text-sm leading-relaxed mb-6">
                    {event.description}
                  </p>

                  {/* Register Button */}
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25">
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
          <div className="bg-gradient-to-r from-green-800/30 to-emerald-800/30 backdrop-blur-sm border border-green-400/20 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Want to Host an Event?</h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Have an idea for a workshop or event? We'd love to hear from you! Let's collaborate to create amazing learning experiences.
            </p>
            <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-full text-lg border border-green-300/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25">
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;
