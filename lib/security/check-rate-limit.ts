import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.REDIS_KV_REST_API_URL;
const token = process.env.REDIS_KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token, retry: false, signal: () => AbortSignal.timeout(500) }) : null;
const minuteLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60 s"), prefix: "ratelimit:check:minute" }) : null;
const dayLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(25, "24 h"), prefix: "ratelimit:check:day" }) : null;

export function getClientIp(request: Request): string {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

export async function limitCheckRequest(request: Request): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!minuteLimiter || !dayLimiter) return { allowed: true, retryAfterSeconds: 0 };
  try {
    const key = getClientIp(request);
    const [minute, day] = await Promise.all([minuteLimiter.limit(key), dayLimiter.limit(key)]);
    if (minute.success && day.success) return { allowed: true, retryAfterSeconds: 0 };
    const reset = Math.max(minute.reset, day.reset);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch {
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
