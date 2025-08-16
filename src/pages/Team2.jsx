import React, { useRef } from 'react';
import NewCard from './NewCard';
import teamData from '../data/teamData';

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
    // THEME: Added a ref and overflow-hidden for cleaner animation context
    <div ref={containerRef} className='w-full min-h-screen darkthemebg pt-32 overflow-hidden'>

      {/* Hero Section */}
      <section ref={heroRef} className="pb-10 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* THEME: Use a more impactful font for the main heading for consistency */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight font-alfa tracking-tight">
            Meet Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
              Team
            </span>
          </h1>
          {/* THEME: Adjusted text color and font weight to match the About page's style */}
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-nunito font-normal">
            The passionate minds behind GFG BVCOE Student Chapter, driving innovation and fostering a community of learners.
          </p>
        </div>
      </section>

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