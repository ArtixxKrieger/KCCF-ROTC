import { sql } from "@/lib/db";
import type { SessionUser } from "@/lib/session";

export type AuditAction =
  | "user.create"
  | "user.update"
  | "account.create"
  | "login.success"
  | "login.failed"
  | "inventory.create"
  | "inventory.update"
  | "inventory.delete"
  | "receiving.create"
  | "issuance.create"
  | "return.create"
  | "request.create"
  | "request.review"
  | "report.export";

type AuditInput = {
  actor: SessionUser | null;
  action: AuditAction;
  entity?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

export async function logAudit({
  actor,
  action,
  entity = null,
  entityId = null,
  details = null,
}: AuditInput): Promise<void> {
  try {
    await sql`
      insert into audit_logs (
        actor_id, actor_name, actor_email, actor_role, action, entity, entity_id, details
      ) values (
        ${actor?.id ?? null}::uuid,
        ${actor?.name ?? "Unknown"}::text,
        ${actor?.email ?? "unknown"}::text,
        ${actor?.role ?? "Personnel"}::app_role,
        ${action}::text,
        ${entity}::text,
        ${entityId}::text,
        ${details ? JSON.stringify(details) : null}::jsonb
      )
    `;
  } catch (error) {
    // Auditing must never break the request it describes.
    console.error("Audit log failed", action, (error as Error).message);
  }
}
