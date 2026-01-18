import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";

type OrderItem = {
  id: string;
  collab_room_id?: string;
  request_title?: string | null;
  buyer_id: string;
  seller_id: string;
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  status: string;
  escrow_id?: string;
  due_date?: string;
  created_at: string;
  started_at?: string;
  delivered_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300",
  pending: "bg-yellow-500/20 text-yellow-300",
  in_progress: "bg-blue-500/20 text-blue-300",
  delivered: "bg-purple-500/20 text-purple-300",
  revision: "bg-orange-500/20 text-orange-300",
  completed: "bg-green-500/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-300",
  disputed: "bg-red-600/20 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  in_progress: "In Progress",
  delivered: "Delivered",
  revision: "Revision",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const OrdersPage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [connectReady, setConnectReady] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"all" | "buyer" | "seller">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tab !== "all") params.role = tab;
      if (statusFilter !== "all") params.status = statusFilter;
      
      const res = await apiClient.get("/orders", { params });
      const items = res.data?.items || res.data || [];
      setOrders(items);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
      const checkConnect = async () => {
        if (!user) return;
        try {
          const res = await apiClient.get(`/escrow/connect/account/${user.id}`);
          if (res.data?.stripe_account_id && res.data?.status === "enabled") {
            setConnectReady(true);
          } else {
            setConnectReady(false);
          }
        } catch (err: any) {
          if (err?.response?.status === 404) {
            setConnectReady(false);
          } else {
            setConnectReady(null);
          }
        }
      };
      checkConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter, isAuthenticated, authLoading]);

  const formatCurrency = (amount: number, currency: string) => {
    const numericAmount = typeof amount === "number" ? amount : Number(amount);
    if (Number.isNaN(numericAmount)) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 0,
    }).format(numericAmount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20 px-4 pb-10">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Sign in to view orders</h2>
          <p className="text-white/50 mb-6">
            Create an account or sign in to manage your orders and collaborations.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20 px-4 pb-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
            <p className="text-white/50 mt-1">Manage your orders and transactions</p>
          </div>
        </div>

        {/* Tabs and seller payout setup */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="flex flex-wrap gap-2">
            {(["all", "buyer", "seller"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t === "all" ? "All Orders" : t === "buyer" ? "As Buyer" : "As Seller"}
              </button>
            ))}
          </div>
          {user && tab !== "buyer" && connectReady === false && (
            <a
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                navigate("/payouts/setup");
              }}
              className="ml-auto px-4 py-2 rounded-xl bg-amber-500 text-black font-medium hover:bg-amber-400 transition cursor-pointer text-sm"
            >
              Set up payouts
            </a>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-white/50 text-sm self-center mr-2">Status:</span>
          {["all", "pending", "in_progress", "delivered", "completed", "disputed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white/80 mb-1">No orders found</h3>
            <p className="text-white/50 text-sm">Orders will appear here when you start collaborations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left side */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                        {order.request_title || order.title}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-500/20 text-gray-300"}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs mb-2 truncate">
                      {order.title}
                    </p>
                    {order.description && (
                      <p className="text-white/50 text-sm line-clamp-1 mb-3">{order.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
                      {(() => {
                        const shipment = (order.metadata as any)?.material_shipment as
                          | { status?: string; carrier?: string; tracking_number?: string }
                          | undefined;
                        if (!shipment) return null;
                        const statusLabel =
                          shipment.status === "received" ? "Materials received" : "Materials shipped";
                        const statusClass =
                          shipment.status === "received" ? "text-green-400/70" : "text-amber-300/70";
                        const trackingText = shipment.tracking_number
                          ? `Tracking: ${shipment.tracking_number}`
                          : undefined;
                        return (
                          <span
                            className={`flex items-center gap-1.5 ${statusClass}`}
                            title={trackingText || shipment.carrier || statusLabel}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V7a2 2 0 00-2-2h-6l-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-3" />
                            </svg>
                            {statusLabel}
                            {shipment.tracking_number && (
                              <span className="text-white/40">
                                • {shipment.tracking_number}
                              </span>
                            )}
                          </span>
                        );
                      })()}
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created {formatDate(order.created_at)}
                      </span>
                      {order.due_date && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Due {formatDate(order.due_date)}
                        </span>
                      )}
                      {order.escrow_id && (
                        <span className="flex items-center gap-1.5 text-green-400/70">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Escrow Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side - Amount */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(order.total_amount, order.currency)}
                      </div>
                      <div className="text-xs text-white/40">Total Amount</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <svg className="w-4 h-4 text-white/50 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

