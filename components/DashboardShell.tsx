"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Boxes,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/receiving", label: "Receiving", icon: PackageCheck },
  { href: "/requests", label: "Requests", icon: ClipboardCheck },
  { href: "/issuances", label: "Issuance & Returns", icon: Box },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/users", label: "User Management", icon: Users },
];

export function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Guest Operator");
  const [displayRole, setDisplayRole] = useState("Sign in required");

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const timer = window.setTimeout(() => {
      void client.auth.getUser().then(async ({ data }) => {
        if (!data.user) return;
        const { data: profile } = await client
          .from("users")
          .select("full_name, role")
          .eq("auth_user_id", data.user.id)
          .maybeSingle();
        setDisplayName(profile?.full_name ?? data.user.email ?? "User");
        setDisplayRole(profile?.role ?? "Personnel");
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setDisplayName("Guest Operator");
    setDisplayRole("Sign in required");
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#101d35] text-white transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#d4b44c] text-[#101d35]">
            <Shield className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-bold tracking-wide">KCCF COMMAND</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
              Logistics System
            </div>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="ml-auto rounded p-2 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-[#101d35]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="text-xs text-slate-400">System status</div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Operations Ready
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
        <header className="no-print sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white px-4 md:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            className="mr-3 rounded-md border border-slate-200 p-2 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm font-bold text-[#101d35]">
            Inventory Operations
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-bold">{displayName}</div>
              <div className="text-[10px] text-slate-500">{displayRole}</div>
            </div>
            {displayRole === "Sign in required" ? (
              <Link
                href="/login"
                className="rounded-md bg-[#101d35] px-3 py-2 text-xs font-bold text-white"
              >
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101d35] text-xs font-bold text-white"
                title="Sign out"
              >
                {displayName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </button>
            )}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
