import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../lib/apiClient";

export interface Comment {
  id: string;
  post_id?: string;
  user_id: string;
  author_name?: string | null;
  text: string;
  created_at?: string;
  replies?: Comment[];
  is_deleted?: boolean;
}

interface CommentListResponse {
  comments: Comment[];
  total: number;
}

export function usePostComments(postId: string | null, options?: { limit?: number; enabled?: boolean }) {
  const { limit, enabled = true } = options || {};
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<CommentListResponse>(`/content/posts/${postId}/comments`, {
        params: limit ? { limit } : {},
      });
      setComments(res.data?.comments || []);
      setTotal(res.data?.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [postId, limit, enabled]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, total, loading, error, refetch: fetchComments };
}

