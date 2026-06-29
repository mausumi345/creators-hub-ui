import { useState, useEffect, useMemo } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";

type Role = "designer" | "maker" | "tailor" | "customer";
type CollabMode = "tailor" | "project";
type FulfillmentType = "single" | "bulk";
type PartnerType = "Tailor" | "Fabric Provider" | "Designer" | "Project";
type DesiredRoleFilter = "MAKER" | "FABRIC_PROVIDER" | "BOTH" | "DESIGNER";

const roleOptions: Role[] = ["designer", "maker", "tailor", "customer"];

interface Candidate {
  id: string;
  name: string;
  role: Role;
  title: string;
  collabCategory?: string;
  location: string;
  priceTier: "$" | "$$" | "$$$";
  rating: number;
  reviews: number;
  response: string;
  badges: string[];
  avatar?: string;
}

interface Props {
  post?: {
    id: string;
    title: string;
    description?: string | null;
    budget_min?: number;
    budget_max?: number;
    currency_code?: string;
  };
  onClose: () => void;
  onSubmitted?: () => void;
}

const fabricTypes = ["Cotton", "Linen", "Silk", "Wool", "Denim", "Synthetic", "Other"];

type MilestoneRow = {
  title: string;
  amount: number;
  due_date?: string;
};

const TEMPLATE_OPTIONS = [
  {
    id: "default_3",
    label: "Design → Delivery (3 steps)",
    steps: [
      { title: "Concept & Sketch", percent: 30 },
      { title: "Final Design & Specs", percent: 40 },
      { title: "Final Delivery & Handover", percent: 30 },
    ],
  },
  {
    id: "proto_4",
    label: "Prototype → Production (4 steps)",
    steps: [
      { title: "Requirements & BOM", percent: 20 },
      { title: "Prototype Build", percent: 30 },
      { title: "Revisions & QA", percent: 25 },
      { title: "Final Production/Delivery", percent: 25 },
    ],
  },
  {
    id: "simple_2",
    label: "Simple Project (2 steps)",
    steps: [
      { title: "Kickoff & Plan", percent: 40 },
      { title: "Final Delivery", percent: 60 },
    ],
  },
];

const TITLE_OPTIONS = [
  "Concept & Sketch",
  "Final Design & Specs",
  "Final Delivery & Handover",
  "Requirements & BOM",
  "Prototype Build",
  "Revisions & QA",
  "Final Production/Delivery",
  "Kickoff & Plan",
  "Final Delivery",
];

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

const formatDateUs = (value: string) => {
  if (!value) return "";
  try {
    const iso = parseDdMmYyyyToIso(value) || value; // fall back to raw value if already ISO
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).format(parsed);
  } catch {
    return value;
  }
};

