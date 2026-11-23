"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { api } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { Transaction } from "@/lib/types";
import { Badge, Select } from "@/components/ui";
import { SetupNotice } from "@/components/SetupNotice";

function toneFor(type: string) {
  switch (type) {
    case "Receiving":
      return "success" as const;
    case "Return":
      return "success" as const;
    case "Issuance":
      return "info" as const;
    case "Adjustment":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default function AuditPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api<Transaction[]>("/api/transactions")
        .then(setTransactions)
        .catch((error) => console.error(error));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => {
    return transactions.filter((transaction) => {
      if (typeFilter !== "All" && transaction.transaction_type !== typeFilter) {
        return false;
      }
      if (search.trim()) {
        const haystack = [
          transaction.source_destination,
          transaction.reference_number,
          transaction.performed_by,
          transaction.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      const date = new Date(transaction.created_at).toISOString().slice(0, 10);
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    });
  }, [transactions, typeFilter, search, from, to]);

  function exportCsv() {
    const header = [
      "Timestamp",
      "Type",
      "Quantity",
      "Source/Destination",
      "Reference",
      "Performed By",
      "Notes",
    ];
    const rows = visible.map((t) => [
      new Date(t.created_at).toLocaleString(),
      t.transaction_type,
      String(t.quantity),
      t.source_destination ?? "",
      t.reference_number ?? "",
      t.performed_by ?? "",
      (t.notes ?? "").replaceAll('"', '""'),
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

        <div className="mb-4 grid gap-3 rounded-xl border border-border bg-surface p-3 md:grid-cols-[1fr_180px_140px_140px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search source, reference, or officer…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={["All", "Receiving", "Issuance", "Return", "Adjustment"].map((type) => ({
              value: type,
              label: type,
            }))}
          />
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Source / Destination</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Performed By</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((transaction) => (
                  <tr key={transaction.id} className="transition hover:bg-surface-hover/60">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={toneFor(transaction.transaction_type)}>
                        {transaction.transaction_type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-bold text-foreground">
                      {transaction.quantity}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {transaction.source_destination ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {transaction.reference_number ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {transaction.performed_by ?? "—"}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-muted">
                      {transaction.notes ?? "—"}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted">
                      No transactions match the current filters
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
