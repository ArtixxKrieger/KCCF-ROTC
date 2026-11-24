"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { api, patch, post } from "@/lib/api";
import { useToast } from "@/components/ui";
import { THEME_EVENT, readStoredTheme, storeTheme, type Theme } from "@/lib/theme";

type Account = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const input =
  "mt-2 block h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent";
const label = "block text-[13px] font-semibold text-foreground";
const card = "rounded-xl border border-border bg-surface";
const primaryBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[13px] font-bold text-accent-foreground transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();

  const [account, setAccount] = useState<Account | null>(null);
  const [theme, setTheme] = useState<Theme>("system");
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTheme(readStoredTheme());
      api<Account>("/api/account")
        .then((data) => {
          setAccount(data);
          setFullName(data.full_name);
        })
        .catch(() => setAccount(null));
    }, 0);

    const onTheme = (event: Event) => setTheme((event as CustomEvent<Theme>).detail);
    window.addEventListener(THEME_EVENT, onTheme);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(THEME_EVENT, onTheme);
    };
  }, []);

  const nameDirty = Boolean(account) && fullName.trim() !== account?.full_name;
  const nameValid = fullName.trim().length >= 2;

  function chooseTheme(value: Theme) {
    storeTheme(value);
    setTheme(value);
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    if (!nameDirty || !nameValid) return;
    setSavingName(true);
    try {
      const updated = await patch<Account>("/api/account", {
        full_name: fullName.trim(),
      });
      setAccount(updated);
      setFullName(updated.full_name);
      toast("Name updated.");
    } catch (error) {
      toast((error as Error).message, "error");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");

    if (next.length < 8) return setPasswordError("Use at least 8 characters.");
    if (next !== confirm)
      return setPasswordError("The two new passwords do not match.");

    setSavingPassword(true);
    try {
      await post("/api/account/password", {
        current_password: current,
        new_password: next,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast("Password changed.");
    } catch (error) {
      setPasswordError((error as Error).message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function signOut() {
    try {
      await api("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  }

  const initials =
    account?.full_name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "—";

  const memberSince = account
    ? new Date(account.created_at).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
          Your account
        </p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.4vw,2rem)] font-black tracking-[-0.02em] text-foreground">
          Settings
        </h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        {/* ── Main column ───────────────────────────────── */}
        <div className="space-y-5">
          {/* Profile */}
          <section className={`${card} p-6`}>
            <h2 className="text-[15px] font-bold text-foreground">Profile</h2>
            <p className="mt-1 text-[13px] text-muted">
              How your name appears on requests and in the audit log.
            </p>

            <form onSubmit={saveName} className="mt-5">
              <label className={label} htmlFor="full-name">
                Display name
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  className={`${input} sm:mt-0`}
                />
                <button
                  type="submit"
                  disabled={savingName || !nameDirty || !nameValid}
                  className={`${primaryBtn} shrink-0 sm:mt-2`}
                >
                  {savingName ? "Saving…" : "Save"}
                </button>
              </div>
              <p className="mt-2.5 text-xs text-muted">
                {nameDirty
                  ? nameValid
                    ? "Unsaved change."
                    : "At least 2 characters."
                  : "Up to date."}
              </p>
            </form>
          </section>

          {/* Appearance */}
          <section className={`${card} p-6`}>
            <h2 className="text-[15px] font-bold text-foreground">Appearance</h2>
            <p className="mt-1 text-[13px] text-muted">
              Stored on this device only.
            </p>

            <div
              role="radiogroup"
              aria-label="Theme"
              className="mt-5 grid gap-3 sm:grid-cols-3"
            >
              {THEMES.map(({ value, label: themeLabel, icon: Icon }) => {
                const active = theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => chooseTheme(value)}
                    className={`flex h-[62px] items-center gap-3 rounded-lg border px-3.5 text-left transition ${
                      active
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-foreground/25 hover:bg-surface-hover"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-muted"}`}
                    />
                    <span className="text-[13px] font-bold text-foreground">
                      {themeLabel}
                    </span>
                    {active && <Check className="ml-auto h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Security */}
          <section className={`${card} p-6`}>
            <h2 className="text-[15px] font-bold text-foreground">
              Change password
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              You stay signed in here. Other devices keep their session until it
              expires.
            </p>

            <form onSubmit={savePassword} className="mt-5 space-y-4">
              <div>
                <label className={label} htmlFor="current-password">
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={current}
                  onChange={(event) => setCurrent(event.target.value)}
                  className={input}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="new-password">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={next}
                    onChange={(event) => setNext(event.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label} htmlFor="confirm-password">
                    Repeat new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className={input}
                  />
                </div>
              </div>

              {confirm.length > 0 && next !== confirm && (
                <p className="text-xs font-medium text-warning">
                  Passwords do not match yet.
                </p>
              )}

              {passwordError && (
                <p
                  role="alert"
                  className="rounded-lg border border-danger/40 bg-danger-bg px-3.5 py-2.5 text-[13px] font-medium text-danger"
                >
                  {passwordError}
                </p>
              )}

              <div className="flex justify-end border-t border-border pt-4">
                <button
                  type="submit"
                  disabled={savingPassword || !current || next.length < 8}
                  className={primaryBtn}
                >
                  {savingPassword ? "Changing…" : "Change password"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* ── Rail ──────────────────────────────────────── */}
        <div className="space-y-5 lg:sticky lg:top-20">
          <section className={`${card} p-5`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[13px] font-bold text-accent ring-1 ring-accent/30">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-foreground">
                  {account?.full_name ?? "Loading…"}
                </p>
                <p className="truncate text-[12px] text-muted">
                  {account?.role ?? "—"}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 border-t border-border pt-4">
              <Row term="Email" detail={account?.email ?? "—"} />
              <Row term="Member since" detail={memberSince} />
              <Row term="Session" detail="7 days" />
            </dl>
          </section>

          <section className={`${card} p-5`}>
            <h2 className="text-[13px] font-bold text-foreground">Session</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Signing out clears the cookie on this device.
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-[13px] font-bold text-foreground transition hover:border-danger/40 hover:bg-danger-bg hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </section>

          <p className="px-1 text-[11px] leading-relaxed text-muted">
            Need a different role? An admin changes it in User Management.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {term}
      </dt>
      <dd className="min-w-0 truncate text-right text-[12px] font-medium text-foreground">
        {detail}
      </dd>
    </div>
  );
}
