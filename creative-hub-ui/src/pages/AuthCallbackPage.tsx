import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient"; // make sure this exists

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState<string>("Finishing login...");

  useEffect(() => {
    const run = async () => {
      try {
        // Example fragment:
        // #access_token=xxx&refresh_token=yyy&expires_in=300
        const hash = window.location.hash || "";
        const params = new URLSearchParams(hash.replace(/^#/, ""));

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token") || undefined;
        const expiresIn = params.get("expires_in") || undefined;

        if (!accessToken) {
          setStatus("error");
          setMessage("Missing access token in callback URL.");
          return;
        }

        // Store tokens (gateway/apiClient will use access token)
        localStorage.setItem("ch_access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("ch_refresh_token", refreshToken);
        }
        if (expiresIn) {
          localStorage.setItem("ch_expires_in", expiresIn);
        }

        // Now call /auth/me via API gateway to bootstrap user + session
        setMessage("Fetching your profile...");
        const res = await apiClient.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Optionally store user + session in localStorage for later
        localStorage.setItem("ch_me", JSON.stringify(res.data));

        // Redirect to home (or later: /feed, /dashboard, etc.)
        navigate("/", { replace: true });
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("error");
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "Something went wrong while completing login.";
        setMessage(msg);
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur-md text-center">
        <h1 className="text-xl font-semibold mb-3">Signing you in…</h1>
        <p className="text-sm text-white/70 mb-4">{message}</p>

        {status === "loading" && (
          <div className="mt-2 text-xs text-white/50">
            Please wait, this may take a few seconds.
          </div>
        )}

        {status === "error" && (
          <button
            onClick={() => navigate("/login")}
            className="mt-4 rounded-full border border-white/30 px-4 py-1.5 text-xs hover:bg-white/10"
          >
            Back to login
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
