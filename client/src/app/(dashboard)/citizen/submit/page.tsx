"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";

export default function SubmitComplaintPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Top Breadcrumb & SLA Badge */}
      <div className="flex items-center justify-between">
        <Link
          href="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#D95D0F] bg-orange-50 px-3 py-1 rounded-full border border-orange-200 shadow-xs">
          <Shield className="size-3 text-[#D95D0F]" />
          SLA Protected Civic Grievance
        </span>
      </div>

      {/* Main Submission Card */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-100/70 border border-orange-200 text-[#D95D0F] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="size-3" /> AI &amp; Multilingual Voice Enabled
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Submit a Civic Grievance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Report road potholes, garbage accumulation, water leakages, or streetlights. Voice record in your native state language, pin with What3Words, and get verified resolution.
          </p>
        </div>

        {/* Powerful Multi-Step Complaint Form with Sarvam Voice & Translation */}
        <ComplaintForm
          onSuccess={(complaint) => {
            if (complaint?._id) {
              router.push(`/complaints/${complaint._id}`);
            } else {
              router.push("/citizen/complaints");
            }
          }}
        />
      </div>
    </div>
  );
}
