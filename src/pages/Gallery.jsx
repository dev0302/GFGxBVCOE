import React, { useRef, useEffect, useState } from "react";
import gsap from "https://esm.sh/gsap";

const SCROLL_SPEED_FAST = 20;
const SCROLL_SPEED_SLOW = 22;

const Gallery = () => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const row3Ref = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Smooth infinite GSAP scrolling
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current, {
        opacity: 0,
        y: 25,
        duration: 1,
        ease: "power3.out"
      });
const setupScroller = (rowRef, speed, direction = "forward") => {
  const row = rowRef.current;
  if (!row) return;

  // 1. Calculate the true width of one full set of images
  // Since we duplicated them, the total scrollable width is 2x.
  // We want to reset once we've traveled the distance of one full set.
  const totalWidth = row.scrollWidth;
  const halfWidth = totalWidth / 2;

  const dir = direction === "forward" ? -1 : 1;

  // 2. Create the infinite loop
  const tl = gsap.to(row, {
    x: dir * halfWidth,
    duration: speed,
    ease: "none",
    repeat: -1,
    modifiers: {
      // This ensures that when x reaches -halfWidth, it wraps back to 0
      // creating a seamless visual loop.
      x: gsap.utils.unitize((x) => {
        const val = parseFloat(x);
        return direction === "forward" 
          ? val % halfWidth 
          : ((val % halfWidth) - halfWidth) % halfWidth;
      }),
    },
  });

  // 3. Optional: Pause on hover for better UX
//   row.addEventListener("mouseenter", () => tl.pause());
//   row.addEventListener("mouseleave", () => tl.play());
};

      const timeoutId = setTimeout(() => {
        setupScroller(row1Ref, SCROLL_SPEED_FAST, "forward");
        setupScroller(row2Ref, SCROLL_SPEED_SLOW, "backward");
        setupScroller(row3Ref, SCROLL_SPEED_FAST, "forward");
      }, 100);

      return () => clearTimeout(timeoutId);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const ImageCard = ({ image }) => {
    const [loaded, setLoaded] = useState(false);

    return (
      <div className="h-64 md:h-72 w-auto rounded-2xl group relative overflow-hidden flex-shrink-0 gallery-image-card">

        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <img
          src={image.src}
          alt={image.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`relative h-full w-auto object-cover rounded-2xl transition-all duration-700
          ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}
          group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-green-500/25`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/600x400/0a0a0a/16a34a?text=Image+Not+Found";
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6 rounded-2xl">
          <div className="w-full">
            <h3 className="text-xl font-bold text-richblack-25 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 mb-2">
              {image.title}
            </h3>
            <div className="w-0 group-hover:w-16 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500"></div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-green-400/30 transition-all duration-500"></div>
      </div>
    );
  };

  const ImageRow = ({ images, rowRef }) => {
    const repeatedImages = [...images, ...images];

    return (
      <div
        ref={rowRef}
        className="flex gap-4 md:gap-6 flex-shrink-0 will-change-transform"
      >
        {repeatedImages.map((image, index) => (
          <ImageCard key={`${image.id}-${index}`} image={image} />
        ))}
      </div>
    );
  };

  // ---- your full image arrays (unchanged) ----

  const row1Images = [
    { id: "r1-1", src: "/Hacknfrag2.webp", title: "Portrait Orientation" },
    { id: "r1-2", src: "/gridimg2.webp", title: "Landscape Orientation" },
    { id: "r1-3", src: "/gridimg3.webp", title: "Square Image" },
    { id: "r1-4", src: "/gridimg4.webp", title: "Campus Life" },
    { id: "r1-5", src: "/gridimg5.webp", title: "Coding Session" },
    { id: "r1-6", src: "/gridimg6.webp", title: "Coding Session" },
    { id: "r1-7", src: "/gridimg7.webp", title: "Coding Session" },
    { id: "r1-8", src: "/gridimg1.webp", title: "Portrait Orientation" },
    { id: "r1-9", src: "/Hacknfrag7.webp", title: "Square Image" },
    { id: "r1-10", src: "/Hacknfrag8.webp", title: "Coding Session" }
  ];

  const row2Images = [
    { id: "r2-1", src: "/gridimg8.webp", title: "Guest Speaker" },
    { id: "r2-2", src: "/gridimg9.webp", title: "Behind the Scenes" },
    { id: "r2-3", src: "/gridimg10.webp", title: "Planning Session" },
    { id: "r2-4", src: "/teampic_1.webp", title: "Community Meetup" },
    { id: "r2-5", src: "/gridimg12.webp", title: "Team Huddle" },
    { id: "r2-6", src: "/gridimg13.webp", title: "Coding Session" },
    { id: "r2-7", src: "/Hacknfrag9.webp", title: "Planning Session" }
  ];

  const row3Images = [
    { id: "r3-1", src: "/gridimg14.webp", title: "Workshop Action" },
    { id: "r3-2", src: "/gridimg15.webp", title: "Networking Event" },
    { id: "r3-3", src: "/gridimg16.webp", title: "Project Showcase" },
    { id: "r3-4", src: "/gridimg17.webp", title: "Hackathon Night" },
    { id: "r3-5", src: "/gridimg18.webp", title: "Celebration" },
    { id: "r3-6", src: "/gridimg19.webp", title: "Coding Session" },
    { id: "r3-7", src: "/gridimg20.webp", title: "Coding Session" },
    { id: "r3-8", src: "/pwgatefft2.webp", title: "Project Showcase" }
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-hidden text-richblack-25 font-nunito bg-[#020617]"
    >
      {/* Hero */}
      <section ref={heroRef} className="pt-32 pb-20 relative text-center z-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-richblack-25 mb-6 font-audiowide">
            Society{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
              Scrapbook
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200">
            A continuous stream of our favorite moments, memories, and milestones.
          </p>
        </div>
      </section>

      {/* Gallery rows */}
      <div className="relative flex flex-col gap-4 md:gap-6 py-10">
        <ImageRow images={row1Images} rowRef={row1Ref} />
        <ImageRow images={row2Images} rowRef={row2Ref} />
        <ImageRow images={row3Images} rowRef={row3Ref} />
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};

export default Gallery;