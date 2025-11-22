import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

function App() {
  return (
    <Routes>
      {/* Routes using main layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* later: /signup, /feed, /profile, etc. */}
      </Route>

      {/* Auth callback can be outside the layout if you want a blank page */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
