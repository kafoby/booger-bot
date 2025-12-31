import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

// Bot API key for authenticating requests
const BOT_API_KEY = process.env.BOT_API_KEY;

// Check if request has valid bot API key
function hasValidBotApiKey(req: Request): boolean {
  if (!BOT_API_KEY) {
    return false;
  }
  const apiKey = req.headers["x-bot-api-key"] as string;
  return apiKey === BOT_API_KEY;
}

// Check if route is bot-facing (should bypass rate limiting if authenticated)
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
    // Skip rate limiting for authenticated bot requests
    return hasValidBotApiKey(req) && isBotRoute(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "You have exceeded the rate limit of 100 requests per minute. Please wait before making more requests.",
      retryAfter: 60,
    });
  },
});
