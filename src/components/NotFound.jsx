import React from 'react';
import notfoundimg from "../images/notFound.png";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] font-['Inter'] text-white">
      {/* Dialog Card */}
      <div className="relative bg-[#2a2a3d] rounded-2xl border-2 border-opacity-20 border-gray-300 shadow-lg p-6 w-[360px] min-h-[250px] flex flex-col items-center justify-end animate-fadeIn">
        {/* Bear Image */}
        <img
          src={notfoundimg}
          alt="Cute Bear"
          className="h-[180px] absolute -top-[85px] left-[60px] pointer-events-none animate-bounce"
        />
        
        {/* Title */}
        <h2 className="text-xl font-bold text-red-400 mb-2">
          Google Form Link Not Found
        </h2>
        
        {/* Description */}
        <p className="text-sm text-[#aaa] mb-6 text-center">
          This action cannot be undone. Blinky is a bit nervous about it too.
        </p>
        
        {/* Buttons */}
        <div className="flex justify-between w-full gap-3">
          <button className="flex-1 py-2.5 px-4 rounded-lg bg-[#444] text-[#ccc] text-sm transition-all duration-300 hover:scale-105 hover:opacity-95">
            Cancel
          </button>
          <button className="flex-1 py-2.5 px-4 rounded-lg bg-cyan-700 text-white text-sm transition-all duration-300 hover:scale-105 hover:opacity-95">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;