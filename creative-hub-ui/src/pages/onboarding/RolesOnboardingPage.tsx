import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/apiClient";
import { useAuth } from "../../contexts/AuthContext";

const ROLE_OPTIONS = [
  { id: "DESIGNER", label: "Designer", emoji: "🎨", desc: "I design and create concepts." },
  { id: "MAKER", label: "Maker", emoji: "🧵", desc: "I bring designs to life." },
  { id: "EXPLORER", label: "Explorer", emoji: "🛍️", desc: "I browse, discover, or commission." },
];

const RolesOnboardingPage = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();

  const existingRoles = useMemo(() => (user?.roles ?? []).map((r) => r.toUpperCase()), [user?.roles]);
  const availableRoles = ROLE_OPTIONS.filter((r) => !existingRoles.includes(r.id));

  const toggle = (id: string) => {
    if (existingRoles.includes(id)) return; // already owned
    setSelected((prev) => (prev === id ? null : id));
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/profile/roles", { roles: [selected] });
      await refreshUser();
      navigate(`/onboarding/profile?mode=add-role&role=${encodeURIComponent(selected)}`, {
        replace: true,
        state: { roleForEdit: selected, allowProfileEdit: true },
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(axiosErr?.response?.data?.detail || axiosErr?.message || "Failed to save roles");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (roleId: string) => {
    navigate(`/onboarding/profile?mode=edit-role&role=${encodeURIComponent(roleId)}`, {
      replace: true,
      state: { roleForEdit: roleId, allowProfileEdit: true },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-3">
            <div className="flex items-center gap-2 justify-center">
              <div className="h-2 w-16 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <div className="h-2 w-16 rounded-full bg-white/10" />
              <div className="h-2 w-16 rounded-full bg-white/10" />
            </div>
            <h1 className="text-3xl font-bold">Manage roles</h1>
            <p className="text-white/60 text-sm">
              Add one new role at a time, or edit an existing role’s details. Switch active role from the user menu.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-white/50">Your roles</p>
            {existingRoles.length === 0 ? (
              <div className="text-sm text-white/60">No roles yet.</div>
            ) : (
              <div className="grid gap-2">
                {existingRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleEditRole(r)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-left text-sm text-white/80 hover:border-white/25 hover:bg-white/10 transition-colors"
                  >
                    <span>{r}</span>
                    <span className="text-xs text-white/60">Edit details</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-3">
            {availableRoles.length === 0 && (
              <div className="text-sm text-white/60">
                All roles are already added. Switch active role from the user menu.
              </div>
            )}
            {availableRoles.map((role) => {
              const isSelected = selected === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => toggle(role.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 ${
                    isSelected
                      ? "border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                      : "border-white/10 bg-black/40 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{role.emoji}</span>
                      <div>
                        <div className="font-semibold">{role.label}</div>
                        <div className="text-xs text-white/60">{role.desc}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              className={`px-10 py-3 rounded-2xl font-semibold text-white transition-all duration-150 ${
                selected && !loading
                  ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
                  : "bg-white/10 cursor-not-allowed opacity-60"
              }`}
            >
              {loading ? "Adding..." : "Add role"}
            </button>
            <p className="mt-2 text-xs text-white/50">
              You can switch active roles from the user menu anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesOnboardingPage;

