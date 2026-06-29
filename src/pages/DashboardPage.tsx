import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/apiClient";

type NotificationItem = { id: string; title: string; body?: string; ago: string; pill?: string };

const DashboardPage = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 5;

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get("/notifications", { params: { limit: PAGE_SIZE, offset: 0 } });
      const items = res.data?.notifications ?? res.data?.items ?? res.data ?? [];
      const mapped: NotificationItem[] = items.map((n: any) => ({
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

  useEffect(() => {
    void loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => n.pill === "New").length;
  const recentItems = notifications.slice(0, 3);

  const getMeta = (n: NotificationItem) => {
    const text = `${n.title} ${n.body || ""}`.toLowerCase();
    if (text.includes("order")) {
      return { label: "Orders", color: "bg-emerald-100 text-emerald-700", icon: "📦" };
    }
    if (text.includes("collab")) {
      return { label: "Collaboration", color: "bg-orange-100 text-orange-700", icon: "🤝" };
    }
    if (text.includes("escrow") || text.includes("payment") || text.includes("payout")) {
      return { label: "Payments", color: "bg-amber-100 text-amber-700", icon: "💳" };
    }
    if (text.includes("message") || text.includes("chat")) {
      return { label: "Messages", color: "bg-sky-100 text-sky-700", icon: "💬" };
    }
    return { label: "Updates", color: "bg-slate-100 text-slate-700", icon: "🧾" };
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="max-w-6xl mr-auto py-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-slate-500">Dashboard</div>
            <div className="text-2xl font-semibold text-slate-900">Welcome back</div>
            <div className="text-slate-500 mt-1">Your workspace at a glance</div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/collaboration"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-orange-50"
            >
              Start collaboration
            </Link>
            <Link
              to="/ai-studio"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-200 hover:from-orange-400 hover:to-amber-400"
            >
              Create AI Design
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
          {[
            { label: "Unread notifications", value: unreadCount.toString(), sub: "New updates" },
            { label: "Recent activity", value: notifications.length.toString(), sub: "Last 5 items" },
            { label: "Next step", value: "Review", sub: "Check orders & collabs" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">{card.label}</div>
              <div className="text-2xl font-bold mt-1 text-slate-900">{card.value}</div>
              <div className="text-[11px] text-slate-500 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-900">Recent notifications</div>
              <span className="text-xs text-slate-500">See all in the bell icon</span>
            </div>
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : recentItems.length === 0 ? (
              <div className="text-sm text-slate-500">No notifications yet.</div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((n) => {
                  const meta = getMeta(n);
                  return (
                  <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.icon}</span>
                        <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    {n.body && <div className="text-sm text-slate-600 mt-1">{n.body}</div>}
                    <div className="text-xs text-slate-400 mt-1">{n.ago}</div>
                  </div>
                )})}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-900 mb-4">Quick actions</div>
            <div className="space-y-2">
              <Link
                to="/orders"
                className="block w-full text-left px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-orange-50"
              >
                Review orders
              </Link>
              <Link
                to="/collaboration"
                className="block w-full text-left px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-orange-50"
              >
                Manage collaborations
              </Link>
              <Link
                to="/feed"
                className="block w-full text-left px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-orange-50"
              >
                Go to feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
