import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import OnboardingPage from "./pages/OnboardingPage";
import LoginSuccessBanner from "./pages/LoginSuccessBanner";
import TopBar from "./components/TopBar";

function App() {
  return (
    <AuthProvider>
      {/* Global "logged in successfully" toast */}
      <LoginSuccessBanner />
      <TopBar />
      <Routes>
        {/* Routes using main layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>

        {/* Auth callback can be outside the layout if you want a blank page */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
