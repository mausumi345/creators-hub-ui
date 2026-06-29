import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import CollaborationRequestModal from "../components/CollaborationRequestModal";

type RequestItem = {
  id: string;
  source_type: string;
  post_id?: string | null;
  request_title?: string | null;
  requester_user_id: string;
  target_user_id: string;
  requester_role: string;
  target_role: string;
  message?: string | null;
  status: string;
  created_at?: string;
};

type RoomItem = {
  id: string;
  request_id: string;
  status: string;
  chat_thread_id?: string | null;
  request_title?: string | null;
  requester_user_id?: string | null;
  target_user_id?: string | null;
  requester_role?: string | null;
  target_role?: string | null;
  post_id?: string | null;
  source_type?: string | null;
  created_at?: string;
};

const CollaborationPage = () => {
  const [tab, setTab] = useState<"inbox" | "sent" | "active">("inbox");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestCursor, setRequestCursor] = useState<{ created_at: string | null; id: string | null }>({
    created_at: null,
    id: null,
  });
  const [roomCursor, setRoomCursor] = useState<{ created_at: string | null; id: string | null }>({
    created_at: null,
    id: null,
  });
  const [hasMoreRequests, setHasMoreRequests] = useState(true);
  const [hasMoreRooms, setHasMoreRooms] = useState(true);
  const PAGE_SIZE = 20;
  const navigate = useNavigate();

  const load = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      if (tab === "active") {
        const params: Record<string, string | number> = { status: "active", limit: PAGE_SIZE };
        if (!reset && roomCursor.created_at) {
          params.cursor_created_at = roomCursor.created_at;
          if (roomCursor.id) params.cursor_id = roomCursor.id;
        }
        const res = await apiClient.get("/collaboration/rooms", { params });
        const items = res.data || [];
        setRooms((prev) => (reset ? items : [...prev, ...items]));
        setHasMoreRooms(items.length === PAGE_SIZE);
        const last = items[items.length - 1];
        if (last) {
          setRoomCursor({ created_at: last.created_at || null, id: last.id || null });
        }
      } else {
        const params: Record<string, string | number> = { box: tab, status: "pending", limit: PAGE_SIZE };
        if (!reset && requestCursor.created_at) {
          params.cursor_created_at = requestCursor.created_at;
          if (requestCursor.id) params.cursor_id = requestCursor.id;
        }
        const res = await apiClient.get("/collaboration/requests", { params });
        const items = res.data?.items || res.data || [];
        setRequests((prev) => (reset ? items : [...prev, ...items]));
        setHasMoreRequests(items.length === PAGE_SIZE);
        const last = items[items.length - 1];
        if (last) {
          setRequestCursor({ created_at: last.created_at || null, id: last.id || null });
        }
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setRequestCursor({ created_at: null, id: null });
    setRoomCursor({ created_at: null, id: null });
    setHasMoreRequests(true);
    setHasMoreRooms(true);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const accept = async (id: string) => {
    setActioning(id);
    try {
      const res = await apiClient.post(`/collaboration/requests/${id}/accept`, {});
      const room = res.data;
      await pollForChat(room.id);
      await load(true);
    } catch (err) {
      console.error(err);
      alert("Failed to accept");
    } finally {
      setActioning(null);
    }
  };

  const pollForChat = async (roomId: string) => {
    for (let i = 0; i < 5; i++) {
      try {
        const res = await apiClient.get(`/collaboration/rooms/${roomId}`);
        const data = res.data;
        if (data.chat_thread_id) {
          navigate(`/chat/${data.chat_thread_id}`);
          return;
        }
      } catch {
        // ignore
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  const decline = async (id: string) => {
    setActioning(id);
    try {
      await apiClient.post(`/collaboration/requests/${id}/decline`, {});
      await load(true);
    } finally {
      setActioning(null);
    }
  };

  const cancel = async (id: string) => {
    setActioning(id);
    try {
      await apiClient.post(`/collaboration/requests/${id}/cancel`, {});
      await load(true);
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="max-w-6xl mr-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Collaborations</p>
            <h1 className="text-2xl font-bold">Requests & Rooms</h1>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 rounded-full text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400"
          >
            Start collaboration
          </button>
        </div>

        <div className="flex gap-2">
          {(["inbox", "sent", "active"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm ${
                tab === t ? "bg-orange-500 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t === "inbox" ? "Inbox" : t === "sent" ? "Sent" : "Active"}
            </button>
          ))}
        </div>

        {loading && <div className="text-slate-500 text-sm">Loading...</div>}

        {!loading && tab === "inbox" && requests.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>
              <strong>Accepting a request will start the order.</strong> The project details, budget, and deadline from the request will be used to create the order automatically.
              <span className="block text-emerald-600 mt-1">
                If multiple collaborators are invited, each accepted request becomes its own order and escrow. Split budgets by request.
              </span>
            </span>
          </div>
        )}

        {!loading && tab !== "active" && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500 text-sm">No requests.</div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{r.source_type === "post" ? "Post" : "Direct"}</span>
                    <span className="text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <span className="font-semibold">{r.request_title || "Collaboration request"}</span>
                    <span className="text-slate-500 text-xs">{r.requester_role} → {r.target_role}</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        r.status === "accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "declined"
                          ? "bg-rose-100 text-rose-700"
                          : r.status === "cancelled"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.message && <div className="text-slate-700 text-sm">{r.message}</div>}
                  <div className="flex gap-2">
                    {tab === "inbox" ? (
                      <>
                        <button
                          onClick={() => accept(r.id)}
                          disabled={actioning === r.id || r.status !== "pending"}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm disabled:opacity-50"
                        >
                          {r.status === "pending" ? "Accept" : "Accepted"}
                        </button>
                        <button
                          onClick={() => decline(r.id)}
                          disabled={actioning === r.id || r.status !== "pending"}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => cancel(r.id)}
                        disabled={actioning === r.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {hasMoreRequests && (
              <button
                onClick={() => load(false)}
                disabled={loadingMore}
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        )}

        {!loading && tab === "active" && (
          <div className="space-y-3">
            {rooms.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500 text-sm">No active rooms.</div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Room</span>
                    <span className="text-slate-400">{room.post_id ? `Post ${room.post_id.slice(0, 6)}` : ""}</span>
                  </div>
                  <div className="text-slate-900 text-sm font-semibold">{room.request_title || "Room"}</div>
                  <div className="text-slate-600 text-xs">{room.requester_role} ↔ {room.target_role}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (room.chat_thread_id) {
                          navigate(`/chat/${room.chat_thread_id}`);
                        } else {
                          pollForChat(room.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm"
                    >
                      Open chat
                    </button>
                    <button
                      onClick={() => navigate("/orders")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                    >
                      View Orders
                    </button>
                  </div>
                </div>
              ))
            )}
            {hasMoreRooms && (
              <button
                onClick={() => load(false)}
                disabled={loadingMore}
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        )}
      </div>

      {showRequestModal && (
        <CollaborationRequestModal
          onClose={() => setShowRequestModal(false)}
          onSubmitted={load}
        />
      )}
    </div>
  );
};

export default CollaborationPage;

