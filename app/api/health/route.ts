import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { getSessionUser, unauthorized } from "@/lib/auth";

/** Authenticated liveness check — any signed-in role may call it. */
export async function GET() {
  try {
    if (!(await getSessionUser())) return unauthorized();
    await sql`select 1`;
    return ok({ status: "online" });
  } catch {
    return fail("Database unreachable", 503);
  }
}
