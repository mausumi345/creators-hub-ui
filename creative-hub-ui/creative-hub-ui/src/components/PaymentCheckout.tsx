/**
 * Razorpay Payment Checkout Component
 * 
 * This component handles the Razorpay payment flow:
 * 1. Displays payment button with order details
 * 2. Opens Razorpay Checkout when clicked
 * 3. Verifies payment with backend after success
 * 4. Calls onSuccess/onFailure callbacks
 * 
 * Test Mode Cards:
 * - Success: 4111 1111 1111 1111 (any future expiry, any CVV)
 * - Failure: 4000 0000 0000 0002
 * 
 * Test UPI:
 * - Success: success@razorpay
 * - Failure: failure@razorpay
 */

import { useState } from "react";
import { apiClient } from "../lib/apiClient";

// Razorpay checkout options from backend
export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface PaymentCheckoutProps {
  escrowId: string;
  checkoutOptions: RazorpayCheckoutOptions;
  amount: number; // in rupees for display
  onSuccess?: () => void;
  onFailure?: (error: string) => void;
  className?: string;
}

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  escrowId,
  checkoutOptions,
  amount,
  onSuccess,
  onFailure,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const verifyPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => {
    try {
      const response = await apiClient.post("/escrow/verify-payment", {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Payment verification failed");
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay. Please check your internet connection.");
      }

      // Create Razorpay instance
      const options = {
        ...checkoutOptions,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Verify payment with backend
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            onSuccess?.();
          } catch (err: any) {
            setError(err.message);
            onFailure?.(err.message);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        const errorMessage =
          response.error?.description ||
          response.error?.reason ||
          "Payment failed. Please try again.";
        setError(errorMessage);
        onFailure?.(errorMessage);
        setLoading(false);
      });

      razorpay.open();
    } catch (err: any) {
      setError(err.message);
      onFailure?.(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Payment Amount Display */}
      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-emerald-300">Amount to Pay</div>
            <div className="text-2xl font-bold text-white">
              ₹{amount.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="text-4xl">💳</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            Processing...
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
            Pay ₹{amount.toLocaleString("en-IN")}
          </>
        )}
      </button>

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
        Secured by Razorpay
      </div>

      {/* Test Mode Banner (only in development) */}
      {import.meta.env.DEV && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs">
          <div className="font-semibold mb-1">🧪 Test Mode</div>
          <div>
            Use test card: <code className="bg-black/30 px-1 rounded">4111 1111 1111 1111</code>
          </div>
          <div>
            Or test UPI: <code className="bg-black/30 px-1 rounded">success@razorpay</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCheckout;

