import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import RolesOnboardingPage from "./pages/onboarding/RolesOnboardingPage";
import RoleSelectionPage from "./pages/onboarding/RoleSelectionPage";
import ProfileOnboardingPage from "./pages/onboarding/ProfileOnboardingPage";
import LoginSuccessBanner from "./pages/LoginSuccessBanner";
import TopBar from "./components/TopBar";
import OnboardingGuard from "./components/OnboardingGuard";
import FeedPage from "./pages/FeedPage";
import CollaborationPage from "./pages/CollaborationPage";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <AuthProvider>
      {/* Global "logged in successfully" toast */}
      <LoginSuccessBanner />
      <OnboardingGuard>
        <TopBar />
        <Routes>
          {/* Onboarding routes - no MainLayout, full screen */}
          <Route path="/onboarding/roles" element={<RolesOnboardingPage />} />
          <Route path="/onboarding/role" element={<RoleSelectionPage />} />
          <Route path="/onboarding/profile" element={<ProfileOnboardingPage />} />

          {/* Routes using main layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/collaboration" element={<CollaborationPage />} />
            <Route path="/chat/:threadId" element={<ChatPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            {/* Legacy onboarding redirect */}
            <Route path="/onboarding" element={<Navigate to="/onboarding/roles" replace />} />
          </Route>

          {/* Auth callback can be outside the layout if you want a blank page */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </OnboardingGuard>
    </AuthProvider>
  );
}

export default App;
