import { Fragment } from "react";

type NotificationKind = "collab" | "order" | "message" | "payment" | "system";

export type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  kind: NotificationKind;
  status?: "unread" | "read";
  timestamp: string;
  pill?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: NotificationItem[];
}

const kindLabel: Record<NotificationKind, string> = {
  collab: "Collab",
  order: "Order",
  message: "Message",
  payment: "Payment",
  system: "Update",
};

const NotificationsDrawer = ({ isOpen, onClose, items }: Props) => {
  if (!isOpen) return null;

  const unreadCount = items.filter((n) => n.status !== "read").length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <button
        aria-label="Close notifications"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative mt-16 mr-4 w-full max-w-md rounded-2xl bg-slate-950/90 border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <div className="text-sm text-white/60">Notifications</div>
            <div className="text-lg font-semibold text-white">
              {unreadCount ? `${unreadCount} unread` : "All caught up"}
            </div>
          </div>
          <button
            className="text-white/60 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/5"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/50 text-sm">No notifications yet.</div>
          ) : (
            items.map((n, idx) => (
              <Fragment key={n.id}>
                <div className="px-4 py-3 flex gap-3 hover:bg-white/5 transition">
                  <div
                    className={`mt-1 w-2 h-2 rounded-full ${
                      n.status === "read" ? "bg-white/20" : "bg-fuchsia-400"
                    }`}
                    aria-hidden
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{n.title}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {kindLabel[n.kind]}
                      </span>
                      {n.pill && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-fuchsia-600/30 text-fuchsia-100">
                          {n.pill}
                        </span>
                      )}
                    </div>
                    {n.subtitle && <div className="text-sm text-white/70 mt-0.5">{n.subtitle}</div>}
                    <div className="text-[11px] text-white/50 mt-1">{n.timestamp}</div>
                  </div>
                </div>
                {idx < items.length - 1 && <div className="h-px bg-white/5" />}
              </Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDrawer;

