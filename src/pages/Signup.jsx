import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendOTP, getOtpForAutofill, signup, AUTH_DEPARTMENTS, getAccountTypeLabel, enrichProfileSSE, getMe } from "../services/api";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { SpinnerCustom } from "../components/SpinnerCustom";
import { OtpInput } from "@/components/OtpInput";

const RESEND_COOLDOWN_SECONDS = 5 * 60; // 5 minutes
const AUTOFILL_DIGIT_DELAY_MS = 100;
const AUTOFILL_POLL_INTERVAL_MS = 1000;

const Signup = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
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

  // 5-minute countdown for resend OTP
  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
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
    if (!firstName.trim() || !lastName.trim() || !password || !confirmPassword || !otp) {
      toast.error("All required fields must be filled.");
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
    "w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16 flex items-center justify-center px-4">
      {enriching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4 min-w-[280px]">
            <SpinnerCustom />
            <p className="text-gray-300 text-sm text-center">{enrichStatusText}</p>
          </div>
        </div>
      )}
      <div className="w-full max-w-md bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Sign up</h1>
        <p className="text-gray-400 text-sm mb-6">
          Only allowed emails can register. Choose your department and verify with OTP.
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Department *</label>
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
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Sending OTP…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} className={inputClass + " opacity-80"} readOnly />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input type="text" value={getAccountTypeLabel(department) || department} className={inputClass + " opacity-80"} readOnly />
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
                            transition={{ type: "spring", stiffness: 400, damping: 22 }}
                            className="w-9 h-11 sm:w-10 sm:h-12 rounded-xl bg-cyan-500/40 border border-cyan-400/60 flex items-center justify-center text-xl font-bold text-white shadow-lg"
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
                <label className={labelClass}>Last name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  required
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
