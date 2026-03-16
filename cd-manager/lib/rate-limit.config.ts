import { RateLimiter } from "./security";

export interface RateLimitRule {
  /** Route prefix to match (matched with startsWith) */
  path: string;
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per IP within the window */
  maxRequests: number;
}

/**
 * Rate limit rules applied per route prefix.
 * Rules are matched in order — first match wins.
 * Each rule gets its own RateLimiter instance (separate counters).
 */
export const rateLimitRules: RateLimitRule[] = [
  // Auth endpoints: strict limit to prevent brute force
  { path: "/api/auth", windowMs: 60_000, maxRequests: 30 },

  // Discogs search: moderate limit (external API has its own rate limits)
  { path: "/api/discogs", windowMs: 60_000, maxRequests: 100 },

  // Proxy/display: moderate limit (forwards to external services)
  { path: "/api/proxy-remote", windowMs: 60_000, maxRequests: 80 },
  { path: "/api/display", windowMs: 1_000, maxRequests: 10 },

  // Images: lenient (static file serving)
  { path: "/api/images", windowMs: 60_000, maxRequests: 120 },

  // CDs collection: moderate
  { path: "/api/cds", windowMs: 60_000, maxRequests: 60 },

  // Default catch-all for any other API route
  { path: "/api", windowMs: 60_000, maxRequests: 1000 },
];

/**
 * Pre-instantiated RateLimiter for each rule.
 * Lives in module scope so state persists across requests (in-memory, per-process).
 */
export const rateLimiters: Map<string, RateLimiter> = new Map(
  rateLimitRules.map((rule) => [
    rule.path,
    new RateLimiter(rule.windowMs, rule.maxRequests),
  ]),
);

/**
 * Finds the matching rate limiter for a given pathname.
 * Returns the limiter and rule, or undefined if no match.
 */
export const findRateLimiter = (
  pathname: string,
): { limiter: RateLimiter; rule: RateLimitRule } | undefined => {
  for (const rule of rateLimitRules) {
    if (pathname.startsWith(rule.path)) {
      const limiter = rateLimiters.get(rule.path);
      if (limiter) return { limiter, rule };
    }
  }
  return undefined;
};
