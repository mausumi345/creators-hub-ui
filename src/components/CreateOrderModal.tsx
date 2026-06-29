import { useState } from "react";
import { apiClient } from "../lib/apiClient";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
  collabRoomId: string;
  targetUserId: string;
};

const CreateOrderModal = ({ isOpen, onClose, onSuccess, collabRoomId, targetUserId }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Valid amount is required");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/orders", {
        title: title.trim(),
        description: description.trim() || undefined,
        total_amount: parseFloat(amount),
        currency,
        seller_id: targetUserId,
        collab_room_id: collabRoomId,
        due_date: dueDate || undefined,
      });
      
      onSuccess(res.data.id);
      onClose();
      
      // Reset form
      setTitle("");
      setDescription("");
      setAmount("");
      setDueDate("");
    } catch (err: unknown) {
      console.error("Failed to create order:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create order";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-5">
      <div className="ch-modal bg-white border border-slate-200 rounded-none w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-6 py-3 text-white flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-white">Create Order</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Order Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Custom Dress Design"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work to be done..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors resize-none"
            />
          </div>

          {/* Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors"
              />
            </div>
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-slate-700 text-sm">
            💡 After creating, the order will be sent to the seller. Payment will be held in escrow until the work is completed.
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 transition-all"
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;

