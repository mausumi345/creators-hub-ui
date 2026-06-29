import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/apiClient";

interface ProfileData {
  user_id: string;
  display_name?: string | null;
  handle?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  primary_role?: string | null;
  country_code?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  location_postal?: string | null;
  style_tags?: string[] | null;
  creator_profile?: Record<string, unknown> | null;
  maker_profile?: Record<string, unknown> | null;
  explorer_profile?: Record<string, unknown> | null;
  roles?: string[] | null;
  active_role?: string | null;
  collab_category?: string | null;
  onboarding_status: string;
  created_at: string;
  updated_at: string;
}

type Post = {
  id: string;
  title: string;
  description?: string | null;
  visibility?: string | null;
  created_at?: string;
  media_url?: string | null;
  likes_count?: number;
};

const UserProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [cursorCreatedAt, setCursorCreatedAt] = useState<string | null>(null);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const PAGE_SIZE = 6;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<ProfileData>("/profile/me");
        setProfile(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const fetchPosts = async (reset = false) => {
    if (!profile?.user_id) return;
    if (reset) {
      setLoadingPosts(true);
    } else {
      setLoadingMorePosts(true);
    }
    setPostsError(null);
    try {
      const params: Record<string, string | number> = {
        owner_id: profile.user_id,
        limit: PAGE_SIZE,
      };
      if (!reset && cursorCreatedAt) {
        params.cursor_created_at = cursorCreatedAt;
        if (cursorId) params.cursor_id = cursorId;
      }
      const res = await apiClient.get<Post[]>("/content/posts", { params });
      const data = res.data || [];
      setPosts((prev) => (reset ? data : [...prev, ...data]));
      setHasMorePosts(data.length === PAGE_SIZE);
      const last = data[data.length - 1];
      if (last) {
        setCursorCreatedAt(last.created_at || null);
        setCursorId(last.id || null);
      }
    } catch (err: any) {
      setPostsError(err?.response?.data?.detail || "Failed to load posts.");
    } finally {
      setLoadingPosts(false);
      setLoadingMorePosts(false);
    }
  };

  useEffect(() => {
    if (!profile?.user_id) return;
    setCursorCreatedAt(null);
    setCursorId(null);
    setHasMorePosts(true);
    fetchPosts(true);
  }, [profile?.user_id]);

  const displayName = profile?.display_name || "Your Profile";
  const handle = profile?.handle ? `@${profile.handle}` : "";
  const role = profile?.primary_role || profile?.active_role || "";
  const location = [profile?.location_city, profile?.location_state].some(Boolean) ? "USA" : "";

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return "";
    const date = new Date(profile.created_at);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }, [profile?.created_at]);

  const styleTags = profile?.style_tags || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-900">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="max-w-6xl mr-auto py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-slate-500">Profile</div>
            <div className="text-2xl font-semibold text-slate-900">{displayName}</div>
            <div className="text-slate-500 mt-1">{handle || "Complete your profile details"}</div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/onboarding/profile"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-orange-50"
            >
              Edit profile
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row gap-6">
              <div className="w-28 h-28 rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-semibold text-slate-400">
                    {(displayName || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-xl font-semibold text-slate-900">{displayName}</div>
                <div className="text-sm text-slate-500">{handle || ""}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {role && (
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700">{role}</span>
                  )}
                  {location && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">📍 {location}</span>
                  )}
                  {memberSince && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">Member since {memberSince}</span>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  {profile?.bio || "Add a short bio so collaborators can understand your style."}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "Active roles", value: (profile?.roles || []).length || 1, sub: "Current access" },
                { label: "Style tags", value: styleTags.length, sub: "Preferences" },
                { label: "Collab category", value: profile?.collab_category || "—", sub: "Primary focus" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-500">{card.label}</div>
                  <div className="text-2xl font-bold mt-1 text-slate-900">{card.value}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-900 mb-3">Style & interests</div>
              {styleTags.length === 0 ? (
                <div className="text-sm text-slate-500">No tags yet. Add tags in your profile setup.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {styleTags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-900">Your posts</div>
                <Link to="/feed" className="text-xs text-orange-600 hover:text-orange-700">
                  View all
                </Link>
              </div>
              {loadingPosts ? (
                <div className="text-sm text-slate-500">Loading posts…</div>
              ) : postsError ? (
                <div className="text-sm text-red-600">{postsError}</div>
              ) : posts.length === 0 ? (
                <div className="text-sm text-slate-500">No posts yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {posts.map((post) => (
                    <div key={post.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                      <div className="h-36 bg-slate-100">
                        {post.media_url ? (
                          <img src={post.media_url} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">{post.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-2">
                          {post.description || "No description provided."}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{post.visibility || "private"}</span>
                          <span>{post.likes_count ? `❤ ${post.likes_count}` : ""}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {hasMorePosts && !loadingPosts && (
                <div className="mt-4">
                  <button
                    onClick={() => fetchPosts(false)}
                    disabled={loadingMorePosts}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-orange-50 disabled:opacity-60"
                  >
                    {loadingMorePosts ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-900 mb-3">Profile details</div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Primary role</div>
                  <div className="text-slate-800 font-semibold">{role || "Not set"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Location</div>
                  <div className="text-slate-800 font-semibold">{location || "Not set"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Onboarding status</div>
                  <div className="text-slate-800 font-semibold">{profile?.onboarding_status || "—"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-900 mb-3">Quick actions</div>
              <div className="space-y-2">
                <Link
                  to="/orders"
                  className="block w-full text-left px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-orange-50"
                >
                  Review orders
                </Link>
                <Link
                  to="/collaboration"
                  className="block w-full text-left px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-orange-50"
                >
                  Manage collaborations
                </Link>
                <Link
                  to="/ai-studio"
                  className="block w-full text-left px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-orange-50"
                >
                  Create AI design
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
