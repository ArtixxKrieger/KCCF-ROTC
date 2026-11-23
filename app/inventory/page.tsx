"use client";

import { useEffect, useState } from "react";
import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { api, del, patch, post } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { InventoryItem } from "@/lib/types";
import { Badge, ConfirmDialog, Select, statusTone, useToast } from "@/components/ui";
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
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);
  const toast = useToast();

  async function load() {
    try {
      setItems(await api<InventoryItem[]>("/api/inventory"));
    } catch (error) {
      toast((error as Error).message, "error");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast("Item updated.");
      } else {
        await post("/api/inventory", payload);
        toast("Item added.");
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      toast((error as Error).message, "error");
    }
  }

  async function deleteItem() {
    if (!deleting) return;
    try {
      await del(`/api/inventory/${deleting.id}`);
      toast(`Deleted ${deleting.name}.`);
      setDeleting(null);
      await load();
    } catch (error) {
      toast((error as Error).message, "error");
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
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Asset Register
            </div>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              Inventory Management
            </h1>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, category, or location..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
            />
          </div>
          <div className="flex rounded-lg border border-border bg-background p-1">
            {["All", "Armory", "Supplies"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  filter === tab
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase tracking-wide text-muted">
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
              <tbody className="divide-y divide-border">
                {visible.map((item) => (
                  <tr key={item.id} className="transition hover:bg-surface-hover/60">
                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground">{item.name}</div>
                      <div className="text-xs text-muted">{item.item_type}</div>
                    </td>
                    <td className="px-5 py-4 text-muted">{item.category}</td>
                    <td className="px-5 py-4 text-muted">{item.storage_location}</td>
                    <td className="px-5 py-4 font-bold text-foreground">{item.quantity}</td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          Number(item.available_quantity) <= Number(item.min_stock_level)
                            ? "font-bold text-warning"
                            : "font-bold text-success"
                        }
                      >
                        {item.available_quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">{item.condition}</td>
                    <td className="px-5 py-4">
                      <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => setDeleting(item)}
                          className="rounded-lg p-2 text-danger hover:bg-danger-bg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted">
                      No inventory items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete inventory item?"
        message={`This will permanently remove "${deleting?.name}". This action cannot be undone.`}
        confirmLabel="Delete Item"
        onConfirm={() => void deleteItem()}
        onCancel={() => setDeleting(null)}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={saveItem}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold text-foreground">
                {editing ? "Edit inventory item" : "Add inventory item"}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-surface-hover"
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
                <label key={key} className="text-xs font-bold text-muted">
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
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-accent"
                  />
                </label>
              ))}
              <label className="text-xs font-bold text-muted">
                Item type
                <div className="mt-1">
                  <Select
                    value={form.item_type}
                    onChange={(value) => setForm({ ...form, item_type: value as InventoryItem["item_type"] })}
                    options={["Armory Equipment", "Other Supplies"].map((option) => ({
                      value: option,
                      label: option,
                    }))}
                  />
                </div>
              </label>
              <label className="text-xs font-bold text-muted">
                Condition
                <div className="mt-1">
                  <Select
                    value={form.condition}
                    onChange={(value) => setForm({ ...form, condition: value as InventoryItem["condition"] })}
                    options={["Excellent", "Good", "Fair", "Damaged"].map((option) => ({
                      value: option,
                      label: option,
                    }))}
                  />
                </div>
              </label>
              <label className="text-xs font-bold text-muted">
                Status
                <div className="mt-1">
                  <Select
                    value={form.status}
                    onChange={(value) => setForm({ ...form, status: value as InventoryItem["status"] })}
                    options={["Available", "Issued", "Damaged", "Under-maintenance"].map(
                      (option) => ({ value: option, label: option }),
                    )}
                  />
                </div>
              </label>
              <label className="text-xs font-bold text-muted sm:col-span-2">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-accent"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
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
