// src/components/TopBar.tsx
import React, { useEffect, useState } from "react";

type MeResponse = {
  user: {
    id: string;
    email: string | null;
    email_verified: boolean;
    country_code: string;
    locale: string;
    currency_code: string;
    timezone: string;
  };
  session: {
    id: string;
    user_id: string;
    idp_session_id: string | null;
    created_at: string;
    expires_at: string | null;
  };
};

const TopBar: React.FC = () => {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const resp = await fetch("/api/creatorshub/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          console.error("Failed to fetch /auth/me", resp.status);
          setLoading(false);
          return;
        }

        const data: MeResponse = await resp.json();
        console.log(data)
        setMe(data);
      } catch (err) {
        console.error("Error calling /auth/me", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const email = me?.user.email || "Guest";

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
      <div style={{ fontWeight: 600 }}>Creators Hub</div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {loading ? (
          <span style={{ fontSize: 12, color: "#666" }}>Loading user…</span>
        ) : (
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
          </>
        )}
      </div>
    </header>
  );
};

export default TopBar;
