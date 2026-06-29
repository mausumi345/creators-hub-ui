import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { API_BASE_URL } from "../lib/config";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../components/Logo";

interface SignupResponse {
  success: boolean;
  message: string;
  expires_in: number;
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
  const { refreshUser } = useAuth();

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

      // Refresh user data to update auth context
      await refreshUser();

      // Navigate to home - OnboardingGuard will redirect to onboarding
      navigate("/", { replace: true });
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
    window.location.href = `${API_BASE_URL}/auth/login/google`;
  };

  return (
    <div className="min-h-screen bg-orange-50 text-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-stretch gap-8 md:gap-10">
        {/* Left: brand / hero */}
        <div className="hidden md:flex md:flex-col md:justify-between flex-1 rounded-3xl border border-orange-200 bg-white p-8 shadow-[0_25px_70px_rgba(249,115,22,0.15)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs border border-orange-200 text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Join Collabfy
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
              Start creating
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
                amazing things.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-slate-600">
              Join a community of designers, customers, and makers. 
              Collaborate on projects and bring ideas to life together.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
              <p className="font-medium text-slate-900 mb-1">🎨 Create</p>
              <p className="text-xs text-slate-600">
                Share designs, find collaborators, build your portfolio.
              </p>
            </div>
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
              <p className="font-medium text-slate-900 mb-1">🤝 Collaborate</p>
              <p className="text-xs text-slate-600">
                Connect with the right people to bring projects to life.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Logo size={48} />
            <div>
              <p className="font-medium text-slate-900">Collabfy</p>
              <p className="text-xs text-slate-500">Where ideas become reality</p>
            </div>
          </div>
        </div>

        {/* Right: signup card */}
        <div className="flex-1">
          <div className="w-full max-w-md ml-auto mr-auto rounded-3xl border border-orange-200 bg-white p-7 md:p-8 shadow-[0_20px_60px_rgba(249,115,22,0.12)]">
            {/* Header */}
            <div className="mb-5">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Create Account
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Join Collabfy
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Sign up with Google or create an account.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Google signup */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-[0_10px_30px_rgba(249,115,22,0.12)] hover:bg-orange-50 transition-colors"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <span className="text-xs text-slate-900">G</span>
              </span>
              <span className="text-slate-900">Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-orange-100" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                or
              </span>
              <span className="h-px flex-1 bg-orange-100" />
            </div>

            {/* Signup form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                    placeholder="John"
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                  placeholder="johndoe"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <p className="mt-0.5 text-[10px] text-slate-400">
                  At least 8 characters
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.25)] disabled:opacity-60 disabled:cursor-not-allowed hover:from-orange-400 hover:to-amber-400 transition-all"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center text-[11px] text-slate-500">
              <p>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-orange-600 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Terms */}
            <p className="mt-3 text-center text-[10px] text-slate-400">
              By signing up, you agree to our{" "}
              <a href="#" className="underline hover:text-slate-600">Terms</a>
              {" "}and{" "}
              <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
