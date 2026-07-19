import { NavLink, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import Footer from "../components/common/Footer";
import CloudinaryIntroAnimation from "../components/CloudinaryIntroAnimation";
import ImageGrid from "../components/ImageGrid";
import UpcomingEventSection from "../components/UpcomingEventSection";
import ProfileAvatarFlip from "../components/common/ProfileAvatarFlip";

import Lenis from "lenis";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Code2,
  Handshake,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Lightbulb,
  MessageCircle,
  Mic,
  Settings,
  Sparkles,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import OrbitCarousel from "@/components/OrbitCarousel";
import { ImagesScrollingAnimation } from "@/components/ImagesScrollingAnimation";
gsap.registerPlugin(ScrollTrigger);

function Home() {
  const navigate = useNavigate();
  const titleRef = useRef();
  const descRef = useRef();
  const btnRef = useRef();
  const aboutSectionRef = useRef();
  const exploreSectionRef = useRef();
  const teamTitleRef = useRef();
  const teamCardsRef = useRef();

  const triggerResultConfetti = () => {
    const end = Date.now() + 3 * 1000;
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  const handleRecruitmentResultClick = () => {
    triggerResultConfetti();
    window.setTimeout(() => navigate("/results"), 650);
  };

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });
    let rafId;

    const updateScrollTrigger = () => ScrollTrigger.update();
    lenis.on("scroll", updateScrollTrigger);

    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);
    ScrollTrigger.refresh();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis.off("scroll", updateScrollTrigger);
      lenis.destroy();
    };
  }, []);

  const stats = [
    { value: "100+", label: "Active Members", icon: UsersRound },
    { value: "10+", label: "Events Held", icon: CalendarDays },
    { value: "10+", label: "Workshops Conducted", icon: Code2 },
  ];

  const exploreCards = [
    {
      eyebrow: "Upcoming",
      title: "Events",
      description: "Workshops, competitions, and exciting sessions.",
      cta: "Explore Events",
      icon: CalendarDays,
      to: "/events",
      tone: "from-emerald-400/20 via-emerald-500/10 to-teal-500/5",
      iconTone: "bg-emerald-400/15 text-emerald-300",
      textTone: "text-emerald-300",
    },
    {
      eyebrow: "Our Amazing",
      title: "Team",
      description: "Meet the passionate minds driving our community.",
      cta: "Meet The Team",
      icon: Users,
      to: "/team",
      tone: "from-violet-400/20 via-violet-500/10 to-fuchsia-500/5",
      iconTone: "bg-violet-400/15 text-violet-300",
      textTone: "text-violet-300",
    },
    {
      eyebrow: "Moments &",
      title: "Gallery",
      description: "Snapshots of creativity, collaboration and fun.",
      cta: "View Gallery",
      icon: ImageIcon,
      to: "/gallery",
      tone: "from-amber-300/20 via-amber-500/10 to-orange-500/5",
      iconTone: "bg-amber-300/15 text-amber-200",
      textTone: "text-amber-200",
    },
    {
      eyebrow: "Get In",
      title: "Touch",
      description: "Have questions or ideas? We'd love to hear from you.",
      cta: "Contact Us",
      icon: Handshake,
      to: "/contact",
      tone: "from-blue-400/20 via-blue-500/10 to-cyan-500/5",
      iconTone: "bg-blue-400/15 text-blue-300",
      textTone: "text-blue-300",
    },
  ];

