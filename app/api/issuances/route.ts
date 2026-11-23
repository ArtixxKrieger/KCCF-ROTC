import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


export async function GET() {
  try {
    const rows = await sql`select * from issuances order by issued_at desc`;
    return ok(rows);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inventory_id, issued_to, quantity, purpose, due_at, reference } =
      body as Record<string, unknown>;

    const [row] = await sql`
      select * from issue_inventory(
        ${String(inventory_id)}::uuid,
        ${Number(quantity)}::int,
        ${String(issued_to)}::text,
        ${purpose ? String(purpose) : null}::text,
        ${due_at ? String(due_at) : null}::timestamptz,
        ${reference ? String(reference) : null}::text,
        'Supply Officer'::text
      )
    `;
    return ok(row, { status: 201 });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
