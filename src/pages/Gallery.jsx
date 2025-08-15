import React, { useRef, useEffect } from 'react';
import gsap from 'https://esm.sh/gsap';
import { ScrollTrigger } from 'https://esm.sh/gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const Gallery = () => {
    const containerRef = useRef(null);
    const heroRef = useRef(null);

    // Refs for each scrolling element
    const scroller1Ref = useRef(null);
    const scroller2Ref = useRef(null);
    const scroller3Ref = useRef(null);

    // Sample image data for three distinct rows
    const row1Images = [
        { id: 'r1-1', src: 'https://placehold.co/800x500/10b981/ffffff?text=Event+Capture+1', title: 'Event Capture 1' },
        { id: 'r1-2', src: 'https://placehold.co/800x500/06b6d4/ffffff?text=Hackathon+Moments', title: 'Hackathon Moments' },
        { id: 'r1-3', src: 'https://placehold.co/800x500/8b5cf6/ffffff?text=Team+Building', title: 'Team Building' },
        { id: 'r1-4', src: 'https://placehold.co/800x500/ef4444/ffffff?text=Workshop+Fun', title: 'Workshop Fun' },
        { id: 'r1-5', src: 'https://placehold.co/800x500/f97316/ffffff?text=Project+Demo', title: 'Project Demo' },
    ];
    const row2Images = [
        { id: 'r2-1', src: 'https://placehold.co/800x500/3b82f6/ffffff?text=Campus+Life', title: 'Campus Life' },
        { id: 'r2-2', src: 'https://placehold.co/800x500/14b8a6/ffffff?text=Coding+Session', title: 'Coding Session' },
        { id: 'r2-3', src: 'https://placehold.co/800x500/d946ef/ffffff?text=Guest+Speaker', title: 'Guest Speaker' },
        { id: 'r2-4', src: 'https://placehold.co/800x500/f59e0b/ffffff?text=Late+Night+Hustle', title: 'Late Night Hustle' },
        { id: 'r2-5', src: 'https://placehold.co/800x500/65a30d/ffffff?text=Victory+Moment', title: 'Victory Moment' },
    ];
    const row3Images = [
        { id: 'r3-1', src: 'https://placehold.co/800x500/4f46e5/ffffff?text=Behind+the+Scenes', title: 'Behind the Scenes' },
        { id: 'r3-2', src: 'https://placehold.co/800x500/be123c/ffffff?text=Planning+Session', title: 'Planning Session' },
        { id: 'r3-3', src: 'https://placehold.co/800x500/059669/ffffff?text=Community+Meetup', title: 'Community Meetup' },
        { id: 'r3-4', src: 'https://placehold.co/800x500/9333ea/ffffff?text=Fun+and+Games', title: 'Fun and Games' },
        { id: 'r3-5', src: 'https://placehold.co/800x500/c2410c/ffffff?text=Annual+Fest', title: 'Annual Fest' },
    ];

    // GSAP animations for auto-scrolling
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(heroRef.current, { opacity: 0, y: 50, duration: 1, ease: "power3.out" });
            
            const setupScroller = (scrollerRef, direction) => {
                const scroller = scrollerRef.current;
                if (!scroller) return;

                gsap.fromTo(scroller, 
                    { xPercent: direction === 'left' ? 0 : -50 },
                    { 
                        xPercent: direction === 'left' ? -50 : 0,
                        duration: 80, // Increased duration for a slower, smoother feel
                        ease: 'none',
                        repeat: -1,
                    }
                );
            };
            
            setupScroller(scroller1Ref, 'left');
            setupScroller(scroller2Ref, 'right'); // Opposite direction
            setupScroller(scroller3Ref, 'left');

        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Helper component to render a single film strip row
    const FilmStripRow = ({ images, scrollerRef }) => {
        // This is a clever CSS trick to create the film reel holes
        const perforationStyle = {
            backgroundImage: 'radial-gradient(circle, transparent 35%, #0c1a1a 35%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 50%',
            height: '20px',
        };

        return (
            <div className="bg-black/50 py-2">
                <div style={perforationStyle} />
                <div className="flex" ref={scrollerRef}>
                    {[...images, ...images].map((image, index) => (
                        <div key={`${image.id}-${index}`} className="flex-shrink-0 w-[450px] h-[280px] p-3">
                            <div className="relative rounded-lg overflow-hidden shadow-lg group h-full">
                                <img 
                                    src={image.src} 
                                    alt={image.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-end p-4">
                                    <h3 className="text-lg font-bold text-white opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">{image.title}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={perforationStyle} />
            </div>
        );
    };

    return (
        <div ref={containerRef} className="min-h-screen w-full bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 overflow-hidden text-white font-nunito" style={{ backgroundColor: '#0c1a1a' }}>
            {/* Hero Section */}
            <section ref={heroRef} className="pt-32 pb-20 relative text-center">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-audiowide tracking-tight">
                        Society <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">Scrapbook</span>
                    </h1>
                    <p className="text-lg md:text-xl text-green-100 leading-relaxed">
                        A continuous stream of our favorite moments, memories, and milestones.
                    </p>
                </div>
            </section>

            {/* Scrolling Gallery Section */}
            <div className="relative w-full flex flex-col gap-y-2 py-10">
                {/* Left and Right Fading Gradients */}
                <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-[#0c1a1a] to-transparent z-10"></div>
                <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-[#0c1a1a] to-transparent z-10"></div>

                <FilmStripRow images={row1Images} scrollerRef={scroller1Ref} />
                <FilmStripRow images={row2Images} scrollerRef={scroller2Ref} />
                <FilmStripRow images={row3Images} scrollerRef={scroller3Ref} />
            </div>
        </div>
    );
};

export default Gallery;
