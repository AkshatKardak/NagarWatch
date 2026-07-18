"use client"

import { BarChart3, Camera, CheckCircle, Clock, Eye, Map, MapPin, Shield, ThumbsUp, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function LivePulse() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span className="text-xs font-semibold text-green-400">Live</span>
    </span>
  );
}

function StatsBar() {
  const complaints = useAnimatedCounter(12400);
  const resolved = useAnimatedCounter(78);
  const cities = useAnimatedCounter(18);

  const stats = [
    { value: `${complaints.toLocaleString()}+`, label: "Total Complaints Reported", trend: "+142 today", trendUp: true },
    { value: `${resolved}%`, label: "Resolved This Month", trend: "+4% vs last month", trendUp: true },
    { value: `${cities}`, label: "Cities Active", trend: "2 cities added this week", trendUp: true },
  ];

  return (
    <section className="border-b py-10" style={{ backgroundColor: "#FFFFFF", borderColor: "#ECE7DE" }}>
      <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-3">
        {stats.map(({ value, label, trend, trendUp }) => (
          <div key={label} className="border p-6 rounded-lg" style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}>
            <p className="text-3xl font-extrabold" style={{ color: "#D95D0F" }}>{value}</p>
            <p className="mt-1 text-sm" style={{ color: "#4B5563" }}>{label}</p>
            <p className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: trendUp ? "#2E6A42" : "#ef4444" }}>
              <TrendingUp className="size-3" />{trend}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const features = [
    { icon: Map, title: "Public Civic Map", text: "All issues visible on a live city map — no login required" },
    { icon: Zap, title: "Real-Time Updates", text: "Socket.io powered instant notifications on every status change" },
    { icon: ThumbsUp, title: "Community Upvoting", text: "Upvote issues to push them up the authority priority queue" },
    { icon: Shield, title: "Proof-Based Resolution", text: "Mandatory before & after photos to close any complaint" },
    { icon: Clock, title: "SLA Enforcement", text: "Deadlines per category, auto-escalation up the chain on breach" },
    { icon: BarChart3, title: "Analytics Dashboard", text: "Ward-level insights, resolution rates, and trend reports" },
  ];

  const steps = [
    { icon: Camera, title: "Report", text: "Submit issue with photo, description, category and GPS location" },
    { icon: Eye, title: "Track", text: "Follow real-time progress — Pending → In Progress → Resolved" },
    { icon: CheckCircle, title: "Resolve", text: "Authorities close with proof photos. Full before/after visible." },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F6F1" }}>
      <Navbar />

      {/* ─── HERO SECTION ─── */}
      <section
        className="relative min-h-[78vh] pt-16 text-white overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1A0A00 0%, #8B2500 30%, #D95D0F 60%, #2E6A42 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: "#D95D0F" }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: "#2E6A42" }} />

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-6 py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 border border-white/20" style={{ backgroundColor: "rgba(217,93,15,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              India&apos;s Civic Intelligence Platform
            </span>

            <h1 className="text-5xl font-extrabold tracking-tight leading-none md:text-7xl">
              Report.<br />
              Track.<br />
              <span style={{ color: "#FDBA74" }}>Resolve.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl leading-relaxed">
              NagarWatch bridges citizens and local authorities. Report civic issues, track progress in real time, and hold your municipality accountable — transparently.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="font-bold px-6 py-3 text-white shadow-lg" style={{ backgroundColor: "#D95D0F" }}>
                <Link href="/map">View Live Map</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 font-bold px-6 py-3">
                <Link href="/citizen/submit">Report an Issue</Link>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Users className="size-4" /> Community-driven prioritization</span>
              <span className="flex items-center gap-1.5"><Shield className="size-4" /> Proof-based resolution</span>
              <span className="flex items-center gap-1.5"><Clock className="size-4" /> SLA-enforced deadlines</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ANIMATED STATS BAR ─── */}
      <StatsBar />

      <main>
        {/* ─── HOW IT WORKS ─── */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-3xl font-extrabold" style={{ color: "#1F2937" }}>How it works</h2>
          <p className="mt-2 text-sm" style={{ color: "#4B5563" }}>Three simple steps from report to resolution.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="border p-6 rounded-lg relative overflow-hidden" style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}>
                  <span className="absolute top-4 right-5 text-5xl font-black opacity-5 select-none pointer-events-none" style={{ color: "#D95D0F" }}>{i + 1}</span>
                  <Icon className="size-7" style={{ color: "#2E6A42" }} />
                  <h3 className="mt-4 font-bold text-base" style={{ color: "#1F2937" }}>{step.title}</h3>
                  <p className="mt-2 text-sm" style={{ color: "#4B5563" }}>{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── PLATFORM FEATURES ─── */}
        <section className="py-16" style={{ backgroundColor: "#F8F6F1" }}>
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-extrabold" style={{ color: "#1F2937" }}>Platform features</h2>
            <p className="mt-2 text-sm" style={{ color: "#4B5563" }}>Everything a modern civic governance system needs.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="border p-5 rounded-lg group hover:shadow-md transition-shadow" style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "#FFF3EB" }}>
                      <Icon className="size-5" style={{ color: "#D95D0F" }} />
                    </div>
                    <h3 className="font-bold text-sm" style={{ color: "#1F2937" }}>{feature.title}</h3>
                    <p className="mt-1.5 text-sm" style={{ color: "#4B5563" }}>{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── CTA BAND ─── */}
        <section className="py-16" style={{ backgroundColor: "#1A0A00" }}>
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-extrabold text-white">Your city needs you.</h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto">
              Every complaint reported makes your city better. Join thousands of citizens already using NagarWatch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild className="font-bold px-8 py-3 text-white" style={{ backgroundColor: "#D95D0F" }}>
                <Link href="/sign-up">Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-8 py-3">
                <Link href="/complaints">Browse Complaints</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer style={{ backgroundColor: "#111827", borderTop: "1px solid #1F2937" }}>
        {/* Real-time ticker */}
        <div className="border-b" style={{ borderColor: "#1F2937", backgroundColor: "#0D1117" }}>
          <div className="mx-auto max-w-7xl px-6 py-3 flex items-center gap-4 overflow-hidden">
            <LivePulse />
            <div className="flex gap-6 text-xs overflow-x-auto whitespace-nowrap" style={{ color: "rgba(255,255,255,0.45)" }}>
              <span>🟠 Pothole on MG Road, Pune — <span style={{ color: "#D95D0F" }}>In Progress</span></span>
              <span>🟢 Street Light Fixed, Andheri West — <span style={{ color: "#2E6A42" }}>Resolved</span></span>
              <span>🟠 Garbage overflow near Link Rd, Mumbai — <span style={{ color: "#FDBA74" }}>Pending</span></span>
              <span>🟢 Water leakage sealed, Bandra — <span style={{ color: "#2E6A42" }}>Resolved</span></span>
            </div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-white text-lg mb-3">
                <MapPin className="size-5" style={{ color: "#D95D0F" }} />
                NagarWatch
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Bridging citizens and local authorities for a cleaner, more accountable India.
              </p>
              <div className="mt-4 flex gap-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "rgba(217,93,15,0.15)", color: "#D95D0F", border: "1px solid rgba(217,93,15,0.3)" }}>🇮🇳 Made for India</span>
              </div>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Platform</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                <li><Link href="/map" className="hover:text-white transition-colors">Live Map</Link></li>
                <li><Link href="/complaints" className="hover:text-white transition-colors">Browse Complaints</Link></li>
                <li><Link href="/citizen/submit" className="hover:text-white transition-colors">Report an Issue</Link></li>
                <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
              </ul>
            </div>

            {/* Account links */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Account</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                <li><Link href="/sign-in" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/sign-up" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link href="/sign-up?role=authority" className="hover:text-white transition-colors">Authority Portal</Link></li>
              </ul>
            </div>

            {/* Live stats */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                Real-time Stats <LivePulse />
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Open Issues</span>
                  <span className="font-bold" style={{ color: "#FDBA74" }}>2,741</span>
                </li>
                <li className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Resolved Today</span>
                  <span className="font-bold" style={{ color: "#2E6A42" }}>89</span>
                </li>
                <li className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Active Cities</span>
                  <span className="font-bold" style={{ color: "#D95D0F" }}>18</span>
                </li>
                <li className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Avg Resolution</span>
                  <span className="font-bold text-white">3.2 days</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t" style={{ borderColor: "#1F2937" }}>
          <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Built for Indian cities — © 2026 NagarWatch. All rights reserved.</p>
            <div className="flex gap-5 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
