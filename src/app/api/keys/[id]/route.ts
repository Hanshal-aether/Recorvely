import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const merchantId = (session?.user as any)?.merchantId as string | undefined;

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load first and check ownership explicitly - never trust that an id
  // belongs to the caller just because they're logged in as someone.
  const key = await prisma.apiKey.findUnique({ where: { id: params.id } });

  if (!key || key.merchantId !== merchantId) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  if (key.revokedAt) {
    return NextResponse.json({ status: "already_revoked" });
  }

  await prisma.apiKey.update({
    where: { id: params.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ status: "revoked" });
}
