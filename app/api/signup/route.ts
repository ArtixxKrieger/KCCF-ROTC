import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  type SessionUser,
} from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { text } from "@/lib/sanitize";
import { rateLimit, clientKey, tooMany } from "@/lib/rate-limit";

type InviteRow = {
  id: string;
  role: string;
  used_at: string | null;
  revoked_at: string | null;
  expired: boolean;
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

async function uniqueEmail(fullName: string): Promise<string> {
  const base = slug(fullName) || "member";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? `${base}@kccf.local` : `${base}${attempt + 1}@kccf.local`;
    const rows = await sql`select 1 from users where email = ${candidate} limit 1`;
    if (rows.length === 0) return candidate;
  }
  return `${base}.${Date.now()}@kccf.local`;
}

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(await clientKey(request, "signup"), 5, 3600);
    if (!limit.allowed) return tooMany(limit.retryAfter);

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    const token = text(body?.token, 60).toUpperCase();
    const full_name = text(body?.full_name, 120);
    const password = typeof body?.password === "string" ? text(body.password, 200) : "";

    if (!token || !full_name || password.length < 8) {
      return fail("Invite token, full name, and a password of 8+ characters are required", 400);
    }

    const invites = (await sql`
      select id, role::text as role, used_at, revoked_at,
             (expires_at < now()) as expired
      from invite_tokens
      where token = ${token}
      limit 1
    `) as InviteRow[];

    const invite = invites[0];
    if (!invite) return fail("Invalid invite token", 400);
    if (invite.used_at) return fail("This invite token has already been used", 400);
    if (invite.revoked_at) return fail("This invite token has been revoked", 400);
    if (invite.expired) return fail("This invite token has expired", 400);

    const email = await uniqueEmail(full_name);
    const password_hash = await hashPassword(password);

    const [created] = await sql`
      insert into users (full_name, email, password_hash, role, active)
      values (
        ${full_name}::text,
        ${email}::text,
        ${password_hash}::text,
        ${invite.role}::app_role,
        true
      )
      returning id, email, full_name, role::text as role
    `;

    await sql`
      update invite_tokens
      set used_at = now(), used_by = ${(created as { id: string }).id}::uuid
      where id = ${invite.id}::uuid
    `;

    const sessionUser: SessionUser = {
      id: (created as { id: string }).id,
      email: (created as { email: string }).email,
      name: (created as { full_name: string }).full_name,
      role: (created as { role: SessionUser["role"] }).role,
    };

    await logAudit({
      actor: sessionUser,
      action: "account.create",
      entity: "user",
      entityId: sessionUser.id,
      details: { role: invite.role, invite_id: invite.id },
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, await signSession(sessionUser), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return ok(sessionUser, { status: 201 });
  } catch {
    return fail("Unable to create account", 500);
  }
}
