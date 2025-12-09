import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";
import { useRef, useCallback } from "react";
import PostModal from "../components/PostModal";
import PostDetailModal from "../components/PostDetailModal";

type Post = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  visibility?: string | null;
  created_as_role?: string | null;
  owner_id?: string | null;
  tags?: string[];
  created_at?: string;
  media_url?: string | null;
};

const FeedPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [, setLiking] = useState<string | null>(null);

  const activeRole = useMemo(() => user?.active_role || user?.roles?.[0] || "CREATOR", [user]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Post[]>("/content/posts");
      setPosts(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry.isIntersecting && !loading) {
        setVisibleCount((prev) => prev + 6);
      }
    },
    [loading]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    });
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [handleIntersect]);

  const handleLike = (postId: string) => {
    setLiking(postId);
    apiClient
      .post(`/content/posts/${postId}/like`, {})
      .catch((err) => {
        console.error("like failed", err);
      })
      .finally(() => setLiking(null));
  };

  const handleComment = (postId: string) => {
    setDetailPostId(postId);
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Sign in to view your feed</h1>
          <p className="text-white/60 text-sm">Your projects and posts will appear here after login.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/50">Welcome back</p>
          <h1 className="text-3xl font-bold">Your Creative Hub</h1>
          <p className="text-white/60 text-sm">
            Share work, requests, and inspiration. Active role: <span className="text-white/80">{activeRole}</span>
          </p>
        </div>

        {/* Create post */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest posts</h2>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-fuchsia-500 transition-all"
          >
            + New post
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading && <span className="text-xs text-white/50">Loading...</span>}
          {posts.length === 0 && !loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              No posts yet. Create one above to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.slice(0, visibleCount).map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{post.created_as_role || "ROLE"}</span>
                    {post.category && <span className="px-2 py-1 rounded-full bg-white/10 text-white/70">{post.category}</span>}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                  {post.description && <p className="text-sm text-white/70 line-clamp-3">{post.description}</p>}
                  <p className="text-xs text-white/60">Author: {post.owner_id || "unknown"}</p>
                  {post.media_url && (
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <img src={post.media_url} alt={post.title} className="w-full h-48 object-cover bg-black/30" />
                    </div>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-white/70">
                      {post.tags.map((t) => (
                        <span key={t} className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-white/50">
                    {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all"
                    >
                      ♥ Like
                    </button>
                    <button
                      onClick={() => handleComment(post.id)}
                      className="text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all"
                    >
                      💬 Comment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={loadMoreRef} className="h-10 w-full" />
        </div>
      </div>
      <PostModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={async () => {
          await fetchPosts();
        }}
      />
      <PostDetailModal postId={detailPostId} onClose={() => setDetailPostId(null)} />
    </div>
  );
};

export default FeedPage;

