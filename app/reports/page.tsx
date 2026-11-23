"use client";

import { useEffect, useState } from "react";
import { CloudUpload, Download, Printer } from "lucide-react";
import { api, post } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { InventoryItem, Issuance, RequestItem, Transaction } from "@/lib/types";
import { SetupNotice } from "@/components/SetupNotice";

type ReportExport = {
  id: string;
  bucket: string;
  object_key: string;
  file_name: string;
  created_at: string;
  url: string;
};

export default function ReportsPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [issuances, setIssuances] = useState<Issuance[]>([]);
  const [exports, setExports] = useState<ReportExport[]>([]);
  const [generatedAt, setGeneratedAt] = useState("Loading report...");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const data = await api<{
        inventory: InventoryItem[];
        transactions: Transaction[];
        requests: RequestItem[];
        issuances: Issuance[];
      }>("/api/reports");
      setInventory(data.inventory);
      setTransactions(data.transactions);
      setRequests(data.requests);
      setIssuances(data.issuances);
      setGeneratedAt(new Date().toLocaleString());
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function loadExports() {
    try {
      setExports(await api<ReportExport[]>("/api/storage"));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
      void loadExports();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function exportToStorage() {
    try {
      await post<ReportExport>("/api/storage", {});
      setMessage("Report exported to Neon Object Storage.");
      await loadExports();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Records &amp; Accountability
            </div>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Reports</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void exportToStorage()}
              className="flex items-center gap-2 rounded-md border border-accent px-4 py-2.5 text-sm font-bold text-foreground"
            >
              <CloudUpload className="h-4 w-4" />
              Export to Storage
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-bold text-white"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </button>
          </div>
        </div>

        {message && (
          <div className="no-print mb-4 rounded-md border border-border bg-surface px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="no-print mb-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-foreground">
            Object Storage Exports
          </h2>
          {exports.length === 0 ? (
            <p className="text-sm text-muted">
              No exports yet. Use “Export to Storage” to write a JSON report to
              the Neon <code>assets</code> bucket.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {exports.map((report) => (
                <li
                  key={report.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="text-sm">
                    <div className="font-bold">{report.file_name}</div>
                    <div className="text-xs text-muted">
                      {report.bucket}/{report.object_key}
                    </div>
                  </div>
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-bold text-muted"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">
                Inventory Status Report
              </h2>
              <p className="text-xs text-muted">Generated {generatedAt}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted">
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
                <tbody className="divide-y divide-border">
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-bold">{item.name}</td>
                      <td className="py-3 text-muted">{item.category}</td>
                      <td className="py-3 text-muted">
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

          <section className="print-break rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              Transaction Summary
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["Receiving", "Issuance", "Return", "Adjustment"] as const).map(
                (type) => (
                  <div
                    key={type}
                    className="rounded-md border border-border p-4"
                  >
                    <div className="text-xs font-bold text-muted">{type}</div>
                    <div className="mt-1 text-2xl font-bold text-foreground">
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
                <thead className="border-b border-border text-xs uppercase text-muted">
                  <tr>
                    <th className="py-2">Type</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Source / Destination</th>
                    <th className="py-2">Reference</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.slice(0, 30).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="py-3 font-bold">
                        {transaction.transaction_type}
                      </td>
                      <td className="py-3">{transaction.quantity}</td>
                      <td className="py-3 text-muted">
                        {transaction.source_destination ?? "—"}
                      </td>
                      <td className="py-3">
                        {transaction.reference_number ?? "—"}
                      </td>
                      <td className="py-3 text-muted">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-break grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="mb-3 font-bold text-foreground">Request Status</h2>
              {["Pending", "Approved", "Rejected"].map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between border-b border-border py-3 text-sm"
                >
                  <span className="text-muted">{status}</span>
                  <span className="font-bold">
                    {
                      requests.filter((request) => request.status === status)
                        .length
                    }
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="mb-3 font-bold text-foreground">Issuance Status</h2>
              {["Issued", "Returned", "Overdue", "Damaged", "Missing"].map(
                (status) => (
                  <div
                    key={status}
                    className="flex items-center justify-between border-b border-border py-3 text-sm"
                  >
                    <span className="text-muted">{status}</span>
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
