import React, { useRef } from 'react';

import NewCard from './NewCard';

import teamData from '../data/teamData';

import headsData from '../data/headsData';
import FacultyIncharge from "../images/RachnaNarula.jpeg";

import Lenis from "lenis";

import { useEffect, useState } from 'react';


// THEME: Import GSAP for animations

import { useGSAP } from "@gsap/react";

import gsap from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";



gsap.registerPlugin(ScrollTrigger);



function Team2() {


  const [activeTab, setActiveTab] = useState('core');


  useEffect(() => {

    const lenis = new Lenis({

      // duration:4,

      lerp: 0.1,

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



    // NOTE: Card entrance animations disabled per request


  }, { scope: containerRef });



  useEffect(() => {
    // Refresh animations when tab changes to ensure correct triggers
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }, [activeTab]);

  const displayedData = activeTab === 'core' ? teamData : headsData;



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

      <div className=" darkthemebg2 rounded-2xl px-8 py-6 max-w-4xl mx-auto border-2 border-gray-300 border-opacity-20 transition-shadow duration-300 hover:shadow-xl w-10/12 md:py-10 md:px-12">

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

            <h2 className=" text-white mb-1 text-center md:text-left text-lg font-bold font-montserrat ">Ms. Rachna Narula</h2>

            <h3 className="text-indigo-400 text-base font-medium mb-3 text-center md:text-left">Faculty Incharge, GFGxBVCOE</h3>

            <p className="text-[12px] md:text-sm leading-relaxed text-center md:text-left text-gray-300 mt-1  ">

              Empowering students with mentorship that blends wisdom, empathy, and creativity. Her guidance fosters a culture of growth, collaboration, and emotional intelligence—making every student feel seen and supported.

            </p>

          </div>



        </div>

      </div>





      {/* Tabs + Content wrapped in a modern component card */}
      <div className="mt-12 w-10/12 max-w-6xl mx-auto">
        <div className="relative rounded-2xl border border-gray-300/20 bg-gradient-to-b from-[#161625] to-[#1f1f32] backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.35)] overflow-visible">
          {/* soft cyan glowing border */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan-400/35 shadow-[0_0_60px_8px_rgba(34,211,238,0.18)]"></div>
          {/* subtle top accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
          {/* soft inner cyan glow */}
          <div className="pointer-events-none absolute inset-2 sm:inset-3 rounded-[1.5rem] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.18)_0%,rgba(34,211,238,0.10)_30%,transparent_70%)] blur-xl opacity-80"></div>

          {/* Tabs: Core | Heads */}
          <div className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-3 flex justify-center">
            <div className="relative inline-flex p-1 rounded-full border border-gray-300/20 bg-[#1b1b2c]">
              <button
                onClick={() => setActiveTab('core')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'core'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[inset_0_0_12px_rgba(16,185,129,0.25)]'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Core
              </button>
              <button
                onClick={() => setActiveTab('heads')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'heads'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[inset_0_0_12px_rgba(34,211,238,0.25)]'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Heads
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="relative z-10 px-4 sm:px-6 pb-8">
            {/* rendering of card data based on active tab */}
            <div ref={teamGridRef} className='TEAM_SECTION mt-8 justify-center items-center flex flex-wrap gap-10 md:gap-16 md:gap-y-20'>
              {displayedData && displayedData.length > 0 ? (
                displayedData.map((person, index) => (
                  <NewCard key={`${activeTab}-${index}`} person={person} />
                ))
              ) : (
                <div className="text-center text-gray-300 w-full py-10">
                  Heads data coming soon.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>

  );

}



export default Team2;