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
      <div key={c.id} className="border border-slate-200 rounded-xl p-3 bg-white" style={{ marginLeft: depth ? 16 : 0 }}>
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>{displayUser(c.user_id, c.author_name)}</span>
          <span>{c.created_at ? new Date(c.created_at).toLocaleString() : ""}</span>
        </div>
        <p className="text-sm text-slate-900 mt-1">{c.is_deleted ? "(deleted)" : c.text}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-5">
      <div className="ch-modal w-full max-w-3xl rounded-none border border-slate-200 bg-white text-slate-900 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-6 py-3 text-white flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-white">Post details</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading && <p className="text-slate-500 text-sm">Loading...</p>}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {comments.length === 0 && !loading ? (
            <p className="text-slate-500 text-sm">No comments yet.</p>
          ) : (
            <div className="space-y-3">{renderComments(comments)}</div>
          )}
        </div>
        <div className="border-t border-slate-200 px-6 py-5 space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
            placeholder="Add a comment..."
          />
          <div className="flex justify-end">
            <button
              onClick={submitComment}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-400 hover:to-amber-400 transition-all"
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

