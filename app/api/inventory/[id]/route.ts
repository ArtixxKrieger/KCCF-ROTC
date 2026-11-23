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


export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requirePermission("inventory:write");
    const { id } = await context.params;
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
      update inventory set
        name = ${String(name)}::text,
        category = ${String(category)}::text,
        item_type = ${String(item_type)}::text,
        quantity = ${Number(quantity)}::int,
        available_quantity = ${Number(available_quantity)}::int,
        issued_quantity = ${Number(issued_quantity)}::int,
        damaged_quantity = ${Number(damaged_quantity)}::int,
        condition = ${String(condition)}::text,
        status = ${String(status)}::inventory_status,
        storage_location = ${String(storage_location)}::text,
        min_stock_level = ${Number(min_stock_level)}::int,
        unit = ${String(unit)}::text,
        description = ${description ? String(description) : null}::text,
        updated_at = now()
      where id = ${id}::uuid
      returning *
    `;
    if (!row) return fail("Item not found", 404);
    await logAudit({
      actor,
      action: "inventory.update",
      entity: "inventory",
      entityId: id,
      details: { name, category, quantity },
    });
    return ok(row);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requirePermission("inventory:delete");
    const { id } = await context.params;
    await sql`delete from inventory where id = ${id}::uuid`;
    await logAudit({
      actor,
      action: "inventory.delete",
      entity: "inventory",
      entityId: id,
    });
    return ok({ deleted: true });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
