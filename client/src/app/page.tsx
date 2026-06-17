import { BarChart3, Camera, CheckCircle, Clock, Eye, Map, MapPin, Shield, ThumbsUp, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

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

  const stats = [
    ["12,400+", "Total Complaints Reported"],
    ["78%", "Resolved This Month"],
    ["18", "Cities Active"],
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F6F1" }}>
      <Navbar />

      {/* ─── HERO SECTION ─── */}
      <section
        className="relative min-h-[78vh] pt-16 text-white overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1A0A00 0%, #8B2500 30%, #D95D0F 60%, #2E6A42 100%)",
        }}
      >
        {/* Decorative grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />
        {/* Decorative circle blobs */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: "#D95D0F" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: "#2E6A42" }}
        />

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-6 py-20">
          <div className="max-w-3xl">
            {/* Eyebrow badge */}
            <span
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 border border-white/20"
              style={{ backgroundColor: "rgba(217,93,15,0.25)" }}
            >
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
              <Button
                asChild
                className="font-bold px-6 py-3 text-white shadow-lg"
                style={{ backgroundColor: "#D95D0F" }}
              >
                <Link href="/map">View Live Map</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 font-bold px-6 py-3"
              >
                <Link href="/citizen/submit">Report an Issue</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Users className="size-4" /> Community-driven prioritization</span>
              <span className="flex items-center gap-1.5"><Shield className="size-4" /> Proof-based resolution</span>
              <span className="flex items-center gap-1.5"><Clock className="size-4" /> SLA-enforced deadlines</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section
        className="border-b py-10"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#ECE7DE" }}
      >
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-3">
          {stats.map(([number, label]) => (
            <div
              key={label}
              className="border p-6 rounded-lg"
              style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}
            >
              <p
                className="text-3xl font-extrabold"
                style={{ color: "#D95D0F" }}
              >
                {number}
              </p>
              <p className="mt-1 text-sm" style={{ color: "#4B5563" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <main>
        {/* ─── HOW IT WORKS ─── */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-3xl font-extrabold" style={{ color: "#1F2937" }}>How it works</h2>
          <p className="mt-2 text-sm" style={{ color: "#4B5563" }}>Three simple steps from report to resolution.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="border p-6 rounded-lg relative overflow-hidden"
                  style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}
                >
                  <span
                    className="absolute top-4 right-5 text-5xl font-black opacity-5 select-none pointer-events-none"
                    style={{ color: "#D95D0F" }}
                  >
                    {i + 1}
                  </span>
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
                  <div
                    key={feature.title}
                    className="border p-5 rounded-lg group hover:shadow-md transition-shadow"
                    style={{ borderColor: "#ECE7DE", backgroundColor: "#FFFFFF" }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: "#FFF3EB" }}
                    >
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
        <section
          className="py-16"
          style={{ backgroundColor: "#1A0A00" }}
        >
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-extrabold text-white">Your city needs you.</h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto">
              Every complaint reported makes your city better. Join thousands of citizens already using NagarWatch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button
                asChild
                className="font-bold px-8 py-3 text-white"
                style={{ backgroundColor: "#D95D0F" }}
              >
                <Link href="/sign-up">Get Started Free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-bold px-8 py-3"
              >
                <Link href="/complaints">Browse Complaints</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer
        className="border-t py-8"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#ECE7DE" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-bold" style={{ color: "#1F2937" }}>
            <MapPin className="size-5" style={{ color: "#D95D0F" }} />
            NagarWatch
          </div>
          <div className="flex gap-4 text-sm" style={{ color: "#4B5563" }}>
            <Link href="/map" className="hover:underline">Map</Link>
            <Link href="/complaints" className="hover:underline">Complaints</Link>
            <Link href="/sign-in" className="hover:underline">Sign In</Link>
          </div>
          <p className="text-sm" style={{ color: "#4B5563" }}>Built for Indian cities — © 2026 NagarWatch</p>
        </div>
      </footer>
    </div>
  );
}
