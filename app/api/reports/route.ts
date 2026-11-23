import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";


export async function GET() {
  try {
    await requirePermission("report:read");
    const [inventory, transactions, requests, issuances] = await Promise.all([
      sql`select * from inventory order by name`,
      sql`select * from transactions order by created_at desc`,
      sql`select * from requests order by requested_at desc`,
      sql`select * from issuances order by issued_at desc`,
    ]);
    return ok({ inventory, transactions, requests, issuances });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
