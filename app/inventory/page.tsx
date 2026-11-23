"use client";

import { useEffect, useState } from "react";
import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { api, del, patch, post } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { InventoryItem } from "@/lib/types";
import { SetupNotice } from "@/components/SetupNotice";

const emptyItem = {
  name: "",
  category: "",
  item_type: "Other Supplies" as InventoryItem["item_type"],
  quantity: 0,
  available_quantity: 0,
  issued_quantity: 0,
  damaged_quantity: 0,
  condition: "Good" as InventoryItem["condition"],
  status: "Available" as InventoryItem["status"],
  storage_location: "",
  min_stock_level: 0,
  unit: "units",
  description: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyItem);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setItems(await api<InventoryItem[]>("/api/inventory"));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyItem);
    setModalOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      item_type: item.item_type,
      quantity: item.quantity,
      available_quantity: item.available_quantity,
      issued_quantity: item.issued_quantity,
      damaged_quantity: item.damaged_quantity,
      condition: item.condition,
      status: item.status,
      storage_location: item.storage_location,
      min_stock_level: item.min_stock_level,
      unit: item.unit,
      description: item.description ?? "",
    });
    setModalOpen(true);
  }

  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      available_quantity: Number(form.available_quantity),
      issued_quantity: Number(form.issued_quantity),
      damaged_quantity: Number(form.damaged_quantity),
      min_stock_level: Number(form.min_stock_level),
    };
    try {
      if (editing) {
        await patch(`/api/inventory/${editing.id}`, payload);
      } else {
        await post("/api/inventory", payload);
      }
      setMessage(editing ? "Item updated." : "Item added.");
      setModalOpen(false);
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function deleteItem(item: InventoryItem) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await del(`/api/inventory/${item.id}`);
      setMessage("Item deleted.");
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  const visible = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.storage_location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All" ||
      (filter === "Armory" && item.item_type === "Armory Equipment") ||
      (filter === "Supplies" && item.item_type === "Other Supplies");
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Asset Register
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[#101d35]">
              Inventory Management
            </h1>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-md bg-[#101d35] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, category, or location..."
              className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1d3557]"
            />
          </div>
          <div className="flex rounded-md border border-slate-200 p-1">
            {["All", "Armory", "Supplies"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded px-3 py-1.5 text-xs font-bold ${
                  filter === tab
                    ? "bg-[#101d35] text-white"
                    : "text-slate-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">On Hand</th>
                  <th className="px-5 py-3">Available</th>
                  <th className="px-5 py-3">Condition</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.item_type}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{item.category}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.storage_location}
                    </td>
                    <td className="px-5 py-4 font-bold">{item.quantity}</td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          Number(item.available_quantity) <=
                          Number(item.min_stock_level)
                            ? "font-bold text-amber-700"
                            : "font-bold text-emerald-700"
                        }
                      >
                        {item.available_quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{item.condition}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => openEdit(item)}
                          className="rounded p-2 text-slate-500 hover:bg-slate-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => void deleteItem(item)}
                          className="rounded p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      No inventory items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveItem}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-[#101d35]">
                {editing ? "Edit inventory item" : "Add inventory item"}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
                className="rounded p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {(
                [
                  ["name", "Item name", "text"],
                  ["category", "Category", "text"],
                  ["storage_location", "Storage location", "text"],
                  ["quantity", "Total quantity", "number"],
                  ["available_quantity", "Available quantity", "number"],
                  ["issued_quantity", "Issued quantity", "number"],
                  ["damaged_quantity", "Damaged quantity", "number"],
                  ["min_stock_level", "Minimum stock level", "number"],
                  ["unit", "Unit", "text"],
                ] as const
              ).map(([key, label, type]) => (
                <label key={key} className="text-xs font-bold text-slate-600">
                  {label}
                  <input
                    required
                    type={type}
                    min={type === "number" ? 0 : undefined}
                    value={(form as unknown as Record<string, unknown>)[key] as string | number}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]:
                          type === "number"
                            ? Number(event.target.value)
                            : event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-[#1d3557]"
                  />
                </label>
              ))}
              <label className="text-xs font-bold text-slate-600">
                Item type
                <select
                  value={form.item_type}
                  onChange={(event) =>
                    setForm({ ...form, item_type: event.target.value as InventoryItem["item_type"] })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal"
                >
                  <option>Armory Equipment</option>
                  <option>Other Supplies</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                Condition
                <select
                  value={form.condition}
                  onChange={(event) =>
                    setForm({ ...form, condition: event.target.value as InventoryItem["condition"] })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal"
                >
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Damaged</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as InventoryItem["status"] })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal"
                >
                  <option>Available</option>
                  <option>Issued</option>
                  <option>Damaged</option>
                  <option>Under-maintenance</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-[#1d3557]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#101d35] px-4 py-2 text-sm font-bold text-white"
              >
                {editing ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
