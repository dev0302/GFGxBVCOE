import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import gsap from "gsap";

export default function LogoutTransition({ phase }) {
  const screenRef = useRef(null);
  const cardRef = useRef(null);
  const completionRef = useRef(null);

  useEffect(() => {
    if (!screenRef.current) return undefined;
    const timeline = gsap.timeline();
    timeline
      .fromTo(screenRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power2.out" })
      .fromTo(cardRef.current, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }, "<");
    return () => timeline.kill();
  }, []);

  useEffect(() => {
    if (phase !== "complete" || !completionRef.current) return undefined;
    const timeline = gsap.timeline();
    timeline
      .fromTo(completionRef.current, { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.38, ease: "back.out(1.8)" })
      .to(screenRef.current, { opacity: 0, duration: 0.28, delay: 0.38, ease: "power2.inOut" });
    return () => timeline.kill();
  }, [phase]);

  const complete = phase === "complete";
  return (
    <div ref={screenRef} className="fixed inset-0 z-[200] grid place-items-center bg-[#090909] px-6 text-white" role="status" aria-live="polite">
      <div ref={cardRef} className="w-full max-w-[300px] text-center">
        <div className="relative mx-auto mb-6 grid h-[88px] w-[88px] place-items-center">
          {!complete && <span className="absolute inset-0 rounded-full border-[2px] border-white/15 border-t-white animate-[spin_0.9s_linear_infinite]" />}
          <span ref={completionRef} className={`grid h-14 w-14 place-items-center rounded-full bg-white text-[#171717] ${complete ? "" : "opacity-0"}`}>
            <Check size={27} strokeWidth={2.2} />
          </span>
        </div>
        <p className="text-[21px] font-semibold tracking-[-0.035em]">{complete ? "See you soon" : "Signing out"}</p>
        <p className="mt-1.5 text-sm text-white/45">{complete ? "Your session has ended securely" : "Closing your session securely"}</p>
      </div>
    </div>
  );
}
