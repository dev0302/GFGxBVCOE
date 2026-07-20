"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import ReactLenis from "lenis/react"
import { useEffect, useRef } from "react"
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

const ConfettiBackground = () => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const confettiRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext("2d")
    if (!ctx) return undefined

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      const width = parent?.clientWidth || window.innerWidth
      const height = parent?.clientHeight || window.innerHeight

      canvas.width = width
      canvas.height = height
    }

    const whiteColors = [
      "rgba(255, 255, 255, 0.65)",
      "rgba(248, 250, 252, 0.55)",
      "rgba(241, 245, 249, 0.6)",
      "rgba(226, 232, 240, 0.5)",
      "rgba(134, 239, 172, 0.45)",
    ]

    const getSpeedProfile = () => {
      const isMobile = canvas.width < 640

      return {
        horizontal: isMobile ? 0.65 : 1.2,
        fallMin: isMobile ? 0.45 : 1.1,
        fallRange: isMobile ? 0.85 : 1.7,
        depthMin: isMobile ? 0.35 : 0.75,
        depthRange: isMobile ? 0.55 : 1.1,
        acceleration: isMobile ? 0.0015 : 0.004,
        depthAcceleration: isMobile ? 1.0005 : 1.0012,
        fade: isMobile ? 0.02 : 0.035,
      }
    }

    const initConfetti = () => {
      confettiRef.current = []
      const speed = getSpeedProfile()

      for (let i = 0; i < 320; i += 1) {
        confettiRef.current.push({
          x: -canvas.width * 0.2 + Math.random() * canvas.width * 1.4,
          y: -canvas.height * 0.06 + Math.random() * canvas.height * 1.12,
          z: Math.random() * 900 + 450,
          velocityX: (Math.random() - 0.5) * speed.horizontal,
          velocityY: Math.random() * speed.fallRange + speed.fallMin,
          velocityZ: -(Math.random() * speed.depthRange + speed.depthMin),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.04,
          baseSize: Math.random() * 12 + 6,
          opacity: 1,
          shape: ["rectangle", "circle", "star", "diamond"][Math.floor(Math.random() * 4)],
          color: whiteColors[Math.floor(Math.random() * whiteColors.length)],
          floatPhase: Math.random() * Math.PI * 2,
          swayAmplitude: Math.random() * 0.5 + 0.2,
          bobAmplitude: Math.random() * 0.3 + 0.1,
          isFading: false,
        })
      }
    }

    const drawConfetti = (piece) => {
      const perspective = 800
      const scale = perspective / (perspective + piece.z)
      const projectedX = piece.x + (piece.x - canvas.width / 2) * (1 - scale)
      const projectedY = piece.y + (piece.y - canvas.height / 2) * (1 - scale)

      if (scale <= 0.01 || scale > 2) return

      const size = piece.baseSize * scale
      const opacity = Math.min(piece.opacity * scale * 1.5, 1)

      ctx.save()
      ctx.translate(projectedX, projectedY)
      ctx.rotate(piece.rotation)
      ctx.globalAlpha = opacity
      ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(scale * 0.3, 0.2)})`
      ctx.shadowBlur = scale * 4
      ctx.shadowOffsetX = scale * 3
      ctx.shadowOffsetY = scale * 3
      ctx.fillStyle = piece.color

      if (piece.shape === "rectangle") {
        const width = size * 1.5
        const height = size * 0.8
        ctx.fillRect(-width / 2, -height / 2, width, height)
      } else if (piece.shape === "circle") {
        ctx.beginPath()
        ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2)
        ctx.fill()
      } else if (piece.shape === "star") {
        ctx.beginPath()
        const starSize = size * 0.7
        for (let i = 0; i < 6; i += 1) {
          const angle = (i * Math.PI) / 3
          const x = Math.cos(angle) * starSize
          const y = Math.sin(angle) * starSize
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)

          const innerAngle = ((i + 0.5) * Math.PI) / 3
          ctx.lineTo(Math.cos(innerAngle) * starSize * 0.5, Math.sin(innerAngle) * starSize * 0.5)
        }
        ctx.closePath()
        ctx.fill()
      } else {
        const diamondSize = size * 0.8
        ctx.beginPath()
        ctx.moveTo(0, -diamondSize)
        ctx.lineTo(diamondSize * 0.6, 0)
        ctx.lineTo(0, diamondSize)
        ctx.lineTo(-diamondSize * 0.6, 0)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    }

    const resetPiece = (piece) => {
      const speed = getSpeedProfile()

      piece.x = -canvas.width * 0.2 + Math.random() * canvas.width * 1.4
      piece.y = Math.random() < 0.65
        ? -Math.random() * canvas.height * 0.08
        : Math.random() * canvas.height
      piece.z = Math.random() * 900 + 450
      piece.velocityX = (Math.random() - 0.5) * speed.horizontal
      piece.velocityY = Math.random() * speed.fallRange + speed.fallMin
      piece.velocityZ = -(Math.random() * speed.depthRange + speed.depthMin)
      piece.floatPhase = Math.random() * Math.PI * 2
      piece.opacity = 1
      piece.isFading = false
    }

    const updateConfetti = () => {
      const speed = getSpeedProfile()

      confettiRef.current.forEach((piece) => {
        piece.floatPhase += 0.02
        piece.x += piece.velocityX + Math.sin(piece.floatPhase) * piece.swayAmplitude * 0.3
        piece.y += piece.velocityY + Math.cos(piece.floatPhase * 0.7) * piece.bobAmplitude * 0.2
        piece.z += piece.velocityZ
        piece.rotation += piece.rotationSpeed

        const turbulence = Math.max(0, 1 - piece.z / 1500) * 0.08
        piece.velocityX += (Math.random() - 0.5) * turbulence * 0.5
        piece.velocityY += (Math.random() - 0.5) * turbulence * 0.5
        piece.velocityX += (Math.random() - 0.5) * 0.005
        piece.velocityY += (Math.random() - 0.5) * 0.005
        piece.velocityX *= 0.999
        piece.velocityY *= 0.999
        piece.velocityY += speed.acceleration
        piece.velocityZ *= speed.depthAcceleration

        if (!piece.isFading && (piece.z <= 140 || piece.x < -150 || piece.x > canvas.width + 150 || piece.y > canvas.height + 180)) {
          piece.isFading = true
        }

        if (piece.isFading) piece.opacity -= speed.fade
        if (piece.opacity <= 0) resetPiece(piece)
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      updateConfetti()
      confettiRef.current.forEach(drawConfetti)
      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    initConfetti()
    animate()
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full pointer-events-none" />
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
      <section
  className="
    relative w-full overflow-hidden
    bg-[#000814]
    before:absolute before:inset-0
    before:bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.10),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(34,197,94,0.07),transparent_30%)]
    before:pointer-events-none
  "
>
        <ConfettiBackground />

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
