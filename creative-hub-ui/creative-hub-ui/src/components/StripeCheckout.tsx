/**
 * Stripe Payment Checkout Component
 * 
 * This component handles the Stripe Checkout flow:
 * 1. Displays payment button with order details
 * 2. Redirects to Stripe Checkout (hosted page)
 * 3. User returns with session_id in URL
 * 4. We verify with backend
 * 
 * Test Mode Cards:
 * - Success: 4242 4242 4242 4242 (any future expiry, any CVC)
 * - Decline: 4000 0000 0000 0002
 * - Requires Auth: 4000 0025 0000 3155
 * 
 * Stripe Checkout is PCI-compliant hosted checkout - most secure option!
 */

import { useState } from "react";

export interface StripeCheckoutProps {
  escrowId: string;
  checkoutUrl: string;  // URL from backend to redirect to Stripe
  sessionId: string;
  amount: number;  // in rupees/dollars for display
  currency: string;
  onCancel?: () => void;
  className?: string;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  escrowId,
  checkoutUrl,
  sessionId,
  amount,
  currency,
  onCancel,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    setLoading(true);
    // Redirect to Stripe Checkout
    window.location.href = checkoutUrl;
  };

  const formatCurrency = (amt: number, curr: string) => {
    const symbols: Record<string, string> = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    const symbol = symbols[curr.toUpperCase()] || curr;
    return `${symbol}${amt.toLocaleString("en-IN")}`;
  };

  return (
    <div className={`${className}`}>
      {/* Payment Amount Display */}
      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-indigo-300">Amount to Pay</div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(amount, currency)}
            </div>
          </div>
          <div className="text-4xl">💳</div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Redirecting to Checkout...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
              />
            </svg>
            Pay with Card
          </>
        )}
      </button>

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full mt-2 py-2 px-4 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          Cancel
        </button>
      )}

      {/* Security Note */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
        Secured by Stripe
      </div>

      {/* Accepted Cards */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <div className="text-xs text-white/40">Accepts</div>
        <div className="flex gap-2">
          {/* Visa */}
          <div className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">Visa</div>
          {/* Mastercard */}
          <div className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">Mastercard</div>
          {/* Amex */}
          <div className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">Amex</div>
        </div>
      </div>

      {/* Test Mode Banner (only in development) */}
      {import.meta.env.DEV && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs">
          <div className="font-semibold mb-1">🧪 Test Mode</div>
          <div>
            Use test card: <code className="bg-black/30 px-1 rounded">4242 4242 4242 4242</code>
          </div>
          <div>
            Any future expiry, any CVC
          </div>
        </div>
      )}
    </div>
  );
};

export default StripeCheckout;

