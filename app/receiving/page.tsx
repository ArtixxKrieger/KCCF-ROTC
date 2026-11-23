"use client";

import { useEffect, useState } from "react";
import { PackageCheck } from "lucide-react";
import { api, post } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { InventoryItem, Transaction } from "@/lib/types";
import { SetupNotice } from "@/components/SetupNotice";

export default function ReceivingPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    inventoryId: "",
    quantity: 1,
    source: "",
    reference: "",
    notes: "",
  });
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [inventory, history] = await Promise.all([
        api<InventoryItem[]>("/api/inventory"),
        api<Transaction[]>("/api/receiving"),
      ]);
      setItems(inventory);
      setTransactions(history);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function receive(event: React.FormEvent) {
    event.preventDefault();
    if (!form.inventoryId) {
      setMessage("Select an inventory item.");
      return;
    }
    try {
      await post("/api/receiving", {
        inventory_id: form.inventoryId,
        quantity: Number(form.quantity),
        source: form.source,
        reference: form.reference || null,
        notes: form.notes || null,
      });
      setMessage("Receipt recorded; inventory updated.");
      setForm({
        inventoryId: "",
        quantity: 1,
        source: "",
        reference: "",
        notes: "",
      });
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Inbound Logistics
          </div>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Receiving</h1>
        </div>

        {message && (
          <div className="mb-4 rounded-md border border-border bg-surface px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
          <form
            onSubmit={receive}
            className="rounded-lg border border-border bg-surface p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-success-bg text-success">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Record Receipt</h2>
                <p className="text-xs text-muted">
                  Purchased, donated, or transferred stock
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-muted">
                Inventory item
                <select
                  required
                  value={form.inventoryId}
                  onChange={(event) =>
                    setForm({ ...form, inventoryId: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.available_quantity} available
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-muted">
                Quantity
                <input
                  required
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-muted">
                Source
                <input
                  required
                  value={form.source}
                  onChange={(event) =>
                    setForm({ ...form, source: event.target.value })
                  }
                  placeholder="Supplier or issuing unit"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-muted">
                Reference number
                <input
                  value={form.reference}
                  onChange={(event) =>
                    setForm({ ...form, reference: event.target.value })
                  }
                  placeholder="PO, donation, or transfer ID"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-muted">
                Notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
              >
                Record and Update Stock
              </button>
            </div>
          </form>

          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-bold text-foreground">Recent Receipts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-surface-hover text-xs uppercase text-muted">
                  <tr>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Quantity</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-5 py-4 font-medium">
                        {transaction.reference_number ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {transaction.source_destination ?? "—"}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {transaction.quantity}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-muted">
                        No receipts recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
