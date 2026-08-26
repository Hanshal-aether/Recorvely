import { prisma } from "./db";

/**
 * The only function in the codebase that should write to AuditLog.
 * Every classification, policy decision, and action execution calls this.
 * Rule: never update or delete an AuditLog row after creation. If you find
 * yourself wanting to "fix" a log entry, write a new one instead - the
 * trail has to be able to show what the system believed at each point in
 * time, including its mistakes.
 */
export async function logAudit(params: {
  transactionId?: string;
  eventType:
    | "ingested"
    | "classified"
    | "policy_decided"
    | "action_executed"
    | "escalated"
    | "error";
  payload: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      transactionId: params.transactionId,
      eventType: params.eventType,
      payload: params.payload as any,
    },
  });
}
