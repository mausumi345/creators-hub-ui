import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/apiClient";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: unknown) {
      console.error("Forgot password failed", err);
      const axiosError = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg =
        axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-7 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Password Reset
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Forgot your password?
            </h2>
            <p className="mt-1 text-xs text-white/60">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Success message */}
          {success ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium">Check your email</p>
                    <p className="mt-0.5 text-xs text-emerald-200/70">
                      If an account exists for {email}, you'll receive a password reset link shortly.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-white/50">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="text-brand-accent hover:underline"
                >
                  try again
                </button>
              </p>
              <Link
                to="/login"
                className="mt-4 block w-full text-center rounded-2xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/70">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/70"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl bg-gradient-to-r from-brand-purple via-fuchsia-500 to-brand-accent py-2.5 text-sm font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.8)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-5 text-center text-[11px] text-white/60">
                <p>
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-brand-accent hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Small helper text */}
        <p className="mt-4 text-center text-[10px] text-white/40">
          Password reset powered by Keycloak
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

