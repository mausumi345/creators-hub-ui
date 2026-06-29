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
  const [mediaError, setMediaError] = useState(false);
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [tags, setTags] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setMediaUrl("");
      setMediaError(false);
      setCategory("");
      setVisibility("PUBLIC");
      setTags("");
      setUseAi(false);
      setAiPrompt("");
      setAiGenerating(false);
      setAiError(null);
      setIsAiGenerated(false);
      setError(null);
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  useEffect(() => {
    setMediaError(false);
  }, [mediaUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setMediaUrl(e.target.result); // data URL preview; backend still receives it as media_url
        setIsAiGenerated(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      setAiError("Please enter a prompt.");
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await apiClient.post("/content/ai/generate", { prompt });
      const url = res.data?.image_url;
      if (!url) {
        setAiError("No image URL returned.");
        return;
      }
      setMediaUrl(url);
      setIsAiGenerated(true);
    } catch (err: any) {
      setAiError(err?.response?.data?.detail || "Failed to generate image.");
    } finally {
      setAiGenerating(false);
    }
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
        is_ai_generated: isAiGenerated,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-5">
      <div className="ch-modal w-full max-w-2xl max-h-[90vh] rounded-none border border-slate-200 bg-white text-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-6 py-3 text-white flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-white">Create a post</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Title*</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
              placeholder="Emerald Green Gown"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
              placeholder="Tell us about your post..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Media URL</label>
              <input
                value={mediaUrl}
                onChange={(e) => {
                  setMediaUrl(e.target.value);
                  setIsAiGenerated(false);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-sm text-slate-600 mb-1">Upload image (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="text-xs text-slate-500"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Generate with AI</div>
                <div className="text-xs text-slate-500">Create a design image from a prompt.</div>
              </div>
              <button
                onClick={() => setUseAi((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  useAi
                    ? "bg-orange-100 text-orange-700 border-orange-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-orange-50"
                }`}
              >
                {useAi ? "Enabled" : "Enable"}
              </button>
            </div>
            {useAi && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                  placeholder="e.g. Minimalist orange evening gown, silk, studio lighting"
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {isAiGenerated ? "Using AI-generated image." : "AI image will replace Media URL."}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={aiGenerating}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-60"
                  >
                    {aiGenerating ? "Generating..." : "Generate image"}
                  </button>
                </div>
                {aiError && (
                  <div className="text-xs text-red-600">{aiError}</div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                placeholder="gown"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Tags (comma separated)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                placeholder="gown, emerald, evening"
              />
            </div>
          </div>
          {mediaUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
              {!mediaError ? (
                <img
                  src={mediaUrl}
                  alt="preview"
                  onError={() => setMediaError(true)}
                  className="w-full h-48 object-cover bg-slate-50"
                />
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-slate-500 bg-slate-50">
                  Preview unavailable. Check the URL or upload an image.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-5 border-t border-slate-200 bg-white">
          <button
            onClick={onClose}
            className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-orange-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostModal;

