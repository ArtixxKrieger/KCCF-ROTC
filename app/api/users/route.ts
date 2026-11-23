import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { text, optionalText, email, oneOf, ROLES } from "@/lib/sanitize";

export async function GET() {
  try {
    if (!(await getSessionUser())) return unauthorized();
    const rows = await sql`select id, full_name, email, role, department, rank, active, created_at from users order by full_name`;
    return ok(rows);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== "Admin") return forbidden();

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const full_name = text(body?.full_name, 120);
    const userEmail = email(body?.email);
    const role = oneOf(body?.role, ROLES, "Personnel");
    const department = optionalText(body?.department, 120);
    const rank = optionalText(body?.rank, 80);
    const password = typeof body?.password === "string" ? text(body.password, 200) : "";

    if (!full_name || !userEmail || password.length < 8) {
      return fail("Name, a valid email, and a password of 8+ characters are required", 400);
    }

    const password_hash = await hashPassword(password);

    const [row] = await sql`
      insert into users (full_name, email, password_hash, role, department, rank, active)
      values (${full_name}::text, ${userEmail}::text, ${password_hash}::text, ${role}::app_role, ${department}::text, ${rank}::text, true)
      returning id, full_name, email, role, department, rank, active, created_at
    `;
    return ok(row, { status: 201 });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== "Admin") return forbidden();

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const id = text(body?.id, 80);
    const role = oneOf(body?.role, ROLES, "Personnel");
    const activeValue = body?.active === true || body?.active === false ? body.active : null;

    const [row] = await sql`
      update users
      set role = ${role}::app_role,
          active = coalesce(${activeValue}::boolean, active)
      where id = ${id}::uuid
      returning id, full_name, email, role, department, rank, active, created_at
    `;
    if (!row) return fail("User not found", 404);
    return ok(row);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
