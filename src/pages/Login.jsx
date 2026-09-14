import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import AnimatedLoginButton from "../components/AnimatedLoginButton";
import { getLoginProfilePreview } from "../services/api";

function getSafeNextPath(raw) {
  if (!raw || typeof raw !== "string") return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep raw if decode fails
  }
  // Only allow internal app paths like "/share-target?id=..."
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;
  if (decoded.includes("://")) return null;
  if (decoded.includes("\\")) return null;
  return decoded;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const authenticate = async () => {
    if (!email.trim() || !password) {
      throw new Error("Email and password are required.");
    }
    return login(email.trim(), password);
  };

  const handleSuccess = useCallback(() => {
    toast.success("Logged in successfully.", {
      position: "bottom-right",
      style: { background: "#16a34a", color: "#fff", border: "none" },
    });
    const next = getSafeNextPath(searchParams.get("next"));
    navigate(next || "/");
  }, [navigate, searchParams]);

  const handleError = useCallback((error) => {
    toast.error(error?.message || "Login failed.");
  }, []);

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16 flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-md bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl">
        <div className="mb-2 flex h-9 items-center gap-3">
          <h1 className="text-2xl font-semibold leading-none tracking-[-0.03em]">Welcome back</h1>
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
        <p className="text-white/50 text-sm mb-7">Sign in to your GFGxBVCOE account.</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          document.getElementById("login-submit")?.click();
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/75 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 outline-none transition focus:border-white/45 focus:bg-white/[0.09] focus:ring-4 focus:ring-white/5"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-white/75">Password</label>
              <Link to="/forgot-password" className="text-xs text-white/55 hover:text-white font-medium transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 outline-none transition focus:border-white/45 focus:bg-white/[0.09] focus:ring-4 focus:ring-white/5 pr-11"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <AnimatedLoginButton
            onAuthenticate={authenticate}
            onSuccess={handleSuccess}
            onError={handleError}
            profileImage={profileImage}
          />
        </form>
        <p className="mt-6 text-center text-white/50 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-white hover:text-white/70 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
