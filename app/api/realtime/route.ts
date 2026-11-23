import { sealInventoryQuery } from "@/lib/realtime";
import { ok, fail } from "@/lib/http";


export async function POST() {
  try {
    const sealed = await sealInventoryQuery();
    return ok(sealed);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
