import { sealInventoryQuery } from "@/lib/realtime";
import { ok, fail } from "@/lib/http";
import { requirePermission, guardResponse } from "@/lib/guard";


export async function POST() {
  try {
    await requirePermission("inventory:read");
    const sealed = await sealInventoryQuery();
    return ok(sealed);
  } catch (error) {
    return guardResponse(error) ?? fail((error as Error).message, 500);
  }
}
