"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ClipboardList, Clock3, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";

type LowStockItem = {
  id: string;
  name: string;
  available_quantity: number | string;
  min_stock_level: number | string;
  unit: string;
};

type Alerts = {
  lowStock: LowStockItem[];
  pending: number;
  overdue: number;
};

export function NotificationBell({ variant = "popover" }: { variant?: "popover" | "inline" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alerts>({ lowStock: [], pending: 0, overdue: 0 });
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      setAlerts(await api<Alerts>("/api/alerts"));
    } catch {
      /* keep last known */
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 30000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const lowCount = alerts.lowStock.length;
  const count = lowCount + (alerts.pending > 0 ? 1 : 0) + (alerts.overdue > 0 ? 1 : 0);

  const panel = (
    <>
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold text-foreground">Notifications</h2>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted">
          Low Stock ({lowCount})
        </div>
        {alerts.lowStock.length === 0 && (
          <div className="px-4 pb-2 text-sm text-muted">No low-stock items.</div>
        )}
        {alerts.lowStock.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/inventory?q=${encodeURIComponent(item.name)}`);
            }}
            className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-surface-hover"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {item.name}
              </span>
              <span className="text-xs text-muted">
                {item.available_quantity} left · min {item.min_stock_level} {item.unit}
              </span>
            </span>
          </button>
        ))}

        <div className="border-t border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted">
          Other Alerts
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/requests");
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-surface-hover"
        >
          <ClipboardList className="h-4 w-4 shrink-0 text-info" />
          <span className="text-sm text-foreground">
            {alerts.pending} pending request{alerts.pending === 1 ? "" : "s"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/issuances");
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-surface-hover"
        >
          <Clock3 className="h-4 w-4 shrink-0 text-danger" />
          <span className="text-sm text-foreground">
            {alerts.overdue} overdue return{alerts.overdue === 1 ? "" : "s"}
          </span>
        </button>
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <div ref={ref} className="w-full">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          Notifications
          {count > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
        {open && (
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
            {panel}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          {panel}
        </div>
      )}
    </div>
  );
}
