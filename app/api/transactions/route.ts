import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";

export async function GET() {
  try {
    const rows = await sql`select * from transactions order by created_at desc`;
    return ok(rows);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
