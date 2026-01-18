import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";

type AccountStatus = {
  stripe_account_id?: string;
  status: string;
  message?: string;
};

const PayoutSetupPage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      setInfo(null);
      try {
        const res = await apiClient.get(`/escrow/connect/account/${user.id}`);
        setAccount(res.data);
        if (res.data?.status === "connect_disabled") {
          setInfo("Stripe Connect is not enabled on this Stripe account. You can continue using platform payouts.");
        }
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        setError(detail || "Failed to load payout account.");
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && isAuthenticated) {
      load();
    } else if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const openOnboarding = async () => {
    if (!user) return;
    setLinkLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await apiClient.post(`/escrow/connect/onboarding-link`, {
        seller_id: user.id,
        email: user.email,
      });
      const url = res.data?.url;
      if (url) {
        window.open(url, "_blank");
      } else {
        setError("No onboarding link returned.");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail && detail.includes("Connect")) {
        setInfo("Stripe Connect is not enabled on this Stripe account. You can continue using platform payouts.");
      } else {
        setError(detail || "Failed to create onboarding link.");
      }
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20 px-4 pb-10">
      <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Payout setup</h1>
            <p className="text-white/50 text-sm">
              Connect your Stripe Express account to receive payouts.
            </p>
          </div>
          <button
            onClick={() => navigate("/orders")}
            className="text-white/60 hover:text-white text-sm"
          >
            ← Back to orders
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
                {error}
              </div>
            )}
            {info && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-100 text-sm">
                {info}
              </div>
            )}

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">Stripe Express account</div>
                  <div className="text-white/60 text-sm mt-1">
                    {account && account.stripe_account_id
                      ? `Account ID: ${account.stripe_account_id}`
                      : "No account yet. We will create one for you."}
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    Status: {account?.status || "not created"}
                  </div>
                </div>
                {account?.status !== "connect_disabled" && (
                  <button
                    onClick={openOnboarding}
                    disabled={linkLoading}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-60"
                  >
                    {linkLoading ? "Opening..." : "Set up payouts"}
                  </button>
                )}
              </div>
              <p className="text-white/40 text-xs mt-2">
                You’ll be redirected to Stripe to complete onboarding. In test mode, use Stripe test data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutSetupPage;