const journeyPhotos = [
  {
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_256,h_256,c_fill,q_auto,f_auto/v1784357366/FreshersMeet5_z9qdup.webp",
    label: "Group Discussions",
    icon: Users,
    color: "bg-emerald-400/90",
  },
  {
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_256,h_256,c_fill,q_auto,f_auto/v1784357366/FreshersMeet3_haw3o6.webp",
    label: "Interactive Sessions",
    icon: MessageCircle,
    color: "bg-violet-400/90",
  },
  {
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_256,h_256,c_fill,q_auto,f_auto/v1784357366/FreshersMeet6_rc45g4.webp",
    label: "Team Activities",
    icon: Settings,
    color: "bg-amber-400/90",
  },
  {
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_256,h_256,c_fill,q_auto,f_auto/v1784357366/FreshersMeet_eryceo.webp",
    label: "Expert Talks",
    icon: Mic,
    color: "bg-blue-400/90",
  },
  {
    src: "https://res.cloudinary.com/duwmby01d/image/upload/w_256,h_256,c_fill,q_auto,f_auto/v1784357366/FreshersMeet4_qlm7yu.webp",
    label: "Selected Candidates",
    icon: Check,
    color: "bg-emerald-400/90",
  },
];

  // GSAP animations
  useGSAP(() => {
    // Hero entrance animations
    gsap.from(titleRef.current, {
      y: 50,
      opacity: 0,
      duration: 1.2,
      ease: "power2.out",
    });
    gsap.from(descRef.current, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      delay: 0.3,
    });
    gsap.from(btnRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.6,
    });

    [aboutSectionRef.current, exploreSectionRef.current].forEach((section) => {
      if (!section) return;

      gsap.from(section.querySelectorAll(".reveal-up"), {
        y: 44,
        opacity: 0,
        duration: 0.75,
        ease: "power2.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: section,
          start: "top 76%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // Team section animations
    gsap.from(teamTitleRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: teamTitleRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });

    gsap.from(teamCardsRef.current?.children, {
      y: 80,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.2,
      scrollTrigger: {
        trigger: teamCardsRef.current,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  }, []);

  return (
    <div className="relative overflow-x-hidden bg-[#020808] text-white">
      <section
          className="
            relative overflow-hidden
            border-b border-emerald-400/10
            lg:min-h-screen
          "
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(34,197,94,0.18),transparent_28%),radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.08),transparent_30%),linear-gradient(180deg,#020607_0%,#031111_54%,#02100d_100%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(190,255,214,0.55)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full border border-emerald-300/10 md:left-[72%] md:top-24 md:h-[28rem] md:w-[28rem]" />
          <div className="absolute left-[58%] top-20 hidden h-96 w-96 rounded-full border border-dashed border-emerald-200/10 md:block" />

          <div
            className="
              relative z-10 mx-auto
              flex min-h-[100svh] max-w-7xl flex-col
              px-5 pb-14 pt-20

              sm:min-h-0 sm:px-6 sm:pb-8 sm:pt-28

              lg:min-h-screen
              lg:px-8 lg:pb-12 lg:pt-24
            "
          >
            {/* HERO */}
            <div
              className="
                relative grid
                min-h-[68svh]
                content-center
                pb-16

                sm:min-h-0 sm:content-normal sm:pb-10

                lg:flex-1
                lg:items-center
                lg:gap-12
                lg:grid-cols-[1fr_0.9fr]
                lg:pb-0
              "
            >
              {/* TEXT */}
              <div
                className="
                  relative z-10
                  max-w-2xl text-left

                  lg:-mt-32
                "
              >
                <h1
                  ref={titleRef}
                  className="
                    font-nunito
                    text-[2.7rem] font-extrabold
                    leading-[1.12] tracking-normal
                    text-richblack-25

                    sm:text-4xl sm:leading-tight
                    md:text-5xl
                  "
                >
                  Empowering Students
                  <br />
                  to Build{" "}
                  <span className="text-green-400 drop-shadow-[0_0_18px_rgba(74,222,128,0.45)]">
                    the Future
                  </span>
                </h1>

                <p
                  ref={descRef}
                  id="home-desc"
                  className="
                    mt-8 max-w-md
                    font-nunito
                    text-base leading-7
                    text-slate-300

                    sm:mt-6 sm:text-sm sm:leading-8
                    md:text-lg
                  "
                >
                  Join GFG BVCOE - learn, teach, and collaborate through workshops,
                  events, project showcases and mentorship.
                </p>

                <div
                  ref={btnRef}
                  className="
                    mt-10 flex flex-wrap
                    items-center gap-4
                    font-nunito

                    sm:mt-8 sm:gap-4
                  "
                >
                  <NavLink to="/events">
                    <button
                      id="btn-join"
                      className="
                        group inline-flex items-center gap-3
                        rounded-full
                        bg-green-600/80
                        px-6 py-3.5
                        text-sm font-bold text-richblack-25
                        transition
                        hover:-translate-y-1
                        hover:bg-green-600

                        sm:gap-3 sm:px-7 sm:py-3 sm:text-sm
                      "
                    >
                      Our Events

                      <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </NavLink>

                  <button
                    id="btn-about"
                    onClick={() => navigate("/about")}
                    className="
                      group inline-flex items-center gap-3
                      rounded-full
                      border border-white/10
                      bg-white/[0.03]
                      px-6 py-3.5
                      text-sm font-semibold text-richblack-25
                      backdrop-blur
                      transition
                      hover:-translate-y-1
                      hover:border-green-300/40
                      hover:bg-green-300/10
                      sm:gap-3 sm:px-7 sm:py-3 sm:text-sm
                    "
                  >
                    About us

                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>

                  <button
                    id="btn-recruitment-result"
                    type="button"
                    onClick={handleRecruitmentResultClick}
                    className="
                      group inline-flex items-center gap-3
                      rounded-full
                      border border-white/10
                      bg-white/[0.03]
                      px-6 py-3.5
                      text-xs font-semibold text-richblack-25
                      backdrop-blur
                      transition
                      hover:-translate-y-1
                      hover:border-green-300/40
                      hover:bg-green-300/10
                      sm:gap-3 sm:px-7 sm:py-3 sm:text-sm
                    "
                  >
                    2025 Recruitment Result

                    <Trophy className="h-4 w-4 transition group-hover:rotate-6 group-hover:scale-110" />
                  </button>
                </div>
              </div>

              {/* LOGO BACKGROUND ON MOBILE */}
              <div
                className="
                  pointer-events-none
                  absolute inset-0 -z-10
                  h-full w-full
                  opacity-30 blur-[4px]

                  lg:pointer-events-auto
                  lg:relative
                  lg:inset-auto
                  lg:z-auto
                  lg:mx-auto
                  lg:h-[500px]
                  lg:max-w-xl
                  lg:opacity-100
                  lg:blur-none
                "
              >
                <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/20 blur-3xl" />

                <div className="absolute left-1/2 top-[58%] h-20 w-80 -translate-x-1/2 rounded-full border border-green-300/35 bg-green-400/10 shadow-[0_0_70px_rgba(34,197,94,0.35)]" />

                <div className="absolute left-1/2 top-[64%] h-14 w-[26rem] -translate-x-1/2 rounded-full border border-green-200/10" />

                <div
                  className="
                    absolute left-1/2 top-[42%]
                    -translate-x-1/2 -translate-y-1/2
                    flex items-center
                    font-audiowide
                    text-[7rem] font-black leading-none
                    text-green-500
                    drop-shadow-[0_0_34px_rgba(34,197,94,0.8)]
                    md:text-[12rem]
                  "
                >
                  <span className="inline-block scale-x-[-1]">G</span>
                  <span>G</span>
                </div>

                <div className="absolute left-[8%] top-[10%] rounded-full border border-green-300/15 bg-white/[0.04] p-3 text-green-200 backdrop-blur sm:left-[18%] sm:top-[18%] sm:p-4">
                  <UsersRound className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <div className="absolute right-[8%] top-[5%] rounded-full border border-green-300/15 bg-white/[0.04] p-3 text-green-200 backdrop-blur sm:right-[18%] sm:top-[10%] sm:p-4">
                  <Code2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <div className="absolute right-[2%] top-[45%] rounded-full border border-green-300/15 bg-white/[0.04] p-3 text-green-200 backdrop-blur sm:right-[4%] sm:top-[38%] sm:p-4">
                  <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>

            {/* STATS */}
            <div
              id="stats-grid"
              className="
                relative z-20
                mt-[-40px]
                grid grid-cols-3
                overflow-hidden rounded-3xl
                border border-green-400/10
                bg-green-950/30
                font-nunito
                shadow-lg
                ring-1 ring-inset ring-green-400/5

                sm:mt-6 sm:rounded-3xl

                lg:-mt-16
              "
            >
              {stats.map(({ value, label, icon: Icon, highlight }) => (
                <div
                  key={label}
                  className="
                    flex min-w-0
                    flex-col items-center justify-center
                    gap-4
                    border-r border-green-400/10
                    px-2 py-6
                    text-center
                    last:border-r-0

                    sm:flex-row
                    sm:justify-center
                    sm:gap-5
                    sm:px-6 sm:py-5
                    sm:text-left
                  "
                >
                  <div
                    className={`rounded-full p-3 sm:p-4 ${
                      highlight
                        ? "bg-yellow-400/10 text-yellow-300"
                        : "bg-green-400/10 text-green-300"
                    }`}
                  >
                    <Icon className="h-5 w-5 sm:h-5 sm:w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-lg font-extrabold text-green-300 sm:text-[22px]">
                      {value}
                    </div>

                    <div className="mt-1.5 text-[10px] leading-relaxed text-slate-300 sm:mt-1 sm:text-sm sm:leading-5">
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      <UpcomingEventSection variant="home" />

      {/* Bento Grid Section */}
      <div className="relative z-10">
        {/* <GFGBentoGrid /> */}
      </div>

      {/* About Section */}
      <section
        ref={aboutSectionRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#020808] via-[#10101f] to-[#07140f] py-20 text-white"
      >
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-green-300/20 to-transparent" />
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          
          {/* Left Content */}
          <div className="reveal-up text-center sm:text-left">
            <p className="mb-4 font-nunito text-xs font-bold uppercase tracking-[0.2em] text-green-300">
              About Us
            </p>

            <h2 className="mb-5 font-audiowide text-4xl font-extrabold tracking-normal md:text-5xl text-richblack-25">
              Who We{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Are
              </span>
            </h2>

            <p className="max-w-lg font-nunito text-base leading-8 text-slate-300 md:text-lg">
              GFG BVCOE is a community of tech enthusiasts dedicated to fostering a
              culture of learning, innovation, and collaboration. We organize
              workshops, hackathons, and speaker sessions to help students grow their
              skills and connect with like-minded peers.
            </p>

            <button
              onClick={() => navigate("/about")}
              className="group mt-8 inline-flex items-center gap-3 rounded-full  transition hover:-translate-y-1 
              group 
                        bg-green-600/80
                        px-6 py-3.5
                        text-sm font-bold text-richblack-25
                        hover:bg-green-600
                        sm:gap-3 sm:px-7 sm:py-3 sm:text-sm"
            >
              Learn More About Us
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {/* Right Illustration - Desktop Only */}
          <div className="reveal-up relative hidden h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1512]/70 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur lg:block"> {/* Left Person */} <div className="absolute bottom-8 left-[22%] h-36 w-24 rounded-t-full bg-emerald-400/30 shadow-[0_0_32px_rgba(74,222,128,0.22)]" /> <div className="absolute bottom-24 left-[27%] h-12 w-12 rounded-full bg-emerald-300/60 shadow-[0_0_20px_rgba(110,231,183,0.2)]" /> <div className="absolute bottom-0 left-[18%] h-28 w-40 rounded-[50%] bg-black/30" /> {/* Center Code Window */} <div className="absolute left-[48%] top-10 h-56 w-72 -translate-x-1/2 rounded-xl border border-green-200/20 bg-[#07100d]/80 p-5 shadow-[0_0_50px_rgba(74,222,128,0.18)] backdrop-blur-sm"> <div className="mb-5 flex gap-2"> <span className="h-2 w-2 rounded-full bg-green-300/90" /> <span className="h-2 w-2 rounded-full bg-green-300/60" /> <span className="h-2 w-2 rounded-full bg-green-300/40" /> </div> {[72, 48, 82, 62, 76, 54].map((width, index) => ( <div key={width + index} className="mb-4 flex items-center gap-3" > <span className="h-1.5 w-8 rounded-full bg-green-300/25" /> <span className="h-1.5 rounded-full bg-green-200/50" style={{ width: `${width}%` }} /> </div> ))} <div className="absolute right-5 top-16 rounded-xl bg-green-300/15 p-4 text-green-100 shadow-[0_0_20px_rgba(134,239,172,0.12)]"> <Code2 className="h-8 w-8" /> </div> </div> {/* Right Person */} <div className="absolute bottom-4 right-[12%] h-32 w-24 rounded-t-full bg-emerald-400/30 shadow-[0_0_32px_rgba(74,222,128,0.16)]" /> <div className="absolute bottom-32 right-[14%] h-11 w-11 rounded-full bg-emerald-300/60 shadow-[0_0_20px_rgba(110,231,183,0.2)]" /> <div className="absolute bottom-0 right-[8%] h-24 w-36 rounded-[50%] bg-black/30" /> {/* Users Icon */} <div className="absolute left-[7%] top-12 rounded-full border border-green-200/20 bg-green-300/10 p-4 text-green-100 shadow-[0_0_24px_rgba(74,222,128,0.12)] backdrop-blur"> <UsersRound className="h-7 w-7" /> </div> {/* Lightbulb Icon */} <div className="absolute right-[8%] top-8 rounded-full border border-green-200/20 bg-green-300/10 p-4 text-green-100 shadow-[0_0_24px_rgba(74,222,128,0.12)] backdrop-blur"> <Lightbulb className="h-7 w-7" /> </div> </div>
        </div>
      </section>


      {/* ----------------------- */}

      <section
        ref={exploreSectionRef}
        className="relative overflow-hidden bg-[#161629] px-4 py-10 text-white sm:px-6 lg:px-8"
      >
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="absolute inset-0 bg-[#161629]" />

        <div className="relative z-10 mx-auto max-w-[1480px] rounded-[1.75rem] border border-white/[0.06] bg-[#161629] px-5 py-2 sm:px-8 sm:py-8 lg:px-10">

          <div className="reveal-up mx-auto mt-6 max-w-3xl text-center font-nunito">
            <h2 className="text-2xl font-extrabold tracking-normal text-white md:text-4xl">
              Explore. Connect. <span className="text-green-400">Grow.</span>
            </h2>
            <p className="mx-auto mt-2 sm:mt-5 max-w-4xl text-sm leading-6 sm:leading-8 text-slate-300 md:text-lg">
              Discover our journey through impactful events, amazing people,
              and unforgettable moments.
            </p>
          </div>

          <div className="reveal-up mx-auto mt-8 grid max-w-7xl grid-cols-4 gap-2 sm:mt-7 sm:gap-4">
            {exploreCards.map(
              ({
                eyebrow,
                title,
                description,
                cta,
                icon: Icon,
                to,
                tone,
                iconTone,
                textTone,
              }) => (
                <button
                  key={title}
                  onClick={() => navigate(to)}
                  className={`group min-w-0 rounded-xl border border-white/10 bg-gradient-to-br ${tone} p-2 text-left font-nunito transition-transform duration-200 hover:-translate-y-1 sm:min-h-[220px] sm:rounded-2xl sm:p-5`}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      {/* Icon */}
                      <div
                        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full sm:mb-4 sm:h-14 sm:w-14 ${iconTone}`}
                      >
                        <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                      </div>

                      {/* Eyebrow + Title */}
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-2">
                        <p
                          className={`truncate text-[8px] font-bold leading-tight sm:text-sm ${textTone}`}
                        >
                          {eyebrow}
                        </p>

                        <h3 className="break-words text-[11px] font-extrabold leading-tight text-white sm:text-2xl sm:leading-none">
                          {title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="mt-2 hidden sm:block line-clamp-3 text-[8px] leading-3 text-slate-300 sm:mt-4 sm:max-w-[14rem] sm:text-sm sm:leading-6">
                        {description}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-3 flex items-center justify-between gap-1 sm:mt-5">
                      <span
                        className={`hidden sm:block truncate text-[8px] font-bold sm:text-sm ${textTone}`}
                      >
                        {cta}
                      </span>

                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-transform duration-200 group-hover:translate-x-1 sm:h-9 sm:w-9">
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>

          <div className="reveal-up mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#161629] p-5 sm:p-8 lg:p-10">
  <div className="grid gap-8 lg:grid-cols-[minmax(220px,0.32fr)_minmax(0,0.68fr)] lg:items-center">
    <div className="font-nunito">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
        Our Journey
      </p>

      <h3 className="mt-4 inline-block origin-left -rotate-1 text-xl font-extrabold text-white md:text-4xl">
        Freshers Recruitment{" "}
        <span className="text-green-400">2024</span>
      </h3>

      <p className=" mt-3 sm:mt-5 max-w-md text-base  text-richblack-25">
        A glimpse of the energy, enthusiasm and talent from last year's
        recruitment drive.
      </p>

      <button
        type="button"
        aria-label="Previous journey image"
        className="mt-10 hidden h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-300 transition-colors hover:border-emerald-300/30 hover:bg-emerald-300/10 lg:flex"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
    </div>

    <div className="relative min-w-0 overflow-hidden">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-3 [scrollbar-width:none] sm:gap-3 lg:overflow-hidden [&::-webkit-scrollbar]:hidden">
        {journeyPhotos.map(({ src, label, icon: Icon, color }) => (
          <div
            key={label}
            className="group relative h-[200px] min-w-[145px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:min-w-[165px] md:h-[220px] lg:min-w-0 xl:h-[230px]"
          >
            <img
              src={src}
              alt={label}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-2 py-2 font-nunito text-xs font-bold text-white sm:inset-x-3 sm:bottom-3 sm:gap-3 sm:px-3 sm:text-sm">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color} text-white`}
              >
                <Icon className="h-4 w-4" />
              </span>

              <span className="truncate">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Next journey image"
        className="absolute -right-3 top-1/2 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#07130f] text-emerald-300 transition-colors hover:border-emerald-300/30 hover:bg-emerald-300/10 lg:flex"
      >
        <ArrowRight className="h-6 w-6" />
      </button>

      <div className="mt-5 flex justify-center gap-3">
        {[0, 1, 2, 3, 4, 5].map((dot) => (
          <span
            key={dot}
            className={`h-3 w-3 rounded-full ${
              dot === 0 ? "bg-green-400" : "bg-slate-600/50"
            }`}
          />
        ))}
      </div>
    </div>
  </div>
</div>

        </div>
      </section>



        <ImagesScrollingAnimation></ImagesScrollingAnimation>




      {/* Team Section */}
      <section className="py-20 bg-[#071426] text-richblack-25 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-green-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>

        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <div ref={teamTitleRef} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Meet Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-pulse">
                Team
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light font-nunito mb-8">
              We are a group of passionate students and faculty dedicated to
              guiding our community. Our diverse team works together to create
              impactful events and provide mentorship for all members.
            </p>
          </div>

          {/* Team Preview Grid */}
         

          {/* Call to Action */}
          <div className="text-center">
            <button
              onClick={() => navigate("/team")}
              className="group relative px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-700 text-richblack-25 font-bold rounded-3xl text-lg transition-all duration-500 ease-in-out transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40 border-2 border-transparent hover:border-emerald-300/50 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></span>
              <span className="relative z-10 flex items-center justify-center">
                <span className="font-rounded mr-3">Meet the Full Team</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

       <CloudinaryIntroAnimation />

      <OrbitCarousel></OrbitCarousel>

      {/* Image Grid */}
      <ImageGrid />

     

      {/* Footer */}
      <Footer />
    </div>

  );
}

export default Home;
