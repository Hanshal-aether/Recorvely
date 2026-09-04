import "dotenv/config";
import { Worker, Job } from "bullmq";
import { connection, FAILURE_QUEUE_NAME, FailureJobData } from "../lib/queue";
import { prisma } from "../lib/db";
import { logAudit } from "../lib/audit";
import { classifyDecline } from "../lib/llm/classifier";
import { decidePolicy } from "../lib/policy/engine";
import { executeRetryAndAdvance } from "../lib/actions/executeRetry";

/**
 * This file holds no in-memory state between jobs - every job independently
 * loads what it needs from Postgres, does its work, and writes the result
 * back. Run one of these, or run twenty; BullMQ distributes jobs across
 * however many are running.
 */
async function processFailure(job: Job<FailureJobData>) {
  const { transactionId } = job.data;

  const tx = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
  });

  // 1. Classify
  const classification = await classifyDecline({
    declineCode: tx.declineCode,
    declineMessage: tx.declineMessage,
    amountPaise: tx.amountPaise,
    attemptNumber: tx.attemptNumber,
  });

  await prisma.classification.create({
    data: {
      transactionId: tx.id,
      category: classification.category,
      confidence: classification.confidence,
      method: classification.method,
      reasoning: classification.reasoning,
    },
  });
  await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: "classified" },
  });
  await logAudit({
    transactionId: tx.id,
    eventType: "classified",
    payload: classification,
  });

  // 2. Decide policy
  const policy = decidePolicy({
    category: classification.category,
    attemptNumber: tx.attemptNumber,
  });

  await prisma.policyDecision.create({
    data: {
      transactionId: tx.id,
      action: policy.action,
      scheduledFor: policy.scheduledFor,
      reason: policy.reason,
    },
  });
  await logAudit({
    transactionId: tx.id,
    eventType: "policy_decided",
    payload: policy,
  });

  // 3. Execute (or leave for later)
  if (policy.action === "retry_now") {
    // executeRetryAndAdvance handles the attempt, logs it, and - if it
    // fails - re-runs the policy engine with the incremented attempt
    // count, which is what actually makes the stopping rule bite.
    await executeRetryAndAdvance(tx.id);
  } else if (
    policy.action === "escalate_update_method" ||
    policy.action === "escalate_review"
  ) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "escalated" },
    });
    await logAudit({
      transactionId: tx.id,
      eventType: "escalated",
      payload: { action: policy.action, reason: policy.reason },
    });
  } else if (policy.action === "stop") {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "exhausted" },
    });
    await logAudit({
      transactionId: tx.id,
      eventType: "escalated",
      payload: { action: "stop", reason: policy.reason },
    });
  }
  // retry_scheduled transactions are picked up by
  // scripts/runScheduledRetries.ts once policy.scheduledFor arrives -
  // they stay in "classified" status until then, on purpose.
}

const worker = new Worker<FailureJobData>(FAILURE_QUEUE_NAME, processFailure, {
  connection,
  concurrency: 5,
});

worker.on("completed", (job) => {
  console.log(`[worker] completed job ${job.id} for transaction ${job.data.transactionId}`);
});

worker.on("failed", async (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err);
  if (job) {
    await logAudit({
      transactionId: job.data.transactionId,
      eventType: "error",
      payload: { message: err.message },
    });
  }
});

console.log("[worker] listening for payment failure jobs...");
