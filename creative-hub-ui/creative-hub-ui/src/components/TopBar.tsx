// src/components/TopBar.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";
import Logo from "./Logo";
import NotificationsDrawer, { type NotificationItem } from "./NotificationsDrawer";

const TopBar = () => {
  const { user, isLoading, isAuthenticated, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

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

  const fetchNotifications = useMemo(
    () => async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        return;
      }
      try {
        setIsLoadingNotifs(true);
        const res = await apiClient.get("/notifications");
        const items =
          res.data?.notifications ??
          res.data?.items ??
          res.data ??
          [];
        const mapped: NotificationItem[] = items.map((n: any) => ({
          id: n.id,
          title: n.title,
          subtitle: n.body,
          kind: "collab",
          status: (n.status || "unread").toString().toLowerCase() === "read" ? "read" : "unread",
          timestamp: n.created_at ? new Date(n.created_at).toLocaleString("en-IN") : "",
        }));
        setNotifications(mapped);
      } catch (err) {
        console.error("Failed to load notifications", err);
        setNotifications([]);
      } finally {
        setIsLoadingNotifs(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleCloseDrawer = async () => {
    setIsNotifOpen(false);
    if (!isAuthenticated) return;
    try {
      await apiClient.post("/notifications/read-all");
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  const unreadCount = notifications.filter((n) => n.status !== "read").length;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 pr-4 sm:pr-6 flex items-center justify-between bg-black/80 backdrop-blur-xl border-b border-white/10"
      style={{ paddingLeft: "20px" }}
    >
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <Logo size={32} className="group-hover:scale-105 transition-transform" />
        <span className="text-white/85 text-sm font-semibold hidden sm:inline">Creative Hub</span>
      </Link>

      {/* Right: Notifications + Profile / Auth buttons */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <span className="text-xs text-white/50">Loading…</span>
        ) : isAuthenticated ? (
          <>
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((v) => !v)}
                className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                aria-label="Notifications"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-fuchsia-500 text-[11px] font-semibold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isNotifOpen && isLoadingNotifs && (
                <div className="absolute right-0 mt-2 text-xs text-white/70">Loading…</div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-violet-500/30">
                  {initial}
                </div>
                <svg
                  className={`w-3 h-3 text-white/60 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
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

            <NotificationsDrawer
              isOpen={isNotifOpen}
              onClose={handleCloseDrawer}
              items={notifications}
            />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-white/80 hover:text-white font-medium transition-colors"
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
