import { sql } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { text, optionalText, oneOf, CONDITIONS } from "@/lib/sanitize";


export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const issuance_id = text(body?.issuance_id, 80);
    const rawCondition = body?.condition;
    if (
      !issuance_id ||
      typeof rawCondition !== "string" ||
      !CONDITIONS.includes(rawCondition as (typeof CONDITIONS)[number])
    ) {
      return fail("Issuance id and a valid return condition are required", 400);
    }
    const condition = oneOf(rawCondition, CONDITIONS, "Good");
    const notes = optionalText(body?.notes, 500);

    const [row] = await sql`
      select * from return_inventory(
        ${String(issuance_id)}::uuid,
        ${String(condition)}::text,
        ${notes ? String(notes) : null}::text,
        'Supply Officer'::text
      )
    `;
    return ok(row);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
