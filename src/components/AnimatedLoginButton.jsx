import { useEffect, useRef, useState } from "react";
import { Check, UserRound, X } from "lucide-react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import HandwrittenWelcomeOverlay from "./HandwrittenWelcomeOverlay";

export default function AnimatedLoginButton({ onAuthenticate, onSuccess, onError, profileImage }) {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const iconRef = useRef(null);
  const completeRef = useRef(null);
  const resultRef = useRef(null);
  const [stage, setStage] = useState("idle");

  const handleClick = async () => {
    if (stage !== "idle") return;
    setStage("loading");
    try {
      const [data] = await Promise.all([Promise.resolve(onAuthenticate?.()), new Promise((resolve) => window.setTimeout(resolve, 1050))]);
      resultRef.current = { ok: true, data };
      setStage("success");
    } catch (error) {
      resultRef.current = { ok: false, error };
      setStage("error");
    }
  };

  useEffect(() => {
    if (stage !== "loading" || !overlayRef.current) return undefined;
    const timeline = gsap.timeline();
    timeline
      .fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: "power2.out" })
      .fromTo(cardRef.current, { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.52, ease: "power3.out" }, "<")
      .fromTo(iconRef.current, { opacity: 0, scale: 0.72 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, "<0.08");
    return () => timeline.kill();
  }, [stage]);

  useEffect(() => {
    if ((stage !== "success" && stage !== "error") || !completeRef.current) return undefined;
    const success = stage === "success";
    const timeline = gsap.timeline({
      onComplete: () => {
        if (success) {
          setStage("welcome");
        } else {
          onError?.(resultRef.current?.error);
          gsap.to(overlayRef.current, { opacity: 0, duration: 0.28, delay: 0.65, onComplete: () => setStage("idle") });
        }
      },
    });
    timeline
      .to(iconRef.current, { opacity: 0, scale: 0.65, duration: 0.16 })
      .fromTo(completeRef.current, { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(1.8)" });
    return () => timeline.kill();
  }, [stage, onError, onSuccess]);

  const visible = stage !== "idle";
  const success = stage === "success";
  const user = resultRef.current?.data?.user || resultRef.current?.data || {};
  const firstName = user.firstName || user.name?.split(" ")[0] || "there";
  return (
    <>
      <button id="login-submit" type="button" onClick={handleClick} disabled={visible} className="group relative flex h-[54px] w-full items-center justify-center overflow-hidden rounded-2xl bg-white text-[15px] font-semibold text-black shadow-[0_8px_24px_rgba(255,255,255,0.12)] transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-100 active:translate-y-0 active:scale-[0.985] disabled:cursor-wait">
        <span className="relative z-10">Sign in</span>
        <span aria-hidden className="absolute inset-x-5 bottom-0 h-px bg-black/15 transition-transform duration-300 group-hover:scale-x-75" />
      </button>

      {visible && stage !== "welcome" && createPortal(
        <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-5 opacity-0 backdrop-blur-xl" role="status" aria-live="polite">
          <div ref={cardRef} className="w-full max-w-[330px] rounded-[32px] border border-white/15 bg-white/[0.07] p-7 text-center shadow-2xl backdrop-blur-2xl">
            <div className="relative mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full border border-white/20 bg-white text-black shadow-[0_0_0_10px_rgba(255,255,255,0.05)]">
              {stage === "loading" && <span className="absolute inset-[-8px] animate-[spin_1.65s_linear_infinite] rounded-full border border-dashed border-white/45" />}
              <div ref={iconRef} className="grid h-full w-full place-items-center overflow-hidden rounded-full">
                {profileImage ? <img src={profileImage} alt="" className="h-full w-full object-cover" /> : <UserRound size={39} strokeWidth={1.5} />}
              </div>
              <div ref={completeRef} className="absolute grid h-full w-full place-items-center opacity-0">
                <span className={`grid h-14 w-14 place-items-center rounded-full ${success ? "bg-black text-white" : "border-2 border-black bg-white text-black"}`}>
                  {success ? <Check size={29} strokeWidth={2.2} /> : <X size={29} strokeWidth={2.2} />}
                </span>
              </div>
            </div>
            <p className="text-[17px] font-semibold tracking-[-0.02em] text-white">{stage === "loading" ? "Signing in" : success ? "Verified" : "Unable to sign in"}</p>
            <p className="mt-1.5 text-sm text-white/55">{stage === "loading" ? "Verifying your account securely" : success ? "Preparing your greeting" : "Please check your details and try again"}</p>
            {stage === "loading" && <div className="mx-auto mt-6 h-1 w-24 overflow-hidden rounded-full bg-white/15"><span className="block h-full w-1/2 animate-[login-progress_1.1s_ease-in-out_infinite] rounded-full bg-white" /></div>}
          </div>
        </div>, document.body,
      )}
      {stage === "welcome" && createPortal(<HandwrittenWelcomeOverlay firstName={firstName} onComplete={() => onSuccess?.(resultRef.current?.data)} />, document.body)}
    </>
  );
}
