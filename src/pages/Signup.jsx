import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendOTP, signup, AUTH_DEPARTMENTS, getAccountTypeLabel, enrichProfileSSE, getMe } from "../services/api";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { SpinnerCustom } from "../components/SpinnerCustom";
import { OtpInput } from "@/components/OtpInput";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichStatus, setEnrichStatus] = useState("Fetching details…");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim() || !department) {
      toast.error("Email and department are required.");
      return;
    }
    setLoading(true);
    try {
      await sendOTP({ email: email.trim(), department });
      toast.success("OTP sent to your email.");
      setStep(2);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
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
      setEnrichStatus("Fetching details…");
      await enrichProfileSSE({
        onMessage: ({ event, message }) => {
          if (message) setEnrichStatus(message);
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
            <p className="text-gray-300 text-sm text-center">{enrichStatus}</p>
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
            {/* Replace the old OTP input with this */}
            <div>
        <label className={labelClass}>Verification Code *</label>
        <OtpInput 
          value={otp} 
          onChange={setOtp} 
          disabled={loading} 
        />
        <p className="text-center text-[11px] text-gray-500 font-medium tracking-wide">
          WE'VE SENT A 6-DIGIT CODE TO YOUR EMAIL
        </p>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Confirm password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
              />
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
