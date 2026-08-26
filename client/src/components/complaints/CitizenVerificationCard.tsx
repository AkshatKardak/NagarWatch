"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { complaintsApi } from "@/lib/api";

interface CitizenVerificationCardProps {
  complaintId: string;
  beforeImage?: string;
  afterImage?: string;
  resolutionNote?: string;
  onVerified?: () => void;
  onReopened?: () => void;
}

export function CitizenVerificationCard({
  complaintId,
  beforeImage,
  afterImage,
  resolutionNote,
  onVerified,
  onReopened,
}: CitizenVerificationCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("Issue still exists");
  const [comment, setComment] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      await complaintsApi.verifyResolution(complaintId);
      if (onVerified) onVerified();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to verify resolution");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReopen = async () => {
    setIsSubmittingRejection(true);
    setErrorMsg(null);
    try {
      await complaintsApi.reopen(complaintId, {
        reason: rejectionReason,
        comment,
      });
      setIsReopenModalOpen(false);
      if (onReopened) onReopened();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to reject resolution");
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  return (
    <Card className="p-6 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 shadow-md rounded-2xl mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
            Citizen Verification Required
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            Has this civic issue been properly resolved?
          </h3>
          <p className="text-xs text-slate-600">
            The municipal authority has uploaded work completion proof. Please inspect the before and after photos to confirm.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 text-xs font-semibold bg-red-100 text-red-700 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Photo Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            📷 Initial Problem Photo
          </span>
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner relative group">
            {beforeImage ? (
              <img
                src={beforeImage}
                alt="Before Resolution"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                No initial photo available
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              BEFORE
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
            ✨ Authority Resolution Proof
          </span>
          <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-emerald-500 bg-emerald-50/50 shadow-inner relative group">
            {afterImage ? (
              <img
                src={afterImage}
                alt="After Resolution Proof"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-emerald-700 text-xs font-medium">
                Photo proof registered on site
              </div>
            )}
            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              AFTER (COMPLETED)
            </div>
          </div>
        </div>
      </div>

      {resolutionNote && (
        <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs text-slate-700 my-3">
          <span className="font-bold text-slate-900 block mb-0.5">Authority Field Note:</span>
          {resolutionNote}
        </div>
      )}

      {/* Decision CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-5 pt-4 border-t border-indigo-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsReopenModalOpen(true)}
          className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs h-10 px-4"
        >
          <XCircle className="size-4 mr-1.5" />
          No, Issue Still Exists (Reopen)
        </Button>

        <Button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 shadow-md shadow-emerald-200"
        >
          {isVerifying ? (
            <Loader2 className="size-4 animate-spin mr-1.5" />
          ) : (
            <CheckCircle2 className="size-4 mr-1.5" />
          )}
          Yes, Issue Resolved (Confirm)
        </Button>
      </div>

      {/* Reopen / Rejection Modal */}
      <Dialog open={isReopenModalOpen} onOpenChange={setIsReopenModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="size-5 text-red-600" />
              Reopen Grievance
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Please tell us why this repair is unsatisfactory. The assigned contractor and municipal supervisor will be alerted immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                Reason for Rejection *
              </label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Issue still exists">Issue still exists on ground</SelectItem>
                  <SelectItem value="Incomplete repair">Incomplete / partial repair work</SelectItem>
                  <SelectItem value="Poor repair quality">Substandard material / poor quality</SelectItem>
                  <SelectItem value="Wrong location resolved">Wrong location / inaccurate photo proof</SelectItem>
                  <SelectItem value="Hazard remaining">Debris or safety hazard remaining</SelectItem>
                  <SelectItem value="Other">Other observation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                Additional Comments / Evidence
              </label>
              <Textarea
                placeholder="Describe what is still missing or defective..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="text-xs min-h-[90px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsReopenModalOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReopen}
              disabled={isSubmittingRejection}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              {isSubmittingRejection ? (
                <Loader2 className="size-3 animate-spin mr-1.5" />
              ) : null}
              Confirm Reopen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CitizenVerificationCard;
