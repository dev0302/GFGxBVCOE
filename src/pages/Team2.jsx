import React from 'react'
import NewCard from './NewCard';
import teamData from '../data/teamData';



function Team2() {
  return (
    <div className='w-[100vw] bg-gradient-to-tr from-[#0F3D2F] via-[#1B5E3C] to-[#2E7D4F]'>
      <div className='TEAM_SECTION mt-24 justify-center items-center flex flex-wrap w-10/12 mx-auto gap-10 pb-12'>
       {/* Hero Section */}
        <section className="pt-8 pb-16 px-6 font-nunito">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight  tracking-tight">
              Meet Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                Team
              </span>
            </h1>
            <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto leading-relaxed font-light">
              The passionate minds behind GFG BVCOE Student Chapter, driving innovation and fostering a community of learners.
            </p>
          </div>
        </section>
        
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