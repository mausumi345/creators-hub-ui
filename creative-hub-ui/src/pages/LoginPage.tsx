import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../lib/config";
import Logo from "../components/Logo";

const LoginPage = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(emailOrUsername, password);
      localStorage.setItem("ch_login_success", "1");
      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      console.error("Login failed", err);
      const axiosError = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg =
        axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = `${API_BASE_URL}/auth/login/google`;
    window.location.href = redirectUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-stretch gap-8 md:gap-10">
        {/* Left: brand / hero */}
        <div className="hidden md:flex md:flex-col md:justify-between flex-1 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/30 via-fuchsia-900/20 to-slate-900 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.7)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs border border-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Welcome back
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              Your creative workspace
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400">
                awaits you.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/70">
              Sign in to collaborate with designers, customers, and makers. 
              Continue building amazing projects together.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <Logo size={48} />
            <div>
              <p className="font-medium text-white">Creative Hub</p>
              <p className="text-xs text-white/50">Where ideas become reality</p>
            </div>
          </div>
        </div>

        {/* Right: login card */}
        <div className="flex-1">
          <div className="w-full max-w-md ml-auto mr-auto rounded-3xl border border-white/10 bg-black/60 p-7 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sign in
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Welcome back
              </h2>
              <p className="mt-1 text-xs text-white/60">
                Sign in with Google or your credentials.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            )}

            {/* Google login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-black px-3 py-2.5 text-sm font-medium shadow-[0_10px_40px_rgba(0,0,0,0.55)] hover:bg-slate-100 transition-colors"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <span className="text-xs">G</span>
              </span>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                or
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Local login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/70">
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/70"
                  placeholder="johndoe or you@example.com"
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/70">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-violet-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/70"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 py-2.5 text-sm font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.8)] disabled:opacity-60 disabled:cursor-not-allowed hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500 transition-all"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-5 text-center text-[11px] text-white/60">
              <p>
                New to Creative Hub?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-violet-400 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-white/40">
            Secure authentication powered by Keycloak
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
