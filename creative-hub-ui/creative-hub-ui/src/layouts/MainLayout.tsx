import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import { useAuth } from "../contexts/AuthContext";

const MainLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const width = isAuthenticated ? (collapsed ? "5rem" : "15rem") : "0";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [collapsed, isAuthenticated]);

  const navItems = [
    {
      label: "Dashboard",
      to: "/dashboard",
      iconBg: "bg-gradient-to-br from-[#7cf2c2] to-[#1fa1ff]",
      icon: (
        <path
          d="M4 4h16v16H4z"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Collab",
      to: "/collaboration",
      iconBg: "bg-gradient-to-br from-[#ff9ff3] to-[#7f7bff]",
      icon: (
        <path
          d="M7 8a5 5 0 0 1 10 0v2a5 5 0 0 1-10 0zm-3 9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Orders",
      to: "/orders",
      iconBg: "bg-gradient-to-br from-[#ffaf4b] to-[#ff5f6d]",
      icon: (
        <path
          d="M5 7h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7zm0 0 2-3h10l2 3m-9 4h4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Payments",
      to: "/transactions",
      iconBg: "bg-gradient-to-br from-[#7cf2c2] to-[#b26bff]",
      icon: (
        <path
          d="M3 6h18M3 12h18M3 18h18"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Feed",
      to: "/feed",
      iconBg: "bg-gradient-to-br from-[#7ad7f0] to-[#7c3aed]",
      icon: (
        <path
          d="M12 3v7m0 0 4-4m-4 4-4-4m0 11h8m-8 4h5"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen flex bg-brand-dark text-white">
      {/* Left nav */}
      {isAuthenticated && (
        <aside
          className={`fixed inset-y-0 left-0 border-r border-white/10 bg-[#11131d]/95 backdrop-blur-xl flex flex-col transition-all duration-200 z-40 ${
            collapsed ? "w-20" : "w-60"
          }`}
          style={{
            background: "var(--sidebar-gradient)",
          }}
        >
          <div className="h-16 px-3 flex items-center gap-2 border-b border-white/10">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              title={collapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {collapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <Logo size={32} />
              {!collapsed && (
                <span className="font-semibold text-base tracking-tight text-white/90 truncate">Creative Hub</span>
              )}
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to);
              const baseLink =
                "flex items-center gap-3 py-2.5 rounded-xl transition-all text-white/80 hover:text-white hover:bg-white/5";
              const collapsedLink = collapsed ? "justify-center px-0" : "px-3";
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${baseLink} ${collapsedLink} ${
                    active
                      ? "text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-white/10"
                      : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-black/90 ${item.iconBg} ${
                      active ? "shadow-lg shadow-black/40" : ""
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main column */}
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: isAuthenticated ? "var(--sidebar-width)" : 0 }}
      >
        {/* Spacer for fixed TopBar */}
        <div className="h-16" />

        {/* Page content */}
        <main className="flex-1 min-h-screen bg-gradient-to-br from-[#0f131e] via-[#0f1624] to-[#0c182a] text-white">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/50 py-6 text-xs text-center text-white/40">
          © 2026 Creative Hub · Where ideas become reality
        </footer>
      </div>

    </div>
  );
};

export default MainLayout;
