import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";
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
  // tags from backend; use TagOut[]
  tags?: TagOut[];
  created_at?: string;
  media_url?: string | null;
  likes_count?: number;
  liked_by_me?: boolean;
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
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursorCreatedAt, setCursorCreatedAt] = useState<string | null>(null);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [collabPost, setCollabPost] = useState<Post | null>(null);
  const [, setLiking] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const activeRole = useMemo(() => user?.active_role || user?.roles?.[0] || "CREATOR", [user]);
  const PAGE_SIZE = 12;

  const fetchPosts = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE };
      if (!reset && cursorCreatedAt) {
        params.cursor_created_at = cursorCreatedAt;
        if (cursorId) params.cursor_id = cursorId;
      }
      const res = await apiClient.get<Post[]>("/content/posts", { params });
      const data = res.data || [];
      const nextLiked = { ...likedMap };
      data.forEach((p) => {
        if (p.liked_by_me) {
          nextLiked[p.id] = true;
        }
      });
      setLikedMap(nextLiked);
      setPosts((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      const last = data[data.length - 1];
      if (last) {
        setCursorCreatedAt(last.created_at || null);
        setCursorId(last.id || null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setCursorCreatedAt(null);
      setCursorId(null);
      setHasMore(true);
      fetchPosts(true);
    }
  }, [isAuthenticated]);

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
      return <p className="text-xs text-slate-500">Loading comments…</p>;
    }
    if (error) {
      return <p className="text-xs text-red-600">Failed to load comments</p>;
    }
    if (total === 0) {
      return (
        <button
          onClick={() => setDetailPostId(postId)}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          💬 Be the first to comment
        </button>
      );
    }

    return (
      <div className="space-y-1">
        <button
          onClick={() => setDetailPostId(postId)}
          className="text-xs text-slate-600 hover:text-slate-800"
        >
          💬 {total} {total === 1 ? "comment" : "comments"}
        </button>
        {comments.slice(0, 2).map((c) => (
          <div key={c.id} className="text-xs text-slate-500 line-clamp-1">
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
    <div className="min-h-screen text-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">Sign in to view your feed</h1>
        <p className="text-slate-600 text-sm">Your projects and posts will appear here after login.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="max-w-6xl mr-auto py-6 space-y-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">Welcome back</p>
          <h1 className="text-2xl font-semibold">Your Collabfy</h1>
          <p className="text-slate-600 text-sm">
            Share work, requests, and inspiration. Active role: <span className="text-slate-800">{activeRole}</span>
          </p>
        </div>

        {/* Create post */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Latest posts</h2>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-400 hover:to-amber-400 transition-all"
          >
            + New post
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading && <span className="text-xs text-slate-500">Loading...</span>}
          {posts.length === 0 && !loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No posts yet. Create one above to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{post.created_as_role || "ROLE"}</span>
                    {post.category && (
                      <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">{post.title}</h3>
                  {post.description && <p className="text-sm text-slate-600 line-clamp-3">{post.description}</p>}
                  <p className="text-xs text-slate-500">Author: {displayAuthor(post)}</p>
                  {post.media_url && (
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <img src={post.media_url} alt={post.title} className="w-full h-48 object-cover bg-slate-50" />
                    </div>
                  )}
                  <CommentsPreview postId={post.id} />
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      {post.tags.map((t) => (
                        <span
                          key={t.slug}
                          className="px-2 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100 transition-colors"
                        >
                          #{t.name || t.slug}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
                  </div>
                  <LikesPreview postId={post.id} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLikeToggle(post.id)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                        likedMap[post.id]
                          ? "border-orange-300 bg-orange-50 text-orange-700"
                          : "text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-orange-50"
                      }`}
                    >
                      <span className={likedMap[post.id] ? "text-orange-600" : "text-slate-500"}>♥</span>{" "}
                      <span className="text-slate-700">Like</span>{" "}
                      {typeof post.likes_count === "number" ? `(${post.likes_count})` : ""}
                    </button>
                    <button
                      onClick={() => handleComment(post.id)}
                      className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-orange-50 transition-all"
                    >
                      💬 Comment
                    </button>
                    <button
                      onClick={() => setCollabPost(post)}
                      className="text-sm text-orange-700 hover:text-orange-800 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all"
                    >
                      🤝 Collaborate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMore && (
            <button
              onClick={() => fetchPosts(false)}
              disabled={loadingMore}
              className="mx-auto px-4 py-2 rounded-full text-sm bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      </div>
      <PostModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={async () => {
          setCursorCreatedAt(null);
          setCursorId(null);
          setHasMore(true);
          await fetchPosts(true);
        }}
      />
      {collabPost && (
        <CollaborationRequestModal
          post={collabPost}
          onClose={() => setCollabPost(null)}
          onSubmitted={() => {
            setCursorCreatedAt(null);
            setCursorId(null);
            setHasMore(true);
            return fetchPosts(true);
          }}
        />
      )}
      <PostDetailModal postId={detailPostId} onClose={() => setDetailPostId(null)} />
    </div>
  );
};

export default FeedPage;

