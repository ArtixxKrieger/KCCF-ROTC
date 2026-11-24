import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { text } from "@/lib/sanitize";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, type SessionUser } from "@/lib/session";

export async function GET() {
  try {
    const actor = await requirePermission("inventory:read");
    const [row] = await sql`
      select id, full_name, email, role::text as role, active, created_at
      from users
      where id = ${actor.id}::uuid
    `;
    if (!row) return fail("Account not found", 404);
    return ok(row);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requirePermission("inventory:read");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const full_name = text(body?.full_name, 120);

    if (full_name.length < 2) {
      return fail("Full name must be at least 2 characters", 400);
    }

    const [row] = await sql`
      update users set full_name = ${full_name}::text
      where id = ${actor.id}::uuid
      returning id, full_name, email, role::text as role, created_at
    `;
    if (!row) return fail("Account not found", 404);

    // Keep the session name in step with the record.
    const next: SessionUser = { ...actor, name: full_name };
    const store = await cookies();
    store.set(SESSION_COOKIE, await signSession(next), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    await logAudit({
      actor,
      action: "account.update",
      entity: "user",
      entityId: actor.id,
      details: { full_name },
    });

    return ok(row);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
