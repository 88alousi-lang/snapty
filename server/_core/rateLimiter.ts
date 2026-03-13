import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory store — fast for single-instance deployments.
 * For multi-instance / serverless, swap to Redis (see DBRateLimiter below).
 */
const memoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(memoryStore.entries())) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Fast in-memory rate limit check.
 * Works correctly for single-instance deployments.
 * NOTE: Resets on restart — use dbRateLimit() for financial operations.
 */
export function checkRateLimit(
  userId: number,
  action: string,
  limit: number,
  windowMs: number = 60_000
): void {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= limit) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Please wait ${retryAfterSec}s before trying again.`,
    });
  }

  entry.count += 1;
}

/**
 * DB-backed rate limiter — survives restarts, works across multiple instances.
 * Used for sensitive financial operations (payouts, checkout).
 *
 * Requires a rate_limits table (created automatically if DB supports it).
 * Falls back to memory-only on DB errors.
 */
export async function checkRateLimitDB(
  userId: number,
  action: string,
  limit: number,
  windowMs: number = 60_000
): Promise<void> {
  // Always check in-memory first (fast path)
  try {
    checkRateLimit(userId, action, limit, windowMs);
  } catch (e) {
    throw e; // already rate limited in memory
  }

  // Also verify against DB for persistence across restarts
  try {
    const db = await getDb();
    if (!db) return; // DB not available — memory check already passed

    const windowStart = new Date(Date.now() - windowMs);
    const key = `${userId}:${action}`;

    const result = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM rate_limit_log
          WHERE rl_key = ${key} AND created_at > ${windowStart}`
    ) as any;

    const count = Number(result[0]?.[0]?.cnt ?? result[0]?.cnt ?? 0);
    if (count >= limit) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Maximum ${limit} requests per ${Math.round(windowMs / 60000)} minute(s).`,
      });
    }

    // Log this request
    await db.execute(
      sql`INSERT INTO rate_limit_log (rl_key, user_id, action, created_at)
          VALUES (${key}, ${userId}, ${action}, NOW())`
    );

    // Cleanup old entries (async, don't await)
    db.execute(
      sql`DELETE FROM rate_limit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
    ).catch(() => {});

  } catch (err: any) {
    // If it's a rate limit error, re-throw it
    if (err instanceof TRPCError) throw err;
    // On DB errors, fall back silently — memory check already passed
    console.warn("[rateLimiter] DB check failed, using memory-only:", err.message);
  }
}
