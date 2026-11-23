import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";

export async function GET() {
  try {
    await requirePermission("audit:read");
    const rows = await sql`select * from transactions order by created_at desc`;
    return ok(rows);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
