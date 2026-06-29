import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/apiClient";

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const roles: RoleOption[] = [
  {
    id: "CREATOR",
    title: "Creator",
    description: "I design and create original concepts, patterns, and ideas that inspire others.",
    icon: "✨",
  },
  {
    id: "MAKER",
    title: "Maker",
    description: "I bring designs to life through craftsmanship, manufacturing, or production.",
    icon: "🛠️",
  },
  {
    id: "EXPLORER",
    title: "Explorer",
    description: "I'm here to discover, commission, or collaborate on creative projects.",
    icon: "🔍",
  },
];

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/profile/onboarding/role", {
        primary_role: selectedRole,
      });
      navigate("/onboarding/profile");
    } catch (err: unknown) {
      console.error("Role selection failed:", err);
      const axiosError = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Failed to save role. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 text-slate-900 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="h-2 w-16 rounded-full bg-orange-100" />
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold mb-3">How will you use Collabfy?</h1>
            <p className="text-slate-600 text-sm">
              Choose the role that best describes you. You can always change this later.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Role cards */}
          <div className="grid gap-4">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  w-full text-left p-5 rounded-2xl border transition-all duration-200
                  ${
                    selectedRole === role.id
                      ? "border-orange-300 bg-orange-50 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                      : "border-slate-200 bg-white hover:bg-orange-50"
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{role.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{role.title}</h3>
                      {selectedRole === role.id && (
                        <span className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{role.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Continue button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!selectedRole || loading}
              className={`
                px-8 py-3 rounded-2xl font-semibold text-white transition-all duration-200
                ${
                  selectedRole && !loading
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-[0_12px_30px_rgba(249,115,22,0.25)]"
                    : "bg-orange-100 cursor-not-allowed opacity-50 text-orange-700"
                }
              `}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;

