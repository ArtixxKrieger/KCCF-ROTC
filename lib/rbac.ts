import type { SessionUser } from "@/lib/session";

export type Role = SessionUser["role"];

export const PERMISSIONS = [
  "inventory:read",
  "inventory:write",
  "inventory:delete",
  "receiving:read",
  "receiving:write",
  "issuance:read",
  "issuance:write",
  "return:write",
  "request:create",
  "request:read",
  "request:review",
  "report:read",
  "audit:read",
  "user:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  Admin: PERMISSIONS,
  "Supply Officer": [
    "inventory:read",
    "inventory:write",
    "receiving:read",
    "receiving:write",
    "issuance:read",
    "issuance:write",
    "return:write",
    "request:create",
    "request:read",
    "request:review",
    "report:read",
    "audit:read",
  ],
  // Personnel: read inventory and file requests. Nothing else.
  Personnel: ["inventory:read", "request:create", "request:read"],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role | undefined): readonly Permission[] {
  if (!role) return [];
  return MATRIX[role] ?? [];
}

const PAGE_ACCESS: Record<string, readonly Role[]> = {
  "/dashboard": ["Admin", "Supply Officer"],
  "/inventory": ["Admin", "Supply Officer", "Personnel"],
  "/receiving": ["Admin", "Supply Officer"],
  "/requests": ["Admin", "Supply Officer", "Personnel"],
  "/issuances": ["Admin", "Supply Officer"],
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

/** Where a role lands. Personnel have no dashboard, so they start on inventory. */
export function homeForRole(role: Role | undefined): string {
  if (role === "Personnel") return "/inventory";
  return "/dashboard";
}
