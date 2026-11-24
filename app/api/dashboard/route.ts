import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";

export async function GET() {
  try {
    await requirePermission("report:read");

    const [inventory, recentTransactions, transactions, stats] = await Promise.all([
      sql`select * from inventory order by name`,
      sql`select * from transactions order by created_at desc limit 8`,
      sql`select * from transactions where created_at > now() - interval '60 days' order by created_at desc`,
      sql`
        select
          coalesce(sum(quantity), 0)::int as total,
          coalesce(sum(available_quantity), 0)::int as available,
          coalesce(sum(issued_quantity), 0)::int as issued,
          count(*) filter (where available_quantity <= min_stock_level)::int as "lowStock",
          (select count(*) from requests where status = 'Pending')::int as pending,
          (select count(*) from issuances where status = 'Issued' and due_at < now())::int as overdue
        from inventory
      `,
    ]);

    return ok({
      stats: stats[0],
      inventory,
      recentTransactions,
      transactions,
    });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
