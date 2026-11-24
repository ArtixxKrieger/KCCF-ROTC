"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, Users } from "lucide-react";
import { api, patch } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { AppUser } from "@/lib/types";
import { Select } from "@/components/ui";
import { SetupNotice } from "@/components/SetupNotice";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setUsers(await api<AppUser[]>("/api/users"));
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function updateRole(user: AppUser, role: AppUser["role"]) {
    try {
      await patch("/api/users", { id: user.id, role });
      setMessage(`${user.full_name} is now ${role}.`);
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function toggleActive(user: AppUser) {
    try {
      await patch("/api/users", { id: user.id, active: !user.active });
      setMessage(
        `${user.full_name} ${user.active ? "deactivated" : "activated"}.`,
      );
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "All" && user.role !== roleFilter) return false;
      if (!needle) return true;
      return `${user.full_name} ${user.email}`
        .toLowerCase()
        .includes(needle);
    });
  }, [users, query, roleFilter]);

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="px-5 py-8 md:px-8 md:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
            Access control
          </p>
          <h1 className="mt-2 text-[clamp(1.6rem,2.4vw,2rem)] font-black tracking-[-0.02em] text-foreground">
            User management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Change a role to change what someone can see and do. Every change is
            written to the audit log.
          </p>
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent"
            />
          </div>
          <div className="md:w-44">
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              options={["All", "Admin", "Supply Officer", "Personnel"].map(
                (role) => ({ value: role, label: role === "All" ? "All roles" : role }),
              )}
            />
          </div>
        </div>

        {message && (
          <p className="mb-5 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {message}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-muted">
                  <th className="px-5 py-3 font-bold">Name</th>
                  <th className="px-5 py-3 font-bold">Email</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((user) => (
                  <tr key={user.id} className="transition hover:bg-surface-hover/60">
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {user.full_name}
                    </td>
                    <td className="px-5 py-3.5 text-muted">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="w-40">
                        <Select
                          value={user.role}
                          onChange={(value) =>
                            void updateRole(user, value as AppUser["role"])
                          }
                          options={["Admin", "Supply Officer", "Personnel"].map(
                            (role) => ({ value: role, label: role }),
                          )}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          user.active
                            ? "bg-success-bg text-success"
                            : "bg-surface-hover text-muted"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.active ? "bg-success" : "bg-muted"
                          }`}
                        />
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => void toggleActive(user)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold text-muted transition hover:border-foreground/30 hover:text-foreground"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {user.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Users className="h-6 w-6 text-muted" />
                        <p className="text-sm font-medium text-foreground">
                          {loading
                            ? "Loading accounts…"
                            : query || roleFilter !== "All"
                              ? "No accounts match that search"
                              : "No accounts yet"}
                        </p>
                        {!loading && (query || roleFilter !== "All") && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuery("");
                              setRoleFilter("All");
                            }}
                            className="text-xs font-semibold text-accent underline decoration-2 underline-offset-4"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted">
          Showing {visible.length} of {users.length}{" "}
          {users.length === 1 ? "account" : "accounts"}
        </p>
      </div>
    </>
  );
}
