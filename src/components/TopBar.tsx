// src/components/TopBar.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";
import Logo from "./Logo";
import NotificationsDrawer, { type NotificationItem } from "./NotificationsDrawer";

const TopBar = () => {
  const { user, isLoading, isAuthenticated, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const notifOffsetRef = useRef(0);
  const [notifHasMore, setNotifHasMore] = useState(true);
  const [notifLoadingMore, setNotifLoadingMore] = useState(false);
  const isNotifOpenRef = useRef(false);
  const loadingNotifsRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const PAGE_SIZE = 20;

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

  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!isAuthenticated) {
        setNotifications([]);
        return;
      }
      if (loadingNotifsRef.current || loadingMoreRef.current) {
        return;
      }
      const nextOffset = reset ? 0 : notifOffsetRef.current;
      try {
        if (reset) {
          setIsLoadingNotifs(true);
          loadingNotifsRef.current = true;
        } else {
          setNotifLoadingMore(true);
          loadingMoreRef.current = true;
        }
        const res = await apiClient.get("/notifications", { params: { limit: PAGE_SIZE, offset: nextOffset } });
        const items = res.data?.notifications ?? res.data?.items ?? res.data ?? [];
        const mapped: NotificationItem[] = items.map((n: any) => ({
          id: n.id,
          title: n.title,
          subtitle: n.body,
          kind: "collab",
          status: (n.status || "unread").toString().toLowerCase() === "read" ? "read" : "unread",
          timestamp: n.created_at ? new Date(n.created_at).toLocaleString("en-IN") : "",
        }));
        setNotifications((prev) => (reset ? mapped : [...prev, ...mapped]));
        setNotifHasMore(mapped.length === PAGE_SIZE);
        const newOffset = nextOffset + PAGE_SIZE;
        notifOffsetRef.current = newOffset;
      } catch (err) {
        console.error("Failed to load notifications", err);
        if (reset) setNotifications([]);
      } finally {
        setIsLoadingNotifs(false);
        setNotifLoadingMore(false);
        loadingNotifsRef.current = false;
        loadingMoreRef.current = false;
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    notifOffsetRef.current = 0;
    setNotifHasMore(true);
    void fetchNotifications(true);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;
    isNotifOpenRef.current = isNotifOpen;
    const id = window.setInterval(() => {
      if (!isNotifOpenRef.current) {
        void fetchNotifications(true);
      }
    }, 15000);
    return () => {
      window.clearInterval(id);
    };
  }, [isAuthenticated, isNotifOpen, fetchNotifications]);

  const handleCloseDrawer = async () => {
    setIsNotifOpen(false);
    if (!isAuthenticated) return;
    try {
      await apiClient.post("/notifications/read-all");
      setNotifHasMore(true);
      await fetchNotifications(true);
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  const unreadCount = notifications.filter((n) => n.status !== "read").length;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 pr-4 sm:pr-6 flex items-center justify-between bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm"
      style={{ paddingLeft: "20px" }}
    >
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <Logo size={32} className="group-hover:scale-105 transition-transform" />
        <span className="hidden sm:inline relative text-2xl font-extrabold tracking-wide">
          <span className="absolute -inset-x-1.5 -inset-y-0.5 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 blur-[1px]" />
          <span className="relative bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(249,115,22,0.28)]">
            Collabfy
          </span>
        </span>
      </Link>

      {/* Right: Notifications + Profile / Auth buttons */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <span className="text-xs text-slate-500">Loading…</span>
        ) : isAuthenticated ? (
          <>
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((v) => !v)}
                className="relative w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
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
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-[11px] font-semibold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isNotifOpen && isLoadingNotifs && (
                <div className="absolute right-0 mt-2 text-xs text-slate-500">Loading…</div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-orange-200">
                  {initial}
                </div>
                <svg
                  className={`w-3 h-3 text-slate-500 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1">
                  {user?.roles && user.roles.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs uppercase tracking-wide text-slate-500">
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
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${
                              active ? "text-slate-900" : "text-slate-600"
                            }`}
                          >
                            {active ? "✓ " : ""}
                            {role}
                          </button>
                        );
                      })}
                      <div className="h-px bg-slate-200 my-1" />
                    </>
                  )}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate("/onboarding/roles");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-orange-50"
                  >
                    Manage roles
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate("/profile");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-orange-50"
                  >
                    View profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-orange-50"
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
              onLoadMore={() => fetchNotifications(false)}
              hasMore={notifHasMore}
              loadingMore={notifLoadingMore}
            />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-200 transition-all"
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
