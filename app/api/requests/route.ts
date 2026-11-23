import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { text, optionalText, int, oneOf, REQUEST_STATUS } from "@/lib/sanitize";


export async function GET() {
  try {
    const rows = await sql`select * from requests order by requested_at desc`;
    return ok(rows);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const requested_by = text(body?.requested_by, 120);
    const inventory_id = optionalText(body?.inventory_id, 80);
    const item_name = text(body?.item_name, 200);
    const quantity = int(body?.quantity, { min: 1 });
    const purpose = optionalText(body?.purpose, 500);

    if (!requested_by || !item_name || quantity < 1) {
      return fail("Requester, item name, and a quantity of at least 1 are required", 400);
    }

    const [row] = await sql`
      insert into requests (requested_by, inventory_id, item_name, quantity, purpose, status)
      values (
        ${String(requested_by)}::text,
        ${inventory_id ? String(inventory_id) : null}::uuid,
        ${String(item_name)}::text,
        ${Number(quantity)}::int,
        ${purpose ? String(purpose) : null}::text,
        'Pending'::request_status
      )
      returning *
    `;
    return ok(row, { status: 201 });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function PATCH(request: Request) {
  try {
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
    const reviewed_by = optionalText(body?.reviewed_by, 120);

    const [row] = await sql`
      update requests
      set status = ${String(status)}::request_status,
          reviewed_at = now(),
          reviewed_by = ${reviewed_by ? String(reviewed_by) : null}::text
      where id = ${String(id)}::uuid
      returning *
    `;
    if (!row) return fail("Request not found", 404);
    return ok(row);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
