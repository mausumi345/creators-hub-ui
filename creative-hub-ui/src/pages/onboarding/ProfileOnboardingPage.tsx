import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "../../lib/apiClient";
import { useAuth } from "../../contexts/AuthContext";

const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Chandigarh",
  "Gurugram",
  "Noida",
  "Kochi",
  "Indore",
  "Bhopal",
  "Nagpur",
  "Visakhapatnam",
];

const ProfileOnboardingPage = () => {
  const [role, setRole] = useState<string | null>(null); // DESIGNER, MAKER, EXPLORER
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [city, setCity] = useState("");
  const [citySelection, setCitySelection] = useState<string>("OTHER");
  const [cityCustom, setCityCustom] = useState<string>("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [creatorStyleTags, setCreatorStyleTags] = useState<string[]>([]);
  const [creatorBio, setCreatorBio] = useState<string>("");
  const [creatorInspiration, setCreatorInspiration] = useState<string>("");
  const [creatorPortfolio, setCreatorPortfolio] = useState<string>("");
  const [creatorExperience, setCreatorExperience] = useState<string>("");
  const [makerStyleTags, setMakerStyleTags] = useState<string[]>([]);
  const [makerBio, setMakerBio] = useState<string>("");
  const [makerPriceRange, setMakerPriceRange] = useState<string>("");
  const [makerCategories, setMakerCategories] = useState<string[]>([]);
  const [explorerStyleTags, setExplorerStyleTags] = useState<string[]>([]);
  const [explorerBio, setExplorerBio] = useState<string>("");
  const [collabCategory, setCollabCategory] = useState<string>("");
  const [creatorCreates, setCreatorCreates] = useState("");
  const [creatorCategories, setCreatorCategories] = useState<string[]>([]);
  const [creatorPriceRange, setCreatorPriceRange] = useState("");
  const [makerServices, setMakerServices] = useState<string[]>([]);
  const [makerDelivery, setMakerDelivery] = useState<string[]>([]);
  const [explorerIntent, setExplorerIntent] = useState<string>("");
  const [makerExperienceYears, setMakerExperienceYears] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
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
  const MAKER_CATEGORY_OPTIONS = ["saree", "blouse", "lehenga", "indo_western", "fusion", "gown"];
  const MAKER_SERVICE_OPTIONS = ["stitching", "embroidery", "alterations", "custom_outfit"];
  const MAKER_DELIVERY_OPTIONS = ["local", "shipping", "pickup"];
  const FABRIC_SERVICE_OPTIONS = [
    "fabric_sourcing",
    "bulk_yardage",
    "swatches",
    "custom_print_dye",
    "trims_notions",
    "embroidery_addon",
    "returns_exchanges",
  ];
  const FABRIC_DELIVERY_OPTIONS = ["shipping", "pickup", "local", "bulk_freight"];
  const FABRIC_CATEGORY_OPTIONS = [
    "cotton",
    "linen",
    "silk",
    "wool",
    "denim",
    "rayon_viscose",
    "blends",
    "stretch_knit",
    "prints_patterns",
    "sustainable_organic",
  ];

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

  const handleRoleSelect = (newRole: string) => {
    setRole(newRole);
    if (newRole === "DESIGNER") {
      setCollabCategory("DESIGNER");
    } else if (newRole === "MAKER") {
      setCollabCategory("");
    } else {
      setCollabCategory("");
    }
  };

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
        const candidate = rawCandidate;

        if (["DESIGNER", "MAKER", "EXPLORER"].includes(candidate)) {
          setRole(candidate);
          if (candidate === "DESIGNER") setCollabCategory("DESIGNER");
        } else {
          setRole(null);
        }

        // Prefill base fields
        if (profile.display_name) setDisplayName(profile.display_name);
        if (profile.handle) setHandle(profile.handle);
        if (profile.bio) setBio(profile.bio);
        if (profile.country_code) setCountryCode(profile.country_code);
        const cpLoc = profile.creator_profile || {};
        const mpLoc = profile.maker_profile || {};
        const resolvedCity = profile.location_city || cpLoc.location_city || mpLoc.location_city || "";
        setCity(resolvedCity);
        const effectiveCountry = profile.country_code || countryCode;
        if (effectiveCountry === "IN") {
          if (INDIAN_CITIES.includes(resolvedCity)) {
            setCitySelection(resolvedCity);
            setCityCustom("");
          } else if (resolvedCity) {
            setCitySelection("OTHER");
            setCityCustom(resolvedCity);
          }
        } else {
          setCitySelection("OTHER");
          setCityCustom(resolvedCity);
        }
        setStateRegion(profile.location_state || cpLoc.location_state || mpLoc.location_state || "");
        setPostalCode(profile.location_postal || cpLoc.location_postal || mpLoc.location_postal || "");
        if (profile.collab_category) setCollabCategory(profile.collab_category);

        // Prefill role-specific fields
        if (candidate === "DESIGNER") {
          const cp = profile.creator_profile || {};
          if (Array.isArray(cp.style_tags)) setCreatorStyleTags(normalizeArray(cp.style_tags));
          if (cp.bio) setCreatorBio(cp.bio);
          if (cp.inspiration) setCreatorInspiration(cp.inspiration);
          if (cp.portfolio_url) setCreatorPortfolio(cp.portfolio_url);
          if (cp.experience) setCreatorExperience(cp.experience);
          if (cp.creates) setCreatorCreates(normalizeSingleToOptions(cp.creates, CREATOR_CREATES_OPTIONS));
          if (Array.isArray(cp.categories))
            setCreatorCategories(normalizeArrayToOptions(cp.categories, CREATOR_CATEGORY_OPTIONS));
          if (cp.price_range) setCreatorPriceRange(normalizeSingleToOptions(cp.price_range, CREATOR_PRICE_OPTIONS));
          setCollabCategory("DESIGNER");
        } else if (candidate === "MAKER") {
          const mp = profile.maker_profile || {};
          if (Array.isArray(mp.style_tags)) setMakerStyleTags(normalizeArray(mp.style_tags));
          if (mp.bio) setMakerBio(mp.bio);
          if (Array.isArray(mp.services))
            setMakerServices(
              normalizeArrayToOptions(
                mp.services,
                collabCategory === "CLOTH_PROVIDER" ? FABRIC_SERVICE_OPTIONS : MAKER_SERVICE_OPTIONS
              )
            );
          if (Array.isArray(mp.delivery))
            setMakerDelivery(
              normalizeArrayToOptions(
                mp.delivery,
                collabCategory === "CLOTH_PROVIDER" ? FABRIC_DELIVERY_OPTIONS : MAKER_DELIVERY_OPTIONS
              )
            );
          if (mp.price_range) setMakerPriceRange(normalizeToken(mp.price_range));
          if (Array.isArray(mp.categories))
            setMakerCategories(
              normalizeArrayToOptions(
                mp.categories,
                collabCategory === "CLOTH_PROVIDER" ? FABRIC_CATEGORY_OPTIONS : MAKER_CATEGORY_OPTIONS
              )
            );
        if (mp.experience_years) setMakerExperienceYears(String(mp.experience_years));
          // keep whatever collab_category is set; limited to maker options in UI
        } else if (candidate === "EXPLORER") {
          const ep = profile.explorer_profile || {};
          if (Array.isArray(ep.style_tags)) setExplorerStyleTags(normalizeArray(ep.style_tags));
          if (ep.bio) setExplorerBio(ep.bio);
          if (ep.intent) setExplorerIntent(ep.intent);
          setCollabCategory("");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setRole(null);
      } finally {
        setProfileLoaded(true);
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

    const activeCity = citySelection === "OTHER" ? cityCustom.trim() : city.trim();
    const stateClean = stateRegion.trim();
    const postalClean = postalCode.trim();
    if (!countryCode || !activeCity || !stateClean || !postalClean) {
      setError("Country, city, state/region, and postal code are required.");
      return;
    }
    if (role === "MAKER" && !collabCategory) {
      setError("Please select your collaboration specialty (Tailor or Fabric provider).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build role-specific profiles
      let creator_profile = null;
      let maker_profile = null;
      let explorer_profile = null;

      if (role === "DESIGNER") {
        creator_profile = {
          creates: creatorCreates || null,
          categories: creatorCategories,
          price_range: creatorPriceRange || null,
          style_tags: creatorStyleTags.length ? creatorStyleTags : null,
          bio: creatorBio || null,
          inspiration: creatorInspiration || null,
          portfolio_url: creatorPortfolio || null,
          experience: creatorExperience || null,
        };
      } else if (role === "MAKER") {
        maker_profile = {
          services: makerServices,
          delivery: makerDelivery,
          style_tags: makerStyleTags.length ? makerStyleTags : null,
          bio: makerBio || null,
          price_range: makerPriceRange || null,
          categories: makerCategories,
          experience_years: makerExperienceYears ? Number(makerExperienceYears) : null,
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
        if (creator_profile && role === "DESIGNER") payload.creator_profile = creator_profile;
        if (maker_profile && role === "MAKER") payload.maker_profile = maker_profile;
        if (explorer_profile && role === "EXPLORER") payload.explorer_profile = explorer_profile;
        if (role === "MAKER" && collabCategory) payload.collab_category = collabCategory;
        await apiClient.patch("/profile/me", payload);
      } else {
        // Add / initial completion: update full profile
        await apiClient.post("/profile/onboarding/basic", {
          display_name: displayName,
          handle: handle,
          bio: bio || null,
          country_code: countryCode.toUpperCase() || null,
          location_city: activeCity,
          location_state: stateClean,
          location_postal: postalClean,
          collab_category:
            role === "DESIGNER"
              ? "DESIGNER"
              : role === "MAKER"
              ? collabCategory || null
              : null,
          creator_profile: creator_profile
            ? {
                ...creator_profile,
                location_city: activeCity,
                location_state: stateClean,
                location_postal: postalClean,
              }
            : creator_profile,
          maker_profile: maker_profile
            ? {
                ...maker_profile,
                location_city: activeCity,
                location_state: stateClean,
                location_postal: postalClean,
              }
            : maker_profile,
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

  if (!profileLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-white/70 text-sm">Loading profile...</div>
      </div>
    );
  }

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
            {/* Role selector (dropdown) */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Choose your primary role
              </label>
              <select
                value={role || ""}
                onChange={(e) => handleRoleSelect(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
              >
                <option value="">Select</option>
                <option value="DESIGNER">Designer (stylists, creative leads)</option>
                <option value="MAKER">Maker (tailor or cloth provider)</option>
                <option value="EXPLORER">Explorer (browsing/engaging)</option>
              </select>
            </div>

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
                disabled={isEditExistingRole}
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

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Country <span className="text-violet-400">*</span>
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
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  City <span className="text-violet-400">*</span>
                </label>
                {countryCode === "IN" ? (
                  <>
                    <select
                      value={citySelection}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCitySelection(val);
                        if (val === "OTHER") {
                          setCity("");
                        } else {
                          setCity(val);
                          setCityCustom("");
                        }
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                    >
                      {INDIAN_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="OTHER">Other (enter manually)</option>
                    </select>
                    {citySelection === "OTHER" && (
                      <input
                        value={cityCustom}
                        onChange={(e) => {
                          setCityCustom(e.target.value);
                          setCity(e.target.value);
                        }}
                        className="mt-3 w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                        placeholder="City name"
                      />
                    )}
                  </>
                ) : (
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                    placeholder="e.g., Mumbai"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  State / Region <span className="text-violet-400">*</span>
                </label>
                <input
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                  placeholder="e.g., Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Postal code <span className="text-violet-400">*</span>
                </label>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                  placeholder="e.g., 400001"
                />
              </div>
            </div>

            {/* Collaboration specialty */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Collaboration specialty <span className="text-violet-400">*</span>
              </label>
              {role === "DESIGNER" && (
                <div className="px-4 py-3 rounded-2xl border border-white/10 bg-black/50 text-white/80">
                  Designer (locked for this role)
                </div>
              )}
              {role === "MAKER" && (
                <select
                  value={collabCategory}
                  required
                  onChange={(e) => setCollabCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                >
                  <option value="">Select one</option>
                  <option value="TAILOR">Tailor</option>
                  <option value="CLOTH_PROVIDER">Fabric provider</option>
                </select>
              )}
              {role === "EXPLORER" && (
                <div className="px-4 py-3 rounded-2xl border border-white/10 bg-black/50 text-white/60">
                  Not applicable for Explorer
                </div>
              )}
            </div>

            {/* Role-specific sections */}
            {role === "DESIGNER" && (
              <div className="space-y-4 border border-white/10 rounded-2xl p-4 bg-white/5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Bio (designer)
                  </label>
                  <textarea
                    value={creatorBio}
                    onChange={(e) => setCreatorBio(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
                    placeholder="Short bio for your designer profile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Style & interests (designer)
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
                    Inspiration / design ethos
                  </label>
                  <textarea
                    value={creatorInspiration}
                    onChange={(e) => setCreatorInspiration(e.target.value)}
                    maxLength={300}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
                    placeholder="What inspires your designs?"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Portfolio URL (optional)
                    </label>
                    <input
                      type="url"
                      value={creatorPortfolio}
                      onChange={(e) => setCreatorPortfolio(e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Experience (optional)
                    </label>
                    <select
                      value={creatorExperience}
                      onChange={(e) => setCreatorExperience(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                    >
                      <option value="">Select</option>
                      <option value="0-1">0-1 yrs</option>
                      <option value="1-3">1-3 yrs</option>
                      <option value="3-5">3-5 yrs</option>
                      <option value="5-10">5-10 yrs</option>
                      <option value="10+">10+ yrs</option>
                    </select>
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
                  {(collabCategory === "CLOTH_PROVIDER" ? FABRIC_SERVICE_OPTIONS : MAKER_SERVICE_OPTIONS).map((svc) => {
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
                    Years of experience (optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={makerExperienceYears}
                    onChange={(e) => setMakerExperienceYears(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-black/50 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Delivery capability
                  </label>
                  <div className="flex flex-wrap gap-2">
                  {(collabCategory === "CLOTH_PROVIDER" ? FABRIC_DELIVERY_OPTIONS : MAKER_DELIVERY_OPTIONS).map((opt) => {
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
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Categories you stitch
                  </label>
                  <div className="flex flex-wrap gap-2">
                  {(collabCategory === "CLOTH_PROVIDER" ? FABRIC_CATEGORY_OPTIONS : MAKER_CATEGORY_OPTIONS).map((cat) => {
                      const selected = makerCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setMakerCategories((prev) =>
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
                    value={makerPriceRange}
                    onChange={(e) => setMakerPriceRange(e.target.value)}
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

