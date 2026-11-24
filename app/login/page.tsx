"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/dashboard");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const param = new URLSearchParams(window.location.search).get("next");
      if (param && param.startsWith("/") && !param.startsWith("//")) {
        setNext(param);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const account =
        mode === "signin"
          ? await api<{ role: string }>("/api/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            })
          : await api<{ role: string }>("/api/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ full_name: fullName, email, password }),
            });

      const home = account?.role === "Personnel" ? "/inventory" : "/dashboard";
      router.replace(next === "/dashboard" ? home : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-2 block w-full rounded-lg border border-border bg-background px-3.5 py-3 text-[15px] text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent";
  const label = "block text-[13px] font-semibold text-foreground";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand side — desktop only */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/40 bg-accent/15">
            <ShieldMark />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight text-foreground">
              KCCF Command
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Logistics System
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-[clamp(2.4rem,3.4vw,3.4rem)] font-black leading-[1.02] tracking-[-0.03em] text-foreground">
            Every item.
            <br />
            Every hand.
            <br />
            <span className="text-accent">On record.</span>
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-muted">
            Stock levels, issuances and returns for the corps — with the
            guard rails built into the database, not bolted on afterwards.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-6 border-t border-border pt-8">
          <Fact term="Backend" detail="Neon Postgres" />
          <Fact term="Audit" detail="Every action" />
          <Fact term="Issuing" detail="Stock-guarded" />
        </dl>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[26rem]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/40 bg-accent/15">
              <ShieldMark />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight text-foreground">
                KCCF Command
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Logistics System
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            {mode === "signin"
              ? "Use the email and password on your record."
              : "New accounts start with read-only access to inventory."}
          </p>

          <form onSubmit={onSubmit} className="mt-7">
            {mode === "signup" && (
              <div className="mb-5">
                <label className={label} htmlFor="full-name">
                  Full name
                </label>
                <input
                  id="full-name"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="As it appears on your record"
                  className={field}
                />
              </div>
            )}

            <div className="mb-5">
              <label className={label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@school.example"
                className={field}
              />
            </div>

            <div>
              <label className={label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className={field}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-danger/40 bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-7 w-full rounded-lg bg-accent px-4 py-3 text-[15px] font-bold text-accent-foreground transition hover:brightness-110 active:translate-y-px disabled:opacity-60"
            >
              {busy
                ? "Working…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted">
            {mode === "signin" ? (
              <>
                No account yet?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-4 transition hover:text-accent"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-4 transition hover:text-accent"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-8 border-t border-border pt-6 text-xs text-muted">
            <Link href="/" className="transition hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function ShieldMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 2.6l7.4 2.9v6c0 4.4-3.1 8.2-7.4 9.9-4.3-1.7-7.4-5.5-7.4-9.9v-6L12 2.6z"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.9 12.1l2.2 2.2 4-4.4"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Fact({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
        {term}
      </dt>
      <dd className="mt-1 text-[13px] font-semibold text-foreground">{detail}</dd>
    </div>
  );
}
