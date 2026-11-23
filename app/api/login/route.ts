import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, type SessionUser } from "@/lib/session";
import { email, text } from "@/lib/sanitize";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
  password_hash: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    const userEmail = email(body?.email);
    const password =
      typeof body?.password === "string" ? text(body.password, 200) : "";

    if (!userEmail || !password) {
      return fail("Email and password are required", 400);
    }

    const rows = (await sql`
      select id, email, full_name, role::text as role, active, password_hash
      from users
      where email = ${userEmail}
      limit 1
    `) as UserRow[];

    const row = rows[0];
    const valid =
      row && row.active && row.password_hash
        ? await verifyPassword(password, row.password_hash)
        : false;

    if (!valid) return fail("Invalid email or password", 401);

    const sessionUser: SessionUser = {
      id: row.id,
      email: row.email,
      name: row.full_name,
      role: row.role as SessionUser["role"],
    };

    const store = await cookies();
    store.set(SESSION_COOKIE, await signSession(sessionUser), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return ok(sessionUser);
  } catch {
    return fail("Unable to sign in", 500);
  }
}
