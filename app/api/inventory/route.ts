import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


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
    return ok(row, { status: 201 });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
