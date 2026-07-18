"use client";

import {
  AlertCircle, ArrowRight, BarChart3, CheckCircle, Clock,
  Github, Globe, Map, MapPin, Shield, ThumbsUp,
  TrendingUp, Users, Zap, Activity, Wifi, ChevronRight,
  Building2, Bell, Star, Award, Layers
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

/* ─── Utility hooks ─────────────────────────────────────────────── */
function useAnimatedCounter(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let cur = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setValue(target); clearInterval(t); }
      else setValue(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration, start]);
  return value;
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Sub-components ────────────────────────────────────────────── */
function LivePulse({ size = "sm" }: { size?: "sm" | "md" }) {
  const s = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex" style={{ width: size === "md" ? 10 : 8, height: size === "md" ? 10 : 8 }}>
        <span className={`absolute inline-flex ${s} animate-ping rounded-full bg-green-400 opacity-75`} />
        <span className={`relative inline-flex ${s} rounded-full bg-green-500`} />
      </span>
      <span className={`font-bold text-green-500 ${size === "md" ? "text-xs" : "text-[10px]"}`}>LIVE</span>
    </span>
  );
}

const FEED_ITEMS = [
  { color: "#DC2626", cat: "Water Leakage", ward: "Ward 8", time: "12s ago", status: "Reported" },
  { color: "#F59E0B", cat: "Garbage Overflow", ward: "Ward 5", time: "1 min ago", status: "In Progress" },
  { color: "#16A34A", cat: "Streetlight Repaired", ward: "Ward 2", time: "3 min ago", status: "Resolved" },
  { color: "#F59E0B", cat: "Road Damage", ward: "Ward 11", time: "7 min ago", status: "In Progress" },
  { color: "#DC2626", cat: "Open Drain", ward: "Ward 3", time: "9 min ago", status: "Reported" },
  { color: "#16A34A", cat: "Pothole Fixed", ward: "Ward 7", time: "14 min ago", status: "Resolved" },
];

