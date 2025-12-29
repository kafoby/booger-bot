import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

// Check if request is from localhost (bot)
function isLocalhost(req: Request): boolean {
  const ip = req.ip || req.socket.remoteAddress || "";
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}

// Check if route is bot-facing (should bypass rate limiting from localhost)
function isBotRoute(req: Request): boolean {
  const path = req.path;

  // POST routes for bot
  if (req.method === "POST") {
    if (path === "/api/logs" || path === "/api/warns" || path === "/api/lfm") {
      return true;
    }
    if (path === "/api/bot/heartbeat") {
      return true;
    }
  }

  // GET routes for bot
  if (req.method === "GET") {
    if (path === "/api/bot/config") {
      return true;
    }
    if (path.startsWith("/api/lfm/")) {
      return true;
    }
  }

  return false;
}

// Create rate limiter: 100 requests per minute per IP
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for bot routes from localhost
    return isLocalhost(req) && isBotRoute(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "You have exceeded the rate limit of 100 requests per minute. Please wait before making more requests.",
      retryAfter: 60,
    });
  },
});
