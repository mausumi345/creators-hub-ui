import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";
import { useRef, useCallback } from "react";
import PostModal from "../components/PostModal";
import PostDetailModal from "../components/PostDetailModal";
import { usePostComments } from "../hooks/usePostComments";
import CollaborationRequestModal from "../components/CollaborationRequestModal";

type Post = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  visibility?: string | null;
  created_as_role?: string | null;
  owner_id?: string | null;
  author_name?: string | null;
  tags?: string[];
  created_at?: string;
  media_url?: string | null;
  likes_count?: number;
  liked_by_me?: boolean;
  tags?: TagOut[];
};

type LikeInfo = {
  user_id: string;
  user_name?: string | null;
  created_at: string;
};

type TagOut = {
  name: string;
  slug: string;
};

const FeedPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [collabPostId, setCollabPostId] = useState<string | null>(null);
  const [, setLiking] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const activeRole = useMemo(() => user?.active_role || user?.roles?.[0] || "CREATOR", [user]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Post[]>("/content/posts");
      const data = res.data || [];
      const initialLiked: Record<string, boolean> = {};
      data.forEach((p) => {
        if (p.liked_by_me) {
          initialLiked[p.id] = true;
        }
      });
      setLikedMap(initialLiked);
      setPosts(data);
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

  const handleLikeToggle = (postId: string) => {
    const alreadyLiked = likedMap[postId] === true;
    setLiking(postId);

    const request = alreadyLiked
      ? apiClient.delete(`/content/posts/${postId}/like`, { data: {} })
      : apiClient.post(`/content/posts/${postId}/like`, {});

    request
      .catch((err) => {
        console.error("like toggle failed", err);
      })
      .then(() => {
        setLikedMap((prev) => ({ ...prev, [postId]: !alreadyLiked }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likes_count: Math.max(
                    0,
                    (p.likes_count || 0) + (alreadyLiked ? -1 : 1)
                  ),
                }
              : p
          )
        );
      })
      .finally(() => setLiking(null));
  };

  const CommentsPreview = ({ postId }: { postId: string }) => {
    const { comments, total, loading, error, refetch } = usePostComments(postId, { limit: 2, enabled: true });

    useEffect(() => {
      // refetch when modal closes to update preview after new comment
      if (!detailPostId) {
        refetch();
      }
    }, [detailPostId, refetch]);

    if (loading) {
      return <p className="text-xs text-white/50">Loading comments…</p>;
    }
    if (error) {
      return <p className="text-xs text-red-300">Failed to load comments</p>;
    }
    if (total === 0) {
      return (
        <button
          onClick={() => setDetailPostId(postId)}
          className="text-xs text-white/60 hover:text-white"
        >
          💬 Be the first to comment
        </button>
      );
    }

    return (
      <div className="space-y-1">
        <button
          onClick={() => setDetailPostId(postId)}
          className="text-xs text-white/70 hover:text-white"
        >
          💬 {total} {total === 1 ? "comment" : "comments"}
        </button>
        {comments.slice(0, 2).map((c) => (
          <div key={c.id} className="text-xs text-white/60 line-clamp-1">
            {user?.id && c.user_id === user.id ? "You: " : c.author_name ? `${c.author_name}: ` : "User: "}
            {c.text}
          </div>
        ))}
      </div>
    );
  };

  const handleComment = (postId: string) => {
    setDetailPostId(postId);
  };

  const LikesPreview = ({ postId }: { postId: string }) => {
    const [likes, setLikes] = useState<LikeInfo[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
      let cancelled = false;
      const load = async () => {
        try {
          const res = await apiClient.get<LikeInfo[]>(`/content/posts/${postId}/likes`);
          if (!cancelled) {
            setLikes(res.data || []);
          }
        } catch (err) {
          // silent fail; not critical
        } finally {
          if (!cancelled) setLoaded(true);
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }, [postId]);

    if (!loaded || likes.length === 0) return null;

    const names = likes
      .map((l) => l.user_name || l.user_id?.slice(0, 6))
      .filter(Boolean)
      .slice(0, 2);
    const extra = Math.max(0, likes.length - names.length);

    return (
      <div className="text-xs text-white/60">
        Liked by {names.join(", ")}
        {extra > 0 ? ` and ${extra} other${extra === 1 ? "" : "s"}` : ""}
      </div>
    );
  };

  const displayAuthor = (post: Post) => {
    if (post.owner_id && user?.id && post.owner_id === user.id) {
      return user.email || "You";
    }
    return post.author_name || "User";
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
                  <p className="text-xs text-white/60">Author: {displayAuthor(post)}</p>
                  {post.media_url && (
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <img src={post.media_url} alt={post.title} className="w-full h-48 object-cover bg-black/30" />
                    </div>
                  )}
                  <CommentsPreview postId={post.id} />
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-white/70">
                      {post.tags.map((t) => (
                        <span
                          key={t.slug}
                          className="px-2 py-1 rounded-full border border-violet-500/50 bg-violet-600/20 text-violet-100 hover:border-violet-300 hover:bg-violet-500/25 transition-colors"
                        >
                          #{t.name || t.slug}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-white/50">
                    {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
                  </div>
                  <LikesPreview postId={post.id} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLikeToggle(post.id)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                        likedMap[post.id]
                          ? "border-violet-500 bg-violet-500/10 text-white"
                          : "text-white/70 hover:text-white border-white/10 hover:border-white/30 hover:bg-white/5"
                      }`}
                    >
                      <span className={likedMap[post.id] ? "text-violet-300" : "text-white/70"}>♥</span>{" "}
                      <span className="text-white/80">Like</span>{" "}
                      {typeof post.likes_count === "number" ? `(${post.likes_count})` : ""}
                    </button>
                    <button
                      onClick={() => handleComment(post.id)}
                      className="text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all"
                    >
                      💬 Comment
                    </button>
                    <button
                      onClick={() => setCollabPostId(post.id)}
                      className="text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-lg border border-fuchsia-500/60 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 transition-all"
                    >
                      🤝 Collaborate
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
      {collabPostId && (
        <CollaborationRequestModal
          postId={collabPostId}
          onClose={() => setCollabPostId(null)}
          onSubmitted={() => fetchPosts()}
        />
      )}
      <PostDetailModal postId={detailPostId} onClose={() => setDetailPostId(null)} />
    </div>
  );
};

export default FeedPage;

