import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

const TimelineModal = ({ person, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Ensure modalRef.current exists before animating
    if (modalRef.current) {
      gsap.fromTo(modalRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
    }
  }, []);

  const handleClose = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, { y: 50, opacity: 0, duration: 0.3, ease: 'power3.in', onComplete: onClose });
    }
  };

  if (!person) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md" onClick={handleClose}>
      <div
        ref={modalRef}
        className="
          relative w-[85%] sm:w-full max-w-md rounded-3xl p-6 sm:p-8 text-white
          bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e]
          backdrop-blur-sm
          border border-gray-300/20
          font-nunito
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Modal Header --- */}
        <div className="mb-6 flex items-center gap-4 border-b border-cyan-500/30 pb-4">
          <img src={person.image} alt={person.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-cyan-500/50" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-montserrat">Contribution Timeline</h2>
            <p className="text-xs sm:text-sm text-gray-300">For {person.name}</p>
          </div>
        </div>

        {/* --- Timeline Content --- */}
        <div className="
          relative border-l-2 border-cyan-500/50 pl-6 sm:pl-8 max-h-[50vh] overflow-y-auto pr-2 sm:pr-4
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/40 hover:scrollbar-thumb-cyan-500/60
        ">
          {person.timeline && person.timeline.length > 0 ? (
            person.timeline.map((item, index) => (
              <div key={index} className="relative mb-8 last:mb-0">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 h-4 w-4 rounded-full bg-cyan-400 ring-4 ring-[#2c2c3e]"></div>
                
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{item.year}</p>
                <h3 className="text-md font-bold text-white font-montserrat mt-1">{item.role}</h3>
                <p className="mb-2 text-sm font-medium text-gray-300">{item.project}</p>
                {item.description && <p className="text-sm text-gray-400">{item.description}</p>}
              </div>
            ))
          ) : (
            <p className="text-gray-400">No timeline data available.</p>
          )}
        </div>

        {/* --- Close Button --- */}
        <button 
          onClick={handleClose} 
          className="
            absolute top-4 right-4 sm:-top-4 sm:-right-4 
            flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full 
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