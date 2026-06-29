import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { API_BASE_URL } from "../lib/config";
import { useAuth } from "../contexts/AuthContext";

type Thread = {
  id: string;
  type: string;
  created_by: string;
  created_at: string;
  last_message_at?: string | null;
  metadata?: Record<string, any>;
  last_message?: Message;
  unread_count?: number;
};

type Message = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  message_type: string;
  body?: string | null;
  payload?: Record<string, any> | null;
  created_at: string;
};

const ChatPage = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadsHasMore, setThreadsHasMore] = useState(true);
  const [threadsCursor, setThreadsCursor] = useState<{ last_message_at: string | null; created_at: string | null; id: string | null }>({
    last_message_at: null,
    created_at: null,
    id: null,
  });
  const [loadingThreadsMore, setLoadingThreadsMore] = useState(false);
  const [messagesHasMore, setMessagesHasMore] = useState(true);
  const [messagesCursor, setMessagesCursor] = useState<{ created_at: string | null; id: string | null }>({
    created_at: null,
    id: null,
  });
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [activeMembers, setActiveMembers] = useState<string[]>([]);
  const [blocking, setBlocking] = useState(false);
  const [threadTitles, setThreadTitles] = useState<Record<string, string>>({});
  const [streamStatus, setStreamStatus] = useState<"connected" | "reconnecting" | "disconnected">("disconnected");
  const streamRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const activeThreadId = threadId || (threads.length > 0 ? threads[0].id : null);
  const THREAD_PAGE_SIZE = 20;
  const MESSAGE_PAGE_SIZE = 50;

  const loadThreads = async (reset = false) => {
    if (reset) {
      setLoadingThreadsMore(false);
    } else {
      setLoadingThreadsMore(true);
    }
    try {
      const params: Record<string, string | number> = { limit: THREAD_PAGE_SIZE };
      if (!reset && threadsCursor.last_message_at) {
        params.cursor_last_message_at = threadsCursor.last_message_at;
        if (threadsCursor.created_at) params.cursor_created_at = threadsCursor.created_at;
        if (threadsCursor.id) params.cursor_id = threadsCursor.id;
      }
      const res = await apiClient.get("/chat/threads", { params });
      const items = res.data?.items || res.data || [];
      setThreads((prev) => (reset ? items : [...prev, ...items]));
      setThreadsHasMore(items.length === THREAD_PAGE_SIZE);
      const last = items[items.length - 1];
      if (last) {
        setThreadsCursor({
          last_message_at: last.last_message_at || last.created_at || null,
          created_at: last.created_at || null,
          id: last.id || null,
        });
      }
    } catch (err) {
      console.error("Failed to load threads", err);
    } finally {
      setLoadingThreadsMore(false);
    }
  };

  useEffect(() => {
    const hydrateTitles = async () => {
      const targets = threads
        .map((t) => ({ id: t.id, roomId: t.metadata?.room_id as string | undefined }))
        .filter((t) => t.roomId && !threadTitles[t.id])
        .slice(0, 20);
      if (targets.length === 0) return;
      try {
        const results = await Promise.all(
          targets.map((t) =>
            apiClient
              .get(`/collaboration/rooms/${t.roomId}`)
              .then((res) => ({ id: t.id, title: res.data?.request_title }))
              .catch(() => ({ id: t.id, title: undefined }))
          )
        );
        setThreadTitles((prev) => {
          const next = { ...prev };
          results.forEach((r) => {
            if (r.title) next[r.id] = r.title;
          });
          return next;
        });
      } catch (e) {
        console.error("Failed to load thread titles", e);
      }
    };
    hydrateTitles();
  }, [threads, threadTitles]);

  const loadMessages = async (id: string, reset = false) => {
    if (reset) {
      setLoadingMsgs(true);
      setLoadError(null);
    } else {
      setLoadingOlder(true);
    }
    try {
      const params: Record<string, string | number> = { limit: MESSAGE_PAGE_SIZE };
      if (!reset && messagesCursor.created_at) {
        params.cursor_created_at = messagesCursor.created_at;
        if (messagesCursor.id) params.cursor_id = messagesCursor.id;
      }
      const res = await apiClient.get(`/chat/threads/${id}/messages`, { params });
      const items: Message[] = res.data || [];
      const ordered = items.slice().reverse();
      setMessages((prev) => (reset ? ordered : [...ordered, ...prev]));
      setMessagesHasMore(items.length === MESSAGE_PAGE_SIZE);
      const last = items[items.length - 1];
      if (last) {
        setMessagesCursor({ created_at: last.created_at || null, id: last.id || null });
      }
    } catch (err) {
      console.error("Failed to load messages", err);
      setLoadError("Unable to load messages. Please retry.");
    } finally {
      setLoadingMsgs(false);
      setLoadingOlder(false);
    }
  };

  const refreshRecentMessages = async (id: string) => {
    try {
      const res = await apiClient.get(`/chat/threads/${id}/messages`, { params: { limit: MESSAGE_PAGE_SIZE } });
      const items: Message[] = res.data || [];
      const ordered = items.slice().reverse();
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const merged = [...prev];
        ordered.forEach((m) => {
          if (!existing.has(m.id)) merged.push(m);
        });
        return merged;
      });
    } catch (err) {
      // silent: polling fallback only
    }
  };

  useEffect(() => {
    setThreadsCursor({ last_message_at: null, created_at: null, id: null });
    setThreadsHasMore(true);
    loadThreads(true);
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      setMessages([]);
      setMessagesCursor({ created_at: null, id: null });
      setMessagesHasMore(true);
      // load thread detail for members
      apiClient
        .get(`/chat/threads/${activeThreadId}`)
        .then((res) => {
          const members = res.data?.members || [];
          setActiveMembers(members.map((m: any) => m.user_id));
        })
        .catch(() => {});

      const timeoutId = window.setTimeout(() => {
        setLoadingMsgs(false);
        if (!messages.length) {
          setLoadError("Messages are taking too long to load. Please retry.");
        }
      }, 8000);
      loadMessages(activeThreadId, true);
      loadThreads(true);

      const connectStream = () => {
        if (!activeThreadId) return;
        if (streamRef.current) {
          streamRef.current.close();
        }
        const src = new EventSource(`${API_BASE_URL}/chat/threads/${activeThreadId}/stream`, { withCredentials: true });
        streamRef.current = src;

        src.onopen = () => {
          setStreamStatus("connected");
          reconnectAttemptsRef.current = 0;
        };

        src.addEventListener("message.created", (evt) => {
          try {
            const data = JSON.parse((evt as MessageEvent).data);
            setMessages((prev) => {
              if (prev.find((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });
            loadThreads(true);
          } catch (e) {
            console.error(e);
          }
        });

        src.onerror = () => {
          setStreamStatus("reconnecting");
          src.close();
          const attempt = Math.min(reconnectAttemptsRef.current + 1, 5);
          reconnectAttemptsRef.current = attempt;
          const delay = Math.min(1000 * 2 ** attempt, 15000);
          if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
          }
          reconnectTimerRef.current = window.setTimeout(() => {
            connectStream();
          }, delay);
        };
      };

      connectStream();

      const pollId = window.setInterval(() => {
        if (!activeThreadId) return;
        if (streamStatus !== "connected") {
          refreshRecentMessages(activeThreadId);
          loadThreads(true);
        }
      }, 20000);

      return () => {
        window.clearTimeout(timeoutId);
        if (streamRef.current) {
          streamRef.current.close();
          streamRef.current = null;
        }
        if (reconnectTimerRef.current) {
          window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        window.clearInterval(pollId);
        setStreamStatus("disconnected");
      };
    }
  }, [activeThreadId]);

  const sendMessage = async () => {
    if (!activeThreadId || !composer.trim()) return;
    try {
      const res = await apiClient.post(`/chat/threads/${activeThreadId}/messages`, {
        message_type: "text",
        body: composer.trim(),
      });
      setComposer("");
      const msg = res.data;
      setMessages((prev) => [...prev, msg]);
      await loadThreads(true);
    } catch (err) {
      console.error("send failed", err);
    }
  };

  const otherUserId = useMemo(() => {
    if (!user?.id) return null;
    return activeMembers.find((m) => m !== user.id) || null;
  }, [activeMembers, user]);

  const blockUser = async () => {
    if (!otherUserId) return;
    setBlocking(true);
    try {
      await apiClient.post(`/profile/blocks/${otherUserId}`);
      alert("User blocked. You will no longer exchange messages.");
    } catch (err) {
      console.error(err);
      alert("Failed to block user");
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-[calc(100vh-80px)]">
        <div className="border-r border-slate-200 bg-white">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Threads</h2>
            <button onClick={() => loadThreads(true)} className="text-xs text-slate-500 hover:text-slate-900">
              Refresh
            </button>
          </div>
          <div className="space-y-1 px-2 overflow-y-auto h-full">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/chat/${t.id}`)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 ${
                  t.id === activeThreadId ? "bg-orange-50 border border-orange-200" : "border border-transparent"
                }`}
              >
                <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                  {threadTitles[t.id] || (t.metadata?.room_id ? `Collab ${String(t.metadata.room_id).slice(0, 6)}` : `Thread ${t.id.slice(0, 8)}`)}
                </div>
                {t.last_message && (
                  <div className="text-xs text-slate-500 line-clamp-1">{t.last_message.body || t.last_message.message_type}</div>
                )}
                {t.unread_count ? <div className="text-[11px] text-orange-600">Unread: {t.unread_count}</div> : null}
              </button>
            ))}
            {threads.length === 0 && <div className="text-sm text-slate-500 px-3 pb-4">No threads yet.</div>}
            {threadsHasMore && (
              <button
                onClick={() => loadThreads(false)}
                disabled={loadingThreadsMore}
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-50"
              >
                {loadingThreadsMore ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div>
              <p className="text-sm text-slate-500">Chat</p>
              <h1 className="text-xl font-semibold text-slate-900">
                {activeThreadId
                  ? threadTitles[activeThreadId] ||
                    (threads.find((t) => t.id === activeThreadId)?.metadata?.room_id
                      ? `Collab ${String(threads.find((t) => t.id === activeThreadId)?.metadata?.room_id).slice(0, 6)}`
                      : `Thread ${activeThreadId.slice(0, 8)}`)
                  : "Select a thread"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${
                streamStatus === "connected"
                  ? "text-emerald-600"
                  : streamStatus === "reconnecting"
                  ? "text-amber-600"
                  : "text-slate-400"
              }`}>
                {streamStatus === "connected" ? "Live" : streamStatus === "reconnecting" ? "Reconnecting…" : "Offline"}
              </span>
            {otherUserId && (
              <button
                onClick={blockUser}
                disabled={blocking}
                className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {blocking ? "Blocking..." : "Block user"}
              </button>
            )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messagesHasMore && activeThreadId && (
              <button
                onClick={() => loadMessages(activeThreadId, false)}
                disabled={loadingOlder}
                className="mx-auto px-3 py-1.5 rounded-lg bg-white text-slate-600 hover:bg-orange-50 border border-slate-200 disabled:opacity-50"
              >
                {loadingOlder ? "Loading..." : "Load older messages"}
              </button>
            )}
            {loadingMsgs && <div className="text-sm text-slate-500">Loading messages…</div>}
            {loadError && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {loadError}
              </div>
            )}
            {!loadingMsgs &&
              messages.map((m) => (
                <div key={m.id} className="flex flex-col gap-1">
                  <div className="text-xs text-slate-400">{new Date(m.created_at).toLocaleTimeString()}</div>
                  <div className="inline-block max-w-xl rounded-xl bg-white px-3 py-2 text-sm text-slate-900 border border-slate-200">
                    {m.body || m.message_type}
                  </div>
                </div>
              ))}
          </div>

          {activeThreadId && (
            <div className="p-4 border-t border-slate-200 flex gap-3 bg-white">
              <input
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="Type a message"
                className="flex-1 rounded-lg bg-white border border-slate-200 text-slate-900 px-3 py-2"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-50"
                disabled={!composer.trim()}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

