"use client";

import { useState } from "react";
import { Star, Loader2, MessageSquare, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { complaintsAPI } from "@/lib/api";

interface CitizenFeedbackModalProps {
  complaintId: string;
  complaintTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CitizenFeedbackModal({
  complaintId,
  complaintTitle,
  open,
  onOpenChange,
  onSuccess,
}: CitizenFeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const toastId = toast.loading("Submitting your review...");

    try {
      await complaintsAPI.submitFeedback(complaintId, { rating, comment });
      toast.dismiss(toastId);
      toast.success("Thank you for holding contractors accountable!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border-stone-200">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Star className="size-5 text-amber-500 fill-amber-500" />
            Rate Contractor Resolution
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            How satisfied are you with the resolution of "{complaintTitle}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Star Selector */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`size-8 ${
                    star <= rating
                      ? "text-amber-500 fill-amber-500"
                      : "text-stone-300 fill-stone-100"
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-center text-xs font-bold text-slate-700">
            {rating === 5 && "🌟 Outstanding Quality Work"}
            {rating === 4 && "👍 Good Resolution"}
            {rating === 3 && "👌 Acceptable Standard"}
            {rating === 2 && "⚠️ Sub-standard / Incomplete"}
            {rating === 1 && "❌ Poor Workmanship"}
          </p>

          {/* Feedback comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-700">
              Citizen Comments & Observations (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. The pothole was filled smoothly and cleaned up properly..."
              className="text-xs min-h-[80px] border-stone-300"
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold border-stone-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#D95D0F] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider px-5"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" /> Submitting...
                </>
              ) : (
                "Submit Rating"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CitizenFeedbackModal;
