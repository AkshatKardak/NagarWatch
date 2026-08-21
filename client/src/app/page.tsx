"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Bell,
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
  ChevronRight,
  Building2,
  Activity,
  Layers,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ─── Live Ticker Mock Data ─────────────────────────────────────── */
const LIVE_ACTIONS = [
  { text: "Pothole repaired in Ward 7 (Indiranagar)", time: "2 min ago", type: "resolved", color: "#10B981" },
  { text: "Garbage overflow reported in Ward 3 (MG Road)", time: "4 min ago", type: "reported", color: "#EF4444" },
  { text: "Streetlight SLA verified in Ward 12 (Kothrud)", time: "6 min ago", type: "progress", color: "#F59E0B" },
  { text: "RTI Draft generated for Ward 5 water issue", time: "11 min ago", type: "escalated", color: "#8B5CF6" },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_ACTIONS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden border-b border-stone-200/70 bg-gradient-to-b from-[#F9F6F0] via-[#FAF7F2] to-[#FDFBF7]">
        {/* Subtle geometric background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-orange-400/10 via-amber-300/10 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/80 px-3.5 py-1.5 text-xs font-semibold text-[#D95D0F] shadow-sm backdrop-blur">
                <span className="flex h-2 w-2 rounded-full bg-[#D95D0F] animate-ping" />
                <Sparkles className="size-3.5 text-[#D95D0F]" />
                <span>Trusted by 50,000+ Citizens Across Municipal Wards</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Report Civic Issues. <br />
                <span className="text-[#D95D0F] underline decoration-orange-300/60 decoration-wavy underline-offset-8">
                  Get Results.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
                NagarWatch connects citizens directly with municipal authorities and contractors.
                Backed by <strong>Gemini AI verification</strong>, <strong>What3Words micro-pinpointing</strong>,
                and <strong>automatic RTI Act 2005 escalations</strong> for total accountability.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link href="/citizen/submit">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto font-bold text-sm uppercase tracking-wider px-6 py-6 rounded-xl text-white shadow-lg shadow-orange-900/10 hover:shadow-orange-900/20 hover:scale-[1.02] transition-all"
                    style={{ backgroundColor: "#D95D0F" }}
                  >
                    <MapPin className="size-4 mr-2" />
                    File a Complaint
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/map">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto font-bold text-sm uppercase tracking-wider px-6 py-6 rounded-xl border-stone-300 hover:bg-stone-100/70 transition-all"
                  >
                    View Live Ward Map
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-200/80 text-xs sm:text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>100% Free & Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Real-Time SLA Timer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Auto RTI Escalation</span>
                </div>
              </div>

              {/* Live Ticker Banner */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white/80 shadow-sm text-xs text-slate-700">
                <span className="flex items-center gap-1 font-bold text-[#D95D0F] bg-orange-100/70 px-2 py-0.5 rounded-md shrink-0">
                  <Activity className="size-3.5 animate-pulse" /> LIVE
                </span>
                <p className="truncate font-medium flex-1">
                  {LIVE_ACTIONS[tickerIndex].text}
                </p>
                <span className="text-slate-400 text-[11px] shrink-0">
                  {LIVE_ACTIONS[tickerIndex].time}
                </span>
              </div>
            </motion.div>

            {/* Right Column: Interactive App Preview Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/60 border border-orange-200/70 shadow-2xl shadow-stone-900/5">
                {/* Header of preview card */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-auto items-center justify-center">
                      <Image
                        src="/Navbar.png"
                        alt="NagarWatch Hub"
                        width={280}
                        height={70}
                        className="h-10 w-auto object-contain drop-shadow-sm"
                        priority
                      />
                    </div>
                    <div className="hidden sm:block border-l border-stone-300 pl-3">
                      <p className="text-xs font-extrabold text-slate-900">Ward Hub</p>
                      <p className="text-[10px] text-slate-500 font-medium">Smart Civic Intelligence</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300/60 px-3 py-1 rounded-full shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                    System Active
                  </span>
                </div>

                {/* 4 Interactive Feature Showcase Cards */}
                <div className="grid grid-cols-2 gap-3.5">
                  <Card className="border border-stone-200/90 bg-white/90 shadow-sm hover:shadow-md transition-all hover:border-orange-300 group cursor-default">
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#D95D0F] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <MapPin className="size-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">What3Words GPS</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        3m x 3m exact micro-location & landmark detection
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-stone-200/90 bg-white/90 shadow-sm hover:shadow-md transition-all hover:border-orange-300 group cursor-default">
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Sparkles className="size-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Gemini AI Vision</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Auto-detects severity, category & duplicate issues
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-stone-200/90 bg-white/90 shadow-sm hover:shadow-md transition-all hover:border-orange-300 group cursor-default">
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Clock className="size-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">SLA Enforcement</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Guaranteed resolution timeframes & alerts
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-stone-200/90 bg-white/90 shadow-sm hover:shadow-md transition-all hover:border-orange-300 group cursor-default">
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Scale className="size-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Auto RTI 2005</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Instant legal notice generator & PDF download
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Micro scorecard below */}
                <div className="mt-4 p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <HardHat className="size-4 text-[#D95D0F]" />
                    <span className="font-semibold text-slate-800">Contractor Transparency</span>
                  </div>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    94.2% On-Time
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#1E293B] text-white py-14 border-y border-slate-800">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-slate-700/60">
            <motion.div whileHover={{ scale: 1.05 }} className="px-2">
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-orange-400 mb-1">
                50,000+
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wider">
                Complaints Resolved
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} className="px-2">
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-emerald-400 mb-1">
                85.4%
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wider">
                Resolution Rate
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} className="px-2">
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-400 mb-1">
                24 Hours
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wider">
                Avg Response Time
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} className="px-2">
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-amber-400 mb-1">
                15 Wards
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wider">
                Under Active Watch
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section (6 Deep Capability Cards) */}
      <section id="features" className="py-20 md:py-28 bg-[#FAF8F5]">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[#D95D0F] font-bold text-xs uppercase tracking-widest px-3 py-1">
              Platform Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Speed, Precision & Legal Accountability
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Every tool a citizen or municipal commissioner needs to transform local governance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#D95D0F] flex items-center justify-center">
                    <MapPin className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">What3Words Micro-Location</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Identify issues down to a 3m x 3m square using What3Words addressing, GPS coordinates, and AI vision landmark verification.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">AI Duplicate Detection</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Intelligent vision and geospatial embeddings prevent duplicate spam and cluster complaints to boost municipal repair priorities.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Clock className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">SLA Countdown & Tracking</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Every issue is bound by strict resolution timelines. Real-time countdown timers notify authorities before breaches occur.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 4 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Scale className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Automated RTI Escalation</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Unresolved complaints after 30 days automatically generate formatted Right to Information Act 2005 applications with official PDF downloads.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 5 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <HardHat className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Contractor Scorecards</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Public contractor rankings, on-time completion rates, and post-resolution citizen reviews create total financial transparency.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 6 */}
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
              <Card className="h-full border border-stone-200 bg-white shadow-sm hover:shadow-lg hover:border-orange-300 transition-all rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Globe2 className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Multi-Language i18n</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Full native support for English, Hindi (हिंदी), and Marathi (मराठी) ensures civic engagement is accessible to every citizen.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white border-y border-stone-200">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-stone-300 text-slate-700 font-bold text-xs uppercase tracking-widest px-3 py-1">
              Step-by-Step
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              How NagarWatch Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Fixing civic issues takes less than 2 minutes from your smartphone or desktop.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#D95D0F] text-white flex items-center justify-center text-xl font-extrabold mx-auto shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Snap & File</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Take a quick photo of the road damage, garbage, or dark street. AI auto-detects category and location.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#1E293B] text-white flex items-center justify-center text-xl font-extrabold mx-auto shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Authority Dispatched</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Assigned to the ward engineer and licensed contractor with an active SLA timer and real-time status updates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-extrabold mx-auto shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Verify & Rate</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Review before/after proof photos, verify the fix, and rate the contractor's work for public accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof & Testimonials */}
      <section className="py-20 md:py-24 bg-[#FAF8F5] border-b border-stone-200">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Citizens Holding Cities Accountable
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Real stories from residents who solved chronic issues using NagarWatch.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-stone-200 bg-white p-6 rounded-2xl space-y-3 shadow-sm">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-slate-700 text-xs sm:text-sm italic leading-relaxed">
                "A dangerous pothole on our main school road was ignored for 6 months. Filed on NagarWatch, reached SLA escalation, and was fixed in 48 hours!"
              </p>
              <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#D95D0F] font-bold text-xs flex items-center justify-center">
                  AK
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Ananya K.</p>
                  <p className="text-[10px] text-slate-500">Ward 8 Resident</p>
                </div>
              </div>
            </Card>

            <Card className="border border-stone-200 bg-white p-6 rounded-2xl space-y-3 shadow-sm">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-slate-700 text-xs sm:text-sm italic leading-relaxed">
                "The What3Words pinpointing made sure the municipal water supply truck arrived at the exact underground pipe leak without phone calls."
              </p>
              <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center">
                  RS
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Rahul Sharma</p>
                  <p className="text-[10px] text-slate-500">Ward 4 Resident</p>
                </div>
              </div>
            </Card>

            <Card className="border border-stone-200 bg-white p-6 rounded-2xl space-y-3 shadow-sm">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-slate-700 text-xs sm:text-sm italic leading-relaxed">
                "The automated RTI generator was unbelievable. When our drainage issue breached 30 days, the generated PDF forced an immediate municipal inspection."
              </p>
              <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs flex items-center justify-center">
                  PD
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Pooja Deshmukh</p>
                  <p className="text-[10px] text-slate-500">Ward 11 Resident</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10 text-center space-y-6">
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs font-bold uppercase tracking-widest px-3 py-1">
            Join the Movement
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Ready to Build a Cleaner, Safer City?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Report your first civic issue in less than 2 minutes. Free, transparent, and legally empowered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/citizen/submit">
              <Button
                size="lg"
                className="w-full sm:w-auto font-bold text-sm uppercase tracking-wider px-8 py-6 rounded-xl text-white shadow-xl hover:scale-105 transition-all"
                style={{ backgroundColor: "#D95D0F" }}
              >
                File a Complaint Now
              </Button>
            </Link>
            <Link href="/contractors">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto font-bold text-sm uppercase tracking-wider px-8 py-6 rounded-xl border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 transition-all"
              >
                Inspect Contractor Scorecards
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-slate-400 text-xs border-t border-stone-800 py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image src="/Navbar.png" alt="NagarWatch" width={180} height={45} className="h-8 w-auto invert opacity-90" />
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              India's premier civic engagement platform empowering citizens with AI vision, What3Words accuracy, and RTI legal escalations.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Quick Links</p>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/map" className="hover:text-white transition">Live Civic Map</Link></li>
              <li><Link href="/complaints" className="hover:text-white transition">Public Complaints Feed</Link></li>
              <li><Link href="/contractors" className="hover:text-white transition">Contractor Rankings</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition">Municipal Analytics</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Legal & Governance</p>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/citizen/rti" className="hover:text-white transition">Right to Information (RTI 2005)</Link></li>
              <li><Link href="/docs" className="hover:text-white transition">SLA Escalation Matrix</Link></li>
              <li><a href="#" className="hover:text-white transition">Open Civic Data API</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy & Citizen Charter</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Emergency Helplines</p>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5"><PhoneCall className="size-3 text-orange-400" /> Municipal Control Room: 1916</li>
              <li className="flex items-center gap-1.5"><PhoneCall className="size-3 text-blue-400" /> Water Supply Emergency: 1913</li>
              <li className="flex items-center gap-1.5"><PhoneCall className="size-3 text-amber-400" /> Electricity Board: 1912</li>
              <li className="flex items-center gap-1.5"><PhoneCall className="size-3 text-red-400" /> Disaster Management: 108</li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 max-w-7xl mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} NagarWatch. Built for Indian Municipal Governance.</p>
          <p>Version 2.4.0 · Production Ready</p>
        </div>
      </footer>
    </div>
  );
}