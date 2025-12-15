import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "../../lib/apiClient";
import { useAuth } from "../../contexts/AuthContext";

const ProfileOnboardingPage = () => {
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [creatorStyleTags, setCreatorStyleTags] = useState<string[]>([]);
  const [creatorBio, setCreatorBio] = useState<string>("");
  const [makerStyleTags, setMakerStyleTags] = useState<string[]>([]);
  const [makerBio, setMakerBio] = useState<string>("");
  const [explorerStyleTags, setExplorerStyleTags] = useState<string[]>([]);
  const [explorerBio, setExplorerBio] = useState<string>("");
  const [creatorCreates, setCreatorCreates] = useState("");
  const [creatorCategories, setCreatorCategories] = useState<string[]>([]);
  const [creatorPriceRange, setCreatorPriceRange] = useState("");
  const [makerServices, setMakerServices] = useState<string[]>([]);
  const [makerDelivery, setMakerDelivery] = useState<string[]>([]);
  const [explorerIntent, setExplorerIntent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const locationState = location.state as { roleForEdit?: string; allowProfileEdit?: boolean } | null;
  const roleForEdit = locationState?.roleForEdit;
  const searchParams = new URLSearchParams(location.search);
  const roleFromQuery = searchParams.get("role");
  const mode = searchParams.get("mode");
  const isEditExistingRole = mode === "edit-role";

  const CREATOR_CREATES_OPTIONS = ["custom_outfits", "sarees", "blouses", "indo_western", "bridal"];
  const CREATOR_CATEGORY_OPTIONS = ["saree", "blouse", "lehenga", "indo_western", "fusion", "gown"];
  const CREATOR_PRICE_OPTIONS = ["budget", "mid", "premium", "luxury"];

  const normalizeToken = (val: any) =>
    typeof val === "string"
      ? val
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/-+/g, "_")
      : val;

  const normalizeArray = (arr: any, toLower = true) =>
    Array.isArray(arr)
      ? arr.map((v) => {
          const t = toLower ? normalizeToken(v) : v;
          return t;
        })
      : [];

  const normalizeSingleToOptions = (val: any, options: string[]) => {
    const t = normalizeToken(val);
    return options.includes(t) ? t : "";
  };

  const normalizeArrayToOptions = (arr: any, options: string[]) =>
    normalizeArray(arr).filter((v) => options.includes(v));

  // Fetch current profile to get role
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiClient.get("/profile/me");
        const profile = res.data as any;
        const rawCandidate = (
          roleForEdit ||
          roleFromQuery ||
          profile.primary_role ||
          user?.active_role ||
          ""
        )
          .toString()
          .toUpperCase();
        const candidate =
          rawCandidate === "DESIGNER" ? "CREATOR" : rawCandidate;

        if (["CREATOR", "MAKER", "EXPLORER"].includes(candidate)) {
          setRole(candidate);
        } else {
          setRole(null);
        }

        // Prefill base fields
        if (profile.display_name) setDisplayName(profile.display_name);
        if (profile.handle) setHandle(profile.handle);
        if (profile.bio) setBio(profile.bio);
        if (profile.country_code) setCountryCode(profile.country_code);

        // Prefill role-specific fields
        if (candidate === "CREATOR") {
          const cp = profile.creator_profile || {};
          if (Array.isArray(cp.style_tags)) setCreatorStyleTags(normalizeArray(cp.style_tags));
          if (cp.bio) setCreatorBio(cp.bio);
          if (cp.creates) setCreatorCreates(normalizeSingleToOptions(cp.creates, CREATOR_CREATES_OPTIONS));
          if (Array.isArray(cp.categories))
            setCreatorCategories(normalizeArrayToOptions(cp.categories, CREATOR_CATEGORY_OPTIONS));
          if (cp.price_range) setCreatorPriceRange(normalizeSingleToOptions(cp.price_range, CREATOR_PRICE_OPTIONS));
        } else if (candidate === "MAKER") {
          const mp = profile.maker_profile || {};
          if (Array.isArray(mp.style_tags)) setMakerStyleTags(normalizeArray(mp.style_tags));
          if (mp.bio) setMakerBio(mp.bio);
          if (Array.isArray(mp.services)) setMakerServices(normalizeArray(mp.services));
          if (Array.isArray(mp.delivery)) setMakerDelivery(normalizeArray(mp.delivery));
        } else if (candidate === "EXPLORER") {
          const ep = profile.explorer_profile || {};
          if (Array.isArray(ep.style_tags)) setExplorerStyleTags(normalizeArray(ep.style_tags));
          if (ep.bio) setExplorerBio(ep.bio);
          if (ep.intent) setExplorerIntent(ep.intent);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setRole(null);
      }
    };
    loadProfile();
  }, [user?.active_role, roleForEdit, roleFromQuery, mode]);

  // Validate handle format
  const validateHandle = (value: string) => {
    if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
      setHandleError("Handle can only contain letters, numbers, and underscores");
      return false;
    }
    if (value && value.length < 3) {
      setHandleError("Handle must be at least 3 characters");
      return false;
    }
    setHandleError(null);
    return true;
  };

  const handleHandleChange = (value: string) => {
    // Remove @ if user types it
    const cleanValue = value.replace(/^@/, "").toLowerCase();
    setHandle(cleanValue);
    validateHandle(cleanValue);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateHandle(handle)) return;

    setLoading(true);
    setError(null);

    try {
      // Build role-specific profiles
      let creator_profile = null;
      let maker_profile = null;
      let explorer_profile = null;

      if (role === "CREATOR" || role === "DESIGNER") {
        creator_profile = {
          creates: creatorCreates || null,
          categories: creatorCategories,
          price_range: creatorPriceRange || null,
          style_tags: creatorStyleTags.length ? creatorStyleTags : null,
          bio: creatorBio || null,
        };
      } else if (role === "MAKER") {
        maker_profile = {
          services: makerServices,
          delivery: makerDelivery,
          style_tags: makerStyleTags.length ? makerStyleTags : null,
          bio: makerBio || null,
        };
      } else if (role === "EXPLORER") {
        explorer_profile = {
          intent: explorerIntent || null,
          style_tags: explorerStyleTags.length ? explorerStyleTags : null,
          bio: explorerBio || null,
        };
      }

      if (isEditExistingRole) {
        // Edit existing role: only update the current role profile; do not overwrite others.
        const payload: any = {};
        if (creator_profile && role === "CREATOR") payload.creator_profile = creator_profile;
        if (maker_profile && role === "MAKER") payload.maker_profile = maker_profile;
        if (explorer_profile && role === "EXPLORER") payload.explorer_profile = explorer_profile;
        await apiClient.patch("/profile/me", payload);
      } else {
        // Add / initial completion: update full profile
        await apiClient.post("/profile/onboarding/basic", {
          display_name: displayName,
          handle: handle,
          bio: bio || null,
          country_code: countryCode.toUpperCase() || null,
          creator_profile,
          maker_profile,
          explorer_profile,
        });
      }

      // Navigate to feed/dashboard
      navigate("/feed", { replace: true });
    } catch (err: unknown) {
      console.error("Profile save failed:", err);
      const axiosError = err as { response?: { data?: { detail?: string } }; message?: string };
      const detail = axiosError?.response?.data?.detail || "";
      
      if (detail.toLowerCase().includes("handle")) {
        setHandleError(detail);
      } else {
        setError(
          detail ||
          axiosError?.message ||
          "Failed to save profile. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">Complete your profile</h1>
            <p className="text-white/60 text-sm">
              Tell us a bit about yourself. This helps others find and connect with you.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Display Name <span className="text-violet-400">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={128}
                placeholder="Jane Designer"
                disabled={isEditExistingRole || !!displayName}
                className={`w-full px-4 py-3 rounded-2xl border bg-black/50 text-white placeholder:text-white/30 focus:outline-none transition-colors ${
                  isEditExistingRole || !!displayName
                    ? "border-white/10 text-white/60 cursor-not-allowed"
                    : "border-white/15 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                }`}
              />
              {(isEditExistingRole || !!displayName) && (
                <p className="mt-1 text-xs text-white/50">Display name is locked after creation.</p>
              )}
            </div>

            {/* Handle */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Handle <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">@</span>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  maxLength={64}
                  placeholder="janedesigns"
                  className={`w-full pl-8 pr-4 py-3 rounded-2xl border bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 transition-colors ${
                    handleError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : "border-white/15 focus:border-violet-500 focus:ring-violet-500/50"
                  }`}
                />
              </div>
              {handleError && (
                <p className="mt-2 text-sm text-red-400">{handleError}</p>
              )}
              <p className="mt-2 text-xs text-white/40">
                Your unique identifier. Only letters, numbers, and underscores.
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell us about yourself, your style, and what you create..."
                className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
              />
              <p className="mt-1 text-xs text-white/40 text-right">{bio.length}/500</p>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>

            {/* Role-specific sections */}
            {role === "CREATOR" && (
              <div className="space-y-4 border border-white/10 rounded-2xl p-4 bg-white/5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Bio (creator)
                  </label>
                  <textarea
                    value={creatorBio}
                    onChange={(e) => setCreatorBio(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
                    placeholder="Short bio for your creator profile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Style & interests (creator)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["minimalist", "sustainable", "streetwear", "ethnic", "formal", "casual", "luxury"].map((tag) => {
                      const selected = creatorStyleTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setCreatorStyleTags((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                            )
                          }
                          className={`px-3 py-2 text-sm rounded-full border ${
                            selected
                              ? "border-violet-500 bg-violet-500/15"
                              : "border-white/15 bg-black/40 hover:border-white/30"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    What do you create?
                  </label>
                  <select
                    value={creatorCreates}
                    onChange={(e) => setCreatorCreates(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="custom_outfits">Custom outfits</option>
                    <option value="sarees">Sarees</option>
                    <option value="blouses">Blouses</option>
                    <option value="indo_western">Indo-western</option>
                    <option value="bridal">Bridal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Categories you design
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["saree", "blouse", "lehenga", "indo_western", "fusion", "gown"].map((cat) => {
                      const selected = creatorCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setCreatorCategories((prev) =>
                              prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                            )
                          }
                          className={`px-3 py-2 text-sm rounded-full border ${
                            selected
                              ? "border-violet-500 bg-violet-500/15"
                              : "border-white/15 bg-black/40 hover:border-white/30"
                          }`}
                        >
                          {cat.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Price range (optional)
                  </label>
                  <select
                    value={creatorPriceRange}
                    onChange={(e) => setCreatorPriceRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="budget">₹1,000 - ₹3,000</option>
                    <option value="mid">₹3,000 - ₹8,000</option>
                    <option value="premium">₹8,000 - ₹20,000</option>
                    <option value="luxury">₹20,000+</option>
                  </select>
                </div>
              </div>
            )}

            {role === "MAKER" && (
              <div className="space-y-4 border border-white/10 rounded-2xl p-4 bg-white/5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Bio (maker)
                  </label>
                  <textarea
                    value={makerBio}
                    onChange={(e) => setMakerBio(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
                    placeholder="Short bio for your maker profile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Style & interests (maker)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["minimalist", "sustainable", "streetwear", "ethnic", "formal", "casual", "luxury"].map((tag) => {
                      const selected = makerStyleTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setMakerStyleTags((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                            )
                          }
                          className={`px-3 py-2 text-sm rounded-full border ${
                            selected
                              ? "border-violet-500 bg-violet-500/15"
                              : "border-white/15 bg-black/40 hover:border-white/30"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white">Maker: Services</h3>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Services you provide
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["stitching", "embroidery", "alterations", "custom_outfit"].map((svc) => {
                      const selected = makerServices.includes(svc);
                      return (
                        <button
                          key={svc}
                          type="button"
                          onClick={() => {
                            setMakerServices((prev) =>
                              prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
                            );
                          }}
                          className={`px-3 py-2 text-sm rounded-full border ${
                            selected
                              ? "border-violet-500 bg-violet-500/15"
                              : "border-white/15 bg-black/40 hover:border-white/30"
                          }`}
                        >
                          {svc.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Delivery capability
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["local", "shipping", "pickup"].map((opt) => {
                      const selected = makerDelivery.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setMakerDelivery((prev) =>
                              prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]
                            );
                          }}
                          className={`px-3 py-2 text-sm rounded-full border ${
                            selected
                              ? "border-violet-500 bg-violet-500/15"
                              : "border-white/15 bg-black/40 hover:border-white/30"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {role === "EXPLORER" && (
              <div className="space-y-4 border border-white/10 rounded-2xl p-4 bg-white/5">
                <h3 className="text-sm font-semibold text-white">Explorer: What are you looking for?</h3>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Bio (explorer)
                  </label>
                  <textarea
                    value={explorerBio}
                    onChange={(e) => setExplorerBio(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
                    placeholder="Short bio for your explorer profile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Style & interests (explorer)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["minimalist", "sustainable", "streetwear", "ethnic", "formal", "casual", "luxury"].map((tag) => {
                      const selected = explorerStyleTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setExplorerStyleTags((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                            )
                          }
                          className={`px-3 py-2 text-sm rounded-full border ${
                            selected
                              ? "border-violet-500 bg-violet-500/15"
                              : "border-white/15 bg-black/40 hover:border-white/30"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "inspiration", label: "Inspiration" },
                    { id: "buy", label: "Buy outfits" },
                    { id: "tailoring", label: "Tailoring help" },
                    { id: "styling", label: "Personal styling" },
                  ].map((opt) => {
                    const selected = explorerIntent === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setExplorerIntent(opt.id)}
                        className={`px-3 py-2 text-sm rounded-full border ${
                          selected
                            ? "border-violet-500 bg-violet-500/15"
                            : "border-white/15 bg-black/40 hover:border-white/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate("/onboarding/role")}
                className="px-6 py-3 rounded-2xl font-medium text-white/70 border border-white/15 hover:border-white/30 hover:text-white transition-colors"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={!displayName || !handle || loading || !!handleError}
                className={`
                  px-8 py-3 rounded-2xl font-semibold text-white transition-all duration-200
                  ${
                    displayName && handle && !loading && !handleError
                      ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                      : "bg-white/10 cursor-not-allowed opacity-50"
                  }
                `}
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboardingPage;

