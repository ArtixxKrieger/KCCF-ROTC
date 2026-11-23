"use client";

import { useEffect, useState } from "react";
import { PackageCheck } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
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
    if (!supabase) return;
    const [inventory, history] = await Promise.all([
      supabase.from("inventory").select("*").order("name"),
      supabase
        .from("transactions")
        .select("*")
        .eq("transaction_type", "Receiving")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setItems((inventory.data ?? []) as InventoryItem[]);
    setTransactions((history.data ?? []) as Transaction[]);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function receive(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    if (!form.inventoryId) {
      setMessage("Select an inventory item.");
      return;
    }

    const { error } = await supabase.rpc("receive_inventory", {
      p_inventory_id: form.inventoryId,
      p_quantity: Number(form.quantity),
      p_source: form.source,
      p_reference: form.reference || null,
      p_notes: form.notes || null,
    });
    if (error) setMessage(error.message);
    else {
      setMessage("Receipt recorded; inventory updated.");
      setForm({
        inventoryId: "",
        quantity: 1,
        source: "",
        reference: "",
        notes: "",
      });
      await load();
    }
  }

  return (
    <>
      {!isSupabaseConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Inbound Logistics
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[#101d35]">Receiving</h1>
        </div>

        {message && (
          <div className="mb-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
          <form
            onSubmit={receive}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#101d35]">Record Receipt</h2>
                <p className="text-xs text-slate-500">
                  Purchased, donated, or transferred stock
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-600">
                Inventory item
                <select
                  required
                  value={form.inventoryId}
                  onChange={(event) =>
                    setForm({ ...form, inventoryId: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.available_quantity} available
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Quantity
                <input
                  required
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Source
                <input
                  required
                  value={form.source}
                  onChange={(event) =>
                    setForm({ ...form, source: event.target.value })
                  }
                  placeholder="Supplier or issuing unit"
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Reference number
                <input
                  value={form.reference}
                  onChange={(event) =>
                    setForm({ ...form, reference: event.target.value })
                  }
                  placeholder="PO, donation, or transfer ID"
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-[#101d35] px-4 py-3 text-sm font-bold text-white"
              >
                Record and Update Stock
              </button>
            </div>
          </form>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-[#101d35]">Recent Receipts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Quantity</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-5 py-4 font-medium">
                        {transaction.reference_number ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {transaction.source_destination ?? "—"}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {transaction.quantity}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
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