function ActivityFeed() {
  const [items, setItems] = useState(FEED_ITEMS);
  const [flash, setFlash] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const newItem = {
        color: ["#DC2626", "#F59E0B", "#16A34A"][Math.floor(Math.random() * 3)],
        cat: ["Water Leakage", "Pothole", "Garbage", "Streetlight", "Road Damage", "Open Drain"][Math.floor(Math.random() * 6)],
        ward: `Ward ${Math.floor(Math.random() * 15) + 1}`,
        time: "just now",
        status: ["Reported", "In Progress", "Resolved"][Math.floor(Math.random() * 3)],
      };
      setItems((prev) => [newItem, ...prev.slice(0, 5)]);
      setFlash(0);
      setTimeout(() => setFlash(null), 800);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500"
          style={{
            backgroundColor: i === flash ? "rgba(217,93,15,0.06)" : "rgba(255,255,255,0.6)",
            border: "1px solid #ECE7DE",
            transform: i === flash ? "translateX(4px)" : "translateX(0)",
          }}
        >
          <span className="flex h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#1F2937" }}>{item.cat}</p>
            <p className="text-[10px]" style={{ color: "#6B7280" }}>{item.ward}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-medium" style={{ color: item.color }}>{item.status}</p>
            <p className="text-[9px]" style={{ color: "#9CA3AF" }}>{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardMockup() {
  const [count, setCount] = useState(2741);
  useEffect(() => {
    const t = setInterval(() => setCount((c) => c + Math.floor(Math.random() * 3)), 5000);
    return () => clearInterval(t);
  }, []);

  const mapPins = [
    { x: 28, y: 35, color: "#DC2626", label: "Water Leakage" },
    { x: 55, y: 25, color: "#F59E0B", label: "Road Damage" },
    { x: 70, y: 55, color: "#16A34A", label: "Resolved" },
    { x: 40, y: 65, color: "#DC2626", label: "Open Drain" },
    { x: 80, y: 35, color: "#F59E0B", label: "Garbage" },
    { x: 20, y: 70, color: "#16A34A", label: "Fixed" },
    { x: 60, y: 75, color: "#DC2626", label: "Pothole" },
  ];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(236,231,222,0.8)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.10), 0 4px 16px rgba(217,93,15,0.08)",
      }}
    >
      {/* Dashboard header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #ECE7DE", backgroundColor: "rgba(248,246,241,0.9)" }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#DC2626" }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#16A34A" }} />
          </div>
          <span className="text-xs font-bold" style={{ color: "#1F2937" }}>NagarWatch — City Dashboard</span>
        </div>
        <LivePulse size="sm" />
      </div>

      <div className="p-4 space-y-3">
        {/* Mini stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Open", value: count.toLocaleString(), color: "#DC2626" },
            { label: "In Progress", value: "847", color: "#F59E0B" },
            { label: "Resolved", value: "9,280", color: "#16A34A" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: "rgba(248,246,241,0.8)", border: "1px solid #ECE7DE" }}>
              <p className="text-base font-extrabold" style={{ color }}>{value}</p>
              <p className="text-[9px] font-medium" style={{ color: "#6B7280" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Map preview */}
        <div className="relative rounded-xl overflow-hidden" style={{ height: 160, backgroundColor: "#e8f0e8", border: "1px solid #ECE7DE" }}>
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(46,106,66,0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Road lines */}
            <line x1="0" y1="80" x2="100%" y2="80" stroke="rgba(255,255,255,0.7)" strokeWidth="3" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
            <line x1="25%" y1="0" x2="25%" y2="100%" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <line x1="75%" y1="0" x2="75%" y2="100%" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </svg>
          {/* Pins */}
          {mapPins.map((pin, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%,-50%)" }}
            >
              <div className="relative">
                <span
                  className="absolute inline-flex rounded-full animate-ping"
                  style={{ width: 16, height: 16, backgroundColor: pin.color, opacity: 0.4, top: -2, left: -2, animationDelay: `${i * 0.4}s` }}
                />
                <div className="relative w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: pin.color }} />
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="absolute bottom-2 right-2 rounded-lg px-2 py-1.5 flex flex-col gap-1" style={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid #ECE7DE" }}>
            {[{ color: "#DC2626", l: "Pending" }, { color: "#F59E0B", l: "In Progress" }, { color: "#16A34A", l: "Resolved" }].map(({ color, l }) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[8px] font-medium" style={{ color: "#4B5563" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Recent Activity</p>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function StatsSection() {
  const { ref, inView } = useInView();
  const c1 = useAnimatedCounter(12400, 2000, inView);
  const c2 = useAnimatedCounter(9280, 2000, inView);
  const c3 = useAnimatedCounter(38, 1500, inView);
  const c4 = useAnimatedCounter(18, 1200, inView);

  const stats = [
    { value: `${c1.toLocaleString()}+`, label: "Total Complaints", trend: "+12% this month", icon: AlertCircle, color: "#D95D0F" },
    { value: c2.toLocaleString(), label: "Resolved", trend: "78% resolution rate", icon: CheckCircle, color: "#16A34A" },
    { value: `${c3} hrs`, label: "Avg Resolution Time", trend: "-8 hrs vs last month", icon: Clock, color: "#2563EB" },
    { value: c4.toString(), label: "Active Wards", trend: "Across 18 cities", icon: Building2, color: "#8B5CF6" },
  ];

  return (
    <section ref={ref} className="py-20" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D95D0F" }}>Platform Impact</p>
          <h2 className="text-4xl font-extrabold" style={{ color: "#1F2937" }}>Real numbers. Real change.</h2>
          <p className="mt-3 text-base" style={{ color: "#4B5563" }}>Civic accountability at scale across Indian cities.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ value, label, trend, icon: Icon, color }) => (
            <div
              key={label}
              className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default"
              style={{ border: "1px solid #ECE7DE", backgroundColor: "#FFFFFF", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
            >
              <div className="mb-4 inline-flex w-10 h-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
                <Icon className="size-5" style={{ color }} />
              </div>
              <p className="text-4xl font-extrabold tracking-tight" style={{ color: "#1F2937" }}>{value}</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "#4B5563" }}>{label}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <TrendingUp className="size-3" style={{ color: "#16A34A" }} />
                <span className="text-xs font-medium" style={{ color: "#16A34A" }}>{trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ["Hidden complaint filing", "Public live map with all issues"],
    ["Manual follow-up required", "Real-time automated tracking"],
    ["No transparency", "Proof-based resolution with photos"],
    ["Duplicate complaints ignored", "Nearby detection & merging"],
    ["No community input", "Community upvotes & prioritization"],
    ["No SLA enforcement", "Auto-escalation on SLA breach"],
  ];
  return (
    <section className="py-20" style={{ backgroundColor: "#F8F6F1" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D95D0F" }}>Why NagarWatch</p>
          <h2 className="text-4xl font-extrabold" style={{ color: "#1F2937" }}>Traditional systems vs NagarWatch</h2>
          <p className="mt-3 text-base" style={{ color: "#4B5563" }}>A fundamentally better approach to civic governance.</p>
        </div>
        <div className="grid gap-3">
          {/* Header */}
          <div className="grid grid-cols-2 gap-4 px-4">
            <div className="text-center">
              <span className="inline-block rounded-full px-4 py-1.5 text-xs font-bold" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>Traditional Systems</span>
            </div>
            <div className="text-center">
              <span className="inline-block rounded-full px-4 py-1.5 text-xs font-bold" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>NagarWatch</span>
            </div>
          </div>
          {rows.map(([old, nw], i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-2xl px-5 py-4" style={{ backgroundColor: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#DC2626" }} />
                <span className="text-sm" style={{ color: "#374151" }}>{old}</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-5 py-4" style={{ backgroundColor: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.14)" }}>
                <CheckCircle className="size-4 shrink-0" style={{ color: "#16A34A" }} />
                <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{nw}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Map, title: "Interactive Civic Map", color: "#2563EB",
    desc: "Live map of all civic issues across every ward.",
    points: ["Real-time pin updates", "Filter by category & status", "No login required to view"],
  },
  {
    icon: AlertCircle, title: "Complaint Submission", color: "#D95D0F",
    desc: "Submit complaints with GPS, photos, and full context.",
    points: ["GPS auto-location", "Photo evidence upload", "Category & priority tagging"],
  },
  {
    icon: Layers, title: "Nearby Detection", color: "#8B5CF6",
    desc: "Automatically detect and merge duplicate complaints.",
    points: ["500m proximity check", "Auto-merge duplicates", "Upvote existing issues"],
  },
  {
    icon: ThumbsUp, title: "Community Upvoting", color: "#D95D0F",
    desc: "Citizens vote to prioritize the most impactful issues.",
    points: ["Democratic prioritization", "Authority queue ordering", "Momentum tracking"],
  },
  {
    icon: Zap, title: "Real-Time Updates", color: "#F59E0B",
    desc: "Instant Socket.IO notifications on every status change.",
    points: ["Push notifications", "Live status transitions", "History timeline"],
  },
  {
    icon: Shield, title: "Proof-Based Resolution", color: "#16A34A",
    desc: "Mandatory before & after photos to close any complaint.",
    points: ["Photo verification", "Public resolution proof", "Re-open mechanism"],
  },
  {
    icon: Building2, title: "Authority Dashboard", color: "#2563EB",
    desc: "Priority queue and workflow tools for field officers.",
    points: ["SLA countdown timers", "Ward assignment", "Bulk status updates"],
  },
  {
    icon: BarChart3, title: "Analytics Dashboard", color: "#8B5CF6",
    desc: "Ward-level performance insights and trend analysis.",
    points: ["Resolution rate charts", "Heatmaps by ward", "Department performance"],
  },
  {
    icon: Bell, title: "SLA Monitoring", color: "#DC2626",
    desc: "Auto-escalation when deadlines are breached.",
    points: ["Per-category SLAs", "Auto senior escalation", "Breach audit trail"],
  },
];

function FeaturesSection() {
  return (
    <section className="py-20" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D95D0F" }}>Platform Features</p>
          <h2 className="text-4xl font-extrabold" style={{ color: "#1F2937" }}>Everything a modern civic platform needs</h2>
          <p className="mt-3 text-base" style={{ color: "#4B5563" }}>Built ground-up for Indian municipal governance.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, color, desc, points }) => (
            <div
              key={title}
              className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ border: "1px solid #ECE7DE", backgroundColor: "#FFFFFF", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}12` }}>
                <Icon className="size-5" style={{ color }} />
              </div>
              <h3 className="font-bold text-base mb-1.5" style={{ color: "#1F2937" }}>{title}</h3>
              <p className="text-sm mb-4" style={{ color: "#4B5563" }}>{desc}</p>
              <ul className="space-y-2">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs" style={{ color: "#4B5563" }}>
                    <ChevronRight className="size-3 shrink-0" style={{ color: "#D95D0F" }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WORKFLOW = [
  { icon: Users, label: "Citizen", desc: "Opens NagarWatch" },
  { icon: AlertCircle, label: "Submit Complaint", desc: "Photo + GPS + Category" },
  { icon: Layers, label: "Nearby Detection", desc: "Check duplicates in 500m" },
  { icon: Building2, label: "Authority Review", desc: "Ward officer receives alert" },
  { icon: Activity, label: "Status Updates", desc: "Citizen notified in real-time" },
  { icon: Shield, label: "Resolution Proof", desc: "Before/after photos submitted" },
  { icon: CheckCircle, label: "Complaint Closed", desc: "Public resolution published" },
];

function WorkflowSection() {
  const { ref, inView } = useInView(0.1);
  return (
    <section ref={ref} className="py-20 overflow-hidden" style={{ backgroundColor: "#F8F6F1" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D95D0F" }}>How It Works</p>
          <h2 className="text-4xl font-extrabold" style={{ color: "#1F2937" }}>From report to resolution</h2>
          <p className="mt-3 text-base" style={{ color: "#4B5563" }}>A transparent, accountable workflow every step of the way.</p>
        </div>
        {/* Desktop horizontal timeline */}
        <div className="hidden md:block">
          <div className="relative flex items-start justify-between gap-0">
            {/* Animated connecting line */}
            <div className="absolute top-6 left-0 right-0 h-0.5" style={{ backgroundColor: "#ECE7DE" }}>
              <div
                className="h-full transition-all duration-[2000ms] ease-out"
                style={{ backgroundColor: "#D95D0F", width: inView ? "100%" : "0%" }}
              />
            </div>
            {WORKFLOW.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="relative flex flex-col items-center text-center z-10 transition-all duration-500"
                style={{
                  flex: "1",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: `${i * 150}ms`,
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 mb-4"
                  style={{
                    backgroundColor: i === 0 || i === WORKFLOW.length - 1 ? "#D95D0F" : "#FFFFFF",
                    borderColor: i === 0 || i === WORKFLOW.length - 1 ? "#D95D0F" : "#ECE7DE",
                    boxShadow: "0 0 0 4px #F8F6F1",
                  }}
                >
                  <Icon className="size-5" style={{ color: i === 0 || i === WORKFLOW.length - 1 ? "white" : "#4B5563" }} />
                </div>
                <p className="text-xs font-bold px-1" style={{ color: "#1F2937" }}>{label}</p>
                <p className="mt-1 text-[10px] px-1" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Mobile vertical */}
        <div className="md:hidden space-y-4">
          {WORKFLOW.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: i === 0 || i === WORKFLOW.length - 1 ? "#D95D0F" : "#FFFFFF", border: "2px solid #ECE7DE" }}>
                  <Icon className="size-4" style={{ color: i === 0 || i === WORKFLOW.length - 1 ? "white" : "#4B5563" }} />
                </div>
                {i < WORKFLOW.length - 1 && <div className="w-0.5 h-6 mt-1" style={{ backgroundColor: "#ECE7DE" }} />}
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-bold" style={{ color: "#1F2937" }}>{label}</p>
                <p className="text-xs" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TECH = [
  { name: "Next.js" }, { name: "Express" }, { name: "MongoDB" }, { name: "Socket.IO" },
  { name: "Leaflet" }, { name: "Cloudinary" }, { name: "BullMQ" }, { name: "Gemini AI" }, { name: "Clerk" },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F6F1", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen pt-16" style={{ backgroundColor: "#F8F6F1" }}>
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(217,93,15,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(217,93,15,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* LEFT */}
            <div>
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold" style={{ backgroundColor: "rgba(217,93,15,0.10)", border: "1px solid rgba(217,93,15,0.25)", color: "#D95D0F" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                India's Civic Intelligence Platform
              </div>

              <h1 className="text-6xl font-extrabold tracking-tight leading-[1.05] md:text-7xl" style={{ color: "#1F2937" }}>
                Report.<br />
                Track.<br />
                <span style={{ color: "#D95D0F" }}>Resolve.</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed max-w-lg" style={{ color: "#4B5563" }}>
                NagarWatch empowers citizens and authorities through real-time complaint tracking, interactive civic maps, community prioritization, and transparent governance.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/citizen/submit">
                  <Button className="font-bold px-6 py-3 text-white rounded-xl text-sm" style={{ backgroundColor: "#D95D0F" }}>
                    <AlertCircle className="size-4 mr-2" /> Report an Issue
                  </Button>
                </Link>
                <Link href="/map">
                  <Button variant="outline" className="font-bold px-6 py-3 rounded-xl text-sm" style={{ borderColor: "#ECE7DE", color: "#1F2937" }}>
                    <Map className="size-4 mr-2" /> Explore Live Map
                  </Button>
                </Link>
              </div>

              {/* Trust row */}
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
                {[
                  { icon: ThumbsUp, text: "Community-driven prioritization" },
                  { icon: Shield, text: "Proof-based resolution" },
                  { icon: Clock, text: "SLA enforcement" },
                  { icon: Star, text: "AI-assisted governance" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-2 text-sm" style={{ color: "#4B5563" }}>
                    <Icon className="size-4" style={{ color: "#2E6A42" }} /> {text}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT — Dashboard mockup */}
            <div className="relative lg:pl-4">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <StatsSection />

      {/* ─── COMPARISON ─── */}
      <ComparisonSection />

      {/* ─── FEATURES ─── */}
      <FeaturesSection />

      {/* ─── WORKFLOW ─── */}
      <WorkflowSection />

      {/* ─── LIVE ACTIVITY FEED ─── */}
      <section className="py-20" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D95D0F" }}>Live Activity</p>
              <h2 className="text-4xl font-extrabold" style={{ color: "#1F2937" }}>Your city, in real-time</h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "#4B5563" }}>
                Every complaint, every status change, every resolution — visible instantly. NagarWatch is not a static portal. It is a live civic intelligence system.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Wifi, title: "Socket.IO Powered", desc: "Sub-second status propagation across all connected users" },
                  { icon: Bell, title: "Instant Notifications", desc: "Citizens and authorities notified at every transition" },
                  { icon: Activity, title: "Live Priority Queue", desc: "Authority dashboards update automatically as upvotes roll in" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(217,93,15,0.10)" }}>
                      <Icon className="size-5" style={{ color: "#D95D0F" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#1F2937" }}>{title}</p>
                      <p className="text-sm" style={{ color: "#4B5563" }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ border: "1px solid #ECE7DE", backgroundColor: "#FAFAF9" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ color: "#1F2937" }}>Activity Feed</p>
                <LivePulse size="sm" />
              </div>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section className="py-20" style={{ backgroundColor: "#F8F6F1" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D95D0F" }}>Built With</p>
            <h2 className="text-3xl font-extrabold" style={{ color: "#1F2937" }}>Modern open-source stack</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {TECH.map(({ name }) => (
              <div
                key={name}
                className="rounded-xl px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ border: "1px solid #ECE7DE", backgroundColor: "#FFFFFF", color: "#1F2937" }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24" style={{ backgroundColor: "#1A0A00" }}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold" style={{ backgroundColor: "rgba(217,93,15,0.20)", border: "1px solid rgba(217,93,15,0.35)", color: "#FDBA74" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Join 12,400+ citizens already reporting
          </div>
          <h2 className="text-5xl font-extrabold text-white mt-4">Your city needs you.</h2>
          <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            Every complaint reported makes your city better. Start holding your municipality accountable — transparently.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/sign-up">
              <Button className="font-bold px-8 py-3 text-white text-sm rounded-xl" style={{ backgroundColor: "#D95D0F" }}>
                Get Started Free <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
            <Link href="/complaints">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-8 py-3 text-sm rounded-xl">
                Browse Complaints
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ backgroundColor: "#111827" }}>
        {/* Live ticker */}
        <div style={{ borderBottom: "1px solid #1F2937", backgroundColor: "#0D1117" }}>
          <div className="mx-auto max-w-7xl px-6 py-3 flex items-center gap-4 overflow-hidden">
            <LivePulse size="sm" />
            <div className="flex gap-8 text-xs overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ color: "rgba(255,255,255,0.40)" }}>
              <span>Pothole on MG Road, Pune — <span style={{ color: "#F59E0B" }}>In Progress</span></span>
              <span>Street Light Fixed, Andheri West — <span style={{ color: "#16A34A" }}>Resolved</span></span>
              <span>Garbage overflow near Link Rd, Mumbai — <span style={{ color: "#F59E0B" }}>Pending</span></span>
              <span>Water leakage sealed, Bandra — <span style={{ color: "#16A34A" }}>Resolved</span></span>
            </div>
          </div>
        </div>

        {/* Main footer */}
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-5">
            {/* Brand col */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex mb-4">
                <Image
                  src="/Navbar.png"
                  alt="NagarWatch"
                  width={200}
                  height={50}
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              </Link>
              <p className="text-sm leading-relaxed mt-3 max-w-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Bridging citizens and local authorities for a cleaner, more accountable India.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a href="https://github.com/AkshatKardak/NagarWatch" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-medium transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <Github className="size-4" /> GitHub
                </a>
                <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(217,93,15,0.15)", color: "#D95D0F", border: "1px solid rgba(217,93,15,0.3)" }}>Made in India</span>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>Platform</h4>
              <ul className="space-y-2.5 text-sm">
                {[["Live Map", "/map"], ["Browse Complaints", "/complaints"], ["Report an Issue", "/citizen/submit"], ["Analytics", "/analytics"]].map(([l, h]) => (
                  <li key={l}><Link href={h} className="transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.50)" }}>{l}</Link></li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>Resources</h4>
              <ul className="space-y-2.5 text-sm">
                {[["Documentation", "/docs"], ["API Reference", "/api"], ["Roadmap", "/roadmap"], ["Sign In", "/sign-in"], ["Create Account", "/sign-up"]].map(([l, h]) => (
                  <li key={l}><Link href={h} className="transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.50)" }}>{l}</Link></li>
                ))}
              </ul>
            </div>

            {/* Live stats */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "rgba(255,255,255,0.30)" }}>
                Live Stats <LivePulse size="sm" />
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Open Issues", value: "2,741", color: "#FDBA74" },
                  { label: "Resolved Today", value: "89", color: "#16A34A" },
                  { label: "Active Cities", value: "18", color: "#D95D0F" },
                  { label: "Avg Resolution", value: "3.2 days", color: "rgba(255,255,255,0.8)" },
                ].map(({ label, value, color }) => (
                  <li key={label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid #1F2937" }}>
          <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Built for Indian cities — 2026 NagarWatch. All rights reserved.</p>
            <div className="flex gap-5 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"]].map(([l, h]) => (
                <Link key={l} href={h} className="hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
