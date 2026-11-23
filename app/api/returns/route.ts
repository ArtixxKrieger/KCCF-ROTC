import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { issuance_id, condition, notes } = body as Record<string, unknown>;

    const [row] = await sql`
      select * from return_inventory(
        ${String(issuance_id)}::uuid,
        ${String(condition)}::text,
        ${notes ? String(notes) : null}::text,
        'Supply Officer'::text
      )
    `;
    return ok(row);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
