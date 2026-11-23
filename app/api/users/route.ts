import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


export async function GET() {
  try {
    const rows = await sql`select * from users order by full_name`;
    return ok(rows);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, role, department, rank } =
      body as Record<string, unknown>;

    const [row] = await sql`
      insert into users (full_name, email, role, department, rank, active)
      values (
        ${String(full_name)}::text,
        ${String(email)}::text,
        ${String(role)}::app_role,
        ${department ? String(department) : null}::text,
        ${rank ? String(rank) : null}::text,
        true
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
    const { id, role, active } = body as Record<string, unknown>;
    const activeValue = active === true || active === false ? active : null;

    const [row] = await sql`
      update users
      set role = ${String(role)}::app_role,
          active = coalesce(${activeValue}::boolean, active)
      where id = ${String(id)}::uuid
      returning *
    `;
    if (!row) return fail("User not found", 404);
    return ok(row);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
