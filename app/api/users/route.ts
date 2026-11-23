import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { text, oneOf, ROLES } from "@/lib/sanitize";

export async function GET() {
  try {
    await requirePermission("user:manage");
    const rows = await sql`
      select id, full_name, email, role, active, created_at
      from users
      order by full_name
    `;
    return ok(rows);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requirePermission("user:manage");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const id = text(body?.id, 80);
    if (!id) return fail("User id is required", 400);

    const role = body?.role === undefined ? null : oneOf(body.role, ROLES, "Personnel");
    const activeValue =
      body?.active === true || body?.active === false ? body.active : null;

    if (role === null && activeValue === null) {
      return fail("A role or active flag is required", 400);
    }

    const [row] = await sql`
      update users
      set role = coalesce(${role}::app_role, role),
          active = coalesce(${activeValue}::boolean, active)
      where id = ${id}::uuid
      returning id, full_name, email, role, active, created_at
    `;
    if (!row) return fail("User not found", 404);

    await logAudit({
      actor,
      action: "user.update",
      entity: "user",
      entityId: id,
      details: { role, active: activeValue },
    });
    return ok(row);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
