import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

type Role = "designer" | "maker" | "tailor" | "customer";

const roleOptions: Role[] = ["designer", "maker", "tailor", "customer"];

interface Props {
  postId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const CollaborationRequestModal = ({ postId, onClose, onSubmitted }: Props) => {
  const [requesterRole, setRequesterRole] = useState<Role>("designer");
  const [targetRole, setTargetRole] = useState<Role>("maker");
  const [message, setMessage] = useState("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingExists, setPendingExists] = useState(false);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await apiClient.get("/collaboration/requests", {
          params: { box: "sent", status: "pending" },
        });
        const items = res.data?.items || res.data || [];
        const match = items.find((r: any) => r.post_id === postId);
        setPendingExists(Boolean(match));
      } catch {
        // ignore
      }
    };
    checkPending();
  }, [postId]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post("/collaboration/requests", {
        source_type: "post",
        post_id: postId,
        requester_role: requesterRole,
        target_role: targetRole,
        message,
        budget_min: budgetMin ? Number(budgetMin) : undefined,
        budget_max: budgetMax ? Number(budgetMax) : undefined,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      console.error("Failed to send request", err);
      alert("Failed to send collaboration request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Collaborate on this post</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white text-sm">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60">Your role</label>
              <select
                value={requesterRole}
                onChange={(e) => setRequesterRole(e.target.value as Role)}
                className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 text-white p-2"
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60">Target role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as Role)}
                className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 text-white p-2"
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 text-white p-2"
              rows={3}
              placeholder="Share context, expectations, timelines..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60">Budget min (optional)</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 text-white p-2"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Budget max (optional)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 text-white p-2"
              />
            </div>
          </div>

          {pendingExists && <div className="text-xs text-amber-400">Pending request already exists for this post.</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white/80 hover:text-white"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || pendingExists}
              className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-50"
            >
              {pendingExists ? "Pending..." : submitting ? "Sending..." : "Send request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationRequestModal;

