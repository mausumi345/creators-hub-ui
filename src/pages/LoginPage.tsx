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
      // Navigate to home - OnboardingGuard will redirect if needed
      navigate("/", { replace: true });
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
    window.location.href = `${API_BASE_URL}/auth/login/google`;
  };

  return (
    <div className="min-h-screen bg-orange-50 text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-stretch gap-8 md:gap-10">
        {/* Left: brand / hero */}
        <div className="hidden md:flex md:flex-col md:justify-between flex-1 rounded-3xl border border-orange-200 bg-white p-8 shadow-[0_25px_70px_rgba(249,115,22,0.15)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs border border-orange-200 text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Welcome back
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
              Your creative workspace
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
                awaits you.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-slate-600">
              Sign in to collaborate with designers, customers, and makers. 
              Continue building amazing projects together.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <Logo size={48} />
            <div>
              <p className="font-medium text-slate-900">Collabfy</p>
              <p className="text-xs text-slate-500">Where ideas become reality</p>
            </div>
          </div>
        </div>

        {/* Right: login card */}
        <div className="flex-1">
          <div className="w-full max-w-md ml-auto mr-auto rounded-3xl border border-orange-200 bg-white p-7 md:p-8 shadow-[0_20px_60px_rgba(249,115,22,0.12)]">
            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sign in
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Sign in with Google or your credentials.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Google login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-[0_10px_30px_rgba(249,115,22,0.12)] hover:bg-orange-50 transition-colors"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <span className="text-xs text-slate-900">G</span>
              </span>
              <span className="text-slate-900">Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-orange-100" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                or
              </span>
              <span className="h-px flex-1 bg-orange-100" />
            </div>

            {/* Local login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                  placeholder="johndoe or you@example.com"
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-orange-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.25)] disabled:opacity-60 disabled:cursor-not-allowed hover:from-orange-400 hover:to-amber-400 transition-all"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-5 text-center text-[11px] text-slate-500">
              <p>
                New to Collabfy?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-orange-600 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-4" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
