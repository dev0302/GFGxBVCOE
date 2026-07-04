// TimelineModal.jsx
import React, { useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { createPortal } from 'react-dom';

function getPortalContainer() {
  if (typeof document === 'undefined') return null;
  return document.getElementById('modal-root') ?? document.body;
}

const TimelineModal = ({ person, onClose }) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, []);

  useLayoutEffect(() => {
    const el = overlayRef.current;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;

    const syncOverlayToViewport = () => {
      if (!el) return;
      if (vv && vv.width > 0) {
        el.style.position = 'fixed';
        el.style.top = `${vv.offsetTop}px`;
        el.style.left = `${vv.offsetLeft}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.width = `${vv.width}px`;
        el.style.height = `${vv.height}px`;
      } else if (el) {
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.right = '0';
        el.style.bottom = '0';
        el.style.width = '';
        el.style.height = '';
      }
    };

    const scrollY = window.scrollY ?? window.pageYOffset ?? 0;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBody = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    syncOverlayToViewport();
    vv?.addEventListener('resize', syncOverlayToViewport);
    vv?.addEventListener('scroll', syncOverlayToViewport);

    return () => {
      vv?.removeEventListener('resize', syncOverlayToViewport);
      vv?.removeEventListener('scroll', syncOverlayToViewport);

      document.body.style.position = prevBody.position;
      document.body.style.top = prevBody.top;
      document.body.style.left = prevBody.left;
      document.body.style.right = prevBody.right;
      document.body.style.width = prevBody.width;
      document.body.style.overflow = prevBody.overflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleClose = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.28,
        ease: 'power3.in',
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  if (!person) return null;

  return (
    <div
      ref={overlayRef}
      className="z-[240] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 p-4 backdrop-blur-md"
      role="presentation"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeline-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="
          relative my-auto w-[90%] max-h-[min(90vh,100dvh)] sm:w-full max-w-md
          rounded-3xl p-6 sm:p-8 text-richblack-25
          bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e]
          backdrop-blur-sm border border-gray-300/20 font-nunito
          flex flex-col
        "
      >
        {/* Header */}
        <div className="mb-6 flex-shrink-0 flex items-center gap-4 border-b border-cyan-500/30 pb-4">
          <img src={person.image} alt={person.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-cyan-500/50" />
          <div>
            <h2 id="timeline-modal-title" className="text-lg sm:text-xl font-bold font-montserrat">
              Contribution Timeline
            </h2>
            <p className="text-xs sm:text-sm text-gray-300">For {person.name}</p>
          </div>
        </div>

        {/* Timeline: NOTE data-lenis-prevent here */}
        <div
          data-lenis-prevent="true"
          className="
            relative border-l-2 border-cyan-500/50 pl-6 sm:pl-8 pr-2 sm:pr-4
            overflow-y-auto flex-1 min-h-0 space-y-6
            scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/40 hover:scrollbar-thumb-cyan-500/60
            overscroll-contain
          "
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {person.timeline && person.timeline.length > 0 ? (
            person.timeline.map((item, index) => (
              <div key={index} className="relative mb-8 last:mb-0">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 h-4 w-4 rounded-full bg-cyan-400 ring-4 ring-[#2c2c3e]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{item.year}</p>
                <h3 className="text-md font-bold text-richblack-25 font-montserrat mt-1">{item.role}</h3>
                <p className="mb-2 text-sm font-medium text-gray-300">{item.project}</p>
                {item.description && <p className="text-sm text-gray-400">{item.description}</p>}
              </div>
            ))
          ) : (
            <p className="text-gray-400">No timeline data available.</p>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-richblack-25 bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/40 hover:scale-110 transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default function TimelineModalPortal(props) {
  const { person } = props;
  if (!person) return null;
  const container = getPortalContainer();
  if (!container) return null;
  return createPortal(<TimelineModal {...props} />, container);
}
