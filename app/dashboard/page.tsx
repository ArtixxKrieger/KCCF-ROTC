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
    available: rows.reduce((sum, item) => sum + Number(item.available_quantity), 0),
    issued: rows.reduce((sum, item) => sum + Number(item.issued_quantity), 0),
    lowStock: rows.filter(
      (item) => Number(item.available_quantity) <= Number(item.min_stock_level),
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
      if (subRef.current) await subRef.current.renew(sealed);
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

        sub.onChange((snapshot) => {
          if (snapshot.data) {
            const rows = snapshot.data as LiveRow[];
            setItems(rows);
            setStats((current) => computeStats(rows, current.pending, current.overdue));
          }
        });

        sub.onStateChange((state) => {
          if (state.status === "stale") void refreshSealed();
        });
      } catch (error) {
        console.error("Realtime subscription failed", error);
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
    { label: "Total Inventory", value: stats.total, icon: Boxes, tint: "text-info bg-info-bg" },
    { label: "Available", value: stats.available, icon: Package, tint: "text-success bg-success-bg" },
    { label: "Issued", value: stats.issued, icon: ArrowUpFromLine, tint: "text-warning bg-warning-bg" },
    { label: "Low Stock", value: stats.lowStock, icon: AlertTriangle, tint: "text-warning bg-warning-bg" },
    { label: "Pending Requests", value: stats.pending, icon: ClipboardList, tint: "text-info bg-info-bg" },
    { label: "Overdue Returns", value: stats.overdue, icon: Clock3, tint: "text-danger bg-danger-bg" },
  ];

  const maxQuantity = Math.max(...items.map((item) => Number(item.quantity)), 1);

  return (
    <>
      {!isNeonConfigured && <SetupNotice />}
      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Command Overview
            </div>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              Logistics Dashboard
            </h1>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-2xl font-bold text-foreground">
                  {loading ? "—" : card.value.toLocaleString()}
                </div>
                <div className="mt-1 text-xs font-medium text-muted">{card.label}</div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-foreground">Inventory Overview</h2>
              <div className="text-xs text-muted">By total quantity</div>
            </div>
            {items.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted">
                No inventory data available
              </div>
            ) : (
              <div className="space-y-4">
                {items.slice(0, 7).map((item) => (
                  <div key={item.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-foreground">{item.name}</span>
                      <span className="text-muted">
                        {Number(item.available_quantity)}/{Number(item.quantity)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${Math.max(4, (Number(item.quantity) / maxQuantity) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-bold text-foreground">Recent Transactions</h2>
            </div>
            {transactions.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted">
                No recent transactions
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        transaction.transaction_type === "Receiving"
                          ? "bg-success-bg text-success"
                          : "bg-info-bg text-info"
                      }`}
                    >
                      {transaction.transaction_type === "Receiving" ? (
                        <ArrowDownToLine className="h-4 w-4" />
                      ) : (
                        <ArrowUpFromLine className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {transaction.transaction_type}
                      </div>
                      <div className="text-xs text-muted">Qty {transaction.quantity}</div>
                    </div>
                    <div className="text-xs text-muted">
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
