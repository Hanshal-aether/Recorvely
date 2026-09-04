import { prisma } from "../db";
import { logAudit } from "../audit";
import { attemptRetry } from "../razorpay/retry";
import { decidePolicy } from "../policy/engine";
import type { DeclineCategory } from "../llm/provider";

/**
 * Executes one retry attempt for a transaction and advances its state
 * based on the outcome. This is the single place that turns a policy
 * decision into money actually moving (or not) - both the worker's
 * immediate retry_now path and the scheduler's due retry_scheduled path
 * call this, so there's exactly one execution path to reason about.
 *
 * On failure, this re-runs the policy engine with the incremented attempt
 * count - which is what actually makes the stopping rule bite after
 * MAX_RETRY_ATTEMPTS, and what turns "scheduled" into "escalated" once a
 * soft decline has failed enough times.
 */
export async function executeRetryAndAdvance(transactionId: string) {
  const tx = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: { classifications: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const latestCategory = (tx.classifications[0]?.category ??
    "unknown") as DeclineCategory;

  const retry = await attemptRetry({
    transactionId: tx.id,
    amountPaise: tx.amountPaise,
    category: latestCategory,
  });

  await prisma.retryAttempt.create({
    data: {
      transactionId: tx.id,
      attemptNumber: tx.attemptNumber,
      success: retry.success,
      razorpayOrderId: retry.razorpayOrderId,
      razorpayPaymentId: retry.razorpayPaymentId,
      failureReason: retry.failureReason,
      amountRecoveredPaise: retry.amountRecoveredPaise,
    },
  });

  await logAudit({
    transactionId: tx.id,
    eventType: "action_executed",
    payload: { action: "retry", ...retry },
  });

  if (retry.success) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "recovered", attemptNumber: { increment: 1 } },
    });
    return;
  }

  // Failed - increment the attempt count and ask the policy engine what
  // to do now. This is what makes MAX_RETRY_ATTEMPTS actually stop things
  // instead of rescheduling forever, and what turns a soft decline into
  // an escalation once it's failed enough times.
  const nextAttemptNumber = tx.attemptNumber + 1;
  const nextPolicy = decidePolicy({
    category: latestCategory,
    attemptNumber: nextAttemptNumber,
  });

  await prisma.policyDecision.create({
    data: {
      transactionId: tx.id,
      action: nextPolicy.action,
      scheduledFor: nextPolicy.scheduledFor,
      reason: nextPolicy.reason,
    },
  });
  await logAudit({
    transactionId: tx.id,
    eventType: "policy_decided",
    payload: nextPolicy,
  });

  if (nextPolicy.action === "retry_scheduled") {
    // Stays "classified" - the scheduler will pick it up again once
    // nextPolicy.scheduledFor arrives.
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { attemptNumber: nextAttemptNumber },
    });
  } else if (nextPolicy.action === "stop") {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "exhausted", attemptNumber: nextAttemptNumber },
    });
    await logAudit({
      transactionId: tx.id,
      eventType: "escalated",
      payload: { action: "stop", reason: nextPolicy.reason },
    });
  } else {
    // escalate_update_method or escalate_review
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "escalated", attemptNumber: nextAttemptNumber },
    });
    await logAudit({
      transactionId: tx.id,
      eventType: "escalated",
      payload: { action: nextPolicy.action, reason: nextPolicy.reason },
    });
  }
}
