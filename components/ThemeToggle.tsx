"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  THEME_EVENT,
  applyTheme,
  readStoredTheme,
  storeTheme,
  type Theme,
} from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStoredTheme();
      setTheme(stored);
      applyTheme(stored);
    }, 0);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStoredTheme() === "system") applyTheme("system");
    };
    const onTheme = (event: Event) => setTheme((event as CustomEvent<Theme>).detail);

    mq.addEventListener("change", onChange);
    window.addEventListener(THEME_EVENT, onTheme);
    return () => {
      window.clearTimeout(timer);
      mq.removeEventListener("change", onChange);
      window.removeEventListener(THEME_EVENT, onTheme);
    };
  }, []);

  function choose(next: Theme) {
    storeTheme(next);
    setTheme(next);
  }

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex rounded-lg border border-border bg-surface p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={theme === value}
          onClick={() => choose(value)}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
            theme === value
              ? "bg-primary text-primary-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
