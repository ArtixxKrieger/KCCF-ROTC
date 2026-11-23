import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession, type SessionUser } from "@/lib/session";

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export function unauthorized(): Response {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(): Response {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
