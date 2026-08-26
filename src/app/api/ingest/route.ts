import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { failureQueue } from "@/lib/queue";
import { logAudit } from "@/lib/audit";
import { verifyApiKey } from "@/lib/apiKey";

type IncomingTransaction = {
  externalId: string;
  customerId: string;
  subscriptionId?: string;
  amountPaise: number;
  declineCode: string;
  declineMessage: string;
  attemptNumber?: number;
  originalFailedAt: string; // ISO date
};

/**
 * POST /api/ingest
 * Body: { transactions: IncomingTransaction[] }
 *
 * This route does the minimum possible work: validate, write to Postgres,
 * push a job onto the queue, return. It does NOT classify or decide
 * anything - that happens in the worker process, which can be scaled
 * independently of this API. That separation is what makes a traffic
 * spike here (a huge batch upload) not block the app.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const rawKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const merchantId = await verifyApiKey(rawKey);

  if (!merchantId) {
    return NextResponse.json(
      { error: "Invalid or missing API key. Send it as: Authorization: Bearer <key>" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body || !Array.isArray(body.transactions)) {
    return NextResponse.json(
      { error: "Expected body shape: { transactions: [...] }" },
      { status: 400 }
    );
  }

  const transactions: IncomingTransaction[] = body.transactions;
  const results: { externalId: string; status: string }[] = [];

  for (const tx of transactions) {
    if (!tx.externalId || !tx.amountPaise || !tx.declineCode) {
      results.push({ externalId: tx.externalId ?? "unknown", status: "skipped_invalid" });
      continue;
    }

    try {
      const created = await prisma.transaction.upsert({
        where: { externalId: tx.externalId },
        update: {}, // idempotent: re-posting the same batch doesn't duplicate rows
        create: {
          externalId: tx.externalId,
          merchantId,
          customerId: tx.customerId,
          subscriptionId: tx.subscriptionId,
          amountPaise: tx.amountPaise,
          declineCode: tx.declineCode,
          declineMessage: tx.declineMessage,
          attemptNumber: tx.attemptNumber ?? 1,
          originalFailedAt: new Date(tx.originalFailedAt),
        },
      });

      await logAudit({
        transactionId: created.id,
        eventType: "ingested",
        payload: { externalId: tx.externalId, declineCode: tx.declineCode },
      });

      await failureQueue.add("classify-and-resolve", { transactionId: created.id });

      results.push({ externalId: tx.externalId, status: "queued" });
    } catch (err: any) {
      results.push({ externalId: tx.externalId, status: `error: ${err?.message}` });
    }
  }

  return NextResponse.json({ ingested: results.length, results });
}
