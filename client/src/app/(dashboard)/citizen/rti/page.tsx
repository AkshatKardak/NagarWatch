"use client";

import React, { useState } from "react";
import { Scale, Download, Loader2, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useComplaints } from "@/hooks/useComplaints";
import { aiApi } from "@/lib/api";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import type { Complaint } from "@/lib/types";

export default function RTIGeneratorPage() {
  const { data: rawComplaints, isLoading: loadingComplaints } = useComplaints();
  const complaints: Complaint[] = Array.isArray(rawComplaints) ? rawComplaints : [];

  const [selectedComplaintId, setSelectedComplaintId] = useState<string>("");
  const [applicantName, setApplicantName] = useState<string>("");
  const [applicantAddress, setApplicantAddress] = useState<string>("");
  const [applicantPhone, setApplicantPhone] = useState<string>("");
  const [letter, setLetter] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId || !applicantName.trim() || !applicantAddress.trim()) {
      toast.error("Please select a complaint and enter your name and address");
      return;
    }

    setGenerating(true);
    try {
      const res = await aiApi.generateRTI({
        complaintId: selectedComplaintId,
        applicantName,
        applicantAddress,
        applicantPhone,
      });

      if (res.data?.letter) {
        setLetter(res.data.letter);
        toast.success("RTI application generated successfully!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate RTI draft");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!letter) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const splitText = doc.splitTextToSize(letter, 180);
    doc.text(splitText, 15, 20);
    doc.save(`RTI_Application_${Date.now()}.pdf`);
    toast.success("Downloaded official RTI PDF");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="size-6 text-purple-700" />
            RTI Act 2005 Legal Notice Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Automatically draft legal Right to Information applications for unresolved complaints breaching SLA
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="border border-stone-200 bg-white rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Civic Complaint *
              </Label>
              <select
                value={selectedComplaintId}
                onChange={(e) => setSelectedComplaintId(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="">-- Choose unresolved complaint --</option>
                {complaints.map((c) => (
                  <option key={c._id} value={c._id}>
                    [{c.category?.toUpperCase()}] {c.title} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Applicant Full Name *
              </Label>
              <Input
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="rounded-xl border-stone-300 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Applicant Postal Address *
              </Label>
              <Input
                value={applicantAddress}
                onChange={(e) => setApplicantAddress(e.target.value)}
                placeholder="House No, Street, Landmark, PIN code"
                className="rounded-xl border-stone-300 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Contact Phone (Optional)
              </Label>
              <Input
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="rounded-xl border-stone-300 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={generating}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider py-5 rounded-xl shadow-md"
            >
              {generating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Generating Legal Notice...
                </>
              ) : (
                <>
                  <Scale className="size-3.5 mr-1.5" />
                  Draft Formal RTI Application
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Generated Letter Preview */}
        <Card className="border border-stone-200 bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Letter Preview
              </h3>
              {letter && (
                <Button
                  size="xs"
                  onClick={handleDownloadPDF}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase"
                >
                  <Download className="size-3 mr-1" />
                  Download PDF
                </Button>
              )}
            </div>

            {letter ? (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 max-h-96 overflow-y-auto font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {letter}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs space-y-2">
                <FileText className="size-8 text-stone-300 mx-auto" />
                <p>Fill in applicant details and click generate to view your official RTI Act 2005 notice draft.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
