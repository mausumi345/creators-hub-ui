// src/components/TopBar.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";
import Logo from "./Logo";

const TopBar = () => {
  const { user, isLoading, isAuthenticated, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleRoleSwitch = async (newRole: string) => {
    if (!newRole || newRole === user?.active_role) {
      return;
    }

    try {
      const response = await apiClient.patch("/profile/active-role", {
        active_role: newRole,
      });
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          roles: response.data.roles ?? prev.roles,
          active_role: response.data.active_role ?? newRole,
        };
      });
    } catch (error) {
      console.error("Failed to switch role:", error);
    }
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
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-violet-500/30">
                  {initial}
                </div>
                <span className="text-sm text-white/80 hidden sm:block">
                  {email}
                </span>
                <svg
                  className={`w-3 h-3 ml-1 text-white/60 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-lg shadow-xl py-1">
                  {user?.roles && user.roles.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs uppercase tracking-wide text-white/50">
                        Active role
                      </div>
                      {user.roles.map((role) => {
                        const active = role === user.active_role;
                        return (
                          <button
                            key={role}
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleRoleSwitch(role);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${
                              active ? "text-white" : "text-white/80"
                            }`}
                          >
                            {active ? "✓ " : ""}
                            {role}
                          </button>
                        );
                      })}
                      <div className="h-px bg-white/10 my-1" />
                    </>
                  )}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate("/onboarding/roles");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    Manage roles
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
