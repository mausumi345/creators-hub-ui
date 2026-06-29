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
  platform_fee_percent?: number | null;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const loadTransactions = async (reset = false) => {
    if (!isAuthenticated) return;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const nextOffset = reset ? 0 : offset;
      const res = await apiClient.get("/orders/transactions", { params: { limit: PAGE_SIZE, offset: nextOffset } });
      const data = res.data || [];
      setItems((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setOffset(nextOffset + PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setOffset(0);
      setHasMore(true);
      loadTransactions(true);
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

  const formatFee = (amount?: number | null, percent?: number | null) => {
    if (amount === undefined || amount === null || percent === undefined || percent === null) return null;
    const fee = amount * (percent / 100);
    const net = amount - fee;
    return {
      fee,
      net,
    };
  };

  const renderLoadMore = () =>
    hasMore ? (
      <button
        onClick={() => loadTransactions(false)}
        disabled={loadingMore}
        className="w-full px-3 py-2 rounded-lg bg-white text-slate-600 hover:bg-orange-50 border border-slate-200 disabled:opacity-50"
      >
        {loadingMore ? "Loading..." : "Load more"}
      </button>
    ) : null;

  if (!isLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-slate-900">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500">Payments</p>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading transactions...</div>
      ) : items.length === 0 ? (
        <div className="text-slate-500 text-sm">No transactions yet.</div>
      ) : (
        <div className="space-y-3">
          {renderLoadMore()}
          {items.map((t) => (
            <div
              key={`${t.order_id}-${t.created_at}-${t.event_type}`}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-slate-900 font-medium truncate">{t.order_title}</div>
                <div className="text-xs text-slate-500">
                  {labelMap[t.event_type] || t.event_type.replace("escrow_", "").replace("_", " ")}
                </div>
                <div className="text-xs text-slate-400">{formatDate(t.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs border border-slate-200 ${badgeColor(t.direction)}`}>
                  {t.direction === "in" ? "Incoming" : "Outgoing"}
                </span>
                <div className="text-right">
                  <div className="text-slate-900 font-semibold">{formatAmount(t.amount, t.currency)}</div>
                  <div className="text-slate-500 text-xs">{t.role === "buyer" ? "You paid" : "You received"}</div>
                  {t.role === "seller" && t.platform_fee_percent != null && t.amount != null && (
                    <div className="text-[11px] text-slate-400">
                      Platform fee {t.platform_fee_percent}% · Net{" "}
                      {formatAmount(formatFee(t.amount, t.platform_fee_percent)?.net || null, t.currency)}
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/orders/${t.order_id}`)}
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    View order →
                  </button>
                </div>
              </div>
            </div>
          ))}
          {renderLoadMore()}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;

