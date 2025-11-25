// src/components/TopBar.tsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const TopBar: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const email = user?.email || "Guest";

  return (
    <header
      style={{
        height: "56px",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #eee",
        backgroundColor: "#ffffff",
      }}
    >
      <Link to="/" style={{ fontWeight: 600, textDecoration: "none", color: "inherit" }}>
        Creators Hub
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isLoading ? (
          <span style={{ fontSize: 12, color: "#666" }}>Loading…</span>
        ) : isAuthenticated ? (
          <>
            <span style={{ fontSize: 13, color: "#444" }}>{email}</span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "#f3b35c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                textTransform: "uppercase",
              }}
            >
              {email.charAt(0)}
            </div>
            <button
              onClick={handleLogout}
              style={{
                fontSize: 12,
                color: "#666",
                background: "none",
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            style={{
              fontSize: 13,
              color: "#7c3aed",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default TopBar;
