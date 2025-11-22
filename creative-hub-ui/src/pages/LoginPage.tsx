import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { API_BASE_URL } from "../lib/config";

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // adjust payload if your auth service expects `username` not `email`
      const res = await apiClient.post<LoginResponse>("/auth/login", {
        username: email,
        password,
      });

      const data = res.data;

      if (!data?.access_token) {
        throw new Error("No access token returned from server");
      }

      // Store token(s)
      localStorage.setItem("ch_access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("ch_refresh_token", data.refresh_token);
      }

      // TODO: redirect to feed / dashboard
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Login failed", err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // This should hit your API gateway route that starts the OIDC flow
    // e.g. GET /auth/oauth/google -> redirects to Keycloak / Google
    const redirectUrl = `${API_BASE_URL}/auth/oauth/google`;
    window.location.href = redirectUrl;
  };

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-white/60">
          Sign in to continue to your Creative Hub workspace.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-white/70">
              Email / Username
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/70"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-white/70">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/70"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-brand-purple py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Signing you in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-white/60">
          <p>
            New to Creative Hub?{" "}
            <Link to="/signup" className="text-brand-accent hover:underline">
              Join as a creator / tailor
            </Link>
          </p>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="mb-2 text-center text-xs text-white/50">
            Or continue with
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex-1 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs hover:bg-white/5"
            >
              Google (via Keycloak)
            </button>

            {/* Placeholder for later: mobile OTP or other IdP */}
            <button
              type="button"
              disabled
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/40"
            >
              Phone OTP (coming soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
