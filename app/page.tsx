import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Boxes,
  ClipboardCheck,
  ShieldCheck,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Boxes,
    title: "Live Inventory",
    text: "Track armory equipment and supplies with real-time availability.",
  },
  {
    icon: ClipboardCheck,
    title: "Issuance & Returns",
    text: "Issue with stock guards, return with condition checks baked into the database.",
  },
  {
    icon: Activity,
    title: "Command Analytics",
    text: "Activity, status, and category dashboards that update as records move.",
  },
  {
    icon: FileText,
    title: "Reports & Audit",
    text: "Printable reports and a full transaction trail for accountability.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="glow-accent flex h-9 w-9 items-center justify-center rounded-lg border border-accent/40 bg-accent/20 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide">KCCF COMMAND</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
                Logistics System
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        <section className="py-20 text-center md:py-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Mission-ready asset control
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Command your inventory with clarity.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted md:text-lg">
            A secure logistics dashboard for tracking equipment, issuing to
            personnel, and keeping every transaction accountable.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="glow-accent-soft inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-5 py-3 text-sm font-bold text-accent transition hover:bg-accent/25"
            >
              Enter the system
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-bold text-foreground">{feature.title}</h2>
                <p className="mt-1.5 text-sm text-muted">{feature.text}</p>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        KCCF Command · Logistics System
      </footer>
    </div>
  );
}
