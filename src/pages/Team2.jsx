import React from 'react'
import NewCard from './NewCard';
import teamData from '../data/teamData';



function Team2() {
  return (
    <div className='w-[100vw] bg-gradient-to-tr from-[#0F3D2F] via-[#1B5E3C] to-[#2E7D4F]'>
      <div className='TEAM_SECTION mt-24 justify-center items-center flex flex-wrap w-10/12 mx-auto gap-10 pb-12'>
        {
          teamData.map((member) => (
            <NewCard {...member} key={member.name} />
          ))
        }
      </div>
    </div>
  );
}


export default Team2;