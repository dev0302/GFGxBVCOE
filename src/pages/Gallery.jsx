import React, { useRef, useEffect } from 'react';
import gsap from 'https://esm.sh/gsap';
import { ScrollTrigger } from 'https://esm.sh/gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Easily change the scroll speed here. Higher number = slower scroll.
const SCROLL_DURATION = 15;

const Gallery = () => {
    const containerRef = useRef(null);
    const heroRef = useRef(null);

    // Refs for each of the three scrolling columns
    const column1Ref = useRef(null);
    const column2Ref = useRef(null);
    const column3Ref = useRef(null);

    // Sample image data for three distinct columns
    const column1Images = [
        { id: 'c1-1', src: './gridimg1.webp', title: 'Portrait Orientation' },
        { id: 'c1-2', src: './gridimg2.webp', title: 'Landscape Orientation' },
        { id: 'c1-3', src: './gridimg3.webp', title: 'Square Image' },
    ];
    const column2Images = [
        { id: 'c2-1', src: './gridimg4.webp', title: 'Campus Life' },
        { id: 'c2-2', src: './gridimg5.webp', title: 'Coding Session' },
        { id: 'c2-3', src: './gridimg6.webp', title: 'Guest Speaker' },
    ];
    const column3Images = [
        { id: 'c3-1', src: './gridimg7.webp', title: 'Behind the Scenes' },
        { id: 'c3-2', src: './gridimg8.webp', title: 'Planning Session' },
        { id: 'c3-3', src: './gridimg9.webp', title: 'Community Meetup' },
    ];

    // GSAP animations for vertical auto-scrolling
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(heroRef.current, { opacity: 0, y: 50, duration: 1, ease: "power3.out" });
            
            const setupScroller = (columnRef) => {
                const column = columnRef.current;
                if (!column) return;

                gsap.fromTo(column, 
                    { yPercent: -50 },
                    { 
                        yPercent: -25,
                        duration: SCROLL_DURATION,
                        ease: 'none',
                        repeat: -1,
                    }
                );
            };
            
            const timeoutId = setTimeout(() => {
                setupScroller(column1Ref);
                setupScroller(column2Ref);
                setupScroller(column3Ref);
            }, 100);

            return () => clearTimeout(timeoutId);

        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Helper component to render a column of images
    const ImageColumn = ({ images, columnRef }) => (
        <div ref={columnRef} className="flex flex-col gap-6">
            {[...images, ...images, ...images, ...images].map((image, index) => (
                <div key={`${image.id}-${index}`} className="w-[400px] rounded-2xl group relative overflow-hidden">
                    {/* Enhanced Shadow and Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <img 
                        src={image.src} 
                        alt={image.title} 
                        className="relative w-full h-auto rounded-2xl object-cover transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-green-500/25"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/000000/ffffff?text=Image+Failed+to+Load`; }}
                    />
                    
                    {/* Enhanced Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6 rounded-2xl">
                        <div className="w-full">
                            <h3 className="text-xl font-bold text-white opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 mb-2">{image.title}</h3>
                            <div className="w-0 group-hover:w-16 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500"></div>
                        </div>
                    </div>
                    
                    {/* Border Glow on Hover */}
                    <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-green-400/30 transition-all duration-500"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden text-white font-nunito">
            {/* Enhanced Dark Theme Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                {/* Floating Particles */}
                <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-40 right-20 w-1 h-1 bg-emerald-300 rounded-full opacity-30 animate-ping"></div>
                <div className="absolute top-60 left-1/4 w-1.5 h-1.5 bg-teal-400 rounded-full opacity-25 animate-bounce"></div>
                <div className="absolute top-80 right-1/3 w-1 h-1 bg-green-300 rounded-full opacity-40 animate-pulse"></div>
                <div className="absolute top-96 left-1/2 w-2 h-2 bg-emerald-400 rounded-full opacity-20 animate-ping"></div>
                
                {/* Geometric Shapes */}
                <div className="absolute top-32 right-10 w-16 h-16 border border-green-400/20 rounded-full opacity-30"></div>
                <div className="absolute top-64 left-16 w-12 h-12 border border-emerald-300/15 rounded-lg opacity-25 rotate-45"></div>
                <div className="absolute top-96 right-1/4 w-20 h-20 border border-teal-400/10 rounded-full opacity-20"></div>
                
                {/* Gradient Orbs */}
                <div className="absolute top-48 left-1/3 w-32 h-32 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full blur-xl"></div>
                <div className="absolute top-80 right-1/2 w-24 h-24 bg-gradient-to-r from-teal-500/8 to-green-500/8 rounded-full blur-lg"></div>
                <div className="absolute top-64 left-1/2 w-28 h-28 bg-gradient-to-r from-emerald-500/6 to-teal-500/6 rounded-full blur-xl"></div>
            </div>
            
            {/* Mesh Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#0f172a]/30 to-[#1e293b]/40"></div>
            
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(34, 197, 94, 0.3) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>
            {/* Hero Section */}
            <section ref={heroRef} className="pt-32 pb-20 relative text-center z-20">
                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    {/* Glowing Background for Title */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 blur-3xl rounded-full opacity-30"></div>
                    
                    <h1 className="relative text-5xl md:text-6xl font-bold text-white mb-6 font-audiowide tracking-tight">
                        Society <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 drop-shadow-lg">Scrapbook</span>
                    </h1>
                    <p className="relative text-lg md:text-xl text-green-100 leading-relaxed mb-8">
                        A continuous stream of our favorite moments, memories, and milestones.
                    </p>
                    
                    {/* Decorative Elements */}
                    <div className="relative flex justify-center items-center gap-4 mb-8">
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                    </div>
                </div>
            </section>

            {/* Scrolling Gallery Section - No longer absolute */}
            <div className="flex justify-center gap-4">
                <ImageColumn images={column1Images} columnRef={column1Ref} />
                <ImageColumn images={column2Images} columnRef={column2Ref} />
                <ImageColumn images={column3Images} columnRef={column3Ref} />
            </div>

            {/* Top and Bottom Fading Gradients */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"></div>
        </div>
    );
};

export default Gallery;
