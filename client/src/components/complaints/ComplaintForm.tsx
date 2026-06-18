"use client";

import dynamic from "next/dynamic";
import { Camera, ChevronLeft, Loader2, MapPin, Upload } from "lucide-react";
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
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
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
  const [error, setError] = useState<string | null>(null);
  const [nearbyComplaints, setNearbyComplaints] = useState<IComplaint[]>([]);
  const [showNearbyModal, setShowNearbyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { location, loading: locating, getLocation } = useGeolocation();
  const submitComplaint = useComplaintStore((state) => state.submitComplaint);

  useEffect(() => {
    async function fillGpsAddress(): Promise<void> {
      if (location) {
        const address = await reverseGeocode(location.lat, location.lng);
        setForm((current) => ({ ...current, lat: location.lat, lng: location.lng, address }));
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
    if (step === 2 && (form.lat === null || form.lng === null || !form.address)) {
      setError("Choose the issue location");
      return;
    }
    if (step === 3 && !form.image) {
      setError("Upload a photo of the issue");
      return;
    }
    setStep((current) => Math.min(4, current + 1) as 1 | 2 | 3 | 4);
  }

  /** Normal submit — no nearby complaints, no forceCreate flag needed */
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

  /**
   * Force submit — user clicked "Create New Anyway" in the NearbyComplaintsModal.
   * Builds a fresh FormData with forceCreate="true" so the backend skips the
   * duplicate gate and proceeds directly to upload + complaint creation.
   */
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
    if (form.lat === null || form.lng === null) return;
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
    setForm((current) => ({
      ...current,
      image: file,
      preview: URL.createObjectURL(file),
    }));
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((item) => (
          <span key={item} className={`h-2 flex-1 ${item <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      {error ? <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {step === 1 ? (
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Title
            <input
              className="mt-1 w-full border px-3 py-2"
              maxLength={200}
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              className="mt-1 min-h-32 w-full border px-3 py-2"
              maxLength={2000}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <span className="text-xs text-muted-foreground">{form.description.length}/2000</span>
          </label>
          <label className="block text-sm font-medium">
            Category
            <select
              className="mt-1 w-full border px-3 py-2"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value as ComplaintCategory }))
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="space-y-4">
          <Button type="button" variant="outline" onClick={getLocation} disabled={locating}>
            {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            Use My GPS Location
          </Button>
          <div className="text-center text-xs text-muted-foreground">or pin manually</div>
          <MapPicker
            value={form.lat !== null && form.lng !== null ? { lat: form.lat, lng: form.lng } : null}
            onChange={(value) =>
              setForm((current) => ({ ...current, lat: value.lat, lng: value.lng, address: value.address }))
            }
          />
          {form.address ? <div className="bg-muted p-3 text-sm">{form.address}</div> : null}
        </div>
      ) : null}
      {step === 3 ? (
        <div className="space-y-4">
          <label className="block cursor-pointer border border-dashed p-6 text-center">
            <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
            <span className="text-sm font-medium">Upload issue photo</span>
            <input
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handleImage(event.target.files?.[0] || null)}
            />
          </label>
          {form.preview && form.image ? (
            <div>
              <img src={form.preview} alt="Issue preview" className="max-h-72 w-full object-cover" />
              <p className="mt-2 text-sm text-muted-foreground">
                {form.image.name} - {(form.image.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
      {step === 4 ? (
        <div className="space-y-4">
          <div className="border p-4">
            <p className="text-sm text-muted-foreground">Review</p>
            <h3 className="text-lg font-semibold">{form.title}</h3>
            <p className="mt-2 text-sm">{form.description}</p>
            <p className="mt-2 text-sm">
              <strong>Category:</strong> {getCategoryLabel(form.category)}
            </p>
            <p className="text-sm">
              <strong>Address:</strong> {form.address}
            </p>
            {form.preview ? <img src={form.preview} alt="Issue preview" className="mt-3 max-h-60 w-full object-cover" /> : null}
          </div>
          <Button type="button" className="w-full" onClick={handleReviewSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Submit Complaint
          </Button>
        </div>
      ) : null}
      <div className="flex justify-between">
        {step > 1 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((current) => (current - 1) as 1 | 2 | 3 | 4)}>
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
