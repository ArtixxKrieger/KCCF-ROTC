import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/40 bg-accent/15">
              <ShieldMark className="h-4 w-4" />
            </span>
            <span className="text-[14px] font-bold tracking-tight">
              KCCF Command
            </span>
          </Link>
          <nav className="flex items-center gap-5">
            <a
              href="#how"
              className="hidden text-sm font-medium text-muted transition hover:text-foreground sm:block"
            >
              How it works
            </a>
            <a
              href="#rules"
              className="hidden text-sm font-medium text-muted transition hover:text-foreground sm:block"
            >
              Guard rails
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition hover:brightness-110 active:translate-y-px"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55] dark:opacity-100"
            style={{
              backgroundImage:
                "radial-gradient(760px 420px at 50% -8%, var(--glow-1), transparent 70%), radial-gradient(560px 340px at 88% 18%, var(--glow-2), transparent 68%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.22]"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage:
                "radial-gradient(ellipse 78% 62% at 50% 0%, black 12%, transparent 72%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 78% 62% at 50% 0%, black 12%, transparent 72%)",
            }}
          />

          <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-center px-5 pt-20 pb-24 md:px-8">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.07] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              ROTC logistics
            </p>

            <h1 className="mt-7 max-w-[19ch] text-[clamp(2.7rem,6.4vw,5rem)] font-black leading-[0.96] tracking-[-0.04em]">
              Track every rifle,
              <br className="hidden sm:block" /> uniform and battery
              <span className="text-accent">.</span>
            </h1>

            <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-muted">
              And who has it, when it left, and what condition it came back in.
              KCCF Command replaces the logbook for a school corps.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3.5 text-[15px] font-bold text-accent-foreground transition hover:brightness-110 active:translate-y-px"
              >
                Create an account
                <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M2.5 8h10M9 4.5L12.5 8 9 11.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-border px-5 py-3.5 text-[15px] font-bold text-foreground transition hover:border-foreground/25 hover:bg-surface-hover"
              >
                Sign in
              </Link>
            </div>

            <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-7 border-t border-border pt-9 sm:grid-cols-4">
              <Stat value="0" label="Over-issues allowed" />
              <Stat value="3" label="Access roles" />
              <Stat value="6" label="Report types" />
              <Stat value="100%" label="Actions logged" />
            </dl>
          </div>
        </section>

        {/* ── Product ────────────────────────────────────────── */}
        <section
          id="how"
          className="border-t border-border bg-surface/40 py-20 md:py-28"
        >
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
              <div>
                <SectionLabel>One screen</SectionLabel>
                <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-black leading-[1.05] tracking-[-0.03em]">
                  The dashboard is the whole system
                </h2>
                <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted">
                  Availability, issued counts and low-stock warnings move as
                  records move. Nothing to reconcile at the end of the term.
                </p>

                <ul className="mt-8 space-y-4 border-t border-border pt-6">
                  <Point>Availability updates the moment an item is issued</Point>
                  <Point>Low stock flagged before a request is filed</Point>
                  <Point>Every entry carries the person, time and reference</Point>
                </ul>
              </div>

              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 -z-10 rounded-3xl opacity-60 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(60% 60% at 50% 40%, var(--glow-1), transparent 70%)",
                  }}
                />
                <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-black/25">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-danger/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
                    <span className="ml-3 font-mono text-[11px] text-muted">
                      /dashboard
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                    <MockStat label="Total" value="504" />
                    <MockStat label="Available" value="406" />
                    <MockStat label="Issued" value="92" />
                    <MockStat label="Low stock" value="0" tone="accent" />
                  </div>

                  <div className="px-4 pb-4">
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-left text-[13px]">
                        <thead>
                          <tr className="border-b border-border text-[10px] uppercase tracking-[0.12em] text-muted">
                            <th className="px-4 py-2 font-bold">Item</th>
                            <th className="hidden px-4 py-2 font-bold sm:table-cell">Storage</th>
                            <th className="px-4 py-2 text-right font-bold">Avail.</th>
                            <th className="px-4 py-2 text-right font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <MockRow item="M16 Rifle" place="Armory A1" count="18/20" status="Available" />
                          <MockRow item="Combat Uniform" place="Supply Rm 2" count="64/80" status="Available" />
                          <MockRow item="Field Radio" place="Comms Cage" count="4/12" status="Low stock" />
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Rules ──────────────────────────────────────────── */}
        <section id="rules" className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <SectionLabel>Guard rails</SectionLabel>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.75rem,3vw,2.5rem)] font-black leading-[1.05] tracking-[-0.03em]">
              Two rules the app cannot break
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
              Both are enforced by the database itself, so no page, shortcut or
              double-click can get around them.
            </p>

            <div className="mt-12 divide-y divide-border border-y border-border">
              <Rule
                index="01"
                title="You cannot issue what you do not have"
                body="Each issuance checks the available count inside a locked transaction. Ask for 20 when 8 remain and the database refuses — the request never reaches the shelf."
              />
              <Rule
                index="02"
                title="Damaged gear never returns to the shelf"
                body="A return is recorded with the condition it came back in. Good stock goes back to available; damaged stock is counted apart; missing stock leaves the total."
              />
            </div>
          </div>
        </section>

        {/* ── Close ──────────────────────────────────────────── */}
        <section className="border-t border-border bg-surface/40 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
            <h2 className="mx-auto max-w-xl text-[clamp(1.9rem,3.4vw,2.9rem)] font-black leading-[1.03] tracking-[-0.03em]">
              Start with an account
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-muted">
              Register with your name and email to see stock and file requests.
              An admin raises your access from there.
            </p>
            <Link
              href="/login"
              className="mt-9 inline-block rounded-lg bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-foreground transition hover:brightness-110 active:translate-y-px"
            >
              Create an account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 text-xs text-muted md:flex-row md:px-8">
          <span>KCCF Command · ROTC Logistics</span>
          <span>Figures shown are sample data</span>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
      {children}
    </p>
  );
}

function ShieldMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2.6l7.4 2.9v6c0 4.4-3.1 8.2-7.4 9.9-4.3-1.7-7.4-5.5-7.4-9.9v-6L12 2.6z" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.9 12.1l2.2 2.2 4-4.4" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="text-[26px] font-black leading-none tracking-tight text-foreground">
        {value}
      </dd>
      <dt className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
    </div>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-relaxed text-muted">
      <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M3.5 8.4l2.7 2.7 6.3-6.6" fill="none" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </li>
  );
}

function MockStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "accent";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </div>
      <div
        className={`mt-1 text-lg font-black leading-none tracking-tight ${
          tone === "accent" ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MockRow({
  item,
  place,
  count,
  status,
}: {
  item: string;
  place: string;
  count: string;
  status: string;
}) {
  const low = status === "Low stock";
  return (
    <tr>
      <td className="px-4 py-2.5 font-semibold text-foreground">{item}</td>
      <td className="hidden px-4 py-2.5 text-muted sm:table-cell">{place}</td>
      <td className="px-4 py-2.5 text-right font-mono text-[12px] text-muted">
        {count}
      </td>
      <td className="px-4 py-2.5 text-right">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            low ? "bg-warning-bg text-warning" : "bg-success-bg text-success"
          }`}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}

function Rule({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <article className="grid gap-3 py-9 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.15fr)] md:items-start md:gap-8">
      <span className="font-mono text-[13px] font-bold tabular-nums text-accent">
        {index}
      </span>
      <h3 className="text-[19px] font-bold leading-snug tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <p className="text-[15px] leading-relaxed text-muted">{body}</p>
    </article>
  );
}
