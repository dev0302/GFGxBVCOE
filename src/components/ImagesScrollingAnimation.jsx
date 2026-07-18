"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import ReactLenis from "lenis/react"
import { useRef } from "react"
import { DiaTextReveal } from "@/components/ui/dia-text-reveal"

const projects = [
  {
    title: "Event 1",
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_1024,h_1024,c_fill,q_auto,f_auto/v1772367741/gfg-events/1000226185.jpg",
  },
  {
    title: "Event 2",
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_1024,h_1024,c_fill,q_auto,f_auto/v1772791492/gfg-events/IMG_3355.heic",
  },
  {
    title: "Event 3",
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_1024,h_1024,c_fill,q_auto,f_auto/v1774538422/gfg-events/Screenshot%202026-03-26%20204658.png",
  },
  {
    title: "Freshers Meet",
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_1024,h_1024,c_fill,q_auto,f_auto/v1784357366/FreshersMeet_eryceo.webp",
  },
  {
    title: "Freshers Meet",
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_1024,h_1024,c_fill,q_auto,f_auto/v1784357366/FreshersMeet6_rc45g4.webp",
  },
  {
    title: "Event 6",
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_1024,h_1024,c_fill,q_auto,f_auto/v1772791509/gfg-events/IMG_3396.heic",
  },
]

const StickyCard_001 = ({
  i,
  title,
  src,
  progress,
  range,
  targetScale,
}) => {
  const container = useRef(null)

  const scale = useTransform(
    progress,
    range,
    [1, targetScale]
  )

  return (
    <div
      ref={container}
      className="
        sticky top-0
        flex items-center justify-center
        px-4 sm:px-6 lg:px-8
      "
    >
      <motion.div
        style={{
          scale,
          top: `calc(-5vh + ${i * 15 + 200}px)`,
        }}
        className="
          relative
          flex flex-col
          origin-top
          overflow-hidden

          h-[200px] w-[280px]
          sm:h-[240px] sm:w-[360px]
          md:h-[280px] md:w-[420px]
          lg:h-[300px] lg:w-[500px]

          rounded-2xl
          sm:rounded-3xl
          lg:rounded-[2rem]
        "
      >
        <img
          src={src || "/placeholder.svg"}
          alt={title}
          className="h-full w-full object-cover"
        />
      </motion.div>
    </div>
  )
}

const ImagesScrollingAnimation = () => {
  const container = useRef(null)

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  })

  return (
    <ReactLenis root>
      <section className="w-full bg-[#020d0e]">

        {/* Heading */}
        <div className="relative z-20 mt-20 flex w-full justify-center px-4 text-center">
          <h2
            className="
              text-2xl
              font-medium
              tracking-[-0.03em]
              sm:text-3xl
              md:text-4xl
              lg:text-5xl
              font-audiowide
            "
          >
            <DiaTextReveal
              text="Glimpses of Events Conducted"
              colors={["#22c55e", "#86efac", "#e8fff3"]}
              textColor="#F1F0EC"
              repeat
              repeatDelay={2}
              duration={1.5}
            />
          </h2>
        </div>

        {/* Cards */}
        <main
          ref={container}
          className="
            relative
            flex w-full
            flex-col
            items-center
            justify-center

            pb-[40vh]
            
            sm:pb-[60vh]
            
            lg:pb-[70vh]
            
          "
        >
          {projects.map((project, i) => {
            const targetScale = Math.max(
              0.6,
              1 -
                (projects.length - i - 1) *
                  0.08
            )

            return (
              <StickyCard_001
                key={`p_${i}`}
                i={i}
                {...project}
                progress={scrollYProgress}
                range={[i * 0.2, 1]}
                targetScale={targetScale}
              />
            )
          })}
        </main>

      </section>
    </ReactLenis>
  )
}

export {
  ImagesScrollingAnimation,
  StickyCard_001,
}