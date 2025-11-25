import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * OAuth Callback Page
 * 
 * After Google login via Keycloak:
 * 1. Auth-service exchanges code for tokens
 * 2. Auth-service creates our JWT and sets HttpOnly cookie
 * 3. Auth-service redirects here with ?success=true
 * 4. We verify the cookie works by calling refreshUser()
 * 5. Navigate to onboarding
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [message, setMessage] = useState("Finalizing your login...");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const success = url.searchParams.get("success");

        if (success !== "true") {
          console.error("OAuth callback did not indicate success");
          setMessage("Login was not successful. Please try again.");
          setTimeout(() => navigate("/login", { replace: true }), 2500);
          return;
        }

        // The HttpOnly cookie was set by auth-service during redirect
        // Verify it works by refreshing user data
        await refreshUser();

        // Show global success toast
        localStorage.setItem("ch_login_success", "1");
        localStorage.setItem("ch_last_login_provider", "google");

        // Go to onboarding
        navigate("/onboarding", { replace: true });
      } catch (err) {
        console.error("Error in auth callback:", err);
        setMessage("Something went wrong. Please try logging in again.");
        setTimeout(() => navigate("/login", { replace: true }), 2500);
      }
    })();
  }, [navigate, refreshUser]);

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
