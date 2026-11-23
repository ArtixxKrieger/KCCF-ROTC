"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Send, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { InventoryItem, Issuance } from "@/lib/types";
import { SetupNotice } from "@/components/SetupNotice";

export default function IssuancesPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [issuances, setIssuances] = useState<Issuance[]>([]);
  const [tab, setTab] = useState("Issued");
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState<Issuance | null>(null);
  const [issueForm, setIssueForm] = useState({
    inventoryId: "",
    issuedTo: "",
    quantity: 1,
    purpose: "",
    dueAt: "",
    reference: "",
  });
  const [returnCondition, setReturnCondition] = useState("Good");
  const [returnNotes, setReturnNotes] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!supabase) return;
    const [inventoryRes, issuanceRes] = await Promise.all([
      supabase.from("inventory").select("*").order("name"),
      supabase
        .from("issuances")
        .select("*")
        .order("issued_at", { ascending: false }),
    ]);
    setItems((inventoryRes.data ?? []) as InventoryItem[]);
    setIssuances((issuanceRes.data ?? []) as Issuance[]);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submitIssue(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const item = items.find((candidate) => candidate.id === issueForm.inventoryId);
    if (!item) {
      setMessage("Select an inventory item.");
      return;
    }
    if (Number(issueForm.quantity) > item.available_quantity) {
      setMessage(
        `Cannot issue ${issueForm.quantity} units. Only ${item.available_quantity} are available.`,
      );
      return;
    }

    const { error } = await supabase.rpc("issue_inventory", {
      p_inventory_id: item.id,
      p_quantity: Number(issueForm.quantity),
      p_issued_to: issueForm.issuedTo,
      p_purpose: issueForm.purpose || null,
      p_due_at: issueForm.dueAt ? new Date(issueForm.dueAt).toISOString() : null,
      p_reference: issueForm.reference || null,
    });
    if (error) setMessage(error.message);
    else {
      setMessage("Equipment issued successfully.");
      setIssueOpen(false);
      setIssueForm({
        inventoryId: "",
        issuedTo: "",
        quantity: 1,
        purpose: "",
        dueAt: "",
        reference: "",
      });
      await load();
    }
  }

  async function submitReturn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !returnOpen) return;
    const { error } = await supabase.rpc("return_inventory", {
      p_issuance_id: returnOpen.id,
      p_condition: returnCondition,
      p_notes: returnNotes || null,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(
        returnCondition === "Damaged" || returnCondition === "Missing"
          ? "Return recorded. Damaged or missing items were not added to available stock."
          : "Return recorded; item added back to available stock.",
      );
      setReturnOpen(null);
      setReturnNotes("");
      await load();
    }
  }

  const visible = issuances.filter(
    (issuance) => tab === "All" || issuance.status === tab,
  );

  function itemName(id: string) {
    return items.find((item) => item.id === id)?.name ?? "Inventory item";
  }

  return (
    <>
      {!isSupabaseConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Accountability
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[#101d35]">
              Issuance &amp; Returns
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setIssueOpen(true)}
            className="flex items-center gap-2 rounded-md bg-[#101d35] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Send className="h-4 w-4" />
            Issue Equipment
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="mb-4 flex gap-1 overflow-x-auto rounded-md border border-slate-200 bg-white p-1">
          {["Issued", "Returned", "Overdue", "Damaged", "Missing", "All"].map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setTab(status)}
                className={`whitespace-nowrap rounded px-3 py-2 text-xs font-bold ${
                  tab === status ? "bg-[#101d35] text-white" : "text-slate-500"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Issued To</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((issuance) => (
                  <tr key={issuance.id}>
                    <td className="px-5 py-4 font-medium">
                      {issuance.reference_number ?? "—"}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {itemName(issuance.inventory_id)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {issuance.issued_to}
                    </td>
                    <td className="px-5 py-4 font-bold">{issuance.quantity}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {issuance.due_at
                        ? new Date(issuance.due_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {issuance.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {issuance.status !== "Returned" &&
                      issuance.status !== "Damaged" &&
                      issuance.status !== "Missing" ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setReturnOpen(issuance)}
                            className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Process Return
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-slate-400">
                          Closed
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No issuance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {issueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitIssue}
            className="w-full max-w-lg rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-[#101d35]">Issue equipment</h2>
              <button
                type="button"
                onClick={() => setIssueOpen(false)}
                className="rounded p-2 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                Item
                <select
                  required
                  value={issueForm.inventoryId}
                  onChange={(event) =>
                    setIssueForm({ ...issueForm, inventoryId: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                >
                  <option value="">Select available item</option>
                  {items
                    .filter((item) => item.available_quantity > 0)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.available_quantity} available
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                Issued to
                <input
                  required
                  value={issueForm.issuedTo}
                  onChange={(event) =>
                    setIssueForm({ ...issueForm, issuedTo: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Quantity
                <input
                  required
                  type="number"
                  min={1}
                  value={issueForm.quantity}
                  onChange={(event) =>
                    setIssueForm({
                      ...issueForm,
                      quantity: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Due date
                <input
                  type="date"
                  value={issueForm.dueAt}
                  onChange={(event) =>
                    setIssueForm({ ...issueForm, dueAt: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Reference
                <input
                  value={issueForm.reference}
                  onChange={(event) =>
                    setIssueForm({ ...issueForm, reference: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                Purpose
                <textarea
                  rows={3}
                  value={issueForm.purpose}
                  onChange={(event) =>
                    setIssueForm({ ...issueForm, purpose: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setIssueOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#101d35] px-4 py-2 text-sm font-bold text-white"
              >
                Confirm Issuance
              </button>
            </div>
          </form>
        </div>
      )}

      {returnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitReturn}
            className="w-full max-w-md rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-[#101d35]">Process return</h2>
              <button
                type="button"
                onClick={() => setReturnOpen(null)}
                className="rounded p-2 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <span className="font-bold">{itemName(returnOpen.inventory_id)}</span>
                <span className="ml-2 text-slate-500">
                  Qty {returnOpen.quantity}
                </span>
              </div>
              <label className="block text-xs font-bold text-slate-600">
                Condition on return
                <select
                  value={returnCondition}
                  onChange={(event) => setReturnCondition(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                >
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Damaged</option>
                  <option>Missing</option>
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Inspection notes
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(event) => setReturnNotes(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setReturnOpen(null)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#101d35] px-4 py-2 text-sm font-bold text-white"
              >
                Complete Return
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
