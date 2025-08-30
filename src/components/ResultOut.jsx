import React from 'react';
import notfoundimg from "../images/result.png";
import { NavLink } from 'react-router-dom';
import ResultImages from './ResultImages';



const ResultOut = () => {
  return (
    <div className="min-h-screen pt-36 flex-col items-center justify-center bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] font-['Inter'] text-white">
      {/* Dialog Card */}
      <div className="relative mt-10 bg-[#2a2a3d] rounded-2xl border-2 border-opacity-20 border-gray-300 shadow-lg p-6 max-w-[360px] min-h-[250px] flex flex-col items-center justify-end animate-fadeIn w-10/12 mx-auto">
        {/* Bear Image */}
        <img
          src={notfoundimg}
          alt="Cute Bear"
          className="h-[220px] absolute -top-[105px] left-[90px] md:left-[120px] md:-top-[95px]  pointer-events-none animate-bounce"
        />
        
        {/* Title */}
        <h2 className="text-lg font-bold text-pink-500 mb-2 text-center">
          Results are outttt
        </h2>
        
        {/* Description */}
        <p className="text-sm text-[#aaa] mb-6 text-center">
         Checkout here....
         <a className='text-blue-400 text-base' href="https://www.instagram.com/stories/gfg_bvcoe/?hl=en">Click here to see results</a>
        </p>
        
        {/* Buttons */}
        <div className="flex justify-between w-full gap-3">
          <NavLink to="/">
            <button className="flex-1 py-2.5 px-4 rounded-lg bg-[#444] text-[#ccc] text-sm transition-all duration-300 hover:scale-105 hover:opacity-95">
            Go Back
          </button>
          </NavLink>
          <button className="flex-1 py-2.5 px-4 rounded-lg bg-cyan-700 text-white text-sm transition-all duration-300 hover:scale-105 hover:opacity-95">
            <NavLink to="/contact">Contact us</NavLink>
          </button>
        </div>
      </div>

      <ResultImages></ResultImages>
    </div>
  );
};

export default ResultOut;