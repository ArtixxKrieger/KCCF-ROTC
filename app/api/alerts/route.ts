import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";
import { can } from "@/lib/rbac";

export async function GET() {
  try {
    const actor = await requirePermission("inventory:read");

    const lowStock = await sql`
      select id, name, available_quantity, min_stock_level, unit
      from inventory
      where available_quantity <= min_stock_level
      order by (available_quantity - min_stock_level) asc
      limit 10
    `;

    // Request and return counts are officer-level information.
    const seesOperational =
      can(actor.role, "request:review") || can(actor.role, "issuance:read");

    let pending = 0;
    let overdue = 0;

    if (seesOperational) {
      const [counts] = await sql`
        select
          (select count(*) from requests where status = 'Pending')::int as pending,
          (select count(*) from issuances where status = 'Issued' and due_at < now())::int as overdue
      `;
      pending = Number(counts?.pending ?? 0);
      overdue = Number(counts?.overdue ?? 0);
    }

    return ok({ lowStock, pending, overdue, seesOperational });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
