"use client";

import dynamic from "next/dynamic";
import {
  Camera,
  ChevronLeft,
  Loader2,
  MapPin,
  Upload,
  Pencil,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { complaintsAPI, aiAPI } from "@/lib/api";
import { getCategoryLabel } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useComplaintStore } from "@/store/complaintStore";
import type { ComplaintCategory, IComplaint } from "@/types/complaint";
import { NearbyComplaintsModal } from "./NearbyComplaintsModal";
import {
  convertTo3Words,
  convertToCoordinates,
  isValid3Words,
  format3Words,
} from "@/lib/what3words";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });

const categories: ComplaintCategory[] = [
  "pothole",
  "garbage",
  "water",
  "streetlight",
  "road",
  "drainage",
  "other",
];

type LocationMode = "none" | "gps" | "map" | "w3w" | "manual";

interface FormState {
  title: string;
  description: string;
  category: ComplaintCategory;
  lat: number | null;
  lng: number | null;
  address: string;
  what3words: string;
  landmark: string;
  image: File | null;
  preview: string | null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = (await response.json()) as { display_name?: string };
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export function ComplaintForm({ onSuccess }: { onSuccess: (complaint: IComplaint) => void }) {
  const { t } = useTranslation(["complaints", "common"]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: "pothole",
    lat: null,
    lng: null,
    address: "",
    what3words: "",
    landmark: "",
    image: null,
    preview: null,
  });

  const [locationMode, setLocationMode] = useState<LocationMode>("none");
  const [w3wInput, setW3wInput] = useState("");
  const [w3wResolving, setW3wResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  const [nearbyComplaints, setNearbyComplaints] = useState<IComplaint[]>([]);
  const [showNearbyModal, setShowNearbyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { location, loading: locating, getLocation } = useGeolocation();
  const submitComplaint = useComplaintStore((state) => state.submitComplaint);

  // Fill address and what3words from GPS fix
  useEffect(() => {
    async function fillGpsData(): Promise<void> {
      if (location) {
        const address = await reverseGeocode(location.lat, location.lng);
        const w3w = await convertTo3Words(location.lat, location.lng);
        setForm((current) => ({
          ...current,
          lat: location.lat,
          lng: location.lng,
          address,
          what3words: w3w,
        }));
        setW3wInput(w3w);
        setLocationMode("gps");
        toast.success(`GPS Location detected: ${w3w}`);
      }
    }
    void fillGpsData();
  }, [location]);

  // Handle What3Words resolution
  const handleResolve3Words = async () => {
    if (!w3wInput.trim()) return;
    setW3wResolving(true);
    try {
      const coords = await convertToCoordinates(w3wInput);
      const address = await reverseGeocode(coords.lat, coords.lng);
      const formattedW3w = format3Words(w3wInput);
      setForm((cur) => ({
        ...cur,
        lat: coords.lat,
        lng: coords.lng,
        address,
        what3words: formattedW3w,
      }));
      setW3wInput(formattedW3w);
      toast.success(`Resolved ${formattedW3w} to GPS coordinates!`);
    } catch {
      toast.error("Could not resolve 3-word address. Please check spelling.");
    } finally {
      setW3wResolving(false);
    }
  };

  const formData = useMemo(() => {
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("category", form.category);
    data.append("lat", String(form.lat || ""));
    data.append("lng", String(form.lng || ""));
    data.append("address", form.address);
    if (form.what3words) data.append("what3words", form.what3words);
    if (form.landmark) data.append("landmark", form.landmark);
    if (form.image) data.append("image", form.image);
    return data;
  }, [form]);

  // Handle Photo & Gemini Vision Categorization
  const handleImage = async (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      toast.error("Invalid image format");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be under 8MB");
      toast.error("Image file too large");
      return;
    }

    const preview = URL.createObjectURL(file);
    setForm((current) => ({ ...current, image: file, preview }));
    setError(null);

    // Run AI Vision classification
    setAiAnalyzing(true);
    const toastId = toast.loading("AI Vision inspecting photo...");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await aiAPI.categorizeImage({
            imageBase64: base64,
            mimeType: file.type,
          });

          if (res.data?.success) {
            const data = res.data;
            toast.dismiss(toastId);
            toast.success(`AI Identified: ${data.detectedCategory.toUpperCase()} (${data.severity} priority)`);

            setAiInsight(`AI Confidence ${(data.confidence * 100).toFixed(0)}% · Severity: ${data.severity}`);

            setForm((cur) => ({
              ...cur,
              category: (data.detectedCategory as ComplaintCategory) || cur.category,
              title: cur.title || data.suggestedTitle || cur.title,
              description: cur.description || data.suggestedDescription || cur.description,
              landmark: data.detectedLandmarks?.length ? data.detectedLandmarks.join(", ") : cur.landmark,
            }));
          }
        } catch {
          toast.dismiss(toastId);
        } finally {
          setAiAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.dismiss(toastId);
      setAiAnalyzing(false);
    }
  };

