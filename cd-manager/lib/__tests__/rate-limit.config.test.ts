/**
 * @jest-environment node
 */

import { rateLimitRules, rateLimiters, findRateLimiter } from "../rate-limit.config";

describe("rate-limit.config", () => {
  describe("rateLimitRules", () => {
    it("has rules for all API route groups", () => {
      const paths = rateLimitRules.map((r) => r.path);
      expect(paths).toContain("/api/auth");
      expect(paths).toContain("/api/discogs");
      expect(paths).toContain("/api/proxy-remote");
      expect(paths).toContain("/api/display");
      expect(paths).toContain("/api/images");
      expect(paths).toContain("/api/cds");
      expect(paths).toContain("/api"); // catch-all
    });

    it("has the catch-all /api rule last", () => {
      const lastRule = rateLimitRules[rateLimitRules.length - 1];
      expect(lastRule.path).toBe("/api");
    });

    it("all rules have valid windowMs and maxRequests", () => {
      for (const rule of rateLimitRules) {
        expect(rule.windowMs).toBeGreaterThan(0);
        expect(rule.maxRequests).toBeGreaterThan(0);
      }
    });

    it("auth endpoints have the strictest limits", () => {
      const authRule = rateLimitRules.find((r) => r.path === "/api/auth");
      const catchAllRule = rateLimitRules.find((r) => r.path === "/api");
      expect(authRule!.maxRequests).toBeLessThan(catchAllRule!.maxRequests);
    });
  });

  describe("rateLimiters", () => {
    it("has a limiter for each rule", () => {
      expect(rateLimiters.size).toBe(rateLimitRules.length);
      for (const rule of rateLimitRules) {
        expect(rateLimiters.has(rule.path)).toBe(true);
      }
    });
  });

  describe("findRateLimiter", () => {
    it("matches specific routes to their limiter", () => {
      expect(findRateLimiter("/api/auth/signin")?.rule.path).toBe("/api/auth");
      expect(findRateLimiter("/api/discogs/search")?.rule.path).toBe("/api/discogs");
      expect(findRateLimiter("/api/proxy-remote")?.rule.path).toBe("/api/proxy-remote");
      expect(findRateLimiter("/api/display")?.rule.path).toBe("/api/display");
      expect(findRateLimiter("/api/images/photo.jpg")?.rule.path).toBe("/api/images");
      expect(findRateLimiter("/api/cds")?.rule.path).toBe("/api/cds");
    });

    it("falls back to catch-all for unknown API routes", () => {
      expect(findRateLimiter("/api/unknown")?.rule.path).toBe("/api");
    });

    it("returns undefined for non-API routes", () => {
      expect(findRateLimiter("/collection")).toBeUndefined();
      expect(findRateLimiter("/auth/signin")).toBeUndefined();
    });

    it("first match wins (more specific rules first)", () => {
      // /api/discogs/search should match /api/discogs, not /api
      const match = findRateLimiter("/api/discogs/artist/pictures");
      expect(match?.rule.path).toBe("/api/discogs");
    });
  });
});
