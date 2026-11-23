export function text(value: unknown, max = 200): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function optionalText(value: unknown, max = 500): string | null {
  const cleaned = text(value, max);
  return cleaned || null;
}

export function int(
  value: unknown,
  { min = 0, max = 1_000_000_000, fallback = 0 }: {
    min?: number;
    max?: number;
    fallback?: number;
  } = {},
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.trunc(n);
  return Math.min(Math.max(rounded, min), max);
}

export function email(value: unknown): string {
  const cleaned = text(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : "";
}

export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const ROLES = ["Admin", "Supply Officer", "Personnel"] as const;
export const INVENTORY_STATUS = [
  "Available",
  "Issued",
  "Damaged",
  "Under-maintenance",
] as const;
export const REQUEST_STATUS = ["Pending", "Approved", "Rejected"] as const;
export const CONDITIONS = ["Excellent", "Good", "Fair", "Damaged", "Missing"] as const;
export const ITEM_TYPES = ["Armory Equipment", "Other Supplies"] as const;
