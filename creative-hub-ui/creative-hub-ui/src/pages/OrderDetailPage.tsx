import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";

type Milestone = {
  id: string;
  title: string;
  description?: string;
  amount?: number;
  status: string;
  due_date?: string;
  completed_at?: string;
  approved_at?: string;
};

type Deliverable = {
  id: string;
  file_url: string;
  file_name?: string;
  file_type?: string;
  description?: string;
  created_at: string;
};

type TimelineEvent = {
  id: string;
  event_type: string;
  actor_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
};

type OrderDetail = {
  id: string;
  collab_room_id?: string;
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
  milestones: Milestone[];
  deliverables: Deliverable[];
  timeline: TimelineEvent[];
  escrow_summary?: {
    status: string;
    total_amount: number;
    released_amount: number;
    held_amount: number;
    currency: string;
  };
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  delivered: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  revision: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  disputed: "bg-red-600/20 text-red-400 border-red-600/30",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending Acceptance",
  in_progress: "In Progress",
  delivered: "Delivered",
  revision: "Revision Requested",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const TIMELINE_ICONS: Record<string, string> = {
  order_created: "📝",
  order_accepted: "✅",
  order_started: "🚀",
  milestone_started: "🎯",
  milestone_completed: "✓",
  deliverable_uploaded: "📎",
  order_delivered: "📦",
  revision_requested: "🔄",
  order_completed: "🎉",
  order_cancelled: "❌",
  order_disputed: "⚠️",
  escrow_held: "🔒",
  escrow_released: "💰",
};

type EscrowInfo = {
  id: string;
  status: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  currency: string;
  requires_payment?: boolean;
  stripe_checkout_url?: string;
  stripe_session_id?: string;
};

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [escrow, setEscrow] = useState<EscrowInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isBuyer = user?.id === order?.buyer_id;
  const isSeller = user?.id === order?.seller_id;

  const load = async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      setOrder(res.data);
      
      // Load escrow info if order has escrow_id
      if (res.data?.escrow_id) {
        try {
          const escrowRes = await apiClient.get(`/escrow/${res.data.escrow_id}`);
          setEscrow(escrowRes.data);
        } catch (escrowErr) {
          console.error("Failed to load escrow:", escrowErr);
        }
      }
    } catch (err) {
      console.error("Failed to load order:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment verification from Stripe redirect
  const verifyPayment = async (sessionId: string) => {
    setPaymentLoading(true);
    try {
      const res = await apiClient.post("/escrow/verify-payment", {
        stripe_session_id: sessionId,
      });
      if (res.data?.success) {
        setPaymentMessage({ type: 'success', text: 'Payment successful! Your escrow is now funded.' });
        await load(); // Reload to get updated status
      }
    } catch (err) {
      console.error("Payment verification failed:", err);
      setPaymentMessage({ type: 'error', text: 'Payment verification failed. Please contact support.' });
    } finally {
      setPaymentLoading(false);
      // Clean up URL params
      window.history.replaceState({}, '', `/orders/${orderId}`);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
      
      // Check for Stripe redirect (session_id in URL)
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        verifyPayment(sessionId);
      }
    } else if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isAuthenticated, authLoading]);

  // Initiate payment - calls escrow service to get Stripe checkout URL
  const initiatePayment = async () => {
    if (!order) return;
    
    setPaymentLoading(true);
    setPaymentMessage(null);
    
    try {
      // Call order service to initiate escrow hold
      const res = await apiClient.post(`/orders/${orderId}/initiate-payment`);
      
      if (res.data?.stripe_checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = res.data.stripe_checkout_url;
      } else if (res.data?.requires_payment === false) {
        // Mock mode - payment auto-completed
        setPaymentMessage({ type: 'success', text: 'Payment processed successfully!' });
        await load();
      } else if (res.data?.escrow_id) {
        // Escrow created but no checkout URL (should be rare) — refresh state
        setPaymentMessage({ type: 'success', text: 'Escrow created. Refreshing status…' });
        await load();
      } else {
        setPaymentMessage({ type: 'error', text: 'Unable to initiate payment. Please try again.' });
      }
    } catch (err: unknown) {
      console.error("Failed to initiate payment:", err);
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Payment initiation failed'
        : 'Payment initiation failed';
      setPaymentMessage({ type: 'error', text: errorMessage });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAction = async (action: string, body?: Record<string, unknown>) => {
    setActionLoading(action);
    try {
      await apiClient.post(`/orders/${orderId}/${action}`, body || {});
      await load();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      alert(`Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const updateMilestone = async (mid: string, status: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/milestones/${mid}`, { status });
      await load();
    } catch (err) {
      console.error("Failed to update milestone", err);
      alert("Failed to update milestone");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Order not found</h2>
          <button onClick={() => navigate("/orders")} className="text-violet-400 hover:text-violet-300">
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const hasMilestones = order.milestones && order.milestones.length > 0;
  const allMilestonesApproved = hasMilestones && order.milestones.every((m) => m.status === "approved");
  const fundingRequired = !order.escrow_id;
  const escrowPending = escrow?.status === "pending";
  const canFund =
    isBuyer &&
    (!order.escrow_id || escrowPending) &&
    !["completed", "cancelled", "disputed"].includes(order.status);

  const escrowEvents = order.timeline.filter(
    (t) => t.event_type === "escrow_held" || t.event_type === "escrow_released"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{order.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-white/60 text-sm mb-3">Request name • {order.title}</p>
              {order.description && (
                <p className="text-white/60 mb-4">{order.description}</p>
              )}
              <div className="flex flex-wrap gap-6 text-sm text-white/50">
                <div>
                  <span className="text-white/30">Created:</span>{" "}
                  <span className="text-white/70">{formatDate(order.created_at)}</span>
                </div>
                {order.due_date && (
                  <div>
                    <span className="text-white/30">Due:</span>{" "}
                    <span className="text-white/70">{formatDate(order.due_date)}</span>
                  </div>
                )}
                <div>
                  <span className="text-white/30">Role:</span>{" "}
                  <span className={isBuyer ? "text-blue-400" : "text-green-400"}>
                    {isBuyer ? "Buyer" : "Seller"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-1">
                {formatCurrency(order.total_amount, order.currency)}
              </div>
              {order.escrow_summary && (
                <div className="text-xs text-white/60 space-y-1 mt-2">
                  <div className="flex justify-end gap-2">
                    <span className="text-white/40">Escrow:</span>
                    <span className={order.escrow_summary.status === 'released' ? "text-green-300" : "text-white/70"}>
                      {order.escrow_summary.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span className="text-white/40">Released:</span>
                    <span className="text-green-300">
                      {formatCurrency(order.escrow_summary.released_amount, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span className="text-white/40">Held:</span>
                    <span className="text-amber-200">
                      {formatCurrency(order.escrow_summary.held_amount, order.currency)}
                    </span>
                  </div>
                </div>
              )}
              {escrow ? (
                <div className={`flex items-center gap-1.5 text-sm justify-end ${
                  escrow.status === 'funded' || escrow.status === 'partial_release' 
                    ? 'text-green-400' 
                    : escrow.status === 'pending' 
                    ? 'text-yellow-400' 
                    : escrow.status === 'released' 
                    ? 'text-blue-400'
                    : 'text-white/50'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {escrow.status === 'funded' && 'Escrow Funded'}
                  {escrow.status === 'pending' && 'Awaiting Payment'}
                  {escrow.status === 'released' && 'Payment Released'}
                  {escrow.status === 'partial_release' && 'Partially Released'}
                  {escrow.status === 'refunded' && 'Refunded'}
                </div>
              ) : order.escrow_id ? (
                <div className="flex items-center gap-1.5 text-green-400 text-sm justify-end">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Escrow Protected
                </div>
              ) : isBuyer && order.status === 'pending' ? (
                <div className="flex items-center gap-1.5 text-amber-400 text-sm justify-end">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Payment Required
                </div>
              ) : null}
            </div>
          </div>

      {/* Payments & Escrow */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white font-semibold">Payments & Escrow</div>
          {order.escrow_summary ? (
            <span className="text-xs text-white/60">
              Status: {order.escrow_summary.status.replace(/_/g, " ")}
            </span>
          ) : (
            <span className="text-xs text-white/60">No escrow info</span>
          )}
        </div>
        {order.escrow_summary ? (
          <div className="grid sm:grid-cols-3 gap-3 text-sm text-white">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-white/50 text-xs">Total</div>
              <div className="text-white font-semibold">
                {formatCurrency(Number(order.escrow_summary.total_amount), order.currency)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-white/50 text-xs">Released</div>
              <div className="text-green-300 font-semibold">
                {formatCurrency(Number(order.escrow_summary.released_amount), order.currency)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-white/50 text-xs">Held</div>
              <div className="text-amber-200 font-semibold">
                {formatCurrency(Number(order.escrow_summary.held_amount), order.currency)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white/50 text-sm">No escrow data available.</div>
        )}
        {escrowEvents.length > 0 && (
          <div className="mt-4">
            <div className="text-white/70 text-sm mb-2">Payment events</div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {escrowEvents.map((e) => (
                <div key={e.id} className="text-xs text-white/60 flex justify-between">
                  <span>{e.event_type.replace("escrow_", "").toUpperCase()}</span>
                  <span>{formatDate(e.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!order.escrow_id && (
          <div className="mt-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-100 text-xs">
            Escrow not funded. Buyer must fund (Pay to Start) before work can proceed.
          </div>
        )}
      </div>

          {/* Payment Message */}
          {paymentMessage && (
            <div className={`mt-4 p-4 rounded-xl border ${
              paymentMessage.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {paymentMessage.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {paymentMessage.text}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3">
            {hasMilestones && (
              <div className="w-full text-xs text-white/50 flex flex-wrap items-center gap-2">
                <span className="text-white/70 font-medium">Milestone payouts:</span>
                <span>Seller marks milestone completed → Buyer approves → Escrow releases for that milestone.</span>
                {allMilestonesApproved && (
                  <span className="text-green-300">All milestones approved—mark order delivered (shipping) next.</span>
                )}
              </div>
            )}
            {/* Buyer: Pay for order (if escrow not funded) */}
            {canFund && (
              <button
                onClick={initiatePayment}
                disabled={paymentLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                    Pay {formatCurrency(order.total_amount, order.currency)} to Start
                  </>
                )}
              </button>
            )}

            {/* Seller: Accept pending order */}
            {isSeller && order.status === "pending" && (
              <button
                onClick={() => handleAction("accept")}
                disabled={actionLoading === "accept"}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all"
              >
                {actionLoading === "accept" ? "Accepting..." : "Accept Order"}
              </button>
            )}

            {/* Seller: Mark as delivered */}
            {isSeller && !fundingRequired && (
              (!hasMilestones && (order.status === "in_progress" || order.status === "revision")) ||
              (hasMilestones && allMilestonesApproved && (order.status === "in_progress" || order.status === "revision"))
            ) && (
              <button
                onClick={() => handleAction("deliver")}
                disabled={actionLoading === "deliver"}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 transition-all"
              >
                {actionLoading === "deliver" ? "Delivering..." : hasMilestones ? "Mark order delivered (shipping)" : "Mark as Delivered"}
              </button>
            )}

            {/* Buyer: Approve delivery */}
            {isBuyer && order.status === "delivered" && (
              <>
                <button
                  onClick={() => handleAction("approve")}
                  disabled={actionLoading === "approve"}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all"
                >
                  {actionLoading === "approve" ? "Approving..." : "Approve & Release Payment"}
                </button>
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                >
                  Request Revision
                </button>
              </>
            )}

            {/* Both: Cancel or Dispute */}
            {!["completed", "cancelled", "disputed"].includes(order.status) && (
              <button
                onClick={() => {
                  const reason = prompt("Reason for cancellation:");
                  if (reason) handleAction("cancel", { reason });
                }}
                className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-all"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Grid: Milestones & Timeline */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Milestones */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🎯</span> Milestones
            </h2>
            {order.milestones.length === 0 ? (
              <p className="text-white/40 text-sm">No milestones defined</p>
            ) : (
              <div className="space-y-3">
                {order.milestones.map((m, i) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border ${
                      m.status === "completed" || m.status === "approved"
                        ? "bg-green-500/10 border-green-500/20"
                        : m.status === "in_progress"
                        ? "bg-blue-500/10 border-blue-500/20"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">
                        {i + 1}. {m.title}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        m.status === "completed" || m.status === "approved"
                          ? "bg-green-500/20 text-green-300"
                          : m.status === "in_progress"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-white/10 text-white/50"
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-white/50 text-sm">{m.description}</p>
                    )}
                    {m.amount && (
                      <p className="text-white/40 text-xs mt-1">
                        Amount: {formatCurrency(m.amount, order.currency)}
                      </p>
                    )}
                    {m.due_date && (
                      <p className="text-white/40 text-xs">
                        Due: {formatDate(m.due_date)}
                      </p>
                    )}
                    {m.completed_at && (
                      <p className="text-white/40 text-xs">
                        Completed: {formatDate(m.completed_at)}
                      </p>
                    )}
                    {m.approved_at && (
                      <p className="text-white/40 text-xs">
                        Approved: {formatDate(m.approved_at)}
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap items-center">
                      {m.status === "approved" && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-300 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Paid from Escrow
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap text-sm">
                      {isSeller && !fundingRequired && (m.status === "pending" || m.status === "in_progress") && (
                        <button
                          onClick={() => updateMilestone(m.id, "completed")}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          Mark completed
                        </button>
                      )}
                      {isBuyer && !fundingRequired && m.status === "completed" && (
                        <button
                          onClick={() => updateMilestone(m.id, "approved")}
                          className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white"
                        >
                          Approve & release
                        </button>
                      )}
                      {/* Role hints */}
                      {isBuyer && m.status === "in_progress" && (
                        <span className="text-xs text-white/40">Waiting for seller to mark completed.</span>
                      )}
                      {isSeller && fundingRequired && (
                        <span className="text-xs text-amber-200">Fund escrow first to enable milestone actions.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📋</span> Activity Timeline
            </h2>
            {order.timeline.length === 0 ? (
              <p className="text-white/40 text-sm">No activity yet</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {order.timeline.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                      {TIMELINE_ICONS[event.event_type] || "•"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-sm">
                        {event.event_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </div>
                      <div className="text-white/40 text-xs">
                        {formatDate(event.created_at)}
                      </div>
                      {event.details && Object.keys(event.details).length > 0 && (
                        <div className="text-white/30 text-xs mt-1">
                          {JSON.stringify(event.details)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deliverables */}
        {order.deliverables.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mt-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📎</span> Deliverables
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {order.deliverables.map((d) => (
                <a
                  key={d.id}
                  href={d.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate group-hover:text-violet-300 transition-colors">
                        {d.file_name || "File"}
                      </div>
                      <div className="text-white/40 text-xs">{d.file_type || "Unknown type"}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Revision Modal */}
        {showRevisionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Request Revision</h3>
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Explain what changes you need..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (revisionReason.trim()) {
                      handleAction("request-revision", { reason: revisionReason });
                      setShowRevisionModal(false);
                      setRevisionReason("");
                    }
                  }}
                  disabled={!revisionReason.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 transition-all"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;

