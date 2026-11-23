"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "@/lib/api";

type Entry = {
  id: string;
  group: string;
  label: string;
  sub: string;
  href: string;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [inventory, requests, users, issuances] = await Promise.all([
        api<Record<string, string | number | null>[]>("/api/inventory"),
        api<Record<string, string | number | null>[]>("/api/requests"),
        api<Record<string, string | number | null>[]>("/api/users"),
        api<Record<string, string | number | null>[]>("/api/issuances"),
      ]);
      const list: Entry[] = [
        ...inventory.map((item) => ({
          id: String(item.id),
          group: "Inventory",
          label: String(item.name),
          sub: `${item.category} · ${item.storage_location}`,
          href: `/inventory?q=${encodeURIComponent(String(item.name))}`,
        })),
        ...requests.map((request) => ({
          id: String(request.id),
          group: "Requests",
          label: String(request.item_name),
          sub: `${request.status} · ${request.requested_by}`,
          href: "/requests",
        })),
        ...users.map((user) => ({
          id: String(user.id),
          group: "Users",
          label: String(user.full_name),
          sub: `${user.role} · ${user.email}`,
          href: "/users",
        })),
        ...issuances.map((issuance) => ({
          id: String(issuance.id),
          group: "Issuances",
          label: issuance.reference_number
            ? String(issuance.reference_number)
            : "Issuance",
          sub: `${issuance.status} · ${issuance.issued_to}`,
          href: "/issuances",
        })),
      ];
      setEntries(list);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (open) {
        if (!loaded) void load();
        inputRef.current?.focus();
      } else {
        setQuery("");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, loaded]);

  const filtered = query.trim()
    ? entries.filter((entry) =>
        `${entry.label} ${entry.sub}`.toLowerCase().includes(query.toLowerCase()),
      )
    : entries;

  function go(entry: Entry) {
    setOpen(false);
    router.push(entry.href);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted transition hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden rounded border border-border bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold lg:inline">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]">
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setOpen(false);
                  if (event.key === "Enter" && filtered[0]) go(filtered[0]);
                }}
                placeholder="Search inventory, requests, people…"
                className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted hover:bg-surface-hover"
              >
                Esc
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {filtered.slice(0, 30).map((entry) => (
                <li key={`${entry.group}-${entry.id}`}>
                  <button
                    type="button"
                    onClick={() => go(entry)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-surface-hover"
                  >
                    <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted">
                      {entry.group}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {entry.label}
                      </span>
                      <span className="block truncate text-xs text-muted">{entry.sub}</span>
                    </span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  No results for “{query}”
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