const CollaborationRequestModal = ({ post, onClose, onSubmitted }: Props) => {
  const { user } = useAuth();
  const postId = post?.id;
  const postTitle = post?.title || "Direct collaboration";
  const isDirect = !postId;
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
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [requestTitle, setRequestTitle] = useState(post?.title || "");
  const [garmentType, setGarmentType] = useState("");
  const [uploadUrls, setUploadUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fabricType, setFabricType] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [desiredRoleFilter, setDesiredRoleFilter] = useState<DesiredRoleFilter>("MAKER");
  const [prefilledFromPost, setPrefilledFromPost] = useState(false);
  const [milestoneTemplate, setMilestoneTemplate] = useState<string>("default_3");
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [candidateOffset, setCandidateOffset] = useState(0);
  const [candidatesHasMore, setCandidatesHasMore] = useState(true);
  const [candidatesLoadingMore, setCandidatesLoadingMore] = useState(false);
  const CANDIDATE_PAGE_SIZE = 30;
  const isProjectMode = collabMode === "project" || partnerType === "Project";
  const upperRoles = (user?.roles || []).map((r) => String(r).toUpperCase());
  const primaryRole = (user?.active_role || "").toUpperCase();
  const isDesignerUser =
    primaryRole === "CREATOR" ||
    primaryRole === "DESIGNER" ||
    upperRoles.includes("CREATOR") ||
    upperRoles.includes("DESIGNER");
  const isMakerUser = !isDesignerUser && upperRoles.includes("MAKER");

  // If logged-in user is a tailor, default to collaborating with designers
  useEffect(() => {
    if (isDesignerUser) {
      setPartnerType("Tailor");
      setCollabMode("tailor");
      setRolesNeeded(["Tailor"]);
      setDesiredRoleFilter("MAKER");
    } else {
      // Maker (including fabric provider): show designers/fabric providers, default Designer
      setPartnerType("Designer");
      setCollabMode("tailor");
      setRolesNeeded(["Designer"]);
      setDesiredRoleFilter("DESIGNER");
    }
  }, [isDesignerUser, isMakerUser]);

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
          params: { box: "sent" },
        });
        const items = res.data?.items || res.data || [];
        if (!postId) {
          setPendingExists(false);
          return;
        }
        const match = items.find(
          (r: any) =>
            r.post_id === postId &&
            (r.status || "").toLowerCase() === "pending"
        );
        setPendingExists(Boolean(match));
      } catch {
        // ignore
      }
    };
    checkPending();
  }, [postId]);

  // Prefill budget from post if available
  useEffect(() => {
    if (!prefilledFromPost) {
      if (post?.budget_min) setBudgetMin(String(post.budget_min));
      setPrefilledFromPost(true);
    }
  }, [post, prefilledFromPost]);

  const currencyCode = useMemo(() => post?.currency_code || "USD", [post?.currency_code]);
  const totalBudget = useMemo(() => {
    const val = Number(budgetMin || "0");
    return Number.isNaN(val) ? 0 : val;
  }, [budgetMin]);

  // Auto-apply template when budget or template changes
  useEffect(() => {
    if (totalBudget > 0 && milestoneTemplate) {
      const template = TEMPLATE_OPTIONS.find((t) => t.id === milestoneTemplate);
      if (template) {
        const rows = template.steps.map((s) => {
          const amt = s.percent ? Math.round((totalBudget * s.percent) / 100) : 0;
          return { title: s.title, amount: amt, due_date: "" };
        });
        setMilestones(rows);
      }
    }
  }, [totalBudget, milestoneTemplate]);

  const loadCandidates = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setCandidatesLoadingMore(true);
    }
    try {
      const nextOffset = reset ? 0 : candidateOffset;
      const res = await apiClient.get("/profile/search", { params: { limit: CANDIDATE_PAGE_SIZE, offset: nextOffset } });
      let items: any[] = res.data?.items || [];
      const seen = new Set<string>();
      items = items.filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });

      let filtered = items.filter((i: any) => {
        const collabCat = (i.collab_category || "").toUpperCase().trim();
        const primary = (i.primary_role || "").toUpperCase().trim();
        const rolesUpper = (i.roles || []).map((r: string) => r.toUpperCase());
        const isDesigner =
          primary === "DESIGNER" ||
          primary === "CREATOR" ||
          collabCat === "DESIGNER" ||
          rolesUpper.includes("CREATOR") ||
          rolesUpper.includes("DESIGNER");

        if (partnerType === "Designer") {
          return isDesigner;
        }
        if (partnerType === "Fabric Provider") {
          return collabCat === "CLOTH_PROVIDER" || collabCat === "FABRIC_PROVIDER";
        }
        if (partnerType === "Tailor") {
          return collabCat === "TAILOR";
        }
        // Project
        if (isDesignerUser) {
          // Designer login: show tailors + fabric providers
          return collabCat === "TAILOR" || collabCat === "CLOTH_PROVIDER" || collabCat === "FABRIC_PROVIDER";
        }
        if (isMakerUser) {
          // Maker login (including fabric provider): show designers + fabric providers + tailors
          return isDesigner || collabCat === "CLOTH_PROVIDER" || collabCat === "FABRIC_PROVIDER" || collabCat === "TAILOR";
        }
        // Default: designers + tailors
        return isDesigner || collabCat === "TAILOR";
      });

      if (filtered.length === 0) {
        filtered = items;
      }

      const mapped: Candidate[] = filtered.map((i: any) => {
        const collabCat = (i.collab_category || "").toUpperCase().trim();
        const primary = (i.primary_role || "").toUpperCase().trim();
        const rolesUpper = (i.roles || []).map((r: string) => r.toUpperCase());
        const isDesigner =
          primary === "DESIGNER" ||
          primary === "CREATOR" ||
          collabCat === "DESIGNER" ||
          rolesUpper.includes("CREATOR") ||
          rolesUpper.includes("DESIGNER");
        return {
          id: i.id,
          name: i.display_name || i.handle || i.id,
          role: isDesigner ? "designer" : collabCat === "CLOTH_PROVIDER" ? "maker" : "tailor",
          title: isDesigner
            ? "Designer"
            : collabCat === "CLOTH_PROVIDER"
            ? "Fabric Provider"
            : collabCat === "TAILOR"
            ? "Tailor"
            : i.primary_role || "Maker",
          collabCategory: collabCat || undefined,
          location: i.country_code || "Unknown",
          priceTier: "$$",
          rating: 4.8,
          reviews: 20,
          response: "< 4 hours",
          badges: ["Quality Guaranteed"],
          avatar: i.avatar_url,
        };
      });
      setCandidates((prev) => (reset ? mapped : [...prev, ...mapped]));
      setCandidatesHasMore(items.length === CANDIDATE_PAGE_SIZE);
      setCandidateOffset(nextOffset + CANDIDATE_PAGE_SIZE);
      if (reset) {
        setSelectedCandidates((prev) => {
          if (isProjectMode) {
            const prevIds = new Set(prev.map((p) => p.id));
            return mapped.filter((m) => prevIds.has(m.id));
          }
          return mapped[0] ? [mapped[0]] : [];
        });
      }
    } catch (err) {
      console.error("Failed to load candidates", err);
    } finally {
      setLoading(false);
      setCandidatesLoadingMore(false);
    }
  };

  useEffect(() => {
    setCandidateOffset(0);
    setCandidatesHasMore(true);
    loadCandidates(true);
  }, [desiredRoleFilter, isProjectMode, partnerType]);

  // Prefill garment type from post title for single-item flows
  useEffect(() => {
    if (!prefilledFromPost && !garmentType && post?.title) {
      setGarmentType(post.title);
      if (!requestTitle) {
        setRequestTitle(post.title);
      }
      setPrefilledFromPost(true);
    }
  }, [prefilledFromPost, garmentType, post?.title, requestTitle]);

  const formattedDeliveryDate = formatDateUs(deliveryDate);
  const selectedPrimary = selectedCandidates[0] || null;
  const hasSelection = selectedCandidates.length > 0;

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
      `Request: ${requestTitle || postTitle}`,
      !isDirect ? `Design: ${postTitle}` : null,
      `Collaboration type: ${collabMode === "tailor" ? "Ask a Tailor" : "Start a Project"}`,
      rolesLine,
      fulfillmentLine,
      message ? `Notes: ${message}` : null,
      garmentType ? `Garment Type: ${garmentType}` : null,
      uploadUrls.length ? `Reference uploads: ${uploadUrls.join(", ")}` : null,
      fabricType ? `Fabric Type: ${fabricType}` : null,
      colors ? `Color(s): ${colors}` : null,
      measurements ? `Measurements/Instructions: ${measurements}` : null,
      deliveryDate ? `Delivery Date: ${formattedDeliveryDate}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const handleS3Uploads = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const presign = await apiClient.post("/collaboration/uploads/presign", {
          filename: file.name,
          content_type: file.type || "application/octet-stream",
        });
        const { upload_url, public_url } = presign.data || {};
        if (!upload_url || !public_url) {
          throw new Error("Upload URL missing");
        }
        await fetch(upload_url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });
        setUploadUrls((prev) => Array.from(new Set([...prev, public_url])));
      }
    } catch (e) {
      console.error(e);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const canContinueStep2 = hasSelection && !pendingExists;

  const deliveryIso = parseDdMmYyyyToIso(deliveryDate) || deliveryDate;
  const canContinueStep3 =
    canContinueStep2 &&
    ((collabMode === "project" || isDirect) ? garmentType : true) &&
    fabricType &&
    measurements &&
    deliveryIso &&
    budgetMin !== "" &&
    (fulfillmentType === "single" || (fulfillmentType === "bulk" && Number(quantity) > 0));

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Ensure we have milestones; if empty and budget set, reapply template
      let milestoneRows = milestones;
      if (milestoneRows.length === 0 && totalBudget > 0) {
        const template = TEMPLATE_OPTIONS.find((t) => t.id === milestoneTemplate);
        if (template) {
          milestoneRows = template.steps.map((s) => ({
            title: s.title,
            amount: s.percent ? Math.round((totalBudget * s.percent) / 100) : 0,
            due_date: "",
          }));
          setMilestones(milestoneRows);
        }
      }

      const milestonePayload = milestoneRows
        .filter((m) => m.title && m.amount > 0)
        .map((m) => ({
          title: m.title,
          amount: m.amount,
          due_date: m.due_date || undefined,
        }));

      const trimmedTitle = (requestTitle || "").trim();
      if (!trimmedTitle) {
        alert("Please enter a request name.");
        return;
      }

    const commonPayload = {
      source_type: postId ? "post" : "direct",
      ...(postId ? { post_id: postId } : {}),
        request_title: trimmedTitle,
        requester_role: requesterRole,
        message: buildMessage(),
        budget_min: budgetMin ? Number(budgetMin) : undefined,
        budget_max: undefined,
        delivery_date: deliveryIso,
        milestones: milestonePayload,
      };

      if (isProjectMode) {
        await apiClient.post("/collaboration/requests", {
          ...commonPayload,
          targets: selectedCandidates.map((c) => ({
            target_user_id: c.id,
            target_role: c.role,
          })),
        });
      } else {
        await apiClient.post("/collaboration/requests", {
          ...commonPayload,
          target_user_id: selectedPrimary?.id,
          requester_role: requesterRole,
          target_role: selectedPrimary?.role ?? targetRole,
        });
      }
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      console.error("Failed to send request", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Failed to send collaboration request";
      setSubmitError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-5">
        <div className="ch-modal w-full max-w-4xl rounded-none bg-white border border-slate-200/80 shadow-[0_30px_80px_rgba(15,23,42,0.15)] ring-1 ring-slate-200/70 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-6 py-3 text-white flex items-center justify-between">
          <div>
            <h3 className="ch-modal__title text-2xl font-semibold tracking-tight">
              {partnerType === "Tailor"
                ? "Ask a Tailor"
                : partnerType === "Fabric Provider"
                ? "Request Fabric"
                : partnerType === "Designer"
                ? "Collaborate with a Designer"
                : "Start a Project"}
            </h3>
            
            {submitError && (
              <div className="mt-2 rounded-lg bg-white/90 text-orange-700 text-xs px-3 py-2 border border-orange-200">
                {submitError}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 pt-5 flex items-center gap-3 mb-6 text-sm text-slate-700">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step === s
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                    : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className="w-12 h-[2px] bg-slate-300" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 text-slate-800">
          <div className="space-y-1">
            <label className="text-xs text-slate-800 font-medium">Request name *</label>
            <input
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white border border-slate-400 text-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
              placeholder="e.g., Wedding gown fitting with Priya"
              required
            />
            <p className="text-[11px] text-slate-600">Give this request a short name to spot it quickly in your list.</p>
          </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Select a collaborator to work on this design.</p>
                <p className="text-xs text-slate-400">
                  For full service (tailoring + fabric), choose “Start a Project.”
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm ml-auto">
                <span className="text-slate-800">Looking for</span>
                <select
                  value={partnerType}
                  onChange={(e) => {
                    const next = e.target.value as PartnerType;
                    setPartnerType(next);
                    if (next === "Project") {
                      setCollabMode("project");
                      setRolesNeeded(["Tailor", "Fabric Provider"]);
                      setDesiredRoleFilter("BOTH"); // show both tailors and fabric providers
                    } else if (next === "Designer") {
                      setCollabMode("tailor");
                      setRolesNeeded(["Designer"]);
                      setDesiredRoleFilter("DESIGNER");
                    } else {
                      setCollabMode("tailor");
                      setRolesNeeded(next === "Tailor" ? ["Tailor"] : ["Fabric Provider"]);
                      setDesiredRoleFilter(next === "Tailor" ? "MAKER" : "FABRIC_PROVIDER");
                    }
                    setSelectedCandidates([]);
                  }}
                  className="rounded-xl bg-orange-50/40 border border-orange-300 text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                >
                  {isDesignerUser ? (
                    <>
                      <option value="Tailor">Tailor</option>
                      <option value="Fabric Provider">Fabric Provider</option>
                      <option value="Project">Start a Project</option>
                    </>
                  ) : isMakerUser ? (
                    <>
                      <option value="Tailor">Tailor</option>
                      <option value="Designer">Designer</option>
                      <option value="Fabric Provider">Fabric Provider</option>
                      <option value="Project">Start a Project</option>
                    </>
                  ) : (
                    <>
                      <option value="Tailor">Tailor</option>
                      <option value="Fabric Provider">Fabric Provider</option>
                      <option value="Designer">Designer</option>
                      <option value="Project">Start a Project</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
          {(candidates.length ? candidates : []).map((c) => {
              const isSelected = selectedCandidates.some((sc) => sc.id === c.id);
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border ${
                    isSelected ? "border-orange-200 bg-orange-50" : "border-slate-300 bg-white"
                  } p-4 flex gap-4`}
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-14 h-14 rounded-full object-cover border border-slate-400 bg-slate-100"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-slate-900 font-semibold">{c.name}</div>
                        <div className="text-sm text-orange-800 font-medium">{c.title}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {c.badges.map((b) => (
                        <span key={b} className="px-2 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                          {b}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-800 flex gap-4">
                      <span>⭐ {c.rating} ({c.reviews} reviews)</span>
                      <span>📍 USA</span>
                      <span>⏱ Responds {c.response}</span>
                    </div>
                    {pendingExists && (
                      <div className="text-xs text-amber-700 mt-2">
                        Pending request already exists for this collaboration.
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between gap-2 min-w-[110px]">
                    <button
                      onClick={() => {
                        if (isProjectMode) {
                          setSelectedCandidates((prev) =>
                            prev.some((p) => p.id === c.id) ? prev.filter((p) => p.id !== c.id) : [...prev, c]
                          );
                        } else {
                          setSelectedCandidates([c]);
                          setTargetRole(c.role);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                        isSelected ? "bg-orange-500 text-white" : "bg-white border border-slate-400 text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected ? (isProjectMode ? "Remove" : "Selected") : isProjectMode ? "Add" : "Select"}
                    </button>
                  </div>
                </div>
              );
            })}
              {loading && <div className="text-sm text-slate-700">Loading collaborators...</div>}
          {!loading && candidates.length === 0 && (
            <div className="text-sm text-slate-700">No collaborators found for this selection.</div>
          )}
          {candidatesHasMore && (
            <button
              onClick={() => loadCandidates(false)}
              disabled={candidatesLoadingMore}
            className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 hover:bg-slate-50 border border-slate-400 disabled:opacity-50"
            >
              {candidatesLoadingMore ? "Loading..." : "Load more"}
            </button>
          )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 space-y-3">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Selected collaborator{isProjectMode ? "s" : ""}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCandidates.length === 0 && <div className="text-xs text-slate-400">None selected</div>}
                    {selectedCandidates.map((sc) => (
                      <span
                        key={sc.id}
                        className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-xs"
                      >
                        {sc.name} — {sc.title}
                      </span>
                    ))}
                  </div>
                </div>
                {partnerType === "Project" && (
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-500">Collaboration type</div>
                    <select
                      value={collabMode}
                      onChange={(e) => {
                        const next = e.target.value as CollabMode;
                        setCollabMode(next);
                        if (next === "tailor") {
                          setRolesNeeded(["Tailor"]);
                          setPartnerType("Tailor");
                          setDesiredRoleFilter("MAKER");
                          setSelectedCandidates((prev) => (prev[0] ? [prev[0]] : []));
                        } else {
                          setRolesNeeded(["Tailor", "Fabric Provider"]);
                          setDesiredRoleFilter("BOTH");
                        }
                      }}
                      className="mt-1 rounded-lg bg-white border border-slate-200 text-slate-900 px-2 py-1 text-sm"
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
                    <label key={role} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
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
                      <span className="text-slate-700">{role}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Your role</label>
                <select
                  value={requesterRole}
                  onChange={(e) => setRequesterRole(e.target.value as Role)}
                  className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Target role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as Role)}
                  className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
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
              <label className="text-xs text-slate-500">
                {postId ? "Garment Type (from post)" : "Garment Type *"}
              </label>
              <input
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                readOnly={Boolean(postId)}
                className={`mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2 ${postId ? "opacity-90" : ""}`}
                placeholder={postId ? "Filled from post title" : "e.g., Wedding gown, Kurta set"}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Upload reference images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleS3Uploads(e.target.files)}
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                Files are uploaded to your S3 bucket and shared as links.
              </div>
              {uploading && (
                <div className="text-xs text-slate-500 mt-1">Uploading...</div>
              )}
              {uploadError && (
                <div className="text-xs text-red-300 mt-1">{uploadError}</div>
              )}
              {uploadUrls.length > 0 && (
                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  {uploadUrls.map((url) => (
                    <div key={url} className="truncate">
                      {url}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-500">Fabric Type *</label>
              <select
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
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
              <label className="text-xs text-slate-500">Measurements / Notes *</label>
              <textarea
                value={measurements}
                onChange={(e) => setMeasurements(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                rows={3}
                placeholder="e.g., Bust: 36in, Waist: 28in, Hip: 38in or special instructions..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Budget * ({currencyCode})</label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                  placeholder={currencyCode}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Delivery Date *</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={`mt-1 w-full rounded-lg bg-white border ${deliveryDate && !deliveryIso ? "border-red-300" : "border-slate-200"} text-slate-900 p-2`}
                />
              </div>
            </div>

            {/* Payment mode: escrow only */}
            <div className="mt-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-xs text-slate-600">
              Escrow holds funds until each milestone is approved.
            </div>

            {/* Milestone template + editable rows */}
            <div className="space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Milestone template</label>
                  <select
                    value={milestoneTemplate}
                    onChange={(e) => setMilestoneTemplate(e.target.value)}
                    className="mt-1 mb-2 w-full md:w-72 rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                  >
                    {TEMPLATE_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Choose a template to auto-split the budget. Add a custom step if needed.
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Total: {currencyCode} {totalBudget || 0} · Auto-split by template (editable)
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="grid grid-cols-12 text-xs text-slate-500 px-4 py-2 bg-slate-50 rounded-t-xl">
                  <div className="col-span-5">Title</div>
                  <div className="col-span-3">Amount ({currencyCode})</div>
                  <div className="col-span-3">Due date</div>
                  <div className="col-span-1" />
                </div>
                {milestones.map((m, idx) => {
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-2 border-t border-slate-200 items-center">
                      <select
                        value={m.title}
                        onChange={(e) => {
                          const next = [...milestones];
                          next[idx].title = e.target.value;
                          setMilestones(next);
                        }}
                        className="col-span-5 rounded-lg bg-white border border-slate-200 text-slate-900 p-2 text-sm"
                      >
                        {TITLE_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                        {!TITLE_OPTIONS.includes(m.title) && (
                          <option value={m.title}>{m.title || "Custom title"}</option>
                        )}
                      </select>
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => {
                          const next = [...milestones];
                          next[idx].amount = Number(e.target.value || 0);
                          setMilestones(next);
                        }}
                        className="col-span-3 rounded-lg bg-white border border-slate-200 text-slate-900 p-2 text-sm"
                      />
                      <input
                        type="text"
                        value={m.due_date || ""}
                        placeholder="mm/dd/yyyy"
                        onChange={(e) => {
                          const next = [...milestones];
                          next[idx].due_date = e.target.value;
                          setMilestones(next);
                        }}
                        className="col-span-3 rounded-lg bg-white border border-slate-200 text-slate-900 p-2 text-sm"
                      />
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => {
                            const next = milestones.filter((_, i) => i !== idx);
                            setMilestones(next);
                          }}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                  <div className="flex items-center gap-3">
                    <select
                      className="rounded-lg bg-white border border-slate-200 text-slate-900 p-2 text-sm"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        setMilestones((prev) => [
                          ...prev,
                          { title: val, amount: 0, due_date: "" },
                        ]);
                        e.target.value = "";
                      }}
                      defaultValue=""
                    >
                      <option value="">Add from template…</option>
                      {TITLE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        setMilestones((prev) => [
                          ...prev,
                          { title: "New milestone", amount: 0, due_date: "" },
                        ])
                      }
                    className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg bg-orange-50"
                    >
                      + Add custom
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Color(s)</label>
                <input
                  type="text"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                  placeholder="e.g., Navy; or Red/Blue mix"
                />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Fulfillment type</label>
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value as FulfillmentType)}
                  className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                >
                  <option value="single">Single item</option>
                  <option value="bulk">Bulk</option>
                </select>
              </div>
              {fulfillmentType === "bulk" && (
                <div>
                  <label className="text-xs text-slate-500">Quantity (required for bulk)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                  />
                </div>
              )}
            </div>

            {fulfillmentType === "bulk" && (
              <div>
                <label className="text-xs text-slate-500">Size & color breakdown (optional)</label>
                <textarea
                  value={sizeBreakdown}
                  onChange={(e) => setSizeBreakdown(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                  rows={2}
                  placeholder="e.g., S/Red:10, M/Red:15, L/Blue:5 or Fabric: Navy 50m, Lining: Ivory 30m"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-500">Additional Notes (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-2"
                rows={2}
                placeholder="Share context, references, timelines..."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-slate-900">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500 mb-2">Project Summary</div>
              <div className="space-y-1 text-sm">
                <div><span className="text-slate-500">Request:</span> {requestTitle || postTitle}</div>
                {!isDirect && <div><span className="text-slate-500">Design:</span> {postTitle}</div>}
                <div>
                  <span className="text-slate-500">Collaborators:</span>{" "}
                  {selectedCandidates.length
                    ? selectedCandidates.map((c) => c.name).join(", ")
                    : "—"}
                </div>
                <div><span className="text-slate-500">Garment Type:</span> {garmentType}</div>
                <div><span className="text-slate-500">Fabric Type:</span> {fabricType}</div>
                <div><span className="text-slate-500">Budget:</span> {budgetMin ? `₹${budgetMin}` : "—"}</div>
                <div><span className="text-slate-500">Delivery Date:</span> {formattedDeliveryDate || "—"}</div>
                <div><span className="text-slate-500">Notes:</span> {measurements || message || "—"}</div>
              </div>
            </div>

            {/* Order & Escrow Info Banner */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔒</div>
                <div>
                  <div className="font-medium text-emerald-700 mb-1">Secure Payment with Escrow</div>
                  <div className="text-sm text-emerald-700/80 space-y-1">
                    <p>Once your collaborator <strong>accepts</strong> this request:</p>
                    <ul className="list-disc list-inside ml-2 space-y-0.5">
                      <li>An <strong>Order</strong> will be automatically created</li>
                      <li>Your payment of <strong>₹{budgetMin || "0"}</strong> will be held in <strong>escrow</strong></li>
                      <li>Payment is released only after you approve the completed work</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notice about what happens after acceptance */}
        {step === 3 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <div>
                <strong className="text-amber-700">Once accepted, the order starts automatically.</strong>
                <p className="mt-1 text-amber-700/80">
                  The collaborator will be able to start work immediately. The budget and deadline you specified will be used to create the order.
                </p>
              </div>
            </div>
          </div>
        )}

        </div>

        <div className="mt-4 border-t border-slate-200 px-6 py-5 flex items-center justify-between bg-white">
          <button
            onClick={() => {
              if (step === 1) onClose();
              else setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as 1 | 2 | 3)));
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-200 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50"
              >
                Continue
              </button>
            )}
            {step === 3 && (
              <button
                onClick={submit}
                disabled={submitting || pendingExists}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-200 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50"
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

