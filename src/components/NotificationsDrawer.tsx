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
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

const kindLabel: Record<NotificationKind, string> = {
  collab: "Collab",
  order: "Order",
  message: "Message",
  payment: "Payment",
  system: "Update",
};

const NotificationsDrawer = ({ isOpen, onClose, items, onLoadMore, hasMore, loadingMore }: Props) => {
  if (!isOpen) return null;

  const unreadCount = items.filter((n) => n.status !== "read").length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <button
        aria-label="Close notifications"
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative mt-16 mr-4 w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <div className="text-sm text-slate-500">Notifications</div>
            <div className="text-lg font-semibold text-slate-900">
              {unreadCount ? `${unreadCount} unread` : "All caught up"}
            </div>
          </div>
          <button
            className="text-slate-500 hover:text-slate-900 text-sm px-2 py-1 rounded-lg hover:bg-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No notifications yet.</div>
          ) : (
            items.map((n, idx) => (
              <Fragment key={n.id}>
                <div className="px-4 py-3 flex gap-3 hover:bg-slate-50 transition">
                  <div
                    className={`mt-1 w-2 h-2 rounded-full ${
                      n.status === "read" ? "bg-slate-300" : "bg-orange-500"
                    }`}
                    aria-hidden
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{n.title}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                        {kindLabel[n.kind]}
                      </span>
                      {n.pill && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {n.pill}
                        </span>
                      )}
                    </div>
                    {n.subtitle && <div className="text-sm text-slate-600 mt-0.5">{n.subtitle}</div>}
                    <div className="text-[11px] text-slate-400 mt-1">{n.timestamp}</div>
                  </div>
                </div>
                {idx < items.length - 1 && <div className="h-px bg-slate-100" />}
              </Fragment>
            ))
          )}
          {hasMore && onLoadMore && (
            <div className="p-3">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="w-full px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 text-sm"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDrawer;

