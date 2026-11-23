"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { InventoryItem, Issuance, RequestItem, Transaction } from "@/lib/types";
import { SetupNotice } from "@/components/SetupNotice";

export default function ReportsPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [issuances, setIssuances] = useState<Issuance[]>([]);
  const [generatedAt, setGeneratedAt] = useState("Loading report...");

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [inventoryRes, transactionRes, requestRes, issuanceRes] =
        await Promise.all([
          supabase.from("inventory").select("*").order("name"),
          supabase
            .from("transactions")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("requests")
            .select("*")
            .order("requested_at", { ascending: false }),
          supabase
            .from("issuances")
            .select("*")
            .order("issued_at", { ascending: false }),
        ]);
      setInventory((inventoryRes.data ?? []) as InventoryItem[]);
      setTransactions((transactionRes.data ?? []) as Transaction[]);
      setRequests((requestRes.data ?? []) as RequestItem[]);
      setIssuances((issuanceRes.data ?? []) as Issuance[]);
      setGeneratedAt(new Date().toLocaleString());
    }
    void load();
  }, []);

  return (
    <>
      {!isSupabaseConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Records &amp; Accountability
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[#101d35]">Reports</h1>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-md bg-[#101d35] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-[#101d35]">
                Inventory Status Report
              </h2>
              <p className="text-xs text-slate-500">
                Generated {generatedAt}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Item</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Location</th>
                    <th className="py-2">On Hand</th>
                    <th className="py-2">Available</th>
                    <th className="py-2">Issued</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-bold">{item.name}</td>
                      <td className="py-3 text-slate-600">{item.category}</td>
                      <td className="py-3 text-slate-600">
                        {item.storage_location}
                      </td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">{item.available_quantity}</td>
                      <td className="py-3">{item.issued_quantity}</td>
                      <td className="py-3">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-break rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#101d35]">
              Transaction Summary
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["Receiving", "Issuance", "Return", "Adjustment"] as const).map(
                (type) => (
                  <div
                    key={type}
                    className="rounded-md border border-slate-200 p-4"
                  >
                    <div className="text-xs font-bold text-slate-500">{type}</div>
                    <div className="mt-1 text-2xl font-bold text-[#101d35]">
                      {
                        transactions.filter(
                          (transaction) => transaction.transaction_type === type,
                        ).length
                      }
                    </div>
                  </div>
                ),
              )}
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Type</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Source / Destination</th>
                    <th className="py-2">Reference</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.slice(0, 30).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="py-3 font-bold">
                        {transaction.transaction_type}
                      </td>
                      <td className="py-3">{transaction.quantity}</td>
                      <td className="py-3 text-slate-600">
                        {transaction.source_destination ?? "—"}
                      </td>
                      <td className="py-3">
                        {transaction.reference_number ?? "—"}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-break grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="mb-3 font-bold text-[#101d35]">Request Status</h2>
              {["Pending", "Approved", "Rejected"].map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between border-b border-slate-100 py-3 text-sm"
                >
                  <span className="text-slate-600">{status}</span>
                  <span className="font-bold">
                    {
                      requests.filter((request) => request.status === status)
                        .length
                    }
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="mb-3 font-bold text-[#101d35]">Issuance Status</h2>
              {["Issued", "Returned", "Overdue", "Damaged", "Missing"].map(
                (status) => (
                  <div
                    key={status}
                    className="flex items-center justify-between border-b border-slate-100 py-3 text-sm"
                  >
                    <span className="text-slate-600">{status}</span>
                    <span className="font-bold">
                      {
                        issuances.filter(
                          (issuance) => issuance.status === status,
                        ).length
                      }
                    </span>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
