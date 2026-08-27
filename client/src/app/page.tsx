"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  TrendingUp,
  Shield,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Scale,
  HardHat,
  Globe2,
  FileCheck2,
  PhoneCall,
  Activity,
  Mic,
  Camera,
  Flame,
  Building,
  Check,
  Award,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ─── Real-Time Live Civic Pulses ────────────────────────────────── */
const LIVE_PULSES = [
  { text: "Pothole bitumen repair completed in Ward 7 (Indiranagar)", time: "Just now", type: "resolved", color: "#10B981" },
  { text: "Garbage overflow reported near Central Market (Ward 3)", time: "2 min ago", type: "reported", color: "#EF4444" },
  { text: "Citizen approved Before/After photo proof in Ward 12", time: "5 min ago", type: "verified", color: "#10B981" },
  { text: "CPWD Class I Contractor assigned to MG Road drainage work", time: "8 min ago", type: "contractor", color: "#3B82F6" },
  { text: "RTI Act 2005 petition auto-drafted for water supply delay", time: "12 min ago", type: "escalated", color: "#8B5CF6" },
];

/* ─── Civic Issue Categories ─────────────────────────────────────── */
const CIVIC_CATEGORIES = [
  { name: "Potholes & Roads", icon: "🛣️", sla: "72h SLA", count: "12,400+ fixed", color: "bg-orange-50 text-[#D95D0F] border-orange-200" },
  { name: "Garbage & Waste", icon: "🗑️", sla: "24h SLA", count: "18,200+ cleared", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Water Supply & Leaks", icon: "💧", sla: "24h SLA", count: "9,600+ restored", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Streetlights & Power", icon: "💡", sla: "48h SLA", count: "7,800+ repaired", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Drainage & Flooding", icon: "🌊", sla: "36h SLA", count: "6,100+ unblocked", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { name: "Public Safety & Sanitation", icon: "🚸", sla: "48h SLA", count: "4,500+ resolved", color: "bg-purple-50 text-purple-700 border-purple-200" },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [pulseIndex, setPulseIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"ai" | "map" | "verify" | "contractor">("map");

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % LIVE_PULSES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 selection:bg-orange-500 selection:text-white font-sans">
      {/* Navigation Bar */}
      <Navbar />

      {/* ── 1. HERO SECTION ── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden border-b border-stone-200/80 bg-gradient-to-b from-[#F7F4EE] via-[#FAF8F5] to-[#FAF8F5]">
        {/* Ambient background blur elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-orange-400/15 via-amber-300/10 to-emerald-400/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Official Trust Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/80 bg-orange-50/90 px-3.5 py-1.5 text-xs font-bold text-[#D95D0F] shadow-xs backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-[#D95D0F] animate-ping" />
                <Sparkles className="size-3.5 text-[#D95D0F]" />
                <span>India&apos;s Real-Time Civic Operating System</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
                Report Civic Issues. <br />
                <span className="text-[#D95D0F] underline decoration-orange-300 decoration-wavy underline-offset-8">
                  Demand Action.
                </span>{" "}
                Track Results.
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
                NagarWatch bridges Indian citizens directly with municipal authorities and official{" "}
                <strong className="text-slate-900 font-semibold">CPWD-enlisted contractors</strong>.
                Backed by <strong>Gemini AI triage</strong>, <strong>Before/After citizen verification</strong>,
                <strong>Sovereign India heatmaps</strong>, and <strong>RTI Act 2005 legal drafting</strong>.
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link href="/citizen/submit">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto font-black text-xs uppercase tracking-wider px-7 py-6 rounded-xl text-white shadow-xl shadow-orange-950/15 hover:shadow-orange-950/25 hover:scale-[1.02] active:scale-[0.98] transition-all bg-[#D95D0F] hover:bg-[#C24E07]"
                  >
                    <MapPin className="size-4 mr-2" />
                    File a Grievance
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/map">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto font-black text-xs uppercase tracking-wider px-7 py-6 rounded-xl border-stone-300 bg-white hover:bg-stone-100/80 text-slate-800 transition-all shadow-xs"
                  >
                    <Flame className="size-4 mr-2 text-[#D95D0F]" />
                    View Live Civic Map & Heatmap
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators Pill Bar */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-200 text-xs sm:text-sm font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>100% Free & Public</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Strict SLA Timers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>CPWD Contractor Audit</span>
                </div>
              </div>

              {/* Live Ticker Banner */}
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-stone-200 bg-white shadow-sm text-xs text-slate-700">
                <span className="flex items-center gap-1.5 font-black text-[#D95D0F] bg-orange-100 px-2.5 py-1 rounded-lg shrink-0 uppercase text-[10px] tracking-wider">
                  <Activity className="size-3.5 animate-pulse" /> LIVE PULSE
                </span>
                <p className="truncate font-semibold flex-1 text-slate-800">
                  {LIVE_PULSES[pulseIndex].text}
                </p>
                <span className="text-slate-400 text-[11px] font-medium shrink-0">
                  {LIVE_PULSES[pulseIndex].time}
                </span>
              </div>
            </motion.div>

            {/* Right Hero Column: Interactive Intelligence Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-white via-stone-50 to-orange-50/50 border border-orange-200/80 shadow-2xl shadow-stone-900/10 space-y-4">
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src="/favicon.png"
                      alt="NagarWatch Icon"
                      width={36}
                      height={36}
                      className="rounded-xl shadow-xs"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Civic Intelligence Hub
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Republic of India Sovereign Portal</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                    LIVE 24/7
                  </span>
                </div>

                {/* 4 Feature Deep Capability Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border border-stone-200 bg-white p-3.5 rounded-2xl shadow-xs hover:border-orange-300 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#D95D0F] flex items-center justify-center mb-2">
                      <Flame className="size-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">India Civic Heatmap</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Sovereign bounded map with density hotspot tracking
                    </p>
                  </Card>

                  <Card className="border border-stone-200 bg-white p-3.5 rounded-2xl shadow-xs hover:border-orange-300 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                      <Sparkles className="size-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Gemini AI Assistant</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Auto-categorizes severity, dept, and SLA routing
                    </p>
                  </Card>

                  <Card className="border border-stone-200 bg-white p-3.5 rounded-2xl shadow-xs hover:border-orange-300 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                      <Camera className="size-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Citizen Proof Audit</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Before/After photo matrix with confirm/reopen flow
                    </p>
                  </Card>

                  <Card className="border border-stone-200 bg-white p-3.5 rounded-2xl shadow-xs hover:border-orange-300 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                      <Scale className="size-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Legal RTI 2005</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Auto-generates Sec 6(1) petitions on SLA delay
                    </p>
                  </Card>
                </div>

                {/* CPWD Live Reliability Scorecard Footer */}
                <div className="p-3 bg-white border border-stone-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <HardHat className="size-4 text-[#D95D0F]" />
                    <span className="font-bold text-slate-800 text-[11px]">CPWD Contractor Registry</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-extrabold">
                    87/100 Avg Quality Score
                  </Badge>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. HIGH-IMPACT STATS BAR ── */}
      <section className="bg-[#0F172A] text-white py-12 border-y border-slate-800 shadow-inner">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center items-center justify-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <motion.div whileHover={{ scale: 1.03 }} className="pt-4 md:pt-0 px-3 space-y-1">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-orange-400 tracking-tight">
                50,000+
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
                Complaints Resolved
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="pt-4 md:pt-0 px-3 space-y-1">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">
                85.4%
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
                SLA Resolution Rate
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="pt-4 md:pt-0 px-3 space-y-1">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-400 tracking-tight">
                24 Hours
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
                Avg Response Speed
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="pt-4 md:pt-0 px-3 space-y-1">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-400 tracking-tight">
                15 Wards
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
                Under Active Watch
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. SIX CORE PLATFORM CAPABILITIES ── */}
      <section id="features" className="py-20 md:py-28 bg-[#FAF8F5]">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[#D95D0F] font-bold text-xs uppercase tracking-widest px-3 py-1">
              Engineered for Indian Governance
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Speed, Scientific Precision & Legal Accountability
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Every tool required for residents, ward officers, and municipal commissioners to run a transparent city.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Capability 1 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-3xl p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#D95D0F] flex items-center justify-center">
                  <Flame className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">National India Map & Heatmap</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Interactive Leaflet map bounded to the Republic of India with real-time geospatial markers, density cluster heatmaps, and 50m duplicate prevention.
                </p>
              </Card>
            </motion.div>

            {/* Capability 2 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-3xl p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Activity className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Explainable Ward Health Scores</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Deterministic 0–100 municipal health score calculating SLA timeliness, resolution rates, low reopening ratios, and backlog density with diagnostic insights.
                </p>
              </Card>
            </motion.div>

            {/* Capability 3 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-3xl p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Camera className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Citizen Photo Verification</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Authorities upload mandatory resolution proof. Citizens inspect Before vs After photo proofs to approve resolution or reopen substandard repairs.
                </p>
              </Card>
            </motion.div>

            {/* Capability 4 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-3xl p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <HardHat className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Official CPWD Contractor Engine</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Integrated with official Central Public Works Department dataset. Auto-checks debarred blacklists, verifies Class I-V licenses, and scores reliability.
                </p>
              </Card>
            </motion.div>

            {/* Capability 5 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-3xl p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Globe2 className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Multilingual & Voice Input</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Native support for English, हिन्दी, and मराठी with in-browser voice recording, speech-to-text transcript generation, and automated translations.
                </p>
              </Card>
            </motion.div>

            {/* Capability 6 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-3xl p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Scale className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Automated RTI 2005 Filings</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  When a civic grievance exceeds statutory 30-day deadlines, NagarWatch drafts complete Section 6(1) Right to Information petitions with official PDF download.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 4. COMMON CIVIC GRIEVANCE CATEGORIES ── */}
      <section className="py-16 md:py-20 bg-white border-y border-stone-200">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <Badge variant="outline" className="border-stone-300 text-slate-700 font-bold text-xs uppercase tracking-widest px-3 py-1 mb-2">
                Municipal Services
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Civic Issues Handled with Enforced SLAs
              </h2>
            </div>
            <Link href="/citizen/submit">
              <Button variant="outline" className="text-xs font-bold border-stone-300 text-slate-800">
                Report Any Civic Issue <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {CIVIC_CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-stone-200 bg-[#FAF8F5] text-center space-y-2 hover:border-orange-300 hover:shadow-md transition-all group"
              >
                <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">{cat.name}</h4>
                <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white border border-stone-200 text-slate-700">
                  {cat.sla}
                </span>
                <p className="text-[10px] text-slate-500">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS (3 STEPS) ── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-stone-200">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-stone-300 text-slate-700 font-bold text-xs uppercase tracking-widest px-3 py-1">
              Simple 3-Step Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              How NagarWatch Delivers Results
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Fixing local civic infrastructure takes less than 2 minutes from your smartphone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-3.5 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#D95D0F] text-white flex items-center justify-center text-xl font-black mx-auto shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Snap Photo or Voice Record</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Capture the road hazard or speak your grievance in Hindi, Marathi, or English. Gemini AI auto-detects category and location.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-3.5 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center text-xl font-black mx-auto shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">CPWD Contractor Dispatched</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Work order assigned to verified municipal contractor with strict SLA countdown timer and automated escalation triggers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-3.5 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-black mx-auto shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Citizen Verification & Close</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Inspect side-by-side Before/After repair photos. Approve the resolution or reopen with one click if the work is incomplete.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CITIZEN TESTIMONIALS ── */}
      <section className="py-20 md:py-24 bg-white border-b border-stone-200">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Verified Stories from Residents Across India
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              How everyday citizens solved chronic civic issues in their neighborhoods.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-stone-200 bg-[#FAF8F5] p-6 rounded-3xl space-y-3 shadow-xs">
              <div className="flex text-amber-400 gap-1 text-sm font-bold">★★★★★</div>
              <p className="text-slate-700 text-xs sm:text-sm italic leading-relaxed">
                &ldquo;A deep pothole on our school bus route was ignored for months. Filed on NagarWatch, hit SLA countdown, and the CPWD contractor fixed it within 48 hours!&rdquo;
              </p>
              <div className="pt-3 border-t border-stone-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#D95D0F] font-black text-xs flex items-center justify-center">
                  AK
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Ananya Kulkarni</p>
                  <p className="text-[10px] text-slate-500">Ward 8 Resident (Pune)</p>
                </div>
              </div>
            </Card>

            <Card className="border border-stone-200 bg-[#FAF8F5] p-6 rounded-3xl space-y-3 shadow-xs">
              <div className="flex text-amber-400 gap-1 text-sm font-bold">★★★★★</div>
              <p className="text-slate-700 text-xs sm:text-sm italic leading-relaxed">
                &ldquo;The Before vs After photo verification card is brilliant. When a contractor marked a drain repair without cleaning silt, I clicked Reopen and got it completed properly.&rdquo;
              </p>
              <div className="pt-3 border-t border-stone-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 font-black text-xs flex items-center justify-center">
                  RS
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Rahul Sharma</p>
                  <p className="text-[10px] text-slate-500">Ward 4 Resident (Bengaluru)</p>
                </div>
              </div>
            </Card>

            <Card className="border border-stone-200 bg-[#FAF8F5] p-6 rounded-3xl space-y-3 shadow-xs">
              <div className="flex text-amber-400 gap-1 text-sm font-bold">★★★★★</div>
              <p className="text-slate-700 text-xs sm:text-sm italic leading-relaxed">
                &ldquo;The RTI generator is a gamechanger. When a pipeline repair dragged past 30 days, the auto-drafted Section 6(1) notice spurred an immediate ward inspection.&rdquo;
              </p>
              <div className="pt-3 border-t border-stone-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 font-black text-xs flex items-center justify-center">
                  PD
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Pooja Deshmukh</p>
                  <p className="text-[10px] text-slate-500">Ward 11 Resident (Mumbai)</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 7. CALL TO ACTION BANNER ── */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10 text-center space-y-6">
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs font-bold uppercase tracking-widest px-3 py-1">
            Empower Your Ward
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Ready to Build a Cleaner, Safer City?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Report your first civic issue in under 2 minutes. Free, transparent, and legally protected under Indian municipal governance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
            <Link href="/citizen/submit">
              <Button
                size="lg"
                className="w-full sm:w-auto font-black text-xs uppercase tracking-wider px-8 py-6 rounded-xl text-white shadow-xl hover:scale-105 transition-all bg-[#D95D0F] hover:bg-[#C24E07]"
              >
                File a Grievance Now
              </Button>
            </Link>
            <Link href="/map">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto font-black text-xs uppercase tracking-wider px-8 py-6 rounded-xl border-slate-700 bg-slate-800/90 text-white hover:bg-slate-700 transition-all"
              >
                Open Sovereign India Map
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. MUNICIPAL EMERGENCY FOOTER ── */}
      <footer className="bg-[#0C0A09] text-slate-400 text-xs border-t border-stone-800 py-14">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image src="/Navbar.png" alt="NagarWatch" width={190} height={48} className="h-8 w-auto invert opacity-95" />
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              India&apos;s real-time civic intelligence and governance platform empowering citizens with AI vision, CPWD contractor transparency, and RTI Act 2005 legal enforcement.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-2.5">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Quick Access</p>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/map" className="hover:text-white transition">Live Civic Map & Heatmap</Link></li>
              <li><Link href="/complaints" className="hover:text-white transition">Public Grievances Feed</Link></li>
              <li><Link href="/contractors" className="hover:text-white transition">CPWD Contractor Scorecards</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition">Ward Health Index</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal & Governance */}
          <div className="space-y-2.5">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Legal & Governance</p>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/citizen/rti" className="hover:text-white transition">Right to Information (RTI 2005)</Link></li>
              <li><Link href="/docs" className="hover:text-white transition">Citizen Charter & SLA Timers</Link></li>
              <li><a href="#" className="hover:text-white transition">Open Civic Data API</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy & Data Protection</a></li>
            </ul>
          </div>

          {/* Column 4: Emergency Helplines */}
          <div className="space-y-2.5">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Emergency Civic Helplines</p>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5"><PhoneCall className="size-3 text-orange-400" /> Municipal Control Room: 1916</li>
              <li className="flex items-center gap-1.5"><PhoneCall className="size-3 text-blue-400" /> Water Supply Emergency: 1913</li>
              <li className="flex items-center gap-1.5"><PhoneCall className="size-3 text-amber-400" /> Electricity Board: 1912</li>
              <li className="flex items-center gap-1.5"><PhoneCall className="size-3 text-red-400" /> Disaster Management: 108</li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 max-w-7xl mt-10 pt-6 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} NagarWatch. Built for Indian Municipal Governance.</p>
        </div>
      </footer>
    </div>
  );
}