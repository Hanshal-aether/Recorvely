import { randomBytes, createHash } from "crypto";
import { prisma } from "./db";

const KEY_PREFIX = "rcv_test_";

/**
 * Generates a new API key for a merchant. The raw key is returned ONCE -
 * only its SHA-256 hash is stored in the database, exactly like how
 * Stripe/Razorpay handle their own API keys. If the raw key is lost,
 * there's no way to recover it - only revoke and issue a new one.
 */
export async function generateApiKey(merchantId: string) {
  const raw = KEY_PREFIX + randomBytes(24).toString("hex");
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const keyPrefix = raw.slice(0, KEY_PREFIX.length + 6);

  await prisma.apiKey.create({
    data: { merchantId, keyHash, keyPrefix },
  });

  return raw;
}

/**
 * Verifies a raw API key from an Authorization header and resolves it to
 * a merchantId. Returns null if the key doesn't exist - callers must
 * reject the request in that case, never fall back to a default merchant.
 */
export async function verifyApiKey(raw: string): Promise<string | null> {
  if (!raw || !raw.startsWith(KEY_PREFIX)) return null;

  const keyHash = createHash("sha256").update(raw).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });

  if (!apiKey || apiKey.revokedAt) return null;

  // Fire-and-forget usage tracking - don't block the request on this write.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return apiKey.merchantId;
}
