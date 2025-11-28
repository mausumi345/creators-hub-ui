// src/components/TopBar.tsx
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Logo from "./Logo";

const TopBar = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const email = user?.email || "";
  const initial = email ? email.charAt(0).toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between bg-black/80 backdrop-blur-xl border-b border-white/10">
      {/* Logo & Brand */}
      <Link to="/" className="flex items-center gap-3 group">
        <Logo size={40} className="group-hover:scale-105 transition-transform" />
        <span className="text-white font-semibold text-lg tracking-tight">
          Creative Hub
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {isLoading ? (
          <span className="text-xs text-white/50">Loading…</span>
        ) : isAuthenticated ? (
          // Logged in state
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* User avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-violet-500/30">
                {initial}
              </div>
              <span className="text-sm text-white/80 hidden sm:block">
                {email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          // Logged out state
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-white/70 hover:text-white font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
