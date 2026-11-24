/**
 * Human-readable labels for audit action keys.
 *
 * Kept separate from lib/audit.ts so client components can import it without
 * pulling in the database driver.
 */
export const AUDIT_ACTIONS = [
  { key: "login.success", label: "Signed in" },
  { key: "login.failed", label: "Sign-in failed" },
  { key: "account.create", label: "Account created" },
  { key: "account.update", label: "Profile updated" },
  { key: "account.password", label: "Password changed" },
  { key: "account.password_failed", label: "Password change failed" },
  { key: "inventory.create", label: "Item added" },
  { key: "inventory.update", label: "Item updated" },
  { key: "inventory.delete", label: "Item deleted" },
  { key: "receiving.create", label: "Stock received" },
  { key: "issuance.create", label: "Item issued" },
  { key: "return.create", label: "Item returned" },
  { key: "request.create", label: "Request submitted" },
  { key: "request.review", label: "Request reviewed" },
  { key: "report.export", label: "Report exported" },
  { key: "user.create", label: "User created" },
  { key: "user.update", label: "User updated" },
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number]["key"];

const LABELS = new Map<string, string>(
  AUDIT_ACTIONS.map((action) => [action.key, action.label]),
);

/** "login.success" → "Signed in"; unknown keys degrade to "Foo bar". */
export function auditActionLabel(action: string): string {
  const known = LABELS.get(action);
  if (known) return known;

  const words = action.split(".").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
