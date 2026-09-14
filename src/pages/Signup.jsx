import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  sendOTP,
  getOtpForAutofill,
  signup,
  AUTH_DEPARTMENTS,
  getAccountTypeLabel,
  enrichProfileSSE,
  getMe,
  getLoginProfilePreview,
  lookupSignupDepartment,
} from "../services/api";
import { toast } from "sonner";
import { Eye, EyeOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { SpinnerCustom } from "../components/SpinnerCustom";
import { OtpInput } from "@/components/OtpInput";

const RESEND_COOLDOWN_SECONDS = 5 * 60; // 5 minutes
const AUTOFILL_DIGIT_DELAY_MS = 100;
const AUTOFILL_POLL_INTERVAL_MS = 1000;

const Signup = () => {
  const [step, setStep] = useState(1);
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";
  const prefillDepartment = searchParams.get("department") || "";
  const [email, setEmail] = useState(prefillEmail);
  const [department, setDepartment] = useState(prefillDepartment);
  const [otp, setOtp] = useState("");
  const [pollToken, setPollToken] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [autofillAnimating, setAutofillAnimating] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichStatusText, setEnrichStatusText] = useState("Fetching details…");
  const [profileImage, setProfileImage] = useState("");
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptLookupEmail, setDeptLookupEmail] = useState("");
  const [deptLookupLoading, setDeptLookupLoading] = useState(false);
  const [deptLookupResult, setDeptLookupResult] = useState(null);
  const pollRef = useRef(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const runAutofillAnimation = (fullOtp) => {
    setAutofillAnimating(true);
    setOtp("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOtp(fullOtp.slice(0, i));
      if (i >= 6) {
        clearInterval(id);
        setAutofillAnimating(false);
        toast.success("OTP autofilled.");
      }
    }, AUTOFILL_DIGIT_DELAY_MS);
  };

  // Poll every second when on step 2 with pollToken; when user clicks link in email, backend allows → we get OTP and autofill
  useEffect(() => {
    if (step !== 2 || !pollToken || autofillAnimating) return;
    const poll = async () => {
      try {
        const data = await getOtpForAutofill(pollToken);
        if (data.otp && String(data.otp).length === 6) {
          setPollToken(null);
          runAutofillAnimation(String(data.otp));
          return true;
        }
      } catch (_) {}
      return false;
    };
    poll().then((done) => {
      if (done) return;
      pollRef.current = setInterval(async () => {
        const done_ = await poll();
        if (done_ && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, AUTOFILL_POLL_INTERVAL_MS);
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [step, pollToken, autofillAnimating]);

  useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    setProfileImage("");
    if (!validEmail) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const image = await getLoginProfilePreview(normalizedEmail, controller.signal);
        if (!controller.signal.aborted) setProfileImage(image);
      } catch (error) {
        if (error.name !== "AbortError") setProfileImage("");
      }
    }, 320);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [email]);

  useEffect(() => {
    if (!deptModalOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setDeptModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deptModalOpen]);

  // 5-minute countdown for resend OTP
  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [step, resendCooldown]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim() || !department) {
      toast.error("Email and department are required.");
      return;
    }
    setLoading(true);
    try {
      const data = await sendOTP({ email: email.trim(), department });
      if (data.pollToken) setPollToken(data.pollToken);
      toast.success("OTP sent to your email.");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep(2);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      const data = await sendOTP({ email: email.trim(), department });
      if (data.pollToken) setPollToken(data.pollToken);
      toast.success("OTP sent again.");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !password || !confirmPassword || !otp) {
      toast.error(
        "First name, password, confirm password, and OTP are required.",
      );
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        accountType: department,
        otp,
      });
      if (data.user) setUser(data.user);
      toast.success("Account created. Logging you in…");
      setLoading(false);
      setEnriching(true);
      setEnrichStatusText("Fetching details…");
      await enrichProfileSSE({
        onMessage: ({ event, message }) => {
          if (message) setEnrichStatusText(message);
        },
      });
      const meRes = await getMe();
      if (meRes?.user) setUser(meRes.user);
      toast.success("You’re all set!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Signup failed.");
      if (enriching) {
        setEnriching(false);
        const meRes = await getMe().catch(() => null);
        if (meRes?.user) setUser(meRes.user);
        navigate("/", { replace: true });
      }
    } finally {
      setLoading(false);
      setEnriching(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-richblack-25 placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16 flex items-center justify-center px-4">
      {enriching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4 min-w-[280px]">
            <SpinnerCustom />
            <p className="text-gray-300 text-sm text-center">
              {enrichStatusText}
            </p>
          </div>
        </div>
      )}
      <div className="w-full max-w-md bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl">
        <div className="mb-2 flex h-9 items-center gap-3">
          <h1 className="text-2xl font-bold leading-none text-richblack-25">Sign up</h1>
          <div className="h-9 w-9 shrink-0" aria-hidden={!profileImage}>
            {profileImage && (
              <img
                src={profileImage}
                alt=""
                onError={() => setProfileImage("")}
                className="h-full w-full rounded-full border border-white/30 object-cover shadow-[0_3px_12px_rgba(0,0,0,0.28)] animate-in fade-in zoom-in-75 duration-200"
              />
            )}
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Only allowed emails can register. Choose your department and verify
          with OTP.
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className={labelClass}>
                Email *
                {prefillEmail && (
                  <span className="ml-2 text-[10px] font-normal text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded-full">
                    pre-filled
                  </span>
                )}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => !prefillEmail && setEmail(e.target.value)}
                className={
                  inputClass +
                  (prefillEmail ? " opacity-80 cursor-default" : "")
                }
                placeholder="you@example.com"
                readOnly={!!prefillEmail}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                Department *
                {prefillDepartment && (
                  <span className="ml-2 text-[10px] font-normal text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded-full">
                    pre-filled
                  </span>
                )}
              </label>
              {prefillDepartment ? (
                <input
                  type="text"
                  value={
                    getAccountTypeLabel(prefillDepartment) || prefillDepartment
                  }
                  className={inputClass + " opacity-80 cursor-default"}
                  readOnly
                />
              ) : (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select department</option>
                  {AUTH_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {getAccountTypeLabel(d) || d}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-richblack-25 font-semibold disabled:opacity-50"
            >
              {loading ? "Sending OTP…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                className={inputClass + " opacity-80"}
                readOnly
              />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input
                type="text"
                value={getAccountTypeLabel(department) || department}
                className={inputClass + " opacity-80"}
                readOnly
              />
            </div>
            {/* OTP input with Resend and Autofill */}
            <div>
              <label className={labelClass}>Verification Code *</label>
              <div className="relative">
                <AnimatePresence>
                  {autofillAnimating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl overflow-hidden bg-[#1e1e2f]/95 border-2 border-cyan-400/50"
                    >
                      {/* iOS AirDrop-style circular waves */}
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full border-2 border-cyan-400/40"
                          initial={{ width: 40, height: 40, opacity: 0.6 }}
                          animate={{
                            width: 200 + i * 60,
                            height: 200 + i * 60,
                            opacity: [0.4, 0.1, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.35,
                            ease: "easeOut",
                          }}
                        />
                      ))}
                      <div className="relative z-10 flex gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: otp.length > i ? 1 : 0.5,
                              opacity: otp.length > i ? 1 : 0.4,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 22,
                            }}
                            className="w-9 h-11 sm:w-10 sm:h-12 rounded-xl bg-cyan-500/40 border border-cyan-400/60 flex items-center justify-center text-xl font-bold text-richblack-25 shadow-lg"
                          >
                            {otp[i] || ""}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading || autofillAnimating}
                />
              </div>
              <p className="text-center text-[11px] text-gray-500 font-medium tracking-wide mt-1">
                WE'VE SENT A 6-DIGIT CODE TO YOUR EMAIL
              </p>
              <div className="flex justify-center mt-3">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || resending || loading}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  {resending
                    ? "Sending…"
                    : resendCooldown > 0
                      ? `Resend OTP in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, "0")}`
                      : "Resend OTP"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>First name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  Last name{" "}
                  <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + " pr-11"}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-richblack-25 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass + " pr-11"}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-richblack-25 transition-colors"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/20"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-richblack-25 font-semibold disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Log in
          </Link>
        </p>
        <p className="mt-3 text-center text-gray-400 text-sm">
          Want to know your department?{" "}
          <button
            type="button"
            onClick={() => {
              setDeptLookupEmail(email.trim());
              setDeptLookupResult(null);
              setDeptModalOpen(true);
            }}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Find it here
          </button>
        </p>
      </div>

      <AnimatePresence>
        {deptModalOpen && (
          <motion.div
            key="dept-lookup-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            onClick={() => setDeptModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dept-lookup-title"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-gray-500/30 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] p-6 shadow-xl"
            >
              <button
                type="button"
                onClick={() => setDeptModalOpen(false)}
                className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={16} />
              </button>
              <h2 id="dept-lookup-title" className="pr-8 text-lg font-semibold text-richblack-25">
                Find your department
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Enter your email id to see which department you can sign up with.
              </p>
              <form
                className="mt-5 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const lookupEmail = deptLookupEmail.trim().toLowerCase();
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lookupEmail)) {
                    toast.error("Enter a valid email id.");
                    return;
                  }
                  setDeptLookupLoading(true);
                  setDeptLookupResult(null);
                  try {
                    const data = await lookupSignupDepartment(lookupEmail);
                    setDeptLookupResult(data);
                  } catch {
                    setDeptLookupResult({ department: "", departmentLabel: "" });
                  } finally {
                    setDeptLookupLoading(false);
                  }
                }}
              >
                <div>
                  <label className={labelClass}>Email *</label>
                  <input
                    type="email"
                    value={deptLookupEmail}
                    onChange={(e) => {
                      setDeptLookupEmail(e.target.value);
                      setDeptLookupResult(null);
                    }}
                    className={inputClass}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={deptLookupLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-richblack-25 font-semibold disabled:opacity-50"
                >
                  {deptLookupLoading ? "Looking up…" : "Show department"}
                </button>
              </form>
              {deptLookupResult && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                  {deptLookupResult.departmentLabel ? (
                    <>
                      <p className="text-sm text-gray-300">
                        You are registered in the{" "}
                        <span className="font-semibold text-cyan-300">
                          {deptLookupResult.departmentLabel}
                        </span>{" "}
                        department.
                      </p>
                      {step === 1 && !prefillDepartment && (
                        <button
                          type="button"
                          onClick={() => {
                            setDepartment(deptLookupResult.department);
                            if (!prefillEmail && deptLookupEmail.trim()) {
                              setEmail(deptLookupEmail.trim());
                            }
                            setDeptModalOpen(false);
                          }}
                          className="mt-3 text-sm font-medium text-cyan-400 hover:text-cyan-300"
                        >
                          Use this department
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-300">
                      No user registered with this email id.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Signup;
