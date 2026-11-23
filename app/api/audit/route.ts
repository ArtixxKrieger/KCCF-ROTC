import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";

export async function GET() {
  try {
    await requirePermission("audit:read");
    const rows = await sql`
      select id, actor_name, actor_email, actor_role, action, entity,
             entity_id, details, created_at
      from audit_logs
      order by created_at desc
      limit 500
    `;
    return ok(rows);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
