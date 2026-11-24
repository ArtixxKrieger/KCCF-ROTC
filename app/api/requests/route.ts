import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { text, optionalText, int, oneOf, REQUEST_STATUS } from "@/lib/sanitize";
import { requirePermission, guardResponse } from "@/lib/guard";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const actor = await requirePermission("request:read");

    // Personnel only ever see the requests they filed themselves.
    const rows =
      actor.role === "Personnel"
        ? await sql`
            select * from requests
            where requested_by = ${actor.name}
            order by requested_at desc
          `
        : await sql`select * from requests order by requested_at desc`;

    return ok(rows);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("request:create");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const inventory_id = optionalText(body?.inventory_id, 80);
    const item_name = text(body?.item_name, 200);
    const quantity = int(body?.quantity, { min: 1 });
    const purpose = optionalText(body?.purpose, 500);

    // Nobody files a request in someone else's name.
    const requested_by =
      actor.role === "Personnel"
        ? actor.name
        : text(body?.requested_by, 120) || actor.name;

    if (!requested_by || !item_name || quantity < 1) {
      return fail(
        "Requester, item name, and a quantity of at least 1 are required",
        400,
      );
    }

    const [row] = await sql`
      insert into requests (requested_by, inventory_id, item_name, quantity, purpose, status)
      values (
        ${requested_by}::text,
        ${inventory_id}::uuid,
        ${item_name}::text,
        ${quantity}::int,
        ${purpose}::text,
        'Pending'::request_status
      )
      returning *
    `;

    await logAudit({
      actor,
      action: "request.create",
      entity: "request",
      entityId: String((row as { id: string }).id),
      details: { item_name, quantity },
    });

    return ok(row, { status: 201 });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requirePermission("request:review");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const id = text(body?.id, 80);
    const rawStatus = body?.status;

    if (
      !id ||
      typeof rawStatus !== "string" ||
      !["Approved", "Rejected"].includes(rawStatus)
    ) {
      return fail("Request id and a status of Approved or Rejected are required", 400);
    }

    const status = oneOf(rawStatus, REQUEST_STATUS, "Pending");

    const [row] = await sql`
      update requests
      set status = ${status}::request_status,
          reviewed_at = now(),
          reviewed_by = ${actor.name}::text
      where id = ${id}::uuid
      returning *
    `;
    if (!row) return fail("Request not found", 404);

    await logAudit({
      actor,
      action: "request.review",
      entity: "request",
      entityId: id,
      details: { status },
    });
    return ok(row);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
