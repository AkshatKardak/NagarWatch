import { BarChart3, Camera, CheckCircle, Clock, Eye, Map, MapPin, Shield, ThumbsUp, Zap } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

export default function Home() {
  const features = [
    { icon: Map, title: "Public Map", text: "All issues visible on a live city map" },
    { icon: Zap, title: "Real-Time Updates", text: "Socket.io powered instant notifications" },
    { icon: ThumbsUp, title: "Community Voting", text: "Upvote to prioritize important issues" },
    { icon: Shield, title: "Proof-Based Resolution", text: "Before and after photos required to close" },
    { icon: Clock, title: "SLA Enforcement", text: "Deadlines enforced with auto-escalation" },
    { icon: BarChart3, title: "Analytics", text: "Data-driven insights for administrators" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section
        className="relative min-h-[78vh] bg-cover bg-center pt-16 text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(4,47,46,.72),rgba(15,23,42,.68)),url('https://images.unsplash.com/photo-1570997569451-8922e90e46d0?auto=format&fit=crop&w=1800&q=80')",
        }}
      >
        <div className="mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-6 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight md:text-7xl">Report. Track. Resolve.</h1>
            <p className="mt-6 max-w-2xl text-lg text-white/85 md:text-xl">
              NagarWatch - India&apos;s civic intelligence platform. Report issues, track progress, and hold
              authorities accountable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/map">View Live Map</Link>
              </Button>
              <Button asChild variant="outline" className="border-white bg-white/10 text-white hover:bg-white/20">
                <Link href="/citizen/submit">Report an Issue</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <main>
        <section className="border-b bg-slate-50 py-10">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-3">
            {[
              ["12,400+", "Total Complaints Reported"],
              ["78%", "Resolved This Month"],
              ["18", "Cities Active"],
            ].map(([number, label]) => (
              <div key={label} className="border bg-white p-6">
                <p className="text-3xl font-bold">{number}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-3xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: Camera, title: "Report", text: "Submit issue with photo, description and GPS location" },
              { icon: Eye, title: "Track", text: "Follow progress with real-time status updates" },
              { icon: CheckCircle, title: "Resolved", text: "Authorities resolve with proof. You verify." },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="border p-6">
                  <Icon className="size-7 text-emerald-700" />
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold">Platform features</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="border bg-white p-5">
                    <Icon className="size-6 text-emerald-700" />
                    <h3 className="mt-3 font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="size-5 text-emerald-700" />
            NagarWatch
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/map">Map</Link>
            <Link href="/complaints">Complaints</Link>
            <Link href="/sign-in">Sign In</Link>
          </div>
          <p className="text-sm text-muted-foreground">Built for Indian cities - 2026 NagarWatch</p>
        </div>
      </footer>
    </div>
  );
}
