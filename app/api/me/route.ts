import { getSessionUser, unauthorized } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return ok(user);
}
