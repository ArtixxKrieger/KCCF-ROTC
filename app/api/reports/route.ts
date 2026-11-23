import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";


export async function GET() {
  try {
    const [inventory, transactions, requests, issuances] = await Promise.all([
      sql`select * from inventory order by name`,
      sql`select * from transactions order by created_at desc`,
      sql`select * from requests order by requested_at desc`,
      sql`select * from issuances order by issued_at desc`,
    ]);
    return ok({ inventory, transactions, requests, issuances });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
