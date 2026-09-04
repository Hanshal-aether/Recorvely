import "dotenv/config";
import { prisma } from "../src/lib/db";
import { executeRetryAndAdvance } from "../src/lib/actions/executeRetry";

/**
 * Runs as its own long-lived process, separate from the queue worker.
 * Every POLL_INTERVAL_MS, it looks for transactions whose most recent
 * policy decision was "retry_scheduled" and whose scheduledFor time has
 * arrived, and executes the retry for each one via the same shared
 * function the immediate-retry path uses.
 *
 * Without this process, "retry_scheduled" decisions get logged correctly
 * but nothing ever comes back to act on them - this is what closes that
 * loop.
 */
const POLL_INTERVAL_MS = Number(process.env.SCHEDULER_POLL_INTERVAL_MS ?? 10_000);

async function runOnce() {
  // Transactions still awaiting action, whose latest policy decision was
  // a scheduled retry that's now due.
  const candidates = await prisma.transaction.findMany({
    where: { status: "classified" },
    include: {
      policyDecisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const due = candidates.filter((tx) => {
    const latest = tx.policyDecisions[0];
    return (
      latest &&
      latest.action === "retry_scheduled" &&
      latest.scheduledFor &&
      latest.scheduledFor <= new Date()
    );
  });

  if (due.length === 0) return;

  console.log(`[scheduler] found ${due.length} due retry(ies), executing...`);

  for (const tx of due) {
    try {
      await executeRetryAndAdvance(tx.id);
      console.log(`[scheduler] processed ${tx.externalId}`);
    } catch (err) {
      console.error(`[scheduler] failed to process ${tx.externalId}:`, err);
    }
  }
}

async function main() {
  console.log(
    `[scheduler] polling every ${POLL_INTERVAL_MS}ms for due scheduled retries...`
  );
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await runOnce().catch((err) => console.error("[scheduler] poll error:", err));
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
