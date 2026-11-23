"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, Ticket } from "lucide-react";
import { api } from "@/lib/api";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [fullName, setFullName] = useState("");
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

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") {
        await api("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } else {
        await api("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, full_name: fullName, password }),
        });
      }
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="glow-accent mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-accent/40 bg-accent/20 text-accent">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">
            KCCF Command
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "signin"
              ? "Sign in to the logistics system"
              : "Create your account with an invite token"}
          </p>
        </div>

        <div className="mb-4 flex rounded-lg border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            Create account
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-border bg-surface p-6 shadow-2xl"
        >
          {mode === "signup" && (
            <>
              <label className="block">
                <span className="text-xs font-semibold text-muted">
                  Invite token
                </span>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-accent" />
                  <input
                    required
                    value={token}
                    onChange={(event) => setToken(event.target.value.toUpperCase())}
                    placeholder="Enter invite token"
                    className={`${inputClass} pl-9 font-mono tracking-wider`}
                  />
                </div>
                <span className="mt-1 block text-[11px] text-muted">
                  Ask your Supply Officer or Admin for an authorized token.
                </span>
              </label>

              <label className="mt-4 block">
                <span className="text-xs font-semibold text-muted">Full name</span>
                <input
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </label>

            </>
          )}

          {mode === "signin" && (
            <label className="block">
              <span className="text-xs font-semibold text-muted">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className={inputClass}
              />
            </label>
          )}

          <label className="mt-4 block">
            <span className="text-xs font-semibold text-muted">
              Password
              {mode === "signup" && (
                <span className="font-normal"> (min 8 characters)</span>
              )}
            </span>
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          {error && (
            <div className="mt-4 rounded-lg border border-danger/40 bg-danger-bg px-3 py-2 text-sm font-medium text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {busy
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
