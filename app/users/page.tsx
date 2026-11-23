"use client";

import { useEffect, useState } from "react";
import { Plus, ShieldCheck, X } from "lucide-react";
import { api, patch, post } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { AppUser } from "@/lib/types";
import { SetupNotice } from "@/components/SetupNotice";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "Personnel" as AppUser["role"],
    department: "",
    rank: "",
  });
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setUsers(await api<AppUser[]>("/api/users"));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function addUser(event: React.FormEvent) {
    event.preventDefault();
    try {
      await post("/api/users", {
        full_name: form.fullName,
        email: form.email,
        role: form.role,
        department: form.department || null,
        rank: form.rank || null,
      });
      setMessage("User record added.");
      setOpen(false);
      setForm({
        fullName: "",
        email: "",
        role: "Personnel",
        department: "",
        rank: "",
      });
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function updateRole(user: AppUser, role: AppUser["role"]) {
    try {
      await patch("/api/users", { id: user.id, role });
      setMessage("User role updated.");
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function toggleActive(user: AppUser) {
    try {
      await patch("/api/users", { id: user.id, active: !user.active, role: user.role });
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Access Control
            </div>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              User Management
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-md border border-border bg-surface px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground">
                        {user.full_name}
                      </div>
                      <div className="text-xs text-muted">{user.email}</div>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {user.department ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {user.rank ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          void updateRole(
                            user,
                            event.target.value as AppUser["role"],
                          )
                        }
                        className="rounded-md border border-border px-2 py-1.5 text-xs font-bold"
                      >
                        <option>Admin</option>
                        <option>Supply Officer</option>
                        <option>Personnel</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          user.active
                            ? "bg-success-bg text-success"
                            : "bg-surface-hover text-muted"
                        }`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void toggleActive(user)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-bold text-muted"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {user.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      No user records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={addUser}
            className="w-full max-w-lg rounded-lg bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold text-foreground">Add user</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="text-xs font-bold text-muted sm:col-span-2">
                Full name
                <input
                  required
                  value={form.fullName}
                  onChange={(event) =>
                    setForm({ ...form, fullName: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-muted sm:col-span-2">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-muted">
                Role
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as AppUser["role"],
                    })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                >
                  <option>Admin</option>
                  <option>Supply Officer</option>
                  <option>Personnel</option>
                </select>
              </label>
              <label className="text-xs font-bold text-muted">
                Department
                <input
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-muted sm:col-span-2">
                Rank
                <input
                  value={form.rank}
                  onChange={(event) =>
                    setForm({ ...form, rank: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Add User
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
