import React, { useRef } from 'react';
import NewCard from './NewCard';
import teamData from '../data/teamData';
import FacultyIncharge from "../images/RachnaNarula.jpeg"

// THEME: Import GSAP for animations
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function Team2() {
  // THEME: Add refs for animating sections
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const teamGridRef = useRef(null);

  // THEME: Add the dynamic scroll-triggered animations
  useGSAP(() => {
    // 1. Hero Section Animation
    gsap.fromTo(heroRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top 85%",
        }
      }
    );

    // 2. Staggered Team Card Animation
    // This makes the cards appear one after the other
    const cards = teamGridRef.current.children;
    gsap.fromTo(cards,
      { opacity: 0, y: 40, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.15, // The magic property for the cascade effect
        scrollTrigger: {
          trigger: teamGridRef.current,
          start: "top 80%",
        }
      }
    );

  }, { scope: containerRef });


  return (


    <div ref={containerRef} className='w-full min-h-screen darkthemebg pt-32 overflow-hidden'>

      {/* TItle description section */}
      <section ref={heroRef} className="pb-10 px-6">

        <div className="max-w-6xl mx-auto text-center">
         
         {/* heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight font-alfa tracking-tight">

            Meet Our{" "}

            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
              Team
            </span>

          </h1>
          
          

          {/* description */}
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-nunito font-normal">

            The passionate minds behind GFG BVCOE Student Chapter, driving innovation and fostering a community of learners.
          </p>
        </div>
      </section>

      {/* Faculty Card -*/}
      <div className=" font-nunito darkthemebg2 rounded-2xl px-8 py-6 max-w-4xl mx-auto border-2 border-gray-300 border-opacity-20 transition-shadow duration-300 hover:shadow-xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          
          {/* Image Section */}
          <div className="relative shrink-0">
            <img
              src={FacultyIncharge}
              alt="RachnaNarula"
              className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-indigo-500 object-cover"
            />
            <span className="absolute -bottom-2 right-0 w-4 h-4 bg-green-400 rounded-full ring-2 ring-gray-900"></span>
          </div>

          {/* Content Section */}
          <div className="text-left md:text-left flex-1">
            <h2 className="text-2xl font-semibold text-white mb-1">Ms. Rachna Narula</h2>
            <h3 className="text-indigo-400 text-base font-medium mb-3">Faculty Incharge, GFGxBVCOE</h3>
            <p className="text-gray-300 text-[15px] leading-relaxed">
              Empowering students with mentorship that blends wisdom, empathy, and creativity. Her guidance fosters a culture of growth, collaboration, and emotional intelligence—making every student feel seen and supported.
            </p>
          </div>

        </div>
      </div>


      {/* rendering of card data of all members */}
      <div ref={teamGridRef} className='TEAM_SECTION mt-10 justify-center items-center flex flex-wrap w-10/12 mx-auto gap-10 pb-12'>
        {
          teamData.map((person, index) => (
            <NewCard key={index} person={person} />
          ))
        }
      </div>
    </div>
  );
}

export default Team2;