"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Boxes,
  ClipboardCheck,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/receiving", label: "Receiving", icon: PackageCheck },
  { href: "/requests", label: "Requests", icon: ClipboardCheck },
  { href: "/issuances", label: "Issuance & Returns", icon: Box },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/audit", label: "Audit Log", icon: History },
  { href: "/users", label: "User Management", icon: Users },
];

export function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"checking" | "online" | "down">("checking");

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (active) setStatus(res.ok ? "online" : "down");
      } catch {
        if (active) setStatus("down");
      }
    }
    void check();
    const timer = window.setInterval(check, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center border-b border-border px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-bold tracking-wide text-foreground">
              KCCF COMMAND
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
              Logistics System
            </div>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-lg p-2 text-muted hover:bg-surface-hover md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="text-xs text-muted">System status</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "online"
                  ? "bg-success"
                  : status === "down"
                    ? "bg-danger"
                    : "bg-muted animate-pulse"
              }`}
            />
            {status === "online"
              ? "Server Online"
              : status === "down"
                ? "Server Down"
                : "Connecting…"}
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="md:ml-64">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center border-b border-border bg-surface/80 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            className="mr-3 rounded-lg border border-border p-2 text-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-foreground">
              Inventory Operations
            </div>
            <div className="hidden text-[10px] text-muted sm:block">
              Command &amp; Control Center
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <CommandPalette />
            <NotificationBell />
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <div className="text-xs font-bold text-foreground">
                Jordan Blake
              </div>
              <div className="text-[10px] text-muted">Supply Officer</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              JB
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
