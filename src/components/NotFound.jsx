import React from 'react';
import notfoundimg from "../images/notFound.png";
import { NavLink } from 'react-router-dom';


const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] font-['Inter'] text-white">
      {/* Dialog Card */}
      <div className="relative mt-10 bg-[#2a2a3d] rounded-2xl border-2 border-opacity-20 border-gray-300 shadow-lg p-6 w-[360px] min-h-[250px] flex flex-col items-center justify-end animate-fadeIn">
        {/* Bear Image */}
        <img
          src={notfoundimg}
          alt="Cute Bear"
          className="h-[180px] absolute -top-[95px] left-[60px] pointer-events-none animate-bounce"
        />
        
        {/* Title */}
        <h2 className="text-lg font-bold text-red-400 mb-2">
          We are no longer accepting responses.
        </h2>
        
        {/* Description */}
        <p className="text-sm text-[#aaa] mb-6 text-center">
         The interviews for Execom 2025 have been successfully completed. If you have any queries, feel free to reach out to us.
        </p>
        
        {/* Buttons */}
        <div className="flex justify-between w-full gap-3">
          <button className="flex-1 py-2.5 px-4 rounded-lg bg-[#444] text-[#ccc] text-sm transition-all duration-300 hover:scale-105 hover:opacity-95">
            Go Back
          </button>
          <button className="flex-1 py-2.5 px-4 rounded-lg bg-cyan-700 text-white text-sm transition-all duration-300 hover:scale-105 hover:opacity-95">
            <NavLink to="/contact">Contact us</NavLink>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;