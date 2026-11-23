"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { api, patch, post } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { InventoryItem, RequestItem } from "@/lib/types";
import { Select } from "@/components/ui";
import { SetupNotice } from "@/components/SetupNotice";

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState("Pending");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    requestedBy: "",
    inventoryId: "",
    quantity: 1,
    purpose: "",
  });
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [requestRows, inventoryRows] = await Promise.all([
        api<RequestItem[]>("/api/requests"),
        api<InventoryItem[]>("/api/inventory"),
      ]);
      setRequests(requestRows);
      setItems(inventoryRows);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createRequest(event: React.FormEvent) {
    event.preventDefault();
    const item = items.find((candidate) => candidate.id === form.inventoryId);
    if (!item) {
      setMessage("Select an item.");
      return;
    }
    try {
      await post("/api/requests", {
        requested_by: form.requestedBy,
        inventory_id: item.id,
        item_name: item.name,
        quantity: Number(form.quantity),
        purpose: form.purpose,
      });
      setMessage("Equipment request submitted.");
      setFormOpen(false);
      setForm({ requestedBy: "", inventoryId: "", quantity: 1, purpose: "" });
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function reviewRequest(
    request: RequestItem,
    status: "Approved" | "Rejected",
  ) {
    try {
      await patch("/api/requests", {
        id: request.id,
        status,
        reviewed_by: "Jordan Blake",
      });
      setMessage(`Request ${status.toLowerCase()}.`);
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  const visible = requests.filter(
    (request) => filter === "All" || request.status === filter,
  );

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Personnel Support
            </div>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              Equipment Requests
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-md border border-border bg-surface px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="mb-4 flex gap-1 rounded-md border border-border bg-surface p-1">
          {["Pending", "Approved", "Rejected", "All"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded px-3 py-2 text-xs font-bold ${
                filter === tab ? "bg-primary text-primary-foreground" : "text-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">Requester</th>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Purpose</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((request) => (
                  <tr key={request.id}>
                    <td className="px-5 py-4 font-bold">{request.requested_by}</td>
                    <td className="px-5 py-4">{request.item_name}</td>
                    <td className="px-5 py-4 font-bold">{request.quantity}</td>
                    <td className="max-w-xs px-5 py-4 text-muted">
                      {request.purpose ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          request.status === "Approved"
                            ? "bg-success-bg text-success"
                            : request.status === "Rejected"
                              ? "bg-danger-bg text-danger"
                              : "bg-warning-bg text-warning"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {request.status === "Pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void reviewRequest(request, "Approved")}
                            className="flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void reviewRequest(request, "Rejected")}
                            className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-muted">
                          Reviewed
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      No requests in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={createRequest}
            className="w-full max-w-lg rounded-lg bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold text-foreground">New equipment request</h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded p-2 text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block text-xs font-bold text-muted">
                Requested by
                <input
                  required
                  value={form.requestedBy}
                  onChange={(event) =>
                    setForm({ ...form, requestedBy: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-muted">
                Item
                <div className="mt-1">
                  <Select
                    value={form.inventoryId}
                    onChange={(value) => setForm({ ...form, inventoryId: value })}
                    placeholder="Select item"
                    options={items.map((item) => ({ value: item.id, label: item.name }))}
                  />
                </div>
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
                Purpose
                <textarea
                  required
                  rows={3}
                  value={form.purpose}
                  onChange={(event) =>
                    setForm({ ...form, purpose: event.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
