import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Easily change the scroll speed here. Higher number = slower scroll.
const SCROLL_DURATION = 40;

const Gallery = () => {
    const containerRef = useRef(null);
    const heroRef = useRef(null);

    // Refs for each of the three scrolling columns
    const column1Ref = useRef(null);
    const column2Ref = useRef(null);
    const column3Ref = useRef(null);

    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const allImages = [
      ...Array.from({ length: 20 }, (_, i) => ({ id: `grid-${i + 1}`, src: `/gridimg${i + 1}.webp`, title: `Event Highlight #${i + 1}` })),
      { id: 'inaug-1', src: '/images/Inaugration.webp', title: 'Inauguration' },
      { id: 'inaug-2', src: '/images/Inaugration1.webp', title: 'Inauguration' },
      { id: 'inaug-3', src: '/images/Inaugration2.webp', title: 'Inauguration' },
      { id: 'inaug-4', src: '/images/Inaugration3.webp', title: 'Inauguration' },
      { id: 'inaug-5', src: '/images/Inaugration4.webp', title: 'Inauguration' },
      { id: 'geekhunt-1', src: '/images/geekhunt.webp', title: 'GeekHunt Tech Fiesta' },
      { id: 'pyhunt-1', src: '/images/Pyhunt.webp', title: 'Pyhunt Challenge' },
      { id: 'pyhunt-2', src: '/images/Pyhunt1.webp', title: 'Pyhunt Challenge' },
      { id: 'pyhunt-3', src: '/images/Pyhunt2.webp', title: 'Pyhunt Challenge' },
      { id: 'pyhunt-4', src: '/images/Pyhunt3.webp', title: 'Pyhunt Challenge' },
      { id: 'pyhunt-5', src: '/images/Pyhunt4.webp', title: 'Pyhunt Challenge' },
      { id: 'aiconnect-1', src: '/images/aiconnect.webp', title: 'AI Connect Workshop' },
      { id: 'aiconnect-2', src: '/images/aiconnect1.webp', title: 'AI Connect Workshop' },
      { id: 'aiconnect-3', src: '/images/aiconnect2.webp', title: 'AI Connect Workshop' },
      { id: 'aiconnect-4', src: '/images/aiconnect4.webp', title: 'AI Connect Workshop' },
      { id: 'innovogue-1', src: '/images/Innovogue.webp', title: 'InnoVogue Ideathon' },
      { id: 'innovogue-2', src: '/images/Innovogue1.webp', title: 'InnoVogue Ideathon' },
      { id: 'innovogue-3', src: '/images/Innovogue2.webp', title: 'InnoVogue Ideathon' },
      { id: 'innovogue-4', src: '/images/Innovogue3.webp', title: 'InnoVogue Ideathon' },
      { id: 'innovogue-5', src: '/images/Innovogue4.webp', title: 'InnoVogue Ideathon' },
      { id: 'innovogue-6', src: '/images/Innovogue5.webp', title: 'InnoVogue Ideathon' },
      { id: 'vichaarx-1', src: '/images/vichaarx.webp', title: 'VichaarX Challenge' },
      { id: 'vichaarx-2', src: '/images/vichaarx1.webp', title: 'VichaarX Challenge' },
      { id: 'vichaarx-3', src: '/images/vichaarx2.webp', title: 'VichaarX Challenge' },
      { id: 'vichaarx-4', src: '/images/vichaarx3.webp', title: 'VichaarX Challenge' },
      { id: 'vichaarx-5', src: '/images/vichaarx4.webp', title: 'VichaarX Challenge' },
      { id: 'hqvisit-1', src: '/images/hqvisit.webp', title: 'GFG HQ Visit' },
      { id: 'hqvisit-2', src: '/images/hqvisit1.webp', title: 'GFG HQ Visit' },
      { id: 'hqvisit-3', src: '/images/hqvisit2.webp', title: 'GFG HQ Visit' },
      { id: 'hqvisit-4', src: '/images/hqvisit3.webp', title: 'GFG HQ Visit' },
      { id: 'hqvisit-5', src: '/images/hqvisit4.webp', title: 'GFG HQ Visit' },
      { id: 'hqvisit-6', src: '/images/hqvisit5.webp', title: 'GFG HQ Visit' },
      { id: 'gfg-1', src: '/images/gfg1.jpg', title: 'Community Moment' },
      { id: 'gfg-2', src: '/images/gfg2.jpg', title: 'Community Moment' },
      { id: 'gfg-3', src: '/images/gfg3.jpg', title: 'Community Moment' },
      { id: 'gfg-4', src: '/images/gfg4.jpg', title: 'Community Moment' },
      { id: 'gfg-5', src: '/images/gfg5.jpg', title: 'Community Moment' },
  ];

    const column1Images = allImages.filter((_, index) => index % 3 === 0);
    const column2Images = allImages.filter((_, index) => index % 3 === 1);
    const column3Images = allImages.filter((_, index) => index % 3 === 2);

    // GSAP animations for vertical auto-scrolling
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(heroRef.current, { opacity: 0, y: 50, duration: 1, ease: "power3.out" });
            
            const setupScroller = (columnRef, startYPercent, endYPercent) => {
                const column = columnRef.current;
                if (!column) return;

                gsap.fromTo(column, 
                    { yPercent: startYPercent },
                    { 
                        yPercent: endYPercent,
                        duration: SCROLL_DURATION,
                        ease: 'none',
                        repeat: -1,
                        overwrite: 'auto'
                    }
                );
            };
            
            const timeoutId = setTimeout(() => {
                setupScroller(column1Ref, 0, -50);
                setupScroller(column2Ref, -25, -75);
                setupScroller(column3Ref, 0, -50);
            }, 100);

            return () => clearTimeout(timeoutId);

        }, containerRef);

        return () => ctx.revert();
    }, [windowHeight]);

    // Helper component to render a column of images
    const ImageColumn = ({ images, columnRef }) => {
        return (
            <div ref={columnRef} className="flex flex-col gap-6 w-[30vw] max-w-[400px]">
                {[...images, ...images].map((image, index) => (
                    <div key={`${image.id}-${index}`} 
                         className="rounded-2xl group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <img 
                            src={image.src} 
                            alt={image.title} 
                            className="relative w-full h-auto rounded-2xl object-cover transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-green-500/25"
                            loading="lazy"
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/1e293b/a7f3d0?text=Image+Missing`; }}
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6 rounded-2xl">
                            <div className="w-full">
                                <h3 className="text-xl font-bold text-white opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 mb-2">{image.title}</h3>
                                <div className="w-0 group-hover:w-16 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500"></div>
                            </div>
                        </div>
                        
                        <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-green-400/30 transition-all duration-500"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden text-white font-nunito">
            {/* Enhanced Dark Theme Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]"></div>
            
            <div className="absolute inset-0">
                 <div className="absolute inset-0 opacity-5">
                    <div className="w-full h-full" style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(34, 197, 94, 0.3) 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
            </div>
            
            {/* Hero Section */}
            <section ref={heroRef} className="pt-32 pb-20 relative text-center z-20">
                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    <div className="absolute -inset-16 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 blur-3xl rounded-full opacity-30"></div>
                    
                    <h1 className="relative text-5xl md:text-6xl font-bold text-white mb-6 font-audiowide tracking-tight">
                        Society <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 drop-shadow-lg">Scrapbook</span>
                    </h1>
                    <p className="relative text-lg md:text-xl text-green-100 leading-relaxed mb-8">
                        A continuous stream of our favorite moments, memories, and milestones.
                    </p>
                    
                    <div className="relative flex justify-center items-center gap-4 mb-8">
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                    </div>
                </div>
            </section>

            <div className="relative h-screen w-full overflow-hidden">
                <div className="flex justify-center gap-6 absolute top-0 left-1/2 -translate-x-1/2 w-full">
                    <ImageColumn images={column1Images} columnRef={column1Ref} />
                    <ImageColumn images={column2Images} columnRef={column2Ref} />
                    <ImageColumn images={column3Images} columnRef={column3Ref} />
                </div>
            </div>

            {/* Top and Bottom Fading Gradients */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#111827] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#111827] to-transparent z-10 pointer-events-none"></div>
        </div>
    );
};

export default Gallery;