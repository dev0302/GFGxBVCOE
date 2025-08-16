import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

const TimelineModal = ({ person, onClose }) => {
  const modalRef = useRef(null);

  // --- Animations are already well-aligned with the theme's fluid motion ---
  useEffect(() => {
    gsap.fromTo(modalRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, { y: 50, opacity: 0, duration: 0.3, ease: 'power3.in', onComplete: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md" onClick={handleClose}>
      <div
        ref={modalRef}
        className="
          relative w-full max-w-lg rounded-3xl p-8 text-white
          bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e]
          backdrop-blur-sm
          border border-gray-300/20
          font-nunito
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Modal Header --- */}
        {/* ✨ UPDATED ACCENT: Changed from emerald to cyan for consistency */}
        <div className="mb-6 flex items-center gap-4 border-b border-cyan-500/30 pb-4">
          <img src={person.image} alt={person.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-cyan-500/50" />
          <div>
            <h2 className="text-2xl font-bold font-montserrat">Contribution Timeline</h2>
            <p className="text-md text-gray-300">For {person.name}</p>
          </div>
        </div>

        {/* --- Timeline Content --- */}
        {/* ✨ NEW FEATURE: Added a custom, on-theme scrollbar */}
        <div className="
          relative border-l-2 border-cyan-500/50 pl-8 max-h-[50vh] overflow-y-auto pr-4
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/40 hover:scrollbar-thumb-cyan-500/60
        ">
          {person.timeline && person.timeline.length > 0 ? (
            person.timeline.map((item, index) => (
              <div key={index} className="relative mb-8 last:mb-0">
                {/* ✨ UPDATED ACCENT: Switched marker color to cyan */}
                <div className="absolute -left-[43px] top-1 h-4 w-4 rounded-full bg-cyan-400 ring-4 ring-[#2c2c3e]"></div>
                
                {/* ✨ UPDATED ACCENT: Adjusted text colors for the new palette */}
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{item.year}</p>
                <h3 className="text-lg font-bold text-white font-montserrat mt-1">{item.role}</h3>
                <p className="mb-2 text-md font-medium text-gray-300">{item.project}</p>
                {item.description && <p className="text-sm text-gray-400">{item.description}</p>}
              </div>
            ))
          ) : (
            <p className="text-gray-400">No timeline data available.</p>
          )}
        </div>

        {/* --- Close Button --- */}
        {/* ✨ UPDATED ACCENT: Changed button to use the cyan theme */}
        <button 
          onClick={handleClose} 
          className="
            absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full 
            text-white transition-all duration-300
            bg-cyan-500/20 border border-cyan-500/30
            hover:bg-cyan-500/40 hover:scale-110
          "
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default TimelineModal;