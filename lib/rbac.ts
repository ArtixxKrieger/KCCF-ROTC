import type { SessionUser } from "@/lib/session";

export type Role = SessionUser["role"];

export const PERMISSIONS = [
  "inventory:read",
  "inventory:write",
  "inventory:delete",
  "receiving:write",
  "issuance:write",
  "return:write",
  "request:create",
  "request:review",
  "report:read",
  "audit:read",
  "user:manage",
  "invite:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  Admin: PERMISSIONS,
  "Supply Officer": [
    "inventory:read",
    "inventory:write",
    "receiving:write",
    "issuance:write",
    "return:write",
    "request:create",
    "request:review",
    "report:read",
    "audit:read",
  ],
  Personnel: ["inventory:read", "request:create"],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role | undefined): readonly Permission[] {
  if (!role) return [];
  return MATRIX[role] ?? [];
}

/** Pages each role may open. Order is irrelevant. */
const PAGE_ACCESS: Record<string, readonly Role[]> = {
  "/dashboard": ["Admin", "Supply Officer", "Personnel"],
  "/inventory": ["Admin", "Supply Officer", "Personnel"],
  "/receiving": ["Admin", "Supply Officer"],
  "/requests": ["Admin", "Supply Officer", "Personnel"],
  "/issuances": ["Admin", "Supply Officer", "Personnel"],
  "/reports": ["Admin", "Supply Officer"],
  "/audit": ["Admin", "Supply Officer"],
  "/users": ["Admin"],
};

export function canAccessPage(role: Role | undefined, pathname: string): boolean {
  if (!role) return false;
  const base = Object.keys(PAGE_ACCESS).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (!base) return true;
  return PAGE_ACCESS[base].includes(role);
}

export function homeForRole(role: Role | undefined): string {
  return role ? "/dashboard" : "/login";
}
