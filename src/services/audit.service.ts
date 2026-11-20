import { store } from "@/repositories";

/** Audit logging for sensitive actions (esp. admin operations). */
export async function audit(entry: {
  actorUserId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    await store.create("auditLogs", {
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      meta: entry.meta ? JSON.stringify(entry.meta) : null,
    });
  } catch (err) {
    // Never let audit failures break the main flow; still surface in logs.
    console.error("[audit] failed to write entry", entry.action, err);
  }
}
