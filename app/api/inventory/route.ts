import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import {
  text,
  optionalText,
  int,
  oneOf,
  INVENTORY_STATUS,
  ITEM_TYPES,
} from "@/lib/sanitize";
import { requirePermission, guardResponse } from "@/lib/guard";
import { logAudit } from "@/lib/audit";


export async function GET() {
  try {
    const rows = await sql`select * from inventory order by name`;
    return ok(rows);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("inventory:write");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const name = text(body?.name, 200);
    const category = text(body?.category, 100);
    const item_type = oneOf(body?.item_type, ITEM_TYPES, "Other Supplies");
    const quantity = int(body?.quantity, { min: 0 });
    const available_quantity = int(body?.available_quantity, { min: 0 });
    const issued_quantity = int(body?.issued_quantity, { min: 0 });
    const damaged_quantity = int(body?.damaged_quantity, { min: 0 });
    const condition = oneOf(body?.condition, ["Excellent", "Good", "Fair", "Damaged"] as const, "Good");
    const status = oneOf(body?.status, INVENTORY_STATUS, "Available");
    const storage_location = text(body?.storage_location, 120);
    const min_stock_level = int(body?.min_stock_level, { min: 0 });
    const unit = text(body?.unit, 40) || "units";
    const description = optionalText(body?.description, 500);

    if (!name || !category || !storage_location) {
      return fail("Name, category, and storage location are required", 400);
    }

    const [row] = await sql`
      insert into inventory (
        name, category, item_type, quantity, available_quantity,
        issued_quantity, damaged_quantity, condition, status,
        storage_location, min_stock_level, unit, description
      ) values (
        ${String(name)}::text,
        ${String(category)}::text,
        ${String(item_type)}::text,
        ${Number(quantity)}::int,
        ${Number(available_quantity)}::int,
        ${Number(issued_quantity)}::int,
        ${Number(damaged_quantity)}::int,
        ${String(condition)}::text,
        ${String(status)}::inventory_status,
        ${String(storage_location)}::text,
        ${Number(min_stock_level)}::int,
        ${String(unit)}::text,
        ${description ? String(description) : null}::text
      )
      returning *
    `;
    await logAudit({
      actor,
      action: "inventory.create",
      entity: "inventory",
      entityId: String((row as { id: string }).id),
      details: { name, category, quantity },
    });
    return ok(row, { status: 201 });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
