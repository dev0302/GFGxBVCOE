import { NavLink, useNavigate } from "react-router-dom";
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
    { value: "5+", label: "Projects Completed", icon: Trophy, highlight: true },
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
    { src: "/FreshersMeet1.webp", label: "Group Discussions", icon: Users, color: "bg-emerald-400/90" },
    { src: "/FreshersMeet3.webp", label: "Interactive Sessions", icon: MessageCircle, color: "bg-violet-400/90" },
    { src: "/FreshersMeet4.webp", label: "Team Activities", icon: Settings, color: "bg-amber-400/90" },
    { src: "/FreshersMeet5.webp", label: "Expert Talks", icon: Mic, color: "bg-blue-400/90" },
    { src: "/FreshersMeet8.webp", label: "Selected Candidates", icon: Check, color: "bg-emerald-400/90" },
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
      <section className="relative min-h-screen overflow-hidden border-b border-emerald-400/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(34,197,94,0.18),transparent_28%),radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.08),transparent_30%),linear-gradient(180deg,#020607_0%,#031111_54%,#02100d_100%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(190,255,214,0.55)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full border border-emerald-300/10 md:left-[72%] md:top-24 md:h-[28rem] md:w-[28rem]" />
        <div className="absolute left-[58%] top-20 hidden h-96 w-96 rounded-full border border-dashed border-emerald-200/10 md:block" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-12 pt-28 lg:px-8">
          <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-2xl text-left">
              <h1
                ref={titleRef}
                className="font-nunito text-5xl font-extrabold leading-tight tracking-normal text-white md:text-7xl"
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
                className="mt-6 max-w-md font-nunito text-base leading-8 text-slate-300 md:text-lg"
              >
                Join GFG BVCOE - learn, teach, and collaborate through workshops,
                events, project showcases and mentorship.
              </p>

              <div ref={btnRef} className="mt-8 flex flex-wrap items-center gap-4 font-nunito">
                <NavLink to="/signup">
                  <button
                    id="btn-join"
                    className="group inline-flex items-center gap-3 rounded-full bg-green-500 px-7 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(34,197,94,0.36)] transition hover:-translate-y-1 hover:bg-green-400"
                  >
                    Join Our Community
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </NavLink>

                <button
                  id="btn-about"
                  onClick={() => navigate("/about")}
                  className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-7 py-3 text-sm font-semibold text-slate-200 backdrop-blur transition hover:-translate-y-1 hover:border-green-300/40 hover:bg-green-300/10"
                >
                  Learn More
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>

              <div className="mt-8 flex items-center gap-5 text-sm text-slate-400">
                <span>Follow us on</span>
                <a className="text-slate-300 transition hover:text-green-300" href="https://discord.com" aria-label="Discord">
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a className="text-slate-300 transition hover:text-green-300" href="https://instagram.com" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a className="text-slate-300 transition hover:text-green-300" href="https://linkedin.com" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="relative mx-auto h-[360px] w-full max-w-xl lg:h-[500px]">
              <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/20 blur-3xl" />
              <div className="absolute left-1/2 top-[58%] h-20 w-80 -translate-x-1/2 rounded-full border border-green-300/35 bg-green-400/10 shadow-[0_0_70px_rgba(34,197,94,0.35)]" />
              <div className="absolute left-1/2 top-[64%] h-14 w-[26rem] -translate-x-1/2 rounded-full border border-green-200/10" />
              <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 font-audiowide text-[8rem] font-black leading-none text-green-500 drop-shadow-[0_0_34px_rgba(34,197,94,0.8)] md:text-[12rem]">
                gG
              </div>
              <div className="absolute left-[18%] top-[18%] rounded-full border border-green-300/15 bg-white/[0.04] p-4 text-green-200 shadow-[0_0_25px_rgba(34,197,94,0.16)] backdrop-blur">
                <UsersRound className="h-6 w-6" />
              </div>
              <div className="absolute right-[18%] top-[10%] rounded-full border border-green-300/15 bg-white/[0.04] p-4 text-green-200 shadow-[0_0_25px_rgba(34,197,94,0.16)] backdrop-blur">
                <Code2 className="h-6 w-6" />
              </div>
              <div className="absolute right-[4%] top-[38%] rounded-full border border-green-300/15 bg-white/[0.04] p-4 text-green-200 shadow-[0_0_25px_rgba(34,197,94,0.16)] backdrop-blur">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div
            id="stats-grid"
            className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] font-nunito shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map(({ value, label, icon: Icon, highlight }) => (
              <div key={label} className="flex items-center gap-5 border-white/10 px-8 py-7 lg:border-r last:border-r-0">
                <div className={`rounded-full p-4 ${highlight ? "bg-yellow-400/15 text-yellow-300 shadow-[0_0_28px_rgba(250,204,21,0.22)]" : "bg-green-400/10 text-green-300 shadow-[0_0_28px_rgba(34,197,94,0.2)]"}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-green-300">{value}</div>
                  <div className="mt-1 max-w-28 text-sm leading-5 text-slate-300">{label}</div>
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
      <section ref={aboutSectionRef} className="relative overflow-hidden bg-[#020808] py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(34,197,94,0.14),transparent_28%),linear-gradient(180deg,#020808_0%,#03100e_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(190,255,214,0.45)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="reveal-up text-left">
            <p className="mb-4 font-nunito text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              About Us
            </p>
            <h2 className="mb-5 font-nunito text-4xl font-extrabold tracking-normal md:text-5xl">
              Who We Are
            </h2>
            <p className="max-w-lg font-nunito text-base leading-8 text-slate-300 md:text-lg">
              GFG BVCOE is a community of tech enthusiasts dedicated to fostering
              a culture of learning, innovation, and collaboration. We organize
              workshops, hackathons, and speaker sessions to help students grow
              their skills and connect with like-minded peers.
            </p>
            <button
              onClick={() => navigate("/about")}
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-green-500 px-7 py-3 font-nunito text-sm font-bold text-white shadow-[0_0_28px_rgba(34,197,94,0.32)] transition hover:-translate-y-1 hover:bg-green-400"
            >
              Learn More About Us
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="reveal-up relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/5 bg-transparent">
            <div className="absolute left-[22%] bottom-8 h-36 w-24 rounded-t-full bg-green-950/80 shadow-[0_0_28px_rgba(34,197,94,0.18)]" />
            <div className="absolute left-[27%] bottom-24 h-12 w-12 rounded-full bg-emerald-800" />
            <div className="absolute left-[18%] bottom-0 h-28 w-40 rounded-[50%] bg-black/40" />

            <div className="absolute left-[48%] top-10 h-56 w-72 -translate-x-1/2 rounded-xl border border-green-300/20 bg-[#071816]/90 p-5 shadow-[0_0_45px_rgba(34,197,94,0.2)]">
              <div className="mb-5 flex gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400/70" />
                <span className="h-2 w-2 rounded-full bg-green-400/30" />
                <span className="h-2 w-2 rounded-full bg-green-400/20" />
              </div>
              {[72, 48, 82, 62, 76, 54].map((width, index) => (
                <div key={width + index} className="mb-4 flex items-center gap-3">
                  <span className="h-1.5 w-8 rounded-full bg-green-400/20" />
                  <span className="h-1.5 rounded-full bg-green-300/40" style={{ width: `${width}%` }} />
                </div>
              ))}
              <div className="absolute right-5 top-16 rounded-xl bg-green-500/20 p-4 text-green-200">
                <Code2 className="h-8 w-8" />
              </div>
            </div>

            <div className="absolute right-[12%] bottom-4 h-32 w-24 rounded-t-full bg-green-950/80" />
            <div className="absolute right-[14%] bottom-32 h-11 w-11 rounded-full bg-emerald-800" />
            <div className="absolute right-[8%] bottom-0 h-24 w-36 rounded-[50%] bg-black/40" />

            <div className="absolute left-[7%] top-12 rounded-full border border-green-300/15 bg-white/[0.04] p-4 text-green-200 backdrop-blur">
              <UsersRound className="h-7 w-7" />
            </div>
            <div className="absolute right-[8%] top-8 rounded-full border border-green-300/15 bg-white/[0.04] p-4 text-green-200 backdrop-blur">
              <Lightbulb className="h-7 w-7" />
            </div>
          </div>
        </div>
      </section>

      <section ref={exploreSectionRef} className="relative overflow-hidden bg-[#020808] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_72%,rgba(16,185,129,0.18),transparent_22%),radial-gradient(circle_at_84%_28%,rgba(59,130,246,0.14),transparent_24%),linear-gradient(180deg,#020808_0%,#030913_48%,#020808_100%)]" />

        <div className="relative z-10 mx-auto max-w-[1480px] rounded-[1.75rem] border border-white/[0.06] bg-[#030912]/80 px-5 py-10 shadow-[0_28px_100px_rgba(0,0,0,0.5)] sm:px-8 lg:px-10">
          <div className="reveal-up mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-300/10 bg-emerald-300/[0.06] px-5 py-2 font-nunito text-sm font-semibold text-emerald-200 shadow-[0_0_34px_rgba(16,185,129,0.12)]">
            <Sparkles className="h-4 w-4 fill-emerald-200 text-emerald-200" />
            Explore More
          </div>

          <div className="reveal-up mx-auto mt-6 max-w-3xl text-center font-nunito">
            <h2 className="text-4xl font-extrabold tracking-normal text-white md:text-6xl">
              Explore. Connect. <span className="text-green-400">Grow.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Discover our journey through impactful events, amazing people,
              and unforgettable moments.
            </p>
          </div>

          <div className="reveal-up mx-auto mt-9 grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
            {exploreCards.map(({ eyebrow, title, description, cta, icon: Icon, to, tone, iconTone, textTone }) => (
              <button
                key={title}
                onClick={() => navigate(to)}
                className={`group min-h-[260px] rounded-[1.35rem] border border-white/10 bg-gradient-to-br ${tone} p-6 text-left font-nunito shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(0,0,0,0.26)] transition duration-300 hover:-translate-y-1 hover:border-white/20`}
              >
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className={`mb-7 flex h-[70px] w-[70px] items-center justify-center rounded-full ${iconTone} shadow-[0_0_26px_rgba(255,255,255,0.08)]`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="flex flex-wrap items-end gap-x-3">
                      <p className={`text-base font-bold ${textTone}`}>{eyebrow}</p>
                      <h3 className="text-3xl font-extrabold leading-none text-white">{title}</h3>
                    </div>
                    <p className="mt-7 max-w-[14rem] text-base leading-7 text-slate-300">{description}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <span className={`text-base font-bold ${textTone}`}>{cta}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition group-hover:translate-x-1 group-hover:border-white/20">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="reveal-up mt-10 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#030913]/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(220px,0.32fr)_minmax(0,0.68fr)] lg:items-center">
              <div className="font-nunito">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">Our Journey</p>
                <h3 className="mt-4 inline-block origin-left -rotate-1 text-3xl font-extrabold tracking-normal text-white md:text-4xl">
                  Freshers Recruitment <span className="text-green-400">2024</span>
                </h3>
                <p className="mt-5 max-w-md text-base leading-8 text-slate-300">
                  A glimpse of the energy, enthusiasm and talent from last year's recruitment drive.
                </p>
                <button
                  type="button"
                  aria-label="Previous journey image"
                  className="mt-10 hidden h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-emerald-300 transition hover:border-emerald-300/30 hover:bg-emerald-300/10 lg:flex"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>

              <div className="relative min-w-0 overflow-hidden">
                <div className="flex max-w-full gap-2 overflow-x-auto pb-3 [scrollbar-width:none] sm:gap-3 lg:overflow-hidden [&::-webkit-scrollbar]:hidden">
                  {journeyPhotos.map(({ src, label, icon: Icon, color }) => (
                    <div key={label} className="group relative h-[200px] min-w-[145px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_18px_46px_rgba(0,0,0,0.34)] sm:min-w-[165px] md:h-[220px] lg:min-w-0 xl:h-[230px]">
                      <img
                        src={src}
                        alt={label}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-2 py-2 font-nunito text-xs font-bold text-white backdrop-blur-md sm:inset-x-3 sm:bottom-3 sm:gap-3 sm:px-3 sm:text-sm">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color} text-white`}>
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
                  className="absolute -right-3 top-1/2 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-emerald-300 shadow-[0_16px_44px_rgba(0,0,0,0.3)] backdrop-blur transition hover:border-emerald-300/30 hover:bg-emerald-300/10 lg:flex"
                >
                  <ArrowRight className="h-6 w-6" />
                </button>

                <div className="mt-5 flex justify-center gap-3">
                  {[0, 1, 2, 3, 4, 5].map((dot) => (
                    <span
                      key={dot}
                      className={`h-3 w-3 rounded-full ${dot === 0 ? "bg-green-400 shadow-[0_0_16px_rgba(74,222,128,0.5)]" : "bg-slate-600/50"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-[#161629] text-richblack-25 relative overflow-hidden border-b-2 border-gray-600 border-opacity-40">
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
          <div ref={teamCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {/* Chair Person - Featured */}
            <div className="lg:col-span-1 md:col-span-2 group font-nunito">
              <div className="relative bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-3xl p-8 border border-green-400/30 hover:border-green-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 backdrop-blur-sm">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <ProfileAvatarFlip
                    flipKey="toshika-goswami"
                    src="/Toshika.webp"
                    alt="Toshika Goswami"
                    initials="TG"
                    animateOnScroll
                    imageLoading="lazy"
                    className="h-24 w-24 mx-auto mb-6"
                    borderClassName="border-4 border-green-400/50 shadow-lg group-hover:border-green-400 transition-colors duration-300"
                    imageClassName="group-hover:scale-110 transition-transform duration-500"
                  />
                  <h3 className="font-rounded text-2xl font-bold text-richblack-25 mb-2 group-hover:text-green-300 transition-colors duration-300">
                    Toshika Goswami
                  </h3>
                  <p className="text-green-300 text-lg font-semibold mb-2">Chair Person</p>
                  <p className="text-gray-300 text-sm mb-4">CSE • 4th Year</p>
                  
                  {/* Social Links */}
                  <div className="flex justify-center gap-3">
                    <a 
                      href="mailto:toshikagoswami4@gmail.com"
                      className="w-10 h-10 bg-green-500/80 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-110 transition-all duration-300"
                      title="Email"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/toshika-goswami-39791022a"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-600/80 rounded-full flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300"
                      title="LinkedIn"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.328v15.344C1 18.4 1.595 19 2.328 19h15.34c.734 0 1.332-.6 1.332-1.328V2.328C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Vice Chair Person */}
            <div className="group font-nunito">
              <div className="relative bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl p-6 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 text-center">
                  <ProfileAvatarFlip
                    flipKey="kartik-bhattacharya"
                    src="/Kartik.webp"
                    alt="Kartik Bhattacharya"
                    initials="KB"
                    animateOnScroll
                    imageLoading="lazy"
                    className="h-20 w-20 mx-auto mb-4"
                    borderClassName="border-2 border-blue-400/50 shadow-lg group-hover:border-blue-400 transition-colors duration-300"
                    imageClassName="group-hover:scale-110 transition-transform duration-500"
                  />
                  <h3 className="font-rounded text-xl font-bold text-richblack-25 mb-1 group-hover:text-blue-300 transition-colors duration-300">
                    Kartik Bhattacharya
                  </h3>
                  <p className="text-blue-300 font-semibold mb-1">Vice-Chairperson</p>
                  <p className="text-gray-300 text-sm mb-3">CSE • 3rd Year</p>
                  
                  <div className="flex justify-center gap-2">
                    <a 
                      href="mailto:kartikbhattacharya10@gmail.com"
                      className="w-8 h-8 bg-blue-500/80 rounded-full flex items-center justify-center hover:bg-blue-400 hover:scale-110 transition-all duration-300"
                      title="Email"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                    <a 
                      href="https://linkedin.com/in/kafiltafish21"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-blue-600/80 rounded-full flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300"
                      title="LinkedIn"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.328v15.344C1 18.4 1.595 19 2.328 19h15.34c.734 0 1.332-.6 1.332-1.328V2.328C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/_kafiltafish_21_/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-pink-600/80 rounded-full flex items-center justify-center hover:bg-pink-500 hover:scale-110 transition-all duration-300"
                      title="Instagram"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2C6.686 2 6.343 2.014 5.514 2.072 4.69 2.13 4.188 2.333 3.77 2.551a2.5 2.5 0 0 0-.919.919C2.333 4.188 2.13 4.69 2.072 5.514 2.014 6.343 2 6.686 2 10s.014 3.657.072 4.486c.058.824.261 1.326.479 1.744a2.5 2.5 0 0 0 .919.919c.418.218.92.421 1.744.479.829.058 1.168.072 4.486.072s3.657-.014 4.486-.072c.824-.058 1.326-.261 1.744-.479a2.5 2.5 0 0 0 .919-.919c.218-.418.421-.92.479-1.744.058-.829.072-1.168.072-4.486s-.014-3.657-.072-4.486c-.058-.824-.261-1.326-.479-1.744a2.5 2.5 0 0 0-.919-.919c-.418-.218-.92-.421-1.744-.479C13.657 2.014 13.314 2 10 2zm0 1.5c3.136 0 3.389.007 4.61.045.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.919.11.281.24.705.275 1.485.038 1.22.045 1.475.045 4.61s-.007 3.389-.045 4.61c-.035.78-.166 1.204-.275 1.486a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.919.598-.28.11-.704.24-1.485.275-1.22.038-1.475.045-4.61.045s-3.389-.007-4.61-.045c-.78-.035-1.203-.166-1.485-.275a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.704-.275-1.485-.038-1.22-.045-1.475-.045-4.61s.007-3.389.045-4.61c.035-.78.166-1.203.275-1.485.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.281-.11.704-.24 1.485-.275C6.611 3.507 6.864 3.5 10 3.5z" clipRule="evenodd"/>
                        <path d="M10 5.838a4.162 4.162 0 1 0 0 8.324 4.162 4.162 0 0 0 0-8.324zM10 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4.208-7.208a.972.972 0 1 1-1.944 0 .972.972 0 0 1 1.944 0z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Lead */}
            <div className="group font-nunito">
              <div className="relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl p-6 border border-purple-400/30 hover:border-purple-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 text-center">
                  <ProfileAvatarFlip
                    flipKey="archita"
                    src="/Archita.webp"
                    alt="Archita"
                    initials="A"
                    animateOnScroll
                    imageLoading="lazy"
                    className="h-20 w-20 mx-auto mb-4"
                    borderClassName="border-2 border-purple-400/50 shadow-lg group-hover:border-purple-400 transition-colors duration-300"
                    imageClassName="group-hover:scale-110 transition-transform duration-500"
                  />
                  <h3 className="font-rounded text-xl font-bold text-richblack-25 mb-1 group-hover:text-purple-300 transition-colors duration-300">
                    Archita
                  </h3>
                  <p className="text-purple-300 font-semibold mb-1">Design & Creative Lead</p>
                  <p className="text-gray-300 text-sm mb-3">IT • 3rd Year</p>
                  
                  <div className="flex justify-center gap-2">
                    <a 
                      href="mailto:archita770@gmail.com"
                      className="w-8 h-8 bg-purple-500/80 rounded-full flex items-center justify-center hover:bg-purple-400 hover:scale-110 transition-all duration-300"
                      title="Email"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/archita-337521376"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-blue-600/80 rounded-full flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300"
                      title="LinkedIn"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.328v15.344C1 18.4 1.595 19 2.328 19h15.34c.734 0 1.332-.6 1.332-1.328V2.328C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/archiitta.r?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-pink-600/80 rounded-full flex items-center justify-center hover:bg-pink-500 hover:scale-110 transition-all duration-300"
                      title="Instagram"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2C6.686 2 6.343 2.014 5.514 2.072 4.69 2.13 4.188 2.333 3.77 2.551a2.5 2.5 0 0 0-.919.919C2.333 4.188 2.13 4.69 2.072 5.514 2.014 6.343 2 6.686 2 10s.014 3.657.072 4.486c.058.824.261 1.326.479 1.744a2.5 2.5 0 0 0 .919.919c.418.218.92.421 1.744.479.829.058 1.168.072 4.486.072s3.657-.014 4.486-.072c.824-.058 1.326-.261 1.744-.479a2.5 2.5 0 0 0 .919-.919c.218-.418.421-.92.479-1.744.058-.829.072-1.168.072-4.486s-.014-3.657-.072-4.486c-.058-.824-.261-1.326-.479-1.744a2.5 2.5 0 0 0-.919-.919c-.418-.218-.92-.421-1.744-.479C13.657 2.014 13.314 2 10 2zm0 1.5c3.136 0 3.389.007 4.61.045.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.919.11.281.24.705.275 1.485.038 1.22.045 1.475.045 4.61s-.007 3.389-.045 4.61c-.035.78-.166 1.204-.275 1.486a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.919.598-.28.11-.704.24-1.485.275-1.22.038-1.475.045-4.61.045s-3.389-.007-4.61-.045c-.78-.035-1.203-.166-1.485-.275a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.704-.275-1.485-.038-1.22-.045-1.475-.045-4.61s.007-3.389.045-4.61c.035-.78.166-1.203.275-1.485.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.281-.11.704-.24 1.485-.275C6.611 3.507 6.864 3.5 10 3.5z" clipRule="evenodd"/>
                        <path d="M10 5.838a4.162 4.162 0 1 0 0 8.324 4.162 4.162 0 0 0 0-8.324zM10 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4.208-7.208a.972.972 0 1 1-1.944 0 .972.972 0 0 1 1.944 0z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

      {/* Image Grid */}
      <ImageGrid />

      <CloudinaryIntroAnimation />

      {/* Footer */}
      <Footer />
    </div>

  );
}

export default Home;
