import { useState, useRef, useEffect } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
}

const PostModal = ({ isOpen, onClose, onCreated }: PostModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setMediaUrl("");
      setCategory("");
      setVisibility("PUBLIC");
      setTags("");
      setError(null);
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setMediaUrl(e.target.result); // data URL preview; backend still receives it as media_url
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        media_url: mediaUrl.trim() || null,
        category: category.trim() || null,
        visibility,
        created_as_role: user?.active_role || user?.roles?.[0] || "CREATOR",
        owner_id: user?.id,
        author_name: user?.email || user?.id,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await apiClient.post("/content/posts", payload);
      if (onCreated) await onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-white/15 bg-black/80 text-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-black/80 z-10">
          <h2 className="text-lg font-semibold">Create a post</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-all"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-white/70 mb-1">Title*</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
              placeholder="Emerald Green Gown"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
              placeholder="Tell us about your post..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-1">Media URL</label>
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-sm text-white/70 mb-1">Upload image (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="text-xs text-white/70"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
                placeholder="gown"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Tags (comma separated)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
                placeholder="gown, emerald, evening"
              />
            </div>
          </div>
          {mediaUrl && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img src={mediaUrl} alt="preview" className="w-full h-48 object-cover bg-black/30" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 sticky bottom-0 bg-black/80 z-10">
          <button
            onClick={onClose}
            className="text-sm text-white/70 hover:text-white px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostModal;

