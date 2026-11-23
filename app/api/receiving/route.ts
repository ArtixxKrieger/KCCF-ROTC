import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { text, optionalText, int } from "@/lib/sanitize";
import { requirePermission, guardResponse } from "@/lib/guard";
import { logAudit } from "@/lib/audit";


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
    const actor = await requirePermission("receiving:write");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const inventory_id = text(body?.inventory_id, 80);
    const quantity = int(body?.quantity, { min: 1 });
    const source = text(body?.source, 120);
    const reference = optionalText(body?.reference, 80);
    const notes = optionalText(body?.notes, 500);

    if (!inventory_id || quantity < 1 || !source) {
      return fail("Inventory item, source, and a quantity of at least 1 are required", 400);
    }

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
    await logAudit({
      actor,
      action: "receiving.create",
      entity: "inventory",
      entityId: inventory_id,
      details: { quantity, source, reference },
    });
    return ok(row, { status: 201 });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
