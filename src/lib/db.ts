import { PrismaClient } from "@prisma/client";

// Next.js hot-reloads modules in dev, which would otherwise create a new
// PrismaClient (and a new DB connection pool) on every file change.
// Stashing it on globalThis keeps a single instance alive across reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
