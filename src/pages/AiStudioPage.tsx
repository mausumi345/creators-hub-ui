import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "stability", label: "Stability (SDXL)" },
];

const OPENAI_MODELS = [
  { value: "gpt-image-1", label: "gpt-image-1 (fast, flexible)" },
  { value: "dall-e-3", label: "DALL·E 3 (high quality)" },
];

const STABILITY_MODELS = [{ value: "sdxl-1.0", label: "SDXL 1.0" }];

const OPENAI_SIZES = ["1024x1024", "1024x1792", "1792x1024", "512x512", "256x256"];
const OPENAI_DALLE3_SIZES = ["1024x1024", "1024x1792", "1792x1024"];
const STABILITY_SIZES = [
  "1024x1024",
  "1152x896",
  "896x1152",
  "1216x832",
  "832x1216",
  "1344x768",
  "768x1344",
  "1536x640",
  "640x1536",
];

const AiStudioPage = () => {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState(PROVIDER_OPTIONS[0].value);
  const [model, setModel] = useState(OPENAI_MODELS[0].value);
  const [size, setSize] = useState(OPENAI_SIZES[0]);
  const [useOwnKey, setUseOwnKey] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postVisibility, setPostVisibility] = useState("PUBLIC");
  const [postTags, setPostTags] = useState("");
  const [postPrice, setPostPrice] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem("ai_user_api_key");
    if (stored) setApiKey(stored);
  }, []);

  const canGenerate = useMemo(() => {
    if (!prompt.trim()) return false;
    if (useOwnKey && !apiKey.trim()) return false;
    return true;
  }, [prompt, useOwnKey, apiKey]);

  const saveKey = () => {
    setSavingKey(true);
    localStorage.setItem("ai_user_api_key", apiKey.trim());
    setTimeout(() => setSavingKey(false), 400);
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setRevisedPrompt(null);
    setPostError(null);
    setPostSuccess(null);
    try {
      const payload: Record<string, string> = {
        prompt: prompt.trim(),
        model,
        size,
        provider,
      };
      if (useOwnKey) {
        payload.api_key = apiKey.trim();
      }
      if (inputImage) {
        payload.image_base64 = inputImage;
      }
      const res = await apiClient.post("/content/ai/generate", payload);
      setImageUrl(res.data?.image_url || null);
      setRevisedPrompt(res.data?.revised_prompt || null);
      if (!postTitle.trim()) {
        setPostTitle(prompt.trim() || "AI Design");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 404) {
        setError("AI endpoint not found. Please restart/deploy API Gateway and Content Service.");
      } else if (status === 401 || status === 403) {
        setError("Invalid API key or access denied by provider.");
      } else if (status === 422 && Array.isArray(detail)) {
        const msg = detail
          .map((d: any) => `${(d.loc || []).join(".")}: ${d.msg || "Invalid value"}`)
          .join(" | ");
        setError(msg || "Invalid request data.");
      } else {
        setError(detail || "Failed to generate image.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const postToFeed = async () => {
    if (!isAuthenticated || !user) {
      setPostError("Please login to post this image.");
      return;
    }
    if (!imageUrl) {
      setPostError("Generate an image first.");
      return;
    }
    setPosting(true);
    setPostError(null);
    setPostSuccess(null);
    try {
      await apiClient.post("/content/posts", {
        title: postTitle.trim() || "AI Design",
        description: prompt.trim() || null,
        media_url: imageUrl,
        visibility: postVisibility,
        base_price: postPrice.trim() ? Number(postPrice) : undefined,
        created_as_role: user.active_role || user.roles?.[0] || "CREATOR",
        owner_id: user.id,
        author_name: user.email || user.id,
        is_ai_generated: true,
        tags: postTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setPostSuccess("Posted to feed.");
    } catch (err: any) {
      setPostError(err?.response?.data?.detail || "Failed to post to feed.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 py-8">
      <div className="max-w-6xl mr-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Design Studio</h1>
            <p className="text-sm text-slate-500">
              Generate fashion designs from prompts. Use your own API key and pay the provider directly.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-500">
            Provider: OpenAI
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                placeholder="e.g. Minimalist orange evening gown, silk, studio lighting"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const next = e.target.value;
                    setProvider(next);
                    if (next === "openai") {
                      setModel(OPENAI_MODELS[0].value);
                      setSize(OPENAI_SIZES[0]);
                    } else {
                      setModel(STABILITY_MODELS[0].value);
                      setSize(STABILITY_SIZES[0]);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                >
                  {PROVIDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Model</label>
                <select
                  value={model}
                  onChange={(e) => {
                    const next = e.target.value;
                    setModel(next);
                    if (provider === "openai" && next === "dall-e-3") {
                      if (!OPENAI_DALLE3_SIZES.includes(size)) {
                        setSize(OPENAI_DALLE3_SIZES[0]);
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                >
                  {(provider === "openai" ? OPENAI_MODELS : STABILITY_MODELS).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                >
                  {(provider === "openai"
                    ? model === "dall-e-3"
                      ? OPENAI_DALLE3_SIZES
                      : OPENAI_SIZES
                    : STABILITY_SIZES
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Use your own API key</div>
                  <div className="text-xs text-slate-500">
                    You pay the provider directly. Key is stored only in this browser.
                  </div>
                </div>
                <button
                  onClick={() => setUseOwnKey((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    useOwnKey
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-orange-50"
                  }`}
                >
                  {useOwnKey ? "Enabled" : "Enable"}
                </button>
              </div>

              {useOwnKey && (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                    placeholder="sk-..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Saved locally only.</span>
                    <button
                      onClick={saveKey}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-orange-50"
                    >
                      {savingKey ? "Saved" : "Save key"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900 mb-2">Use an existing image</div>
              <div className="text-xs text-slate-500 mb-3">
                Upload a base image and let the AI modify it (edits). DALL·E 3 does not support edits.
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setInputImage(null);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result;
                    if (typeof result === "string") {
                      setInputImage(result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="text-xs text-slate-500"
              />
              {inputImage && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img src={inputImage} alt="input" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={generate}
              disabled={!canGenerate || generating}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-400 hover:to-amber-400 disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate image"}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-sm font-medium text-slate-900 mb-3">Result</div>
            {imageUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img src={imageUrl} alt="AI result" className="w-full h-96 object-cover bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs text-slate-500">Post title</label>
                  <input
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                    placeholder="AI Design"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Visibility</label>
                    <select
                      value={postVisibility}
                      onChange={(e) => setPostVisibility(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Price (optional)</label>
                    <input
                      value={postPrice}
                      onChange={(e) => setPostPrice(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                      placeholder="499"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tags</label>
                    <input
                      value={postTags}
                      onChange={(e) => setPostTags(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                      placeholder="gown, floral"
                    />
                  </div>
                </div>
                {revisedPrompt && (
                  <div className="text-xs text-slate-500">
                    Revised prompt: <span className="text-slate-700">{revisedPrompt}</span>
                  </div>
                )}
                <div className="text-xs text-slate-500 break-all">{imageUrl}</div>
                {postError && <div className="text-xs text-red-600">{postError}</div>}
                {postSuccess && <div className="text-xs text-emerald-600">{postSuccess}</div>}
                <button
                  onClick={postToFeed}
                  disabled={posting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 disabled:opacity-60"
                >
                  {posting ? "Posting..." : "Post to feed"}
                </button>
              </div>
            ) : (
              <div className="h-96 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-400">
                Your image will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiStudioPage;
