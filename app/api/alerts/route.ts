import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";

export async function GET() {
  try {
    const [lowStock, pending, overdue] = await Promise.all([
      sql`select id, name, available_quantity, min_stock_level, unit from inventory where available_quantity <= min_stock_level order by available_quantity asc`,
      sql`select count(*)::int as count from requests where status = 'Pending'`,
      sql`select count(*)::int as count from issuances where due_at < now() and status in ('Issued', 'Overdue')`,
    ]);
    return ok({
      lowStock,
      pending: Number((pending as { count: string | number }[])[0]?.count ?? 0),
      overdue: Number((overdue as { count: string | number }[])[0]?.count ?? 0),
    });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
