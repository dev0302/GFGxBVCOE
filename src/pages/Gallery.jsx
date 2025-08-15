import React, { useRef, useEffect } from 'react';
import gsap from 'https://esm.sh/gsap';
import { ScrollTrigger } from 'https://esm.sh/gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Easily change the scroll speed here. Higher number = slower scroll.
const SCROLL_DURATION = 20;

const Gallery = () => {
    const containerRef = useRef(null);
    const heroRef = useRef(null);

    // Refs for each of the three scrolling columns
    const column1Ref = useRef(null);
    const column2Ref = useRef(null);
    const column3Ref = useRef(null);

    // Sample image data for three distinct columns
    const column1Images = [
        { id: 'c1-1', src: 'https://i2.wp.com/thenewcamera.com/wp-content/uploads/2016/01/Nikon-D500-Sample-Image-3.jpg', title: 'Portrait Orientation' },
        { id: 'c1-2', src: 'https://www.cameraegg.org/wp-content/uploads/2014/09/Nikon-D750-Sample-Images-3.jpg', title: 'Landscape Orientation' },
        { id: 'c1-3', src: 'https://photographylife.com/wp-content/uploads/2023/05/nikon-z8-00006-1536x1024.jpg', title: 'Square Image' },
    ];
    const column2Images = [
        { id: 'c2-1', src: 'https://th.bing.com/th/id/R.c002f934e1f040498f198a632e6adccc?rik=%2b5GS9jcFjD4KXg&riu=http%3a%2f%2fwww.cameraegg.org%2fwp-content%2fuploads%2f2012%2f09%2fnikon-d600-sample-images.jpg&ehk=711QrJdIO8zFSeTR4V7jZeJVcOjX7jTba0oQ93rP0Mo%3d&risl=&pid=ImgRaw&r=0', title: 'Campus Life' },
        { id: 'c2-2', src: 'https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg', title: 'Coding Session' },
        { id: 'c2-3', src: 'https://i2.wp.com/thenewcamera.com/wp-content/uploads/2016/01/Nikon-D500-Sample-Image-3.jpg', title: 'Guest Speaker' },
    ];
    const column3Images = [
        { id: 'c3-1', src: 'https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg', title: 'Behind the Scenes' },
        { id: 'c3-2', src: 'https://photographylife.com/wp-content/uploads/2014/06/Nikon-D810-Image-Sample-6.jpg', title: 'Planning Session' },
        { id: 'c3-3', src: 'https://www.cameraegg.org/wp-content/uploads/2014/09/Nikon-D750-Sample-Images-3.jpg', title: 'Community Meetup' },
    ];

    // GSAP animations for vertical auto-scrolling
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(heroRef.current, { opacity: 0, y: 50, duration: 1, ease: "power3.out" });
            
            const setupScroller = (columnRef) => {
                const column = columnRef.current;
                if (!column) return;

                gsap.fromTo(column, 
                    { yPercent: -25 },
                    { 
                        yPercent: 0,
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
        <div ref={columnRef} className="flex flex-col gap-4">
            {[...images, ...images, ...images, ...images].map((image, index) => (
                <div key={`${image.id}-${index}`} className="w-[400px] group relative ">
                    <img 
                        src={image.src} 
                        alt={image.title} 
                        className="w-full h-auto rounded-2xl shadow-lg object-cover transition-transform duration-500  "
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/000000/ffffff?text=Image+Failed+to+Load`; }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-end p-4 rounded-2xl">
                        <h3 className="text-lg font-bold text-white opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">{image.title}</h3>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div ref={containerRef} className="min-h-screen w-full bg-gradient-to-b from-black via-green-950 to-black overflow-hidden text-white font-nunito">
            {/* Hero Section */}
            <section ref={heroRef} className="pt-32 pb-20 relative text-center z-20">
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
            <div className="absolute inset-0 h-full w-full flex justify-center gap-4 py-10">
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
