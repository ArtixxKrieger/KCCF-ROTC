import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


type InventoryRow = {
  quantity: number | string;
  available_quantity: number | string;
  issued_quantity: number | string;
  min_stock_level: number | string;
};

export async function GET() {
  try {
    const [inventory, transactions, pending, overdue] = await Promise.all([
      sql`select * from inventory order by name`,
      sql`select * from transactions order by created_at desc limit 6`,
      sql`select count(*)::int as count from requests where status = 'Pending'`,
      sql`select count(*)::int as count from issuances where due_at < now() and status in ('Issued', 'Overdue')`,
    ]);

    const rows = inventory as InventoryRow[];
    const stats = {
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
      pending: Number((pending as { count: string | number }[])[0]?.count ?? 0),
      overdue: Number((overdue as { count: string | number }[])[0]?.count ?? 0),
    };

    return ok({ stats, inventory: rows, recentTransactions: transactions });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
