"use client";

import dynamic from "next/dynamic";
import { Camera, ChevronLeft, Loader2, MapPin, Upload, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { complaintsAPI } from "@/lib/api";
import { getCategoryLabel } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useComplaintStore } from "@/store/complaintStore";
import type { ComplaintCategory, IComplaint } from "@/types/complaint";
import { NearbyComplaintsModal } from "./NearbyComplaintsModal";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });

const categories: ComplaintCategory[] = ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"];

type LocationMode = "none" | "gps" | "map" | "manual";

interface FormState {
  title: string;
  description: string;
  category: ComplaintCategory;
  lat: number | null;
  lng: number | null;
  address: string;
  image: File | null;
  preview: string | null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
  const data = (await response.json()) as { display_name?: string };
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function ComplaintForm({ onSuccess }: { onSuccess: (complaint: IComplaint) => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: "pothole",
    lat: null,
    lng: null,
    address: "",
    image: null,
    preview: null,
  });
  const [locationMode, setLocationMode] = useState<LocationMode>("none");
  const [error, setError] = useState<string | null>(null);
  const [nearbyComplaints, setNearbyComplaints] = useState<IComplaint[]>([]);
  const [showNearbyModal, setShowNearbyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { location, loading: locating, getLocation } = useGeolocation();
  const submitComplaint = useComplaintStore((state) => state.submitComplaint);

  // Fill address from GPS fix
  useEffect(() => {
    async function fillGpsAddress(): Promise<void> {
      if (location) {
        const address = await reverseGeocode(location.lat, location.lng);
        setForm((current) => ({ ...current, lat: location.lat, lng: location.lng, address }));
        setLocationMode("gps");
      }
    }
    void fillGpsAddress();
  }, [location]);

  const formData = useMemo(() => {
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("category", form.category);
    data.append("lat", String(form.lat || ""));
    data.append("lng", String(form.lng || ""));
    data.append("address", form.address);
    if (form.image) data.append("image", form.image);
    return data;
  }, [form]);

  function nextStep(): void {
    setError(null);
    if (step === 1 && (!form.title.trim() || !form.description.trim() || !form.category)) {
      setError("Title, description, and category are required");
      return;
    }
    if (step === 2) {
      if (!form.address.trim()) {
        setError("Please enter an address, use GPS, or pin on the map");
        return;
      }
      // lat/lng not required when address is typed manually
    }
    if (step === 3 && !form.image) {
      setError("Upload a photo of the issue");
      return;
    }
    setStep((current) => Math.min(4, current + 1) as 1 | 2 | 3 | 4);
  }

  async function submitNow(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const complaint = await submitComplaint(formData);
      onSuccess(complaint);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit complaint");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNowForce(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const forceData = new FormData();
      forceData.append("title", form.title);
      forceData.append("description", form.description);
      forceData.append("category", form.category);
      forceData.append("lat", String(form.lat || ""));
      forceData.append("lng", String(form.lng || ""));
      forceData.append("address", form.address);
      if (form.image) forceData.append("image", form.image);
      forceData.append("forceCreate", "true");
      const complaint = await submitComplaint(forceData);
      onSuccess(complaint);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit complaint");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewSubmit(): Promise<void> {
    if (form.lat === null || form.lng === null) {
      // No coords — skip nearby check and submit directly
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
      setError(submitError instanceof Error ? submitError.message : "Could not check nearby complaints");
      setSubmitting(false);
    }
  }

  function handleImage(file: File | null): void {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setForm((current) => ({ ...current, image: file, preview: URL.createObjectURL(file) }));
    setError(null);
  }

  // ─── Step labels ─────────────────────────────────────────────────────────────
  const stepLabels = ["Details", "Location", "Photo", "Review"];

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {stepLabels.map((label, i) => (
            <span key={label} className={i + 1 <= step ? "text-primary" : ""}>
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((item) => (
            <span
              key={item}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                item <= step ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="shrink-0 font-bold">!</span>
          {error}
        </div>
      ) : null}

      {/* ── Step 1 : Details ── */}
      {step === 1 ? (
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            Title
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              maxLength={200}
              placeholder="e.g. Deep pothole on main road"
              value={form.title}
              onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Description
            <textarea
              className="mt-1 min-h-28 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              maxLength={2000}
              placeholder="Describe the issue in detail — size, severity, how long it's been there…"
              value={form.description}
              onChange={(e) => setForm((cur) => ({ ...cur, description: e.target.value }))}
            />
            <span className="text-xs text-gray-400">{form.description.length}/2000</span>
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Category
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.category}
              onChange={(e) =>
                setForm((cur) => ({ ...cur, category: e.target.value as ComplaintCategory }))
              }
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {/* ── Step 2 : Location ── */}
      {step === 2 ? (
        <div className="space-y-5">
          <p className="text-sm font-semibold text-gray-700">Where is the issue?</p>

          {/* Option row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setLocationMode("gps");
                void getLocation();
              }}
              disabled={locating}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-bold transition ${
                locationMode === "gps"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-500 hover:border-primary/40"
              }`}
            >
              {locating ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <MapPin className="size-5" />
              )}
              Use GPS
            </button>

            <button
              type="button"
              onClick={() => setLocationMode("map")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-bold transition ${
                locationMode === "map"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-500 hover:border-primary/40"
              }`}
            >
              <span className="text-lg leading-none">🗺️</span>
              Pin on Map
            </button>

            <button
              type="button"
              onClick={() => {
                setLocationMode("manual");
                setForm((cur) => ({ ...cur, lat: null, lng: null, address: "" }));
              }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-bold transition ${
                locationMode === "manual"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-500 hover:border-primary/40"
              }`}
            >
              <Pencil className="size-5" />
              Type Address
            </button>
          </div>

          {/* GPS result */}
          {locationMode === "gps" && form.address && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-green-600" />
              <span className="font-semibold">{form.address}</span>
            </div>
          )}

          {/* Map picker */}
          {locationMode === "map" && (
            <div className="space-y-2">
              <MapPicker
                value={
                  form.lat !== null && form.lng !== null
                    ? { lat: form.lat, lng: form.lng }
                    : null
                }
                onChange={(value) =>
                  setForm((cur) => ({
                    ...cur,
                    lat: value.lat,
                    lng: value.lng,
                    address: value.address,
                  }))
                }
              />
              {form.address ? (
                <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700">
                  📍 {form.address}
                </div>
              ) : null}
            </div>
          )}

          {/* Manual address input */}
          {locationMode === "manual" && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Street address / landmark
              </label>
              <div className="relative">
                <Pencil className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Near Station Road, Ward 5, Mumbai"
                  value={form.address}
                  onChange={(e) =>
                    setForm((cur) => ({ ...cur, address: e.target.value }))
                  }
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Be as specific as possible — include landmark, ward, or street name.
              </p>
            </div>
          )}

          {/* Prompt when nothing selected yet */}
          {locationMode === "none" && (
            <p className="text-center text-xs text-gray-400">↑ Choose how to add the location above</p>
          )}
        </div>
      ) : null}

      {/* ── Step 3 : Photo ── */}
      {step === 3 ? (
        <div className="space-y-4">
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 p-8 text-center transition hover:border-primary/40 hover:bg-gray-50/50">
            <Upload className="mx-auto mb-2 size-8 text-gray-300" />
            <span className="text-sm font-semibold text-gray-600">Click to upload issue photo</span>
            <span className="mt-1 block text-xs text-gray-400">JPEG, PNG or WebP · max 5 MB</span>
            <input
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleImage(e.target.files?.[0] || null)}
            />
          </label>
          {form.preview && form.image ? (
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <img src={form.preview} alt="Issue preview" className="max-h-72 w-full object-cover" />
              <p className="bg-gray-50 px-4 py-2 text-xs text-gray-500">
                {form.image.name} — {(form.image.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Step 4 : Review ── */}
      {step === 4 ? (
        <div className="space-y-4">
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm">
            <div className="pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Title</p>
              <p className="mt-0.5 font-semibold text-gray-900">{form.title}</p>
            </div>
            <div className="py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</p>
              <p className="mt-0.5 text-gray-700">{form.description}</p>
            </div>
            <div className="py-3 flex gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</p>
                <p className="mt-0.5 font-semibold text-gray-900">{getCategoryLabel(form.category)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</p>
                <p className="mt-0.5 font-semibold text-gray-900 max-w-xs truncate">{form.address || "—"}</p>
              </div>
            </div>
            {form.preview ? (
              <div className="pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Photo</p>
                <img src={form.preview} alt="Issue preview" className="max-h-52 w-full rounded-lg object-cover" />
              </div>
            ) : null}
          </div>
          <Button type="button" className="w-full" onClick={handleReviewSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Submit Complaint
          </Button>
        </div>
      ) : null}

      {/* Navigation */}
      <div className="flex justify-between pt-1">
        {step > 1 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((cur) => (cur - 1) as 1 | 2 | 3 | 4)}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < 4 ? (
          <Button type="button" onClick={nextStep}>
            Next
          </Button>
        ) : null}
      </div>

      {showNearbyModal ? (
        <NearbyComplaintsModal
          complaints={nearbyComplaints}
          onJoin={async (id) => {
            await complaintsAPI.upvote(id);
            window.alert("Upvoted! Thanks for supporting this report.");
            setShowNearbyModal(false);
          }}
          onCreate={() => {
            setShowNearbyModal(false);
            void submitNowForce();
          }}
          onClose={() => setShowNearbyModal(false)}
        />
      ) : null}
    </div>
  );
}
