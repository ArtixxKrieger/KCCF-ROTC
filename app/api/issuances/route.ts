import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { text, optionalText, int } from "@/lib/sanitize";
import { requirePermission, guardResponse } from "@/lib/guard";
import { logAudit } from "@/lib/audit";


export async function GET() {
  try {
    await requirePermission("issuance:read");
    const rows = await sql`select * from issuances order by issued_at desc`;
    return ok(rows);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("issuance:write");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const inventory_id = text(body?.inventory_id, 80);
    const issued_to = text(body?.issued_to, 120);
    const quantity = int(body?.quantity, { min: 1 });
    const purpose = optionalText(body?.purpose, 500);
    const due_at = optionalText(body?.due_at, 40);
    const reference = optionalText(body?.reference, 80);

    if (!inventory_id || !issued_to || quantity < 1) {
      return fail("Inventory item, recipient, and a quantity of at least 1 are required", 400);
    }

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
    await logAudit({
      actor,
      action: "issuance.create",
      entity: "issuance",
      entityId: String((row as { id: string }).id),
      details: { inventory_id, issued_to, quantity },
    });
    return ok(row, { status: 201 });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
