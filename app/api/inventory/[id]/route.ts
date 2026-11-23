import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      category,
      item_type,
      quantity,
      available_quantity,
      issued_quantity,
      damaged_quantity,
      condition,
      status,
      storage_location,
      min_stock_level,
      unit,
      description,
    } = body as Record<string, unknown>;

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
    return ok(row);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await sql`delete from inventory where id = ${id}::uuid`;
    return ok({ deleted: true });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
