import { sql } from "@/lib/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

/**
 * Fixed-window limiter backed by Postgres so it holds across serverless
 * instances (in-memory counters reset on every cold start).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const [row] = (await sql`
      insert into rate_limits (key, count, window_start)
      values (${key}::text, 1, now())
      on conflict (key) do update set
        count = case
          when rate_limits.window_start < now() - (${windowSeconds} || ' seconds')::interval
          then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start < now() - (${windowSeconds} || ' seconds')::interval
          then now()
          else rate_limits.window_start
        end
      returning count, extract(epoch from (
        window_start + (${windowSeconds} || ' seconds')::interval - now()
      ))::int as retry_after
    `) as { count: number; retry_after: number }[];

    const count = Number(row?.count ?? 1);
    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      retryAfter: Math.max(Number(row?.retry_after ?? windowSeconds), 1),
    };
  } catch (error) {
    // Never lock users out because the limiter itself failed.
    console.error("Rate limit check failed", (error as Error).message);
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}

export async function clientKey(request: Request, scope: string): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip =
    forwarded.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

export function tooMany(retryAfter: number): Response {
  return Response.json(
    { error: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
