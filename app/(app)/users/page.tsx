"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { api, del, patch, post } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { AppUser } from "@/lib/types";
import { Select } from "@/components/ui";
import { SetupNotice } from "@/components/SetupNotice";

type Invite = {
  id: string;
  token: string;
  role: string;
  created_by_name: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:border-accent";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    role: "Personnel" as AppUser["role"],
    days: "7",
  });
  const [latest, setLatest] = useState<Invite | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [accounts, tokens] = await Promise.all([
        api<AppUser[]>("/api/users"),
        api<Invite[]>("/api/invites"),
      ]);
      setUsers(accounts);
      setInvites(tokens);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function generateInvite(event: React.FormEvent) {
    event.preventDefault();
    try {
      const created = await post<Invite>("/api/invites", {
        role: form.role,
        days: Number(form.days) || 7,
      });
      setLatest(created);
      setMessage("Invite token generated.");
      setOpen(false);
      setForm({ role: "Personnel", days: "7" });
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
      await patch("/api/users", { id: user.id, active: !user.active });
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function revoke(invite: Invite) {
    try {
      await del("/api/invites", { id: invite.id });
      setMessage("Invite revoked.");
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  function inviteState(invite: Invite) {
    if (invite.used_at) return { label: "Used", tone: "bg-success-bg text-success" };
    if (invite.revoked_at) return { label: "Revoked", tone: "bg-surface-hover text-muted" };
    if (new Date(invite.expires_at) < new Date())
      return { label: "Expired", tone: "bg-danger-bg text-danger" };
    return { label: "Active", tone: "bg-info-bg text-info" };
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
            Generate Invite Token
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {message}
          </div>
        )}

        {latest && (
          <div className="mb-4 rounded-xl border border-accent/40 bg-accent/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-accent">
              New invite token — give this to the authorized user
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="rounded-lg border border-accent/30 bg-background px-3 py-2 font-mono text-sm tracking-wider text-foreground">
                {latest.token}
              </code>
              <span className="text-xs text-muted">
                Role: {latest.role} · Expires{" "}
                {new Date(latest.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">User</th>
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
                    <td className="px-5 py-4">
                      <div className="w-44">
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
                    <td colSpan={4} className="px-5 py-12 text-center text-muted">
                      No user records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          <KeyRound className="h-4 w-4" />
          Invite Tokens
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">Token</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Created by</th>
                  <th className="px-5 py-3">Expires</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invites.map((invite) => {
                  const state = inviteState(invite);
                  return (
                    <tr key={invite.id}>
                      <td className="px-5 py-4 font-mono text-xs tracking-wider text-foreground">
                        {invite.token}
                      </td>
                      <td className="px-5 py-4 text-muted">{invite.role}</td>
                      <td className="px-5 py-4 text-muted">
                        {invite.created_by_name ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${state.tone}`}
                        >
                          {state.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!invite.used_at && !invite.revoked_at ? (
                          <button
                            type="button"
                            onClick={() => void revoke(invite)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-bold text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Revoke
                          </button>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {invites.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      No invite tokens generated yet
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
            onSubmit={generateInvite}
            className="w-full max-w-lg rounded-lg border border-border bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold text-foreground">Generate invite token</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="text-xs font-bold text-muted">
                Role
                <div className="mt-1">
                  <Select
                    value={form.role}
                    onChange={(value) =>
                      setForm({ ...form, role: value as AppUser["role"] })
                    }
                    options={["Admin", "Supply Officer", "Personnel"].map(
                      (role) => ({ value: role, label: role }),
                    )}
                  />
                </div>
              </label>
              <label className="text-xs font-bold text-muted">
                Valid for (days)
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.days}
                  onChange={(event) =>
                    setForm({ ...form, days: event.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <p className="text-xs text-muted sm:col-span-2">
                The account email is generated automatically from the member&apos;s
                name when they sign up.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-bold text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                <Check className="h-4 w-4" />
                Generate
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
