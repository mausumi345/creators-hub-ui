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
      iconBg: "bg-orange-100 text-orange-700",
      icon: (
        <path
          d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-18v6h8V3h-8z"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Collab",
      to: "/collaboration",
      iconBg: "bg-orange-100 text-orange-700",
      icon: (
        <path
          d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11zM8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Orders",
      to: "/orders",
      iconBg: "bg-orange-100 text-orange-700",
      icon: (
        <path
          d="M9 2h6a2 2 0 0 1 2 2v2h3v16H4V6h3V4a2 2 0 0 1 2-2zm0 4h6V4H9v2zm2 6h6m-6 4h6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Feed",
      to: "/feed",
      iconBg: "bg-orange-100 text-orange-700",
      icon: (
        <path
          d="M4 5h16v12H5.17L4 18.17V5zm4 4h8m-8 4h6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Profile",
      to: "/profile",
      iconBg: "bg-orange-100 text-orange-700",
      icon: (
        <path
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "AI Studio",
      to: "/ai-studio",
      iconBg: "bg-orange-100 text-orange-700",
      icon: (
        <>
          <path
            d="M12 4a8 8 0 0 1 7.5 5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 7v5h-5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 20a8 8 0 0 1-7.5-5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 17v-5h5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex bg-orange-50 text-slate-900">
      {/* Left nav */}
      {isAuthenticated && (
        <aside
          className={`fixed inset-y-0 left-0 border-r border-slate-200 bg-white/95 backdrop-blur-xl flex flex-col transition-all duration-200 z-40 ${
            collapsed ? "w-20" : "w-60"
          }`}
          style={{
            background: "var(--sidebar-gradient)",
          }}
        >
          <div className="h-16 px-3 flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
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
                <span className="font-semibold text-base tracking-tight text-slate-800 truncate">Collabfy</span>
              )}
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to);
              const baseLink =
                "flex items-center gap-3 py-2.5 rounded-xl transition-all text-slate-700 hover:text-slate-900 hover:bg-slate-100";
              const collapsedLink = collapsed ? "justify-center px-0" : "px-3";
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${baseLink} ${collapsedLink} ${
                    active
                      ? "text-orange-700 shadow-[0_0_0_1px_rgba(249,115,22,0.2)] bg-orange-50"
                      : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconBg} ${
                      active ? "shadow-lg shadow-orange-200" : ""
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
        <main className="flex-1 min-h-screen bg-orange-50 text-slate-900 px-5">
          <Outlet />
        </main>

        {/* Footer */}
        {!location.pathname.startsWith("/chat") && (
          <footer className="border-t border-slate-200 bg-white py-6 text-xs text-center text-slate-400">
            © 2026 Collabfy · Where ideas become reality
          </footer>
        )}
      </div>

    </div>
  );
};

export default MainLayout;
