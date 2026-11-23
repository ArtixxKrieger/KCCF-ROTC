"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeClient } from "@neon/realtime/client";
import type { SealedLiveQuery } from "@neon/realtime/client";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  Clock3,
  Package,
} from "lucide-react";
import { api } from "@/lib/api";
import { isNeonConfigured } from "@/lib/env";
import type { Transaction } from "@/lib/types";
import { SetupNotice } from "@/components/SetupNotice";

type LiveRow = {
  id: string;
  name: string;
  category: string;
  item_type: string;
  quantity: number;
  available_quantity: number;
  issued_quantity: number;
  damaged_quantity: number;
  condition: string;
  status: string;
  storage_location: string;
  min_stock_level: number;
  unit: string;
  description: string | null;
};

type Stats = {
  total: number;
  available: number;
  issued: number;
  lowStock: number;
  pending: number;
  overdue: number;
};

const emptyStats: Stats = {
  total: 0,
  available: 0,
  issued: 0,
  lowStock: 0,
  pending: 0,
  overdue: 0,
};

function computeStats(rows: LiveRow[], pending: number, overdue: number): Stats {
  return {
    total: rows.reduce((sum, item) => sum + Number(item.quantity), 0),
    available: rows.reduce(
      (sum, item) => sum + Number(item.available_quantity),
      0,
    ),
    issued: rows.reduce((sum, item) => sum + Number(item.issued_quantity), 0),
    lowStock: rows.filter(
      (item) =>
        Number(item.available_quantity) <= Number(item.min_stock_level),
    ).length,
    pending,
    overdue,
  };
}

export default function DashboardPage() {
  const [items, setItems] = useState<LiveRow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [liveStatus, setLiveStatus] = useState<string>("offline");

  const clientRef = useRef<ReturnType<typeof createRealtimeClient> | null>(null);
  const subRef = useRef<{
    renew: (query: SealedLiveQuery<LiveRow>) => Promise<void>;
    unsubscribe: () => void;
  } | null>(null);
  const renewingRef = useRef(false);

  const refreshSealed = useCallback(async () => {
    if (renewingRef.current) return;
    renewingRef.current = true;
    try {
      const sealed = await api<SealedLiveQuery<LiveRow>>("/api/realtime", {
        method: "POST",
      });
      if (subRef.current) {
        await subRef.current.renew(sealed);
      }
    } catch (error) {
      console.error("Realtime renewal failed", error);
    } finally {
      renewingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api<{
          stats: Stats;
          inventory: LiveRow[];
          recentTransactions: Transaction[];
        }>("/api/dashboard");
        if (cancelled) return;
        setItems(data.inventory);
        setTransactions(data.recentTransactions);
        setStats(data.stats);
      } catch (error) {
        console.error("Dashboard load failed", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function subscribe() {
      const url = process.env.NEXT_PUBLIC_NEON_REALTIME_URL;
      if (!url) return;
      try {
        const sealed = await api<SealedLiveQuery<LiveRow>>("/api/realtime", {
          method: "POST",
        });
        if (cancelled) return;
        const client = createRealtimeClient({ url });
        clientRef.current = client;
        const sub = client.subscribe(sealed);
        subRef.current = sub;
        setLiveStatus(sub.getSnapshot().status);

        sub.onChange((snapshot) => {
          setLiveStatus(snapshot.status);
          if (snapshot.data) {
            const rows = snapshot.data as LiveRow[];
            setItems(rows);
            setStats((current) =>
              computeStats(rows, current.pending, current.overdue),
            );
          }
        });

        sub.onStateChange((state) => {
          setLiveStatus(state.status);
          if (state.status === "stale") {
            void refreshSealed();
          }
        });
      } catch (error) {
        console.error("Realtime subscription failed", error);
        setLiveStatus("error");
      }
    }

    void load();
    void subscribe();

    return () => {
      cancelled = true;
      subRef.current?.unsubscribe();
      clientRef.current?.close();
    };
  }, [refreshSealed]);

  const cards = [
    { label: "Total Inventory", value: stats.total, icon: Boxes, accent: "bg-blue-50 text-blue-700" },
    { label: "Available", value: stats.available, icon: Package, accent: "bg-emerald-50 text-emerald-700" },
    { label: "Issued", value: stats.issued, icon: ArrowUpFromLine, accent: "bg-violet-50 text-violet-700" },
    { label: "Low Stock", value: stats.lowStock, icon: AlertTriangle, accent: "bg-amber-50 text-amber-700" },
    { label: "Pending Requests", value: stats.pending, icon: ClipboardList, accent: "bg-sky-50 text-sky-700" },
    { label: "Overdue Returns", value: stats.overdue, icon: Clock3, accent: "bg-red-50 text-red-700" },
  ];

  const maxQuantity = Math.max(...items.map((item) => Number(item.quantity)), 1);

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Command Overview
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[#101d35]">
              Logistics Dashboard
            </h1>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            <span
              className={`mr-2 inline-block h-2 w-2 rounded-full ${
                liveStatus === "live"
                  ? "bg-emerald-500"
                  : liveStatus === "error"
                    ? "bg-red-500"
                    : "bg-amber-500"
              }`}
            />
            {liveStatus === "live"
              ? "Live via Neon Realtime"
              : liveStatus === "error"
                ? "Realtime error"
                : "Connecting..."}
          </div>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${card.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-2xl font-bold text-[#101d35]">
                  {loading ? "—" : card.value}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-500">
                  {card.label}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-[#101d35]">Inventory Overview</h2>
              <div className="text-xs text-slate-500">By total quantity</div>
            </div>
            {items.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                No inventory data available
              </div>
            ) : (
              <div className="space-y-4">
                {items.slice(0, 7).map((item) => (
                  <div key={item.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {item.name}
                      </span>
                      <span className="text-slate-500">
                        {Number(item.available_quantity)}/{Number(item.quantity)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#1d3557]"
                        style={{
                          width: `${Math.max(
                            4,
                            (Number(item.quantity) / maxQuantity) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-[#101d35]">Recent Transactions</h2>
            </div>
            {transactions.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-400">
                No recent transactions
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        transaction.transaction_type === "Receiving"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {transaction.transaction_type === "Receiving" ? (
                        <ArrowDownToLine className="h-4 w-4" />
                      ) : (
                        <ArrowUpFromLine className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {transaction.transaction_type}
                      </div>
                      <div className="text-xs text-slate-500">
                        Qty {transaction.quantity}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
