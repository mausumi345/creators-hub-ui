import { useState } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";
import { usePostComments } from "../hooks/usePostComments";
import type { Comment } from "../hooks/usePostComments";

interface PostDetailModalProps {
  postId: string | null;
  onClose: () => void;
}

const PostDetailModal = ({ postId, onClose }: PostDetailModalProps) => {
  const { user } = useAuth();
  const { comments, loading, error, refetch } = usePostComments(postId, { enabled: !!postId });
  const [commentText, setCommentText] = useState("");

  const submitComment = async () => {
    if (!postId || !commentText.trim()) return;
    try {
      await apiClient.post(`/content/posts/${postId}/comments`, {
        text: commentText.trim(),
        user_id: user?.id,
      });
      setCommentText("");
      await refetch();
    } catch (err: any) {
      // leave error handling simple here
    }
  };

  const displayUser = (uid?: string, name?: string | null) => {
    if (user?.id && uid && uid === user.id) return "You";
    if (name) return name;
    return "User";
  };

  const renderComments = (items: Comment[], depth = 0) => {
    return items.map((c) => (
      <div key={c.id} className="border border-white/10 rounded-xl p-3 bg-white/[0.04]" style={{ marginLeft: depth ? 16 : 0 }}>
        <div className="text-xs text-white/50 flex items-center justify-between">
          <span>{displayUser(c.user_id, c.author_name)}</span>
          <span>{c.created_at ? new Date(c.created_at).toLocaleString() : ""}</span>
        </div>
        <p className="text-sm text-white mt-1">{c.is_deleted ? "(deleted)" : c.text}</p>
        {c.replies && c.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {renderComments(c.replies, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (!postId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-black/85 text-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">Post details</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-all"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && <p className="text-white/60 text-sm">Loading...</p>}
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {comments.length === 0 && !loading ? (
            <p className="text-white/60 text-sm">No comments yet.</p>
          ) : (
            <div className="space-y-3">{renderComments(comments)}</div>
          )}
        </div>
        <div className="border-t border-white/10 p-4 space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
            placeholder="Add a comment..."
          />
          <div className="flex justify-end">
            <button
              onClick={submitComment}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-fuchsia-500 transition-all"
            >
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;

