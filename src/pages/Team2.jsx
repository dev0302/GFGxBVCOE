import React from 'react'
import NewCard from './NewCard';
import teamData from '../data/teamData';



function Team2() {
  return (
    <div className='w-[100vw] bg-[#ECF0EF]'>
      <div className='TEAM_SECTION mt-24 justify-center items-centre flex flex-wrap w-10/12 mx-auto gap-10 pb-12'>
      {
        teamData.map ( (member) => {
          return <NewCard {...member} key={member.name}></NewCard>
        } )
      }
    </div>
    </div>
    
  )
}

export default Team2;