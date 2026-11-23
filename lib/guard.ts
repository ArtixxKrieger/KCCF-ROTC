import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/rbac";
import type { SessionUser } from "@/lib/session";

export class Denied extends Error {}

export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Denied("Unauthorized");
  if (!can(user.role, permission)) throw new Denied("Forbidden");
  return user;
}

export function guardResponse(error: unknown): Response | null {
  if (error instanceof Denied) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "Unauthorized" ? 401 : 403 },
    );
  }
  return null;
}
