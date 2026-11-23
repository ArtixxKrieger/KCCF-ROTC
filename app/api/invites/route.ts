import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { text, oneOf, ROLES } from "@/lib/sanitize";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `KCCF-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

export async function GET() {
  try {
    await requirePermission("invite:manage");
    const rows = await sql`
      select id, token, role, created_by_name, created_at,
             expires_at, used_at, revoked_at
      from invite_tokens
      order by created_at desc
      limit 50
    `;
    return ok(rows);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("invite:manage");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    const role = oneOf(body?.role, ROLES, "Personnel");
    const days = Math.min(Math.max(Number(body?.days) || 7, 1), 30);
    const token = newToken();

    const [row] = await sql`
      insert into invite_tokens (token, role, created_by, created_by_name, expires_at)
      values (
        ${token}::text,
        ${role}::app_role,
        ${actor.id}::uuid,
        ${actor.name}::text,
        now() + (${days} || ' days')::interval
      )
      returning id, token, role, created_at, expires_at
    `;

    await logAudit({
      actor,
      action: "invite.create",
      entity: "invite_token",
      entityId: String((row as { id: string }).id),
      details: { role, days },
    });

    return ok(row, { status: 201 });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requirePermission("invite:manage");
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const id = text(body?.id, 80);
    if (!id) return fail("Invite id is required", 400);

    const [row] = await sql`
      update invite_tokens
      set revoked_at = now()
      where id = ${id}::uuid and used_at is null and revoked_at is null
      returning id
    `;
    if (!row) return fail("Invite not found or already used", 404);

    await logAudit({
      actor,
      action: "invite.revoke",
      entity: "invite_token",
      entityId: id,
    });
    return ok({ revoked: true });
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
