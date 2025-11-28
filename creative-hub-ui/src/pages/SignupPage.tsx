import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { API_BASE_URL } from "../lib/config";
import Logo from "../components/Logo";

interface SignupResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    country_code: string;
    locale: string;
    currency_code: string;
    timezone: string;
  };
}

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post<SignupResponse>("/auth/signup", {
        email,
        username,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });

      const data = res.data;

      if (!data?.success) {
        throw new Error(data?.message || "Signup failed");
      }

      localStorage.setItem("ch_login_success", "1");
      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      console.error("Signup failed", err);
      const axiosError = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg =
        axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Signup failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const redirectUrl = `${API_BASE_URL}/auth/login/google`;
    window.location.href = redirectUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-stretch gap-8 md:gap-10">
        {/* Left: brand / hero */}
        <div className="hidden md:flex md:flex-col md:justify-between flex-1 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/30 via-fuchsia-900/20 to-slate-900 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.7)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs border border-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Join Creative Hub
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              Start creating
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400">
                amazing things.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/70">
              Join a community of designers, customers, and makers. 
              Collaborate on projects and bring ideas to life together.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-white/75">
            <div className="rounded-2xl bg-black/30 border border-white/10 p-4">
              <p className="font-medium text-white mb-1">🎨 Create</p>
              <p className="text-xs text-white/60">
                Share designs, find collaborators, build your portfolio.
              </p>
            </div>
            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
              <p className="font-medium text-white mb-1">🤝 Collaborate</p>
              <p className="text-xs text-white/60">
                Connect with the right people to bring projects to life.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Logo size={48} />
            <div>
              <p className="font-medium text-white">Creative Hub</p>
              <p className="text-xs text-white/50">Where ideas become reality</p>
            </div>
          </div>
        </div>

        {/* Right: signup card */}
        <div className="flex-1">
          <div className="w-full max-w-md ml-auto mr-auto rounded-3xl border border-white/10 bg-black/60 p-7 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            {/* Header */}
            <div className="mb-5">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Create Account
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Join Creative Hub
              </h2>
              <p className="mt-1 text-xs text-white/60">
                Sign up with Google or create an account.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            )}

            {/* Google signup */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-black px-3 py-2.5 text-sm font-medium shadow-[0_10px_40px_rgba(0,0,0,0.55)] hover:bg-slate-100 transition-colors"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <span className="text-xs">G</span>
              </span>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                or
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Signup form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/70">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/70"
                    placeholder="John"
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/70">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/70"
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white/70">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/70"
                  placeholder="johndoe"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white/70">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/70"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white/70">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/70"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <p className="mt-0.5 text-[10px] text-white/40">
                  At least 8 characters
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-white/70">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/70"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 py-2.5 text-sm font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.8)] disabled:opacity-60 disabled:cursor-not-allowed hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500 transition-all"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center text-[11px] text-white/60">
              <p>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-violet-400 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Terms */}
            <p className="mt-3 text-center text-[10px] text-white/40">
              By signing up, you agree to our{" "}
              <a href="#" className="underline hover:text-white/60">Terms</a>
              {" "}and{" "}
              <a href="#" className="underline hover:text-white/60">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
