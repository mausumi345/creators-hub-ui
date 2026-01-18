import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

const DashboardPage = () => {
  const tab: "notifications" = "notifications";
  const [notifications, setNotifications] = useState<
    { id: string; title: string; body?: string; ago: string; pill?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get("/notifications");
        const items = res.data?.notifications ?? res.data?.items ?? res.data ?? [];
        const mapped = items.map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          ago: n.created_at ? new Date(n.created_at).toLocaleString("en-IN") : "",
          pill: (n.status || "").toString().toLowerCase() === "unread" ? "New" : undefined,
        }));
        setNotifications(mapped);
      } catch (err) {
        console.error("Failed to load notifications", err);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/60">Tailor Dashboard</div>
            <div className="text-3xl font-bold">My Workspace</div>
            <div className="text-white/60 mt-1">Track orders, collaborations, and notifications</div>
          </div>
          <div className="flex gap-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            { label: "Notifications", value: notifications.length.toString(), pill: "Live" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/60">{card.label}</div>
              <div className="text-2xl font-bold mt-1">{card.value}</div>
              <div className="text-[11px] text-white/60 mt-1">{card.pill}</div>
            </div>
          ))}
        </div>

        {tab === "notifications" && (
          <div className="mt-8 space-y-3">
            {isLoading ? (
              <div className="text-sm text-white/70">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="text-sm text-white/60">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{n.title}</div>
                    {n.pill && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-fuchsia-600/30 text-fuchsia-100">
                        {n.pill}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/70 mt-1">{n.body}</div>
                  <div className="text-xs text-white/50 mt-1">{n.ago}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

