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
    }
  }, [event]);

  if (!event) return null;

  const handleClose = () => {
    gsap.to(modalRef.current, {
      scale: 0.9, opacity: 0, duration: 0.2, ease: 'power2.in',
      onComplete: onClose,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={handleClose}>
      <div ref={modalRef} className="bg-gradient-to-br from-green-950 to-emerald-900 border border-green-400/30 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative opacity-0" onClick={(e) => e.stopPropagation()}>
        
        <button onClick={handleClose} className="absolute top-4 right-4 text-green-300 hover:text-white transition-colors z-10">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* --- NEW LAYOUT: TWO COLUMNS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- LEFT COLUMN: GALLERY & DETAILS --- */}
          <div>
            {/* Image Gallery */}
            <div className="mb-6">
              <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-4 border border-green-500/20">
                <img src={activeImage} alt={event.title} className="w-full h-full object-cover transition-all duration-300" />
              </div>
              <div className="flex gap-3">
                {event.galleryImages.map((img, index) => (
                  <div key={index} className="w-1/4 h-20 rounded-lg overflow-hidden cursor-pointer" onClick={() => setActiveImage(img)}>
                    <img src={img} alt={`thumbnail ${index + 1}`} 
                      className={`w-full h-full object-cover transition-all duration-300 ${activeImage === img ? 'ring-2 ring-green-400' : 'opacity-60 hover:opacity-100'}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Core Details */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-green-200">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span className="text-sm font-semibold">{event.date} at {event.time}</span>
              </div>
              <div className="flex items-center gap-3 text-green-200">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="text-sm font-semibold">{event.location}</span>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: INFO --- */}
          <div>
            <div className="inline-flex items-center px-3 py-1 bg-green-500/20 rounded-full border border-green-400/30 mb-4">
              <span className="text-sm font-medium text-green-300">{event.category}</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{event.title}</h2>
            
            <p className="text-green-100 text-base leading-relaxed mb-6">{event.description}</p>
            
            {/* Sections */}
            <div className="space-y-6">
              {/* Speakers */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3 border-b border-green-400/20 pb-2">Speakers</h3>
                <div className="space-y-3">
                  {event.speakers.map((speaker, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center ring-2 ring-green-500/50">
                        <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-green-100">{speaker.name}</p>
                        <p className="text-sm text-green-300">{speaker.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3 border-b border-green-400/20 pb-2">Agenda</h3>
                <ul className="space-y-2 list-inside">
                  {event.agenda.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-green-200">
                      <span className="text-green-400 mt-1">&#10003;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prerequisites */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3 border-b border-green-400/20 pb-2">Prerequisites</h3>
                <ul className="space-y-2 list-disc list-inside text-green-200">
                  {event.prerequisites.map((item, index) => <li key={index}>{item}</li>)}
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