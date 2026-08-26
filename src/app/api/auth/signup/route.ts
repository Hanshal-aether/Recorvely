import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(`signup:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const { companyName, email, password } = await req.json().catch(() => ({}));

  if (!companyName || !email || !password) {
    return NextResponse.json(
      { error: "companyName, email, and password are required" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Merchant and its first user are created together - every merchant
  // must have at least one admin from the moment it exists.
  const merchant = await prisma.merchant.create({
    data: {
      name: companyName,
      users: {
        create: { email, passwordHash, role: "admin" },
      },
    },
  });

  return NextResponse.json({ merchantId: merchant.id, status: "created" });
}
