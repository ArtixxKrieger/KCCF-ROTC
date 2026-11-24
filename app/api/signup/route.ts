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
import { text, email } from "@/lib/sanitize";
import { rateLimit, clientKey, tooMany } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(await clientKey(request, "signup"), 5, 3600);
    if (!limit.allowed) return tooMany(limit.retryAfter);

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    const full_name = text(body?.full_name, 120);
    const userEmail = email(body?.email);
    const password = typeof body?.password === "string" ? text(body.password, 200) : "";

    if (!full_name || !userEmail || password.length < 8) {
      return fail(
        "Full name, a valid email, and a password of 8+ characters are required",
        400,
      );
    }

    const existing = await sql`select 1 from users where email = ${userEmail} limit 1`;
    if (existing.length > 0) {
      return fail("An account with that email already exists", 409);
    }

    const password_hash = await hashPassword(password);

    const [created] = await sql`
      insert into users (full_name, email, password_hash, role, active)
      values (${full_name}::text, ${userEmail}::text, ${password_hash}::text, 'Personnel'::app_role, true)
      returning id, email, full_name, role::text as role
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
      details: { role: sessionUser.role, self_signup: true },
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
