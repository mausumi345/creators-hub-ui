import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import RolesOnboardingPage from "./pages/onboarding/RolesOnboardingPage";
import RoleSelectionPage from "./pages/onboarding/RoleSelectionPage";
import ProfileOnboardingPage from "./pages/onboarding/ProfileOnboardingPage";
import LoginSuccessBanner from "./pages/LoginSuccessBanner";
import TopBar from "./components/TopBar";
import OnboardingGuard from "./components/OnboardingGuard";
import RequireAuth from "./components/RequireAuth";
import FeedPage from "./pages/FeedPage";
import CollaborationPage from "./pages/CollaborationPage";
import ChatPage from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import UserProfilePage from "./pages/UserProfilePage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import PayoutSetupPage from "./pages/PayoutSetupPage";
import AiStudioPage from "./pages/AiStudioPage";

const ProtectedShell = () => (
  <OnboardingGuard>
    <TopBar />
    <Outlet />
  </OnboardingGuard>
);

function App() {
  return (
    <AuthProvider>
      {/* Global "logged in successfully" toast */}
      <LoginSuccessBanner />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/" replace />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route element={<ProtectedShell />}>
            {/* Onboarding routes - no MainLayout, full screen */}
            <Route path="/onboarding/roles" element={<RolesOnboardingPage />} />
            <Route path="/onboarding/role" element={<RoleSelectionPage />} />
            <Route path="/onboarding/profile" element={<ProfileOnboardingPage />} />
            {/* Legacy onboarding redirect */}
            <Route path="/onboarding" element={<Navigate to="/onboarding/roles" replace />} />

            {/* Routes using main layout */}
            <Route element={<MainLayout />}>
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/collaboration" element={<CollaborationPage />} />
              <Route path="/chat/:threadId" element={<ChatPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/payouts/setup" element={<PayoutSetupPage />} />
              <Route path="/ai-studio" element={<AiStudioPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
