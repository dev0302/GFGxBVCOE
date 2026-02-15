import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPasswordWithToken } from "../services/api";
import { toast } from "sonner";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Fill in both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }
    if (!token) {
      toast.error("Invalid reset link.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithToken({ token, password, confirmPassword });
      setSuccess(true);
      toast.success("Password reset successfully.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen darkthemebg pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl text-center">
          <p className="text-white font-medium mb-2">Invalid reset link</p>
          <p className="text-gray-400 text-sm mb-6">This link is missing or invalid. Request a new one from the login page.</p>
          <Link to="/forgot-password" className="inline-block px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
            Forgot password
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen darkthemebg pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl text-center">
          <p className="text-white font-medium mb-2">Password reset successfully</p>
          <p className="text-gray-400 text-sm mb-6">Redirecting you to login…</p>
          <Link to="/login" className="inline-block px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
        <p className="text-gray-400 text-sm mb-6">Enter your new password below. It must be at least 6 characters.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">New password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>

        <div className="mt-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            <span aria-hidden>←</span> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