  // Next step navigation with duplicate check
  async function nextStep(): Promise<void> {
    setError(null);
    if (step === 1) {
      if (!form.title.trim() || !form.description.trim() || !form.category) {
        setError("Title, description, and category are required");
        toast.error("Please fill in all details");
        return;
      }

      // Check duplicate on step 1
      try {
        const dupRes = await aiAPI.checkDuplicates({
          title: form.title,
          description: form.description,
          category: form.category,
          lat: form.lat || undefined,
          lng: form.lng || undefined,
        });

        if (dupRes.data?.isDuplicate && dupRes.data.matchedComplaint) {
          setDuplicateWarning(dupRes.data.matchedComplaint);
          toast("Potential similar complaint detected in this area!", { icon: "⚠️" });
        }
      } catch {
        // Continue
      }
    }

    if (step === 2) {
      if (!form.address.trim()) {
        setError("Please enter an address, use GPS, or pin on the map");
        toast.error("Location address is required");
        return;
      }
    }

    if (step === 3 && !form.image) {
      setError("Upload a photo of the issue");
      toast.error("Photo proof is required");
      return;
    }

    setStep((current) => Math.min(4, current + 1) as 1 | 2 | 3 | 4);
  }

  async function submitNow(): Promise<void> {
    setSubmitting(true);
    setError(null);
    const toastId = toast.loading(t("submitting"));
    try {
      const complaint = await submitComplaint(formData);
      toast.dismiss(toastId);
      toast.success(`${t("success_msg")} #${complaint._id.slice(-6)}`);
      onSuccess(complaint);
    } catch (submitError: any) {
      toast.dismiss(toastId);
      const msg = submitError instanceof Error ? submitError.message : t("error_msg");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNowForce(): Promise<void> {
    setSubmitting(true);
    setError(null);
    const toastId = toast.loading(t("submitting"));
    try {
      const forceData = new FormData();
      forceData.append("title", form.title);
      forceData.append("description", form.description);
      forceData.append("category", form.category);
      forceData.append("lat", String(form.lat || ""));
      forceData.append("lng", String(form.lng || ""));
      forceData.append("address", form.address);
      if (form.what3words) forceData.append("what3words", form.what3words);
      if (form.landmark) forceData.append("landmark", form.landmark);
      if (form.image) forceData.append("image", form.image);
      forceData.append("forceCreate", "true");

      const complaint = await submitComplaint(forceData);
      toast.dismiss(toastId);
      toast.success(`${t("success_msg")} #${complaint._id.slice(-6)}`);
      onSuccess(complaint);
    } catch (submitError: any) {
      toast.dismiss(toastId);
      const msg = submitError instanceof Error ? submitError.message : t("error_msg");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewSubmit(): Promise<void> {
    if (form.lat === null || form.lng === null) {
      await submitNow();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const nearby = await complaintsAPI.getNearby(form.lat, form.lng, 50);
      if (nearby.data.complaints.length > 0) {
        setNearbyComplaints(nearby.data.complaints);
        setShowNearbyModal(true);
        setSubmitting(false);
        return;
      }
      await submitNow();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not verify nearby complaints");
      setSubmitting(false);
    }
  }

  const stepLabels = [
    t("step1", "Details"),
    t("step2", "Location"),
    t("step3", "Photo"),
    t("step4", "Review"),
  ];

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {stepLabels.map((label, i) => (
            <span key={label} className={i + 1 <= step ? "text-[#D95D0F]" : ""}>
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((item) => (
            <span
              key={item}
              className={`h-2 flex-1 rounded-full transition-all ${
                item <= step ? "bg-[#D95D0F]" : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Duplicate Warning Alert */}
      {duplicateWarning && step === 1 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="size-4 text-amber-600" />
            <span>{t("duplicate_alert_title", "Similar Open Issue Detected Nearby")}</span>
          </div>
          <p className="text-slate-700">
            "{duplicateWarning.title}" was reported recently in this area.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs font-bold border-amber-400 bg-white hover:bg-amber-100"
              onClick={() => {
                window.open(`/complaints/${duplicateWarning._id}`, "_blank");
              }}
            >
              {t("buttons.view_existing", "View & Upvote")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-xs text-amber-800 hover:bg-amber-100"
              onClick={() => setDuplicateWarning(null)}
            >
              {t("buttons.proceed", "Proceed Anyway")}
            </Button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          <span className="font-bold text-red-600">!</span>
          {error}
        </div>
      )}

      {/* ── Step 1 : Details ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t("title_label", "Complaint Title")} *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
              placeholder={t("title_placeholder", "e.g., Deep pothole on road near Metro Gate 2")}
              maxLength={200}
              className="border-stone-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t("category_label", "Category")} *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((cur) => ({ ...cur, category: e.target.value as ComplaintCategory }))}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-orange-500 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t("description_label", "Detailed Description")} *
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((cur) => ({ ...cur, description: e.target.value }))}
              placeholder={t("description_placeholder", "Describe the issue, size, hazards, or history...")}
              maxLength={2000}
              className="min-h-28 border-stone-300"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">{form.description.length}/2000</span>
          </div>
        </div>
      )}

      {/* ── Step 2 : Location ── */}
      {step === 2 && (
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t("location_label", "Pinpoint Issue Location")}
          </p>

          {/* Location Modes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setLocationMode("gps");
                void getLocation();
              }}
              disabled={locating}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${
                locationMode === "gps"
                  ? "border-[#D95D0F] bg-orange-50/60 text-[#D95D0F]"
                  : "border-stone-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              {t("location_mode_gps", "Use GPS Fix")}
            </button>

            <button
              type="button"
              onClick={() => setLocationMode("map")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${
                locationMode === "map"
                  ? "border-[#D95D0F] bg-orange-50/60 text-[#D95D0F]"
                  : "border-stone-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              <span>🗺️</span>
              {t("location_mode_map", "Pin on Map")}
            </button>

            <button
              type="button"
              onClick={() => setLocationMode("w3w")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${
                locationMode === "w3w"
                  ? "border-[#D95D0F] bg-orange-50/60 text-[#D95D0F]"
                  : "border-stone-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              <span className="font-extrabold text-[#D95D0F]">///</span>
              {t("location_mode_w3w", "What3Words")}
            </button>

            <button
              type="button"
              onClick={() => {
                setLocationMode("manual");
                setForm((cur) => ({ ...cur, lat: null, lng: null, what3words: "" }));
              }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${
                locationMode === "manual"
                  ? "border-[#D95D0F] bg-orange-50/60 text-[#D95D0F]"
                  : "border-stone-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              <Pencil className="size-4" />
              {t("location_mode_manual", "Type Address")}
            </button>
          </div>

          {/* What3Words Mode */}
          {locationMode === "w3w" && (
            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="text-[#D95D0F] text-base font-extrabold">///</span>
                <span>Enter 3-Word Address</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={w3wInput}
                  onChange={(e) => setW3wInput(e.target.value)}
                  placeholder="e.g. filled.count.soap"
                  className="bg-white border-stone-300 font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={handleResolve3Words}
                  disabled={w3wResolving || !w3wInput.trim()}
                  className="bg-[#D95D0F] text-white text-xs font-bold"
                >
                  {w3wResolving ? <Loader2 className="size-4 animate-spin" /> : "Resolve"}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">{t("w3w_hint")}</p>
            </div>
          )}

          {/* Map picker */}
          {locationMode === "map" && (
            <div className="rounded-xl overflow-hidden border border-stone-200">
              <MapPicker
                value={form.lat && form.lng ? { lat: form.lat, lng: form.lng } : null}
                onChange={async (loc: { lat: number; lng: number; address: string }) => {
                  const w3w = await convertTo3Words(loc.lat, loc.lng);
                  setForm((cur) => ({
                    ...cur,
                    lat: loc.lat,
                    lng: loc.lng,
                    address: loc.address,
                    what3words: w3w,
                  }));
                  setW3wInput(w3w);
                  toast.success(`Pinned at: ${w3w}`);
                }}
              />
            </div>
          )}

          {/* Address & Landmark Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Street Address *
              </label>
              <Input
                value={form.address}
                onChange={(e) => setForm((cur) => ({ ...cur, address: e.target.value }))}
                placeholder="Street name, landmark, ward number, city..."
                className="border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Prominent Landmark (Optional)
              </label>
              <Input
                value={form.landmark}
                onChange={(e) => setForm((cur) => ({ ...cur, landmark: e.target.value }))}
                placeholder="e.g. Opposite State Bank ATM / Next to Metro Pillar 42"
                className="border-stone-300"
              />
            </div>

            {form.what3words && (
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#D95D0F] bg-orange-100/70 px-3 py-1.5 rounded-lg border border-orange-200">
                <span>Micro-Location:</span>
                <span>{form.what3words}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3 : Photo Proof & AI Vision ── */}
      {step === 3 && (
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {t("photo_label", "Upload Photo Evidence")} *
          </label>

          <div className="border-2 border-dashed border-stone-300 hover:border-orange-400 rounded-2xl p-6 text-center bg-stone-50/50 transition-colors">
            {form.preview ? (
              <div className="space-y-3">
                <div className="relative mx-auto h-48 w-full max-w-sm rounded-xl overflow-hidden shadow-md">
                  <img src={form.preview} alt="Complaint preview" className="h-full w-full object-cover" />
                </div>
                {aiAnalyzing && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#D95D0F]">
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t("ai_analyzing", "Gemini AI Vision analyzing image...")}</span>
                  </div>
                )}
                {aiInsight && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <Sparkles className="size-3.5 text-emerald-600" />
                    <span>{aiInsight}</span>
                  </div>
                )}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold border-stone-300"
                    onClick={() => setForm((cur) => ({ ...cur, image: null, preview: null }))}
                  >
                    Replace Photo
                  </Button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer space-y-3 block">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#D95D0F] flex items-center justify-center mx-auto shadow-sm">
                  <Camera className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t("photo_hint")}</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4 : Review ── */}
      {step === 4 && (
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 text-sm">
          <h3 className="font-bold text-slate-900 border-b pb-2 text-xs uppercase tracking-wider">
            Review Complaint Summary
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-slate-500">Title:</span>
              <span className="font-bold text-slate-900 text-right max-w-xs truncate">{form.title}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-slate-500">Category:</span>
              <Badge variant="outline" className="font-bold uppercase text-[10px]">
                {getCategoryLabel(form.category)}
              </Badge>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-slate-500">Address:</span>
              <span className="font-medium text-slate-800 text-right max-w-xs truncate">{form.address}</span>
            </div>
            {form.what3words && (
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-slate-500">What3Words:</span>
                <span className="font-mono font-bold text-[#D95D0F]">{form.what3words}</span>
              </div>
            )}
            {form.landmark && (
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-slate-500">Landmark:</span>
                <span className="font-medium text-slate-800">{form.landmark}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Button Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((cur) => (cur - 1) as 1 | 2 | 3 | 4)}
            className="text-xs font-bold uppercase tracking-wider"
          >
            <ChevronLeft className="size-4 mr-1" />
            {t("buttons.back", "Back")}
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            type="button"
            onClick={nextStep}
            className="bg-[#D95D0F] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider px-6"
          >
            Next Step
            <ArrowRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleReviewSubmit}
            disabled={submitting}
            className="bg-[#D95D0F] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                {t("submitting")}
              </>
            ) : (
              t("buttons.submit")
            )}
          </Button>
        )}
      </div>

      {/* Nearby modal */}
      {showNearbyModal && (
        <NearbyComplaintsModal
          complaints={nearbyComplaints}
          onJoin={(id) => {
            window.open(`/complaints/${id}`, "_blank");
            setShowNearbyModal(false);
          }}
          onCreate={submitNowForce}
          onClose={() => setShowNearbyModal(false)}
        />
      )}
    </div>
  );
}

export default ComplaintForm;
