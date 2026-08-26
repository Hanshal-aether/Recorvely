import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/apiKey";

async function requireMerchantId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.merchantId as string | undefined;
}

export async function GET() {
  const merchantId = await requireMerchantId();
  if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { merchantId },
    select: { id: true, keyPrefix: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST() {
  const merchantId = await requireMerchantId();
  if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The raw key is only ever returned here, at creation time. It is not
  // retrievable again - only the hash lives in the database from now on.
  const rawKey = await generateApiKey(merchantId);

  return NextResponse.json({ apiKey: rawKey, warning: "Save this now - it will not be shown again." });
}
