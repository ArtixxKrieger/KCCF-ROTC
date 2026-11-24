import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";
import { hashPassword, verifyPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { text } from "@/lib/sanitize";
import { rateLimit, clientKey, tooMany } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("inventory:read");

    const limit = await rateLimit(
      await clientKey(request, `password:${actor.id}`),
      5,
      900,
    );
    if (!limit.allowed) return tooMany(limit.retryAfter);

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const currentPassword =
      typeof body?.current_password === "string"
        ? text(body.current_password, 200)
        : "";
    const newPassword =
      typeof body?.new_password === "string" ? text(body.new_password, 200) : "";

    if (!currentPassword || newPassword.length < 8) {
      return fail("Current password and a new one of 8+ characters are required", 400);
    }
    if (currentPassword === newPassword) {
      return fail("New password must be different from the current one", 400);
    }

    const [row] = (await sql`
      select password_hash from users where id = ${actor.id}::uuid
    `) as { password_hash: string | null }[];

    if (!row?.password_hash) return fail("Account not found", 404);

    if (!(await verifyPassword(currentPassword, row.password_hash))) {
      await logAudit({
        actor,
        action: "account.password_failed",
        entity: "user",
        entityId: actor.id,
      });
      return fail("Current password is incorrect", 401);
    }

    const password_hash = await hashPassword(newPassword);
    await sql`
      update users set password_hash = ${password_hash}::text
      where id = ${actor.id}::uuid
    `;

    await logAudit({
      actor,
      action: "account.password",
      entity: "user",
      entityId: actor.id,
    });

    return ok({ changed: true });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
