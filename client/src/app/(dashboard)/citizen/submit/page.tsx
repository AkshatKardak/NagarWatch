"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateComplaint } from "@/hooks/useComplaints";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LocationPicker } from "@/components/map/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, MapPin, Camera, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Pothole",
  "Garbage",
  "Street Light",
  "Water Supply",
  "Drainage",
  "Encroachment",
  "Noise Pollution",
  "Other",
];

export default function SubmitComplaintPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    latitude: 0,
    longitude: 0,
    address: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { mutate, isPending } = useCreateComplaint();
  const { location, error: geoError } = useGeolocation();

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Please provide or pin the issue location");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("category", formData.category);
    data.append("latitude", formData.latitude.toString());
    data.append("longitude", formData.longitude.toString());
    data.append("address", formData.address.trim());
    if (image) data.append("image", image);

    mutate(data, {
      onSuccess: (res: any) => {
        toast.success("Complaint submitted successfully!");
        const complaintId = res?.data?.complaint?._id || res?._id;
        if (complaintId) {
          router.push(`/complaints/${complaintId}`);
        } else {
          router.push("/citizen/complaints");
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to submit complaint");
      },
    });
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address,
    }));
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/citizen/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D95D0F] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
          SLA Protected Submission
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Submit a Civic Complaint</h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-8">
          Report road damage, garbage overflow, lighting, or water issues. Your report will be automatically routed to your municipal ward authority.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#D95D0F] focus:outline-none shadow-sm"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat.toLowerCase().replace(/ /g, "_")}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Broken water pipeline leaking on Main Street"
              className="rounded-xl border-stone-300 py-2.5 text-sm"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide exact details about the issue, severity, duration, and safety hazards..."
              rows={4}
              className="rounded-xl border-stone-300 text-sm"
              maxLength={2000}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Location *</label>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLat={location?.latitude}
              initialLng={location?.longitude}
              initialAddress={formData.address}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Photo Proof (Optional)</label>
            <div className="border-2 border-dashed border-stone-300 rounded-2xl p-4 text-center bg-[#FAF8F5]/50">
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="h-44 w-full max-w-xs mx-auto rounded-xl overflow-hidden shadow-sm">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageChange(null)}
                    className="text-xs font-bold border-stone-300"
                  >
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer space-y-2 block">
                  <Camera className="size-6 text-[#D95D0F] mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Click to upload photo evidence</p>
                  <p className="text-[10px] text-slate-400">JPEG, PNG or WebP under 8MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#D95D0F] hover:bg-orange-700 text-white font-bold text-sm uppercase tracking-wider py-6 rounded-xl shadow-lg transition-all"
          >
            {isPending ? "Submitting to Ward Authority..." : "Submit Complaint"}
          </Button>
        </form>
      </div>
    </div>
  );
}
