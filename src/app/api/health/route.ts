import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Temporary diagnostics: open /api/health to see why signup/login fails.
// Reveals only whether things work, never secrets.
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
  };
  try {
    await prisma.$queryRaw`select 1`;
    const users = await prisma.user.count();
    return NextResponse.json({ db: "ok", users, env });
  } catch (e: any) {
    return NextResponse.json(
      { db: "error", code: e?.code ?? null, name: e?.name ?? null, hint: String(e?.message ?? "").split("\n").pop()?.slice(0, 160), env },
      { status: 500 }
    );
  }
}
