/**
 * A very simple fixed-window rate limiter, in-memory.
 *
 * Honest limitation: this resets if the process restarts, and doesn't
 * share state across multiple server instances. That's fine for a single
 * hackathon deployment, but NOT how a real multi-instance production
 * service would do it - that needs a shared store (Redis, which we
 * already have via Upstash) with something like a sliding-window or
 * token-bucket algorithm. Flagging this explicitly rather than pretending
 * this is production-grade.
 */
const attempts = new Map<string, { count: number; windowStart: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 8;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}
