import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


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
    const body = await request.json();
    const { requested_by, inventory_id, item_name, quantity, purpose } =
      body as Record<string, unknown>;

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
    const body = await request.json();
    const { id, status, reviewed_by } = body as Record<string, unknown>;

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
