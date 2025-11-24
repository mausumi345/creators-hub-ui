import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finalizing your login...");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1. Read tokens from query params
        const accessToken = url.searchParams.get("access_token");
        const refreshToken = url.searchParams.get("refresh_token");
        

        if (!accessToken) {
          console.error("No access_token in callback URL");
          setMessage("Missing login information. Please sign in again.");
          setTimeout(() => navigate("/login", { replace: true }), 2500);
          return;
        }

        // 2. Store tokens like the password login flow
        localStorage.setItem("ch_access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("ch_refresh_token", refreshToken);
        }

        // 3. Optional but recommended: create user + session in DB via /auth/me
        try {
          await apiClient.get("/auth/me", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
        } catch (err) {
          console.warn("Calling /auth/me failed, continuing anyway", err);
        }

        // 4. Show global success toast
        localStorage.setItem("ch_login_success", "1");
        localStorage.setItem("ch_last_login_provider", "google");

        // 5. Go to onboarding (same as password login)
        navigate("/onboarding", { replace: true });
      } catch (err) {
        console.error("Error in auth callback:", err);
        setMessage("Something went wrong. Please try logging in again.");
        setTimeout(() => navigate("/login", { replace: true }), 2500);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-2">
        <p className="text-sm opacity-80">{message}</p>
        <p className="text-[11px] opacity-40">
          You can close this window if it doesn&apos;t redirect automatically.
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
