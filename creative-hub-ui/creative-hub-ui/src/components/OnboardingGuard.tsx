import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";

interface ProfileData {
  user_id: string;
  onboarding_status: string;
  primary_role: string | null;
  display_name: string | null;
  handle: string | null;
}

interface OnboardingGuardProps {
  children: ReactNode;
}

/**
 * Route guard that checks onboarding status after login.
 * 
 * - If user is not authenticated, renders children (public routes)
 * - If user is authenticated but onboarding incomplete, redirects to /onboarding/role
 * - If user is authenticated and onboarding complete, renders children
 */
const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { allowProfileEdit?: boolean } | null;
  const allowProfileEdit = locationState?.allowProfileEdit === true;
  const searchParams = new URLSearchParams(location.search);
  const modeParam = searchParams.get("mode");

  // Onboarding paths that should be accessible during onboarding
  const onboardingPaths = ["/onboarding/roles", "/onboarding/role", "/onboarding/profile"];
  const isOnOnboardingPage = onboardingPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Still loading auth - wait
      if (authLoading) {
        return;
      }

      // If not authenticated and on onboarding, just allow (avoid flicker); otherwise allow
      if (!isAuthenticated) {
        setCheckedOnboarding(true);
        return;
      }

      // Roles onboarding first
      if (user && (user.roles ?? []).length === 0) {
        if (isOnOnboardingPage) {
          setCheckedOnboarding(true);
          return;
        }
        if (location.pathname !== "/onboarding/roles") {
          navigate("/onboarding/roles", { replace: true });
        }
        setCheckedOnboarding(true);
        return;
      }

      try {
        const response = await apiClient.get<ProfileData>("/profile/me");
        const profile = response.data;

        // Always allow onboarding pages once authed to avoid flicker
        if (isOnOnboardingPage) {
          setCheckedOnboarding(true);
          return;
        }

        if (profile.onboarding_status !== "COMPLETED") {
          // Redirect to appropriate onboarding step
          if (!profile.primary_role) {
            navigate("/onboarding/role", { replace: true });
          } else {
            navigate("/onboarding/profile", { replace: true });
          }
          setCheckedOnboarding(true);
          return;
        }

        // Profile complete and not on onboarding page: if at root, send to feed
        if (!isOnOnboardingPage && location.pathname === "/") {
          navigate("/feed", { replace: true });
          setCheckedOnboarding(true);
          return;
        }
      } catch (error) {
        // If profile doesn't exist (404), redirect to role selection
        console.error("Profile check failed:", error);
        navigate("/onboarding/role", { replace: true });
      } finally {
        setCheckedOnboarding(true);
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, authLoading, isOnOnboardingPage, navigate, allowProfileEdit, modeParam]);

  // Show loading while checking auth or profile
  if (authLoading || (!checkedOnboarding && (isAuthenticated || isOnOnboardingPage))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OnboardingGuard;

