import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';


const EventModal = ({ event, onClose }) => {
  const modalRef = useRef(null);
  // State to manage the currently displayed image in the gallery
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    if (event) {
      // Set the first image as active when a new event is selected
      setActiveImage(event.galleryImages[0]);
      gsap.fromTo(modalRef.current, 
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      
      // Prevent background page scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    // Cleanup function to restore scrolling when modal closes
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [event]);

  if (!event) return null;

  const handleClose = () => {
    // Restore body scrolling before closing
    document.body.style.overflow = 'unset';
    
    gsap.to(modalRef.current, {
      scale: 0.9, opacity: 0, duration: 0.2, ease: 'power2.in',
      onComplete: onClose,
    });
  };

  const handleWheel = (e) => {
    // Prevent the wheel event from bubbling up to the background page
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={handleClose}>
      <div 
        ref={modalRef} 
        className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-400/30 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative opacity-0 backdrop-blur-xl" 
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #1F2937',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        
        {/* --- UPDATED BUTTON --- */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-red-400/40 border border-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-red z-10"
        >
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

              {/* --- NEW LAYOUT: TWO COLUMNS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-4">
        
        {/* --- LEFT COLUMN: GALLERY & DETAILS --- */}
        <div>
          {/* Image Gallery */}
          <div className="mb-6">
            <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-4 border border-gray-400/30 shadow-lg">
              <img src={activeImage} alt={event.title} className="w-full h-full object-cover transition-all duration-300" />
            </div>
            <div className="flex gap-3">
              {event.galleryImages.map((img, index) => (
                <div key={index} className="w-1/4 h-20 rounded-lg overflow-hidden cursor-pointer border border-gray-400/20 hover:border-gray-400/40 transition-all duration-300" onClick={() => setActiveImage(img)}>
                  <img src={img} alt={`thumbnail ${index + 1}`} 
                    className={`w-full h-full object-cover transition-all duration-300 ${activeImage === img ? 'ring-2 ring-cyan-400 ring-opacity-60' : 'opacity-70 hover:opacity-100'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Core Details */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <span className="text-sm font-medium text-gray-200">{event.date} at {event.time}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <span className="text-sm font-medium text-gray-200">{event.location}</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: INFO --- */}
        <div>
          <div className="inline-flex items-center px-4 py-2 bg-cyan-500/20 rounded-full border border-cyan-400/30 mb-6">
            <span className="text-sm font-medium text-cyan-300 tracking-wide">{event.category}</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 leading-tight tracking-wide">{event.title}</h2>
          
          <p className="text-gray-300 text-base leading-relaxed mb-8 font-light">{event.description}</p>
          
          {/* Sections */}
          <div className="space-y-8">
            {/* Speakers */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-400/20 pb-3 tracking-wide">Speakers</h3>
              <div className="space-y-4">
                {event.speakers.map((speaker, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-gray-400/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center ring-2 ring-cyan-400/30">
                      <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                    </div>
                    <div>
                      <p className="font-medium text-white text-base">{speaker.name}</p>
                      <p className="text-sm text-gray-300 font-light">{speaker.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-400/20 pb-3 tracking-wide">Agenda</h3>
              <ul className="space-y-3">
                {event.agenda.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300 p-3 bg-white/5 rounded-lg border border-gray-400/10">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-emerald-400 text-xs font-bold">&#10003;</span>
                    </div>
                    <span className="font-light leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisites */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-400/20 pb-3 tracking-wide">Prerequisites</h3>
              <ul className="space-y-3">
                {event.prerequisites.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300 p-3 bg-white/5 rounded-lg border border-gray-400/10">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                    <span className="font-light leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;