import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

type Role = "designer" | "maker" | "tailor" | "customer";
type CollabMode = "tailor" | "project";
type FulfillmentType = "single" | "bulk";
type PartnerType = "Tailor" | "Fabric Provider" | "Project";

const roleOptions: Role[] = ["designer", "maker", "tailor", "customer"];

interface Candidate {
  id: string;
  name: string;
  role: Role;
  title: string;
  location: string;
  priceTier: "$" | "$$" | "$$$";
  rating: number;
  reviews: number;
  response: string;
  badges: string[];
  avatar?: string;
}

interface Props {
  post: {
    id: string;
    title: string;
    description?: string | null;
  };
  onClose: () => void;
  onSubmitted?: () => void;
}

const garmentTypes = ["Dress", "Blouse", "Suit", "Shirt", "Skirt", "Pants", "Jacket", "Other"];
const fabricTypes = ["Cotton", "Linen", "Silk", "Wool", "Denim", "Synthetic", "Other"];

const parseDdMmYyyyToIso = (value: string) => {
  if (!value) return null;
  const parts = value.trim().split(/[/-]/);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy) return null;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (!day || !month || !year) return null;
  const iso = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return iso;
};

const formatDateIndia = (value: string) => {
  if (!value) return "";
  const iso = parseDdMmYyyyToIso(value) || value; // fall back to raw value if already ISO
  const parsed = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const CollaborationRequestModal = ({ post, onClose, onSubmitted }: Props) => {
  const [requesterRole, setRequesterRole] = useState<Role>("designer");
  const [targetRole, setTargetRole] = useState<Role>("maker");
  const [collabMode, setCollabMode] = useState<CollabMode>("tailor");
  const [rolesNeeded, setRolesNeeded] = useState<string[]>(["Tailor"]);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("single");
  const [quantity, setQuantity] = useState("");
  const [sizeBreakdown, setSizeBreakdown] = useState("");
  const [partnerType, setPartnerType] = useState<PartnerType>("Tailor");
  const [colors, setColors] = useState("");
  const [message, setMessage] = useState("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingExists, setPendingExists] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [garmentType, setGarmentType] = useState("");
  const [fabricType, setFabricType] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [desiredRoleFilter, setDesiredRoleFilter] = useState<"MAKER" | "FABRIC_PROVIDER">("MAKER");
  const [prefilledFromPost, setPrefilledFromPost] = useState(false);

  // lock background scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await apiClient.get("/collaboration/requests", {
          params: { box: "sent", status: "pending" },
        });
        const items = res.data?.items || res.data || [];
        const match = items.find((r: any) => r.post_id === post.id);
        setPendingExists(Boolean(match));
      } catch {
        // ignore
      }
    };
    checkPending();
  }, [post.id]);

  useEffect(() => {
    const loadCandidates = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/profile/search", {
          params: {
            role: "MAKER",
            collab_category: desiredRoleFilter === "FABRIC_PROVIDER" ? "CLOTH_PROVIDER" : "TAILOR",
            limit: 20,
          },
        });
        const items = res.data?.items || [];
        const filtered = items.filter((i: any) => {
          const roles: string[] = i.roles || [];
          const primary = (i.primary_role || "").toUpperCase();
          const collabCat = (i.collab_category || "").toUpperCase().trim();
          if (desiredRoleFilter === "FABRIC_PROVIDER") {
            return collabCat === "CLOTH_PROVIDER";
          }
          // Tailor view: only tailors
          if (collabCat !== "TAILOR") return false;
          return primary === "MAKER" || roles.includes("MAKER");
        });
        const mapped: Candidate[] = filtered.map((i: any) => ({
          id: i.id,
          name: i.display_name || i.handle || i.id,
          role: "maker",
          title:
            (i.collab_category || "").toUpperCase() === "CLOTH_PROVIDER"
              ? "Fabric Provider"
              : (i.collab_category || "").toUpperCase() === "TAILOR"
              ? "Tailor"
              : i.primary_role || "Maker",
          location: i.country_code || "Unknown",
          priceTier: "$$",
          rating: 4.8,
          reviews: 20,
          response: "< 4 hours",
          badges: ["Quality Guaranteed"],
          avatar: i.avatar_url,
        }));
        setCandidates(mapped);
        setSelectedCandidate(mapped[0] || null);
      } catch (err) {
        console.error("Failed to load candidates", err);
      } finally {
        setLoading(false);
      }
    };
    loadCandidates();
  }, [desiredRoleFilter]);

  // Prefill garment type from post title for single-item flows
  useEffect(() => {
    if (!prefilledFromPost && !garmentType && post.title) {
      setGarmentType(post.title);
      setPrefilledFromPost(true);
    }
  }, [prefilledFromPost, garmentType, post.title]);

  const formattedDeliveryDate = formatDateIndia(deliveryDate);

  const buildMessage = () => {
    const rolesLine =
      collabMode === "project" && rolesNeeded.length
        ? `Roles needed: ${rolesNeeded.join(", ")}`
        : `Roles needed: ${partnerType === "Fabric Provider" ? "Fabric Provider" : "Tailor"}`;
    const fulfillmentLine =
      fulfillmentType === "bulk"
        ? `Fulfillment: Bulk, Quantity: ${quantity || "n/a"}${sizeBreakdown ? `, Sizes: ${sizeBreakdown}` : ""}`
        : "Fulfillment: Single item";
    const lines = [
      `Design: ${post.title || post.id}`,
      `Collaboration type: ${collabMode === "tailor" ? "Ask a Tailor" : "Start a Project"}`,
      rolesLine,
      fulfillmentLine,
      message ? `Notes: ${message}` : null,
      garmentType ? `Garment Type: ${garmentType}` : null,
      fabricType ? `Fabric Type: ${fabricType}` : null,
      colors ? `Color(s): ${colors}` : null,
      measurements ? `Measurements/Instructions: ${measurements}` : null,
      deliveryDate ? `Delivery Date (dd/mm/yyyy IST): ${formattedDeliveryDate}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const canContinueStep2 =
    selectedCandidate && !pendingExists;

  const deliveryIso = parseDdMmYyyyToIso(deliveryDate);
  const canContinueStep3 =
    canContinueStep2 &&
    (collabMode === "project" ? garmentType : true) &&
    fabricType &&
    measurements &&
    deliveryIso &&
    budgetMin !== "" &&
    (fulfillmentType === "single" || (fulfillmentType === "bulk" && Number(quantity) > 0));

  const submit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post("/collaboration/requests", {
        source_type: "post",
        post_id: post.id,
        target_user_id: selectedCandidate?.id,
        requester_role: requesterRole,
        target_role: selectedCandidate?.role ?? targetRole,
        message: buildMessage(),
        budget_min: budgetMin ? Number(budgetMin) : undefined,
        budget_max: undefined,
        delivery_date: deliveryIso,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      console.error("Failed to send request", err);
      alert("Failed to send collaboration request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-fuchsia-500/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">
              {partnerType === "Tailor"
                ? "Ask a Tailor"
                : partnerType === "Fabric Provider"
                ? "Request Fabric"
                : "Start a Project"}
            </h3>
            <p className="text-sm text-white/70">Design: {post.title}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-sm">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 text-sm text-white/70">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === s ? "bg-fuchsia-600 text-white" : "bg-white/10 text-white/60"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className="w-10 h-[2px] bg-white/20" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm text-white/70">Select a collaborator to work on this design.</p>
                <p className="text-xs text-white/50">
                  Start a Project: plan a full engagement with both tailoring and fabric sourcing. If you only need one role,
                  pick Tailor or Fabric Provider instead.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/60">Looking for</span>
                <select
                  value={partnerType}
                  onChange={(e) => {
                    const next = e.target.value as PartnerType;
                    setPartnerType(next);
                    if (next === "Project") {
                      setCollabMode("project");
                      setRolesNeeded(["Tailor", "Fabric Provider"]);
                      setDesiredRoleFilter("MAKER"); // start with tailors list
                    } else {
                      setCollabMode("tailor");
                      setRolesNeeded(next === "Tailor" ? ["Tailor"] : ["Fabric Provider"]);
                      setDesiredRoleFilter(next === "Tailor" ? "MAKER" : "FABRIC_PROVIDER");
                    }
                  }}
                  className="rounded-lg bg-slate-900 border border-white/10 text-white px-3 py-2"
                >
                  <option value="Tailor">Tailor</option>
                  <option value="Fabric Provider">Fabric Provider</option>
                  <option value="Project">Start a Project</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
          {(candidates.length ? candidates : []).map((c) => (
                <div
                  key={c.id}
                  className={`rounded-2xl border ${
                    selectedCandidate?.id === c.id ? "border-fuchsia-500/60 bg-fuchsia-600/5" : "border-white/10 bg-white/5"
                  } p-4 flex gap-4`}
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-14 h-14 rounded-full object-cover border border-white/10 bg-white/10"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">{c.name}</div>
                        <div className="text-sm text-fuchsia-200">{c.title}</div>
                      </div>
                      <div className="text-sm text-emerald-300 font-semibold">{c.priceTier}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {c.badges.map((b) => (
                        <span key={b} className="px-2 py-1 rounded-full bg-purple-600/30 text-purple-100 border border-purple-500/50">
                          {b}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-white/70 flex gap-4">
                      <span>⭐ {c.rating} ({c.reviews} reviews)</span>
                      <span>📍 {c.location}</span>
                      <span>⏱ Responds {c.response}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCandidate(c);
                      setTargetRole(c.role);
                    }}
                    className={`self-center px-4 py-2 rounded-lg text-sm font-semibold ${
                      selectedCandidate?.id === c.id ? "bg-fuchsia-600 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {selectedCandidate?.id === c.id ? "Selected" : "Select"}
                  </button>
                </div>
              ))}
              {loading && <div className="text-sm text-white/60">Loading collaborators...</div>}
          {!loading && candidates.length === 0 && (
            <div className="text-sm text-white/60">No makers found. Add makers to the platform to show here.</div>
          )}
            </div>
            {pendingExists && <div className="text-xs text-amber-400">Pending request already exists for this post.</div>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white space-y-3">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <div className="text-sm text-white/60">Selected collaborator</div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-fuchsia-600/40 border border-fuchsia-500/50" />
                    <div>
                      <div className="font-semibold">{selectedCandidate?.name}</div>
                      <div className="text-sm text-white/70">{selectedCandidate?.title}</div>
                    </div>
                  </div>
                </div>
                {partnerType === "Project" && (
                  <div className="space-y-1 text-xs">
                    <div className="text-white/60">Collaboration type</div>
                    <select
                      value={collabMode}
                      onChange={(e) => {
                        const next = e.target.value as CollabMode;
                        setCollabMode(next);
                        if (next === "tailor") {
                          setRolesNeeded(["Tailor"]);
                          setPartnerType("Tailor");
                          setDesiredRoleFilter("MAKER");
                        }
                      }}
                      className="mt-1 rounded-lg bg-slate-900 border border-white/10 text-white px-2 py-1 text-sm"
                    >
                      <option value="project">Tailor + Fabric Provider</option>
                      <option value="tailor">Tailor only</option>
                    </select>
                  </div>
                )}
              </div>

              {collabMode === "project" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  {["Tailor", "Fabric Provider"].map((role) => (
                    <label key={role} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                      <input
                        type="checkbox"
                        checked={rolesNeeded.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRolesNeeded((prev) => Array.from(new Set([...prev, role])));
                          } else {
                            setRolesNeeded((prev) => prev.filter((r) => r !== role));
                          }
                        }}
                      />
                      <span className="text-white/80">{role}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60">Your role</label>
                <select
                  value={requesterRole}
                  onChange={(e) => setRequesterRole(e.target.value as Role)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60">Target role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as Role)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60">
                Garment Type (from post)
              </label>
              <input
                value={garmentType}
                readOnly
                className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2 opacity-90"
                placeholder="Filled from post title"
              />
            </div>

            <div>
              <label className="text-xs text-white/60">Fabric Type *</label>
              <select
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
              >
                <option value="">Select fabric type</option>
                {fabricTypes.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60">Measurements / Notes *</label>
              <textarea
                value={measurements}
                onChange={(e) => setMeasurements(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                rows={3}
                placeholder="e.g., Bust: 36in, Waist: 28in, Hip: 38in or special instructions..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60">Budget *</label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Delivery Date * (dd/mm/yyyy, IST)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={`mt-1 w-full rounded-lg bg-slate-900 border ${deliveryDate && !deliveryIso ? "border-red-500/70" : "border-white/10"} text-white p-2`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60">Color(s)</label>
                <input
                  type="text"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                  placeholder="e.g., Navy; or Red/Blue mix"
                />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60">Fulfillment type</label>
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value as FulfillmentType)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                >
                  <option value="single">Single item</option>
                  <option value="bulk">Bulk</option>
                </select>
              </div>
              {fulfillmentType === "bulk" && (
                <div>
                  <label className="text-xs text-white/60">Quantity (required for bulk)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                  />
                </div>
              )}
            </div>

            {fulfillmentType === "bulk" && (
              <div>
                <label className="text-xs text-white/60">Size & color breakdown (optional)</label>
                <textarea
                  value={sizeBreakdown}
                  onChange={(e) => setSizeBreakdown(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                  rows={2}
                  placeholder="e.g., S/Red:10, M/Red:15, L/Blue:5 or Fabric: Navy 50m, Lining: Ivory 30m"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-white/60">Additional Notes (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2"
                rows={2}
                placeholder="Share context, references, timelines..."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-white">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/60 mb-2">Project Summary</div>
              <div className="space-y-1 text-sm">
                <div><span className="text-white/60">Design:</span> {post.title}</div>
                <div><span className="text-white/60">Tailor:</span> {selectedCandidate?.name}</div>
                <div><span className="text-white/60">Garment Type:</span> {garmentType}</div>
                <div><span className="text-white/60">Fabric Type:</span> {fabricType}</div>
                <div><span className="text-white/60">Budget:</span> {budgetMin || "—"}</div>
                <div><span className="text-white/60">Delivery Date:</span> {formattedDeliveryDate || "—"}</div>
                <div><span className="text-white/60">Notes:</span> {measurements || message || "—"}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => {
              if (step === 1) onClose();
              else setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as 1 | 2 | 3)));
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white/80 hover:text-white"
            disabled={submitting}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="flex gap-3">
            {step < 3 && (
              <button
                onClick={() => {
                  if (step === 1 && canContinueStep2) setStep(2);
                  if (step === 2 && canContinueStep3) setStep(3);
                }}
                disabled={step === 1 ? !canContinueStep2 : !canContinueStep3}
                className="px-5 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-50"
              >
                Continue
              </button>
            )}
            {step === 3 && (
              <button
                onClick={submit}
                disabled={submitting || pendingExists}
                className="px-5 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-50"
              >
                {pendingExists ? "Pending..." : submitting ? "Sending..." : collabMode === "tailor" ? "Send to Tailor" : "Send Project"}
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationRequestModal;

