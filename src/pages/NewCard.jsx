import React from 'react';
// import img from "../assets/image.png"
import { Users, Check } from 'react-feather'; // Feather icons
import verify from "../assets/verify.svg"
import profile from "../assets/profile.svg"
import tick from "../assets/tick-circle.svg"
import activity from "../assets/activity.svg"



function NewCard({name,branch,year,position,p0,image,p1,p2,email,instaLink,linkedinLink}) {
    console.log(name);
    
  return (
    // bg-[#ECF0EF]
    
    <div className='mt-2 flex justify-center items-center  font-poppins text-[#111827]'>
        
      <div className="ring-2 ring-green-500/30
 rounded-[32px] w-[300px] h-[460px] bg-white shadow-md overflow-hidden">
        <img
          src={image}
          alt="Sophie Bennett"
          className='w-full h-[70%] object-cover rounded-[32px] p-1'
        />
        {/* text thing */}

        <div className='px-6 py-3'>
          <p className='text-lg font-semibold flex items-center gap-1'>
            {name}
            {/* icon - sophie bennet */}
            <span><img src={verify} className='text-black' height={10} alt="nf" /></span>
          </p>
          <p className='text-sm text-richblack-200 mt-1 leading-tight'>
            {position}
          </p>
          <div className='flex justify-between items-center mt-4 text-sm text-gray-700'>
            <div className='flex gap-4 items-center'>
              <span className='flex items-center gap-1'>
                {/* user icon */}
                <img src={profile} className='h-4' alt="nf" />
                312</span>
                 
              <span className='flex items-center gap-1'>
                 <img src={tick} className='h-4' alt="nf" />
                  48
                </span>
                 
              
            </div>
            <button className='bg-[#e3e2e16f] px-2 py-1 rounded-full border text-xs font-medium hover:bg-green-200 transition flex gap-1'>
              View Timeline <img src={activity} className='h-4' alt="nf" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewCard;