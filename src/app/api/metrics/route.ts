import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Every query below is filtered by merchantId from the session - this is
// the enforcement point for multi-tenancy on the read side. A logged-in
// user only ever sees their own merchant's numbers, never anyone else's.
export async function GET() {
  const session = await getServerSession(authOptions);
  const merchantId = (session?.user as any)?.merchantId as string | undefined;

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [total, recovered, escalated, exhausted] = await Promise.all([
    prisma.transaction.count({ where: { merchantId } }),
    prisma.transaction.count({ where: { merchantId, status: "recovered" } }),
    prisma.transaction.count({ where: { merchantId, status: "escalated" } }),
    prisma.transaction.count({ where: { merchantId, status: "exhausted" } }),
  ]);

  const recoveredTransactions = await prisma.transaction.findMany({
    where: { merchantId, status: "recovered" },
    select: { amountPaise: true },
  });
  const amountRecoveredPaise = recoveredTransactions.reduce(
    (sum: number, t: { amountPaise: number }) => sum + t.amountPaise,
    0
  );

  const byCategory = await prisma.classification.groupBy({
    by: ["category"],
    _count: { category: true },
    where: { transaction: { merchantId } },
  });

  // "Retries avoided" = failures the policy engine routed straight to
  // escalation instead of retrying, because the category made retrying
  // pointless (hard_decline, risk_block). This is the number that shows
  // judgment, not just brute-force retrying.
  const retriesAvoided = await prisma.policyDecision.count({
    where: {
      action: { in: ["escalate_update_method", "escalate_review"] },
      transaction: { merchantId },
    },
  });

  const recentAuditEvents = await prisma.auditLog.findMany({
    where: { transaction: { merchantId } },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({
    totals: { total, recovered, escalated, exhausted },
    amountRecoveredPaise,
    recoveryRate: total > 0 ? recovered / total : 0,
    byCategory,
    retriesAvoided,
    recentAuditEvents,
  });
}
