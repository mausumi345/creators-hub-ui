import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";

type PaymentEvent = {
  order_id: string;
  order_title: string;
  event_type: string;
  amount?: number | null;
  currency?: string | null;
  created_at: string;
  role: "buyer" | "seller";
  direction: "in" | "out";
};

const labelMap: Record<string, string> = {
  escrow_held: "Escrow Funded",
  escrow_released: "Payment Released",
};

const badgeColor = (direction: string) =>
  direction === "in" ? "bg-green-500/15 text-green-200" : "bg-amber-500/15 text-amber-200";

const TransactionsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const res = await apiClient.get("/orders/transactions");
        setItems(res.data || []);
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        setLoading(false);
      }
    };
    if (!isLoading && isAuthenticated) {
      load();
    }
  }, [isAuthenticated, isLoading]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatAmount = (a?: number | null, c?: string | null) => {
    if (a === undefined || a === null) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: c || "INR",
      minimumFractionDigits: 0,
    }).format(a);
  };

  if (!isLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-white/60">Payments</p>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
        </div>
      </div>

      {loading ? (
        <div className="text-white/60 text-sm">Loading transactions...</div>
      ) : items.length === 0 ? (
        <div className="text-white/60 text-sm">No transactions yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div
              key={`${t.order_id}-${t.created_at}-${t.event_type}`}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{t.order_title}</div>
                <div className="text-xs text-white/50">
                  {labelMap[t.event_type] || t.event_type.replace("escrow_", "").replace("_", " ")}
                </div>
                <div className="text-xs text-white/40">{formatDate(t.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs border border-white/10 ${badgeColor(t.direction)}`}>
                  {t.direction === "in" ? "Incoming" : "Outgoing"}
                </span>
                <div className="text-right">
                  <div className="text-white font-semibold">{formatAmount(t.amount, t.currency)}</div>
                  <div className="text-white/40 text-xs">{t.role === "buyer" ? "You paid" : "You received"}</div>
                  <button
                    onClick={() => navigate(`/orders/${t.order_id}`)}
                    className="text-xs text-violet-300 hover:text-violet-200"
                  >
                    View order →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;

