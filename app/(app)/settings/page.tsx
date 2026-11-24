"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import { api, patch, post } from "@/lib/api";
import { useToast } from "@/components/ui";
import {
  THEME_EVENT,
  readStoredTheme,
  storeTheme,
  type Theme,
} from "@/lib/theme";

type Account = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

const THEMES: { value: Theme; label: string; hint: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", hint: "Daylight", icon: Sun },
  { value: "dark", label: "Dark", hint: "Low light", icon: Moon },
  { value: "system", label: "System", hint: "Follows device", icon: Monitor },
];

const field =
  "mt-2 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent";
const label = "block text-[13px] font-semibold text-foreground";

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

    const onTheme = (event: Event) => {
      setTheme((event as CustomEvent<Theme>).detail);
    };
    window.addEventListener(THEME_EVENT, onTheme);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(THEME_EVENT, onTheme);
    };
  }, []);

  function chooseTheme(value: Theme) {
    storeTheme(value);
    setTheme(value);
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    if (!account || fullName.trim() === account.full_name) return;
    setSavingName(true);
    try {
      const updated = await patch<Account>("/api/account", {
        full_name: fullName.trim(),
      });
      setAccount(updated);
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

    if (next !== confirm) {
      setPasswordError("The two new passwords do not match.");
      return;
    }
    if (next.length < 8) {
      setPasswordError("Use at least 8 characters.");
      return;
    }

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

  return (
    <div className="px-5 py-8 md:px-8 md:py-10">
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
          Your account
        </p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.4vw,2rem)] font-black tracking-[-0.02em] text-foreground">
          Settings
        </h1>
      </div>

      <div className="max-w-3xl space-y-5">
        {/* Identity */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-[15px] font-bold text-accent">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-foreground">
                {account?.full_name ?? "Loading…"}
              </p>
              <p className="truncate text-[13px] text-muted">
                {account?.email ?? ""}
              </p>
            </div>
            <span className="ml-auto shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
              {account?.role ?? "—"}
            </span>
          </div>

          <form onSubmit={saveName} className="mt-6 border-t border-border pt-5">
            <label className={label} htmlFor="full-name">
              Display name
            </label>
            <input
              id="full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              minLength={2}
              maxLength={120}
              className={field}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted">
                Shown on requests you file and in the audit log.
              </p>
              <button
                type="submit"
                disabled={
                  savingName ||
                  !account ||
                  fullName.trim() === account.full_name ||
                  fullName.trim().length < 2
                }
                className="shrink-0 rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-accent-foreground transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingName ? "Saving…" : "Save name"}
              </button>
            </div>
          </form>
        </section>

        {/* Appearance */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-[15px] font-bold text-foreground">Appearance</h2>
          <p className="mt-1 text-[13px] text-muted">
            Saved on this device. Each browser remembers its own choice.
          </p>

          <div
            role="radiogroup"
            aria-label="Theme"
            className="mt-5 grid gap-3 sm:grid-cols-3"
          >
            {THEMES.map(({ value, label: themeLabel, hint, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => chooseTheme(value)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-foreground/25 hover:bg-surface-hover"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-muted"}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-foreground">
                      {themeLabel}
                    </span>
                    <span className="block text-[11px] text-muted">{hint}</span>
                  </span>
                  {active && (
                    <Check className="ml-auto h-4 w-4 shrink-0 text-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Security */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted" />
            <h2 className="text-[15px] font-bold text-foreground">
              Change password
            </h2>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            You will stay signed in on this device. Other devices keep their
            session until it expires.
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
                className={field}
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
                  className={field}
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
                  className={field}
                />
              </div>
            </div>

            {passwordError && (
              <p
                role="alert"
                className="rounded-lg border border-danger/40 bg-danger-bg px-3.5 py-2.5 text-[13px] font-medium text-danger"
              >
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-foreground transition hover:brightness-110 active:translate-y-px disabled:opacity-40"
            >
              {savingPassword ? "Changing…" : "Change password"}
            </button>
          </form>
        </section>

        {/* Session */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-[15px] font-bold text-foreground">Session</h2>
          <p className="mt-1 text-[13px] text-muted">
            Signed in as {account?.email ?? "…"}. Sessions last 7 days.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold text-foreground transition hover:border-danger/40 hover:bg-danger-bg hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </section>

        <p className="flex items-center gap-2 px-1 text-xs text-muted">
          <User className="h-3.5 w-3.5" />
          Need a different role? Ask an admin to change it in User Management.
        </p>
      </div>
    </div>
  );
}
