import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { failureQueue } from "@/lib/queue";
import { isRateLimited } from "@/lib/rateLimit";
import { MAX_FILE_BYTES, MAX_ROWS, mapRows, parseUpload } from "@/lib/import/parse";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/import  (multipart form: file, confirm?)
 * Human-session endpoint for uploading .xlsx / .csv / .sql history.
 *  - without confirm=1 : dry run. Returns what we understood, writes nothing.
 *  - with    confirm=1 : saves the rows and queues them for classification.
 * Files are parsed in memory and never stored. .sql files are never executed.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const merchantId = (session?.user as any)?.merchantId as string | undefined;
  if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(`import:${merchantId}`)) {
    return NextResponse.json({ error: "Too many uploads. Wait a minute and try again." }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const confirm = form.get("confirm") === "1";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File is too large. The limit is 5 MB." }, { status: 413 });
    }

    const rows = await parseUpload(file.name, Buffer.from(await file.arrayBuffer()));
    if (rows.length === 0) {
      return NextResponse.json({ error: "We could not find any rows in that file." }, { status: 422 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `That file has more than ${MAX_ROWS} rows. Split it and upload in parts.` },
        { status: 413 }
      );
    }

    const mapped = mapRows(rows);
    const preview = {
      fileName: file.name,
      totalRows: rows.length,
      valid: mapped.transactions.length,
      skipped: mapped.skipped.slice(0, 10),
      skippedCount: mapped.skipped.length,
      mapping: mapped.mapping,
      warnings: mapped.warnings,
      sample: mapped.transactions.slice(0, 5).map((t) => ({
        id: t.externalId,
        amountRupees: t.amountPaise / 100,
        code: t.declineCode,
        message: t.declineMessage,
        failedAt: t.originalFailedAt,
      })),
    };

    if (!confirm) return NextResponse.json({ dryRun: true, ...preview });
    if (mapped.transactions.length === 0) {
      return NextResponse.json({ error: "Nothing valid to import.", ...preview }, { status: 422 });
    }

    // Ids are namespaced per merchant so two merchants can never collide
    // (externalId is unique across the whole table).
    const ns = (id: string) => `imp:${merchantId}:${id}`;
    const existing = await prisma.transaction.findMany({
      where: { externalId: { in: mapped.transactions.map((t) => ns(t.externalId)) } },
      select: { externalId: true },
    });
    const have = new Set(existing.map((e: { externalId: string }) => e.externalId));
    const fresh = mapped.transactions.filter((t) => !have.has(ns(t.externalId)));

    if (fresh.length > 0) {
      await prisma.transaction.createMany({
        data: fresh.map((t) => ({
          externalId: ns(t.externalId),
          merchantId,
          customerId: t.customerId,
          subscriptionId: t.subscriptionId,
          amountPaise: t.amountPaise,
          declineCode: t.declineCode,
          declineMessage: t.declineMessage,
          attemptNumber: 1,
          originalFailedAt: new Date(t.originalFailedAt),
        })),
        skipDuplicates: true,
      });

      const created = await prisma.transaction.findMany({
        where: { merchantId, externalId: { in: fresh.map((t) => ns(t.externalId)) } },
        select: { id: true, declineCode: true, externalId: true },
      });

      await prisma.auditLog.createMany({
        data: created.map((c: { id: string; declineCode: string }) => ({
          transactionId: c.id,
          eventType: "ingested",
          payload: { source: "file_import", fileName: file.name, declineCode: c.declineCode } as any,
        })),
      });

      await failureQueue.addBulk(
        created.map((c: { id: string }) => ({ name: "classify-and-resolve", data: { transactionId: c.id } }))
      );
    }

    return NextResponse.json({
      imported: fresh.length,
      alreadyImported: mapped.transactions.length - fresh.length,
      skippedCount: mapped.skipped.length,
    });
  } catch (err: any) {
    console.error("import failed", err);
    return NextResponse.json(
      { error: err?.message?.startsWith("Unsupported") ? err.message : "We could not read that file. Check that it is a valid .xlsx, .csv or .sql file." },
      { status: 400 }
    );
  }
}
