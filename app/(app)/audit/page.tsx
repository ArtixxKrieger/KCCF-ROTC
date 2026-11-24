"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { api } from "@/lib/api";
import { AUDIT_ACTIONS, auditActionLabel } from "@/lib/audit-actions";
import { isNeonConfigured } from "@/lib/env";
import { Select } from "@/components/ui";
import { SetupNotice } from "@/components/SetupNotice";

type AuditLog = {
  id: string;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_OPTIONS = [
  { value: "All", label: "All actions" },
  ...AUDIT_ACTIONS.map(({ key, label }) => ({ value: key, label })),
];

function toneFor(action: string) {
  if (action.endsWith(".failed") || action.endsWith("_failed"))
    return "bg-danger-bg text-danger";
  if (action === "inventory.delete" || action === "user.delete")
    return "bg-danger-bg text-danger";
  if (action.startsWith("login.") || action.startsWith("account."))
    return "bg-info-bg text-info";
  if (action.startsWith("inventory.") || action.startsWith("user."))
    return "bg-warning-bg text-warning";
  return "bg-success-bg text-success";
}

function entityLabel(entity: string | null) {
  if (!entity) return "—";
  return entity.charAt(0).toUpperCase() + entity.slice(1);
}

const FIELD_LABELS: Record<string, string> = {
  role: "Role",
  active: "Status",
  days: "Valid for",
  name: "Item",
  category: "Category",
  quantity: "Qty",
  source: "Source",
  reference: "Reference",
  issued_to: "Issued to",
  requested_by: "Requested by",
  item_name: "Item",
  status: "Status",
  condition: "Condition",
  objectKey: "File",
  invite_id: "Invite",
  email: "Email",
  inventory_id: "Inventory",
};

function formatValue(key: string, value: unknown): string {
  if (key === "active") return value ? "Activated" : "Deactivated";
  if (key === "days") {
    const n = Number(value);
    return `${n} day${n === 1 ? "" : "s"}`;
  }
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return "—";
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function detailEntries(details: Record<string, unknown> | null) {
  if (!details) return [];
  return Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      key,
      label: FIELD_LABELS[key] ?? key.replaceAll("_", " "),
      value: formatValue(key, value),
    }));
}

const inputClass =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api<AuditLog[]>("/api/audit")
        .then(setLogs)
        .catch((error) => console.error(error));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "All" && log.action !== actionFilter) return false;
      if (search.trim()) {
        const haystack = [
          log.actor_name,
          log.actor_email,
          log.action,
          auditActionLabel(log.action),
          log.entity,
          log.entity_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      const date = new Date(log.created_at).toISOString().slice(0, 10);
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    });
  }, [logs, actionFilter, search, from, to]);

  function exportCsv() {
    const header = ["When", "Who", "Email", "Role", "Action", "Entity", "Entity ID", "Details"];
    const rows = visible.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.actor_name,
      log.actor_email,
      log.actor_role,
      auditActionLabel(log.action),
      entityLabel(log.entity),
      log.entity_id ?? "",
      detailEntries(log.details)
        .map((entry) => `${entry.label}: ${entry.value}`)
        .join("; ")
        .replaceAll('"', '""'),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Accountability
            </div>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Audit Log</h1>
            <p className="mt-1 text-sm text-muted">
              Every action recorded with who performed it, what changed, and when.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-hover"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="mb-4 grid gap-3 rounded-xl border border-border bg-surface p-3 md:grid-cols-[1fr_200px_140px_140px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search person, action, or record…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
            />
          </div>
          <Select
            value={actionFilter}
            onChange={setActionFilter}
            options={ACTION_OPTIONS}
          />
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className={inputClass}
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Who</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((log) => (
                  <tr key={log.id} className="transition hover:bg-surface-hover/60">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-foreground">
                        {log.actor_name}
                      </div>
                      <div className="text-xs text-muted">
                        {log.actor_role} · {log.actor_email}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        title={log.action}
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneFor(log.action)}`}
                      >
                        {auditActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {entityLabel(log.entity)}
                      {log.entity_id && (
                        <span className="block truncate text-xs">
                          {log.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const entries = detailEntries(log.details);
                        if (entries.length === 0) {
                          return <span className="text-xs text-muted">—</span>;
                        }
                        return (
                          <div className="flex max-w-xs flex-wrap gap-1.5">
                            {entries.map((entry) => (
                              <span
                                key={entry.key}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-hover px-2 py-0.5 text-[11px]"
                              >
                                <span className="text-muted">{entry.label}</span>
                                <span className="font-semibold text-foreground">
                                  {entry.value}
                                </span>
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted">
                      No audit entries match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
