import React, { useEffect, useState } from "react";
import notfoundimg from "../images/result.png";
import { NavLink } from "react-router-dom";
import { Instagram } from "react-feather";
import ResultImages from "../components/ResultImages";

// Loader Component (using Tailwind CSS)
const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-pink-500 border-t-transparent rounded-full animate-spin reverse"></div>
      </div>
      <p className="text-white text-lg font-medium">Loading results...</p>
    </div>
  );
};

const ResultPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] font-['Inter'] text-white">


      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative pt-44">

        {/* Loader overlay - covers only the main content area, not navbar */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] z-30">
            <Loader />
          </div>
        )}

        {/* Dialog Card */}
        <div className="relative bg-[#2a2a3d] rounded-2xl border-2 border-opacity-20 border-gray-300 shadow-lg p-6 max-w-[380px] min-h-[250px] flex flex-col items-center justify-end animate-fadeIn w-5/6 mt-10 mb-10 pt-16">
          {/* Bear Image */}
          <img
            src={notfoundimg}
            alt="Cute Bear"
            className="h-[220px] absolute -top-[115px] left-[90px] md:left-[120px] md:-top-[120px]  pointer-events-none animate-bounce"
          />

          {/* Title */}
          <h2 className="text-xl font-bold text-pink-500 mb-2 text-center">
            Results are outttt
          </h2>

          {/* Description */}
          <p className="text-base text-[#aaa] text-center">
            Checkout here....
            <a
              className="text-blue-400 text-base flex items-center justify-center gap-2 mt-2"
              href="https://www.instagram.com/stories/gfg_bvcoe/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              Click here to see results on
              <Instagram
                className="text-green-500 hover:text-blue-400 transition-colors"
                size={16}
              />
            </a>
          </p>

          <p className="text-base text-[#aaa] mb-6 text-center mt-2">
            Declared on 31 Aug, 2025
          </p>

          {/* Buttons */}
          <div className="flex justify-between w-full gap-3">
            <NavLink to="/" className="flex-1">
              <button className="w-full py-2.5 px-4 rounded-lg bg-[#444] text-[#ccc] text-sm transition-all duration-300 hover:scale-105 hover:opacity-95">
                Go Back
              </button>
            </NavLink>
            <NavLink to="/contact" className="flex-1">
              <button className="w-full py-2.5 px-4 rounded-lg bg-cyan-700 text-white text-sm transition-all duration-300 hover:scale-105 hover:opacity-95">
                Contact us
              </button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Images preload in background - hidden during loading */}
      {!loading && <ResultImages />}
    </div>
  );
};

export default ResultPage;