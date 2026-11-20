/**
 * Simple in-memory sliding-window rate limiter for API routes.
 * Suitable for a single-node deployment; swap for Redis in multi-node setups.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - b.hits[0])) / 1000);
    buckets.set(key, b);
    return { ok: false, retryAfter };
  }
  b.hits.push(now);
  buckets.set(key, b);
  if (buckets.size > 10000) {
    // basic cleanup of very old entries
    for (const [k, v] of buckets) {
      if (v.hits.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
