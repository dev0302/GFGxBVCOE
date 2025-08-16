import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

const TimelineModal = ({ person, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(modalRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, { y: 50, opacity: 0, duration: 0.3, ease: 'power3.in', onComplete: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md" onClick={handleClose}>
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#1B5E3C] to-[#2E7D4F] p-8 text-[#E6F4EA] shadow-2xl ring-1 ring-[#4CAF50]/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center gap-4 border-b border-[#4CAF50]/30 pb-4">
          <img src={person.image} alt={person.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-[#4CAF50]/50" />
          <div>
            <h2 className="text-2xl font-bold text-white">Contribution Timeline</h2>
            <p className="text-md text-[#B8E4C2]">For {person.name}</p>
          </div>
        </div>

        <div className="relative border-l-2 border-[#4CAF50]/50 pl-6 max-h-[50vh] overflow-y-auto pr-4">
          {person.timeline && person.timeline.length > 0 ? (
            person.timeline.map((item, index) => (
              <div key={index} className="relative mb-8">
                <div className="absolute -left-[34px] top-1 h-4 w-4 rounded-full bg-[#4CAF50] ring-4 ring-[#1B5E3C]"></div>
                <p className="text-sm font-semibold text-[#B8E4C2]">{item.year}</p>
                <h3 className="text-lg font-bold text-white">{item.role}</h3>
                <p className="mb-2 text-md font-medium text-[#CDEED0]">{item.project}</p>
                {item.description && <p className="text-sm text-[#B8E4C2]">{item.description}</p>}
              </div>
            ))
          ) : (
            <p className="text-[#B8E4C2]">No timeline data available.</p>
          )}
        </div>

        <button onClick={handleClose} className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#4CAF50]/50 text-white backdrop-blur-sm transition hover:bg-[#4CAF50]/80">✕</button>
      </div>
    </div>
  );
};

export default TimelineModal;