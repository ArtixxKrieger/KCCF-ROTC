import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


export async function GET() {
  try {
    const rows = await sql`
      select * from transactions
      where transaction_type = 'Receiving'
      order by created_at desc
      limit 10
    `;
    return ok(rows);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inventory_id, quantity, source, reference, notes } =
      body as Record<string, unknown>;

    const [row] = await sql`
      select * from receive_inventory(
        ${String(inventory_id)}::uuid,
        ${Number(quantity)}::int,
        ${String(source)}::text,
        ${reference ? String(reference) : null}::text,
        ${notes ? String(notes) : null}::text,
        'Supply Officer'::text
      )
    `;
    return ok(row, { status: 201 });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
