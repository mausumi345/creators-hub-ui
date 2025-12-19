import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";

type RequestItem = {
  id: string;
  source_type: string;
  post_id?: string | null;
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
  requester_user_id?: string | null;
  target_user_id?: string | null;
  requester_role?: string | null;
  target_role?: string | null;
  post_id?: string | null;
  source_type?: string | null;
};

const CollaborationPage = () => {
  const [tab, setTab] = useState<"inbox" | "sent" | "active">("inbox");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      if (tab === "active") {
        const res = await apiClient.get("/collaboration/rooms", { params: { status: "active" } });
        setRooms(res.data || []);
      } else {
        const res = await apiClient.get("/collaboration/requests", { params: { box: tab, status: "pending" } });
        const items = res.data?.items || res.data || [];
        setRequests(items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const accept = async (id: string) => {
    setActioning(id);
    try {
      const res = await apiClient.post(`/collaboration/requests/${id}/accept`, {});
      const room = res.data;
      await pollForChat(room.id);
      await load();
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
      await load();
    } finally {
      setActioning(null);
    }
  };

  const cancel = async (id: string) => {
    setActioning(id);
    try {
      await apiClient.post(`/collaboration/requests/${id}/cancel`, {});
      await load();
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">Collaborations</p>
            <h1 className="text-2xl font-bold">Requests & Rooms</h1>
          </div>
        </div>

        <div className="flex gap-2">
          {(["inbox", "sent", "active"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm ${
                tab === t ? "bg-fuchsia-600 text-white" : "bg-white/5 text-white/70"
              }`}
            >
              {t === "inbox" ? "Inbox" : t === "sent" ? "Sent" : "Active"}
            </button>
          ))}
        </div>

        {loading && <div className="text-white/60 text-sm">Loading...</div>}

        {!loading && tab !== "active" && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/60 text-sm">No requests.</div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-white/70">
                    <span>{r.source_type === "post" ? "Post" : "Direct"}</span>
                    <span className="text-white/50">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</span>
                  </div>
                  <div className="text-white">
                    {r.requester_role} → {r.target_role}
                  </div>
                  {r.message && <div className="text-white/80 text-sm">{r.message}</div>}
                  <div className="flex gap-2">
                    {tab === "inbox" ? (
                      <>
                        <button
                          onClick={() => accept(r.id)}
                          disabled={actioning === r.id}
                          className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => decline(r.id)}
                          disabled={actioning === r.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-white/80 hover:text-white text-sm disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => cancel(r.id)}
                        disabled={actioning === r.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-white/80 hover:text-white text-sm disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && tab === "active" && (
          <div className="space-y-3">
            {rooms.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/60 text-sm">No active rooms.</div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Room</span>
                    <span className="text-white/50">{room.post_id ? `Post ${room.post_id.slice(0, 6)}` : ""}</span>
                  </div>
                  <div className="text-white text-sm">
                    {room.requester_role} ↔ {room.target_role}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (room.chat_thread_id) {
                          navigate(`/chat/${room.chat_thread_id}`);
                        } else {
                          pollForChat(room.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm"
                    >
                      Open chat
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationPage;

