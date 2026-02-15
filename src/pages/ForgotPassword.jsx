import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/api";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setEmailSent(true);
      toast.success("If an account exists with this email, you will receive a reset link.");
    } catch (err) {
      toast.error(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">
          {!emailSent ? "Reset your password" : "Check your email"}
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {!emailSent
            ? "Enter your email and we'll send you a link to reset your password. The link expires in 1 hour."
            : `We've sent reset instructions to ${email}. Check your inbox (and spam folder).`}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!emailSent && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Sending…" : !emailSent ? "Send reset link" : "Resend email"}
          </button>
        </form>

        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
          >
            <span aria-hidden>←</span> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
