"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import {
  FileText,
  Loader2,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Scale,
  Info,
  FileCheck2,
} from "lucide-react";
import { aiAPI, usersAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { IComplaint } from "@/types/complaint";

export default function RTIGeneratorPage() {
  const { t } = useTranslation(["common", "dashboard"]);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  const [selectedComplaintId, setSelectedComplaintId] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");

  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);
  const [daysPending, setDaysPending] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Role guard
  useEffect(() => {
    if (isLoaded && !user) router.push("/sign-in");
  }, [isLoaded, user, router]);

  // Pre-fill name from Clerk
  useEffect(() => {
    if (user?.fullName) setApplicantName(user.fullName);
  }, [user]);

  // Load user's complaints that are NOT resolved
  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersAPI.getMyComplaints({ limit: 100 });
        const all = res.data.complaints;
        // Eligible if unresolved or active
        const eligible = all.filter((c) => c.status !== "resolved");
        setComplaints(eligible);
        if (eligible.length > 0) {
          setSelectedComplaintId(eligible[0]._id);
        }
      } catch {
        setComplaints([]);
      } finally {
        setLoadingComplaints(false);
      }
    };
    if (user) void load();
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedComplaintId || !applicantName.trim() || !applicantAddress.trim()) {
      setError("Please fill in all required fields and select a complaint.");
      toast.error("Please fill in all required fields");
      return;
    }
    setGenerating(true);
    setError(null);
    setLetter(null);
    const toastId = toast.loading("Gemini AI drafting legal RTI application...");

    try {
      const res = await aiAPI.generateRTI({
        complaintId: selectedComplaintId,
        applicantName,
        applicantAddress,
        applicantPhone,
      });
      toast.dismiss(toastId);
      toast.success("RTI application drafted successfully!");
      setLetter(res.data.letter);
      setDaysPending(res.data.daysPending);
    } catch (err: any) {
      toast.dismiss(toastId);
      const msg = err?.response?.data?.message || "Failed to generate RTI letter. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!letter) return;
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    toast.success("RTI Letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RTI_Application_${selectedComplaintId?.slice(-6)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Text file downloaded");
  };

  const handleDownloadPDF = () => {
    if (!letter) return;
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, 55, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("APPLICATION FOR INFORMATION UNDER THE RTI ACT, 2005", 40, 34);

      // Subheader
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Reference ID: NW-RTI-${selectedComplaintId?.slice(-6)} | Generated via NagarWatch Civic Intelligence | Date: ${new Date().toLocaleDateString("en-IN")}`,
        40,
        75
      );
      doc.setDrawColor(226, 232, 240);
      doc.line(40, 85, pageWidth - 40, 85);

      // Letter Body
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      const splitText = doc.splitTextToSize(letter, pageWidth - 80);
      doc.text(splitText, 40, 105);

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Standard Format as per Right to Information Act 2005 (Central / State Rules) · Valid for Submission to PIO",
        40,
        pageHeight - 25
      );

      doc.save(`RTI_Official_Application_${selectedComplaintId?.slice(-6)}.pdf`);
      toast.success("Official PDF Application Downloaded!");
    } catch {
      toast.error("Failed to generate PDF. Downloading text format instead.");
      handleDownloadTxt();
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pt-24 min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-0 mb-4 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0 text-[#D95D0F] shadow-sm">
            <Scale className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              RTI Legal Escalation Generator
            </h1>
            <p className="text-sm mt-1 text-slate-600">
              Auto-generate a formal application under the <strong>Right to Information Act 2005</strong> for unresolved complaints.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50/80 text-xs text-blue-900 shadow-sm">
          <Info className="size-4 flex-shrink-0 mt-0.5 text-blue-600" />
          <span>
            Under <strong>Section 7(1) of the RTI Act 2005</strong>, Public Information Officers are legally required to provide information within <strong>30 days</strong>. If your complaint exceeds the Citizens' Charter SLA, you have the statutory right to demand daily progress reports and officer designations.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="border-b py-3 px-5 border-stone-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Step 1 — Select Complaint
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {loadingComplaints ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="size-4 animate-spin" /> Loading complaints...
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-xs p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-center">
                  <AlertCircle className="size-5 mx-auto mb-2 text-amber-600" />
                  No open complaints found.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {complaints.map((c) => {
                    const days = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000);
                    const isSelected = selectedComplaintId === c._id;
                    return (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => setSelectedComplaintId(c._id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-[#D95D0F] bg-orange-50/70 shadow-sm"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <p className="text-xs font-bold truncate text-slate-900">{c.title}</p>
                        <p className="text-[10px] mt-0.5 uppercase font-semibold text-slate-500">
                          {c.category} · {days} days active
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="border-b py-3 px-5 border-stone-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Step 2 — Applicant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700">Full Legal Name *</label>
                <Input
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Your full name as per Aadhaar / ID"
                  className="mt-1 border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-700">Postal Address *</label>
                <Textarea
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  placeholder="House number, Street, Ward, PIN Code..."
                  className="mt-1 min-h-[70px] border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-700">Phone Number (Optional)</label>
                <Input
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 border-stone-300 text-xs"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700">
                  <AlertCircle className="size-3.5 flex-shrink-0" /> {error}
                </div>
              )}

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !selectedComplaintId}
                className="w-full font-bold text-white bg-[#D95D0F] hover:bg-orange-700 uppercase tracking-wider text-xs py-5 rounded-xl shadow-sm"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Drafting with Gemini AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" /> Generate Official RTI Application
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Letter Output */}
        <div className="lg:col-span-3">
          <Card className="h-full border-stone-200 shadow-sm flex flex-col">
            <CardHeader className="border-b py-3.5 px-5 border-stone-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#D95D0F]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  RTI Draft Application
                </CardTitle>
                {daysPending !== null && (
                  <Badge variant="outline" className="text-[10px] border-red-200 bg-red-50 text-red-700 font-bold">
                    {daysPending} days pending
                  </Badge>
                )}
              </div>
              {letter && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs h-8">
                    {copied ? (
                      <>
                        <CheckCircle className="size-3.5 mr-1 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                  <Button size="sm" onClick={handleDownloadPDF} className="text-xs h-8 bg-[#D95D0F] text-white hover:bg-orange-700 font-bold">
                    <Download className="size-3.5 mr-1" /> Download PDF
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-5 flex-1">
              {!letter && !generating && (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <Scale className="size-12 mb-3 text-stone-300" />
                  <p className="text-sm font-bold text-slate-700">Your Official RTI Notice will appear here</p>
                  <p className="text-xs mt-1 text-slate-500 max-w-sm">
                    Select an open complaint, enter your details, and click Generate to produce a compliant legal draft.
                  </p>
                </div>
              )}

              {generating && (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <Sparkles className="size-8 animate-pulse mb-3 text-[#D95D0F]" />
                  <p className="text-sm font-bold text-slate-800">Gemini AI is generating your RTI Notice...</p>
                  <p className="text-xs mt-1 text-slate-500">
                    Applying Sections 6(1), 7(1), and Citizens' SLA provisions
                  </p>
                </div>
              )}

              {letter && (
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono p-4 rounded-xl border border-stone-200 bg-white text-slate-900 overflow-auto max-h-[580px] shadow-inner">
                  {letter}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
