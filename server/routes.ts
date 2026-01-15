import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, requireAuth, isAuthenticated, isDiscordConfigured } from "./auth";
import { api } from "@shared/routes";
import { insertWarnSchema, insertLfmSchema, insertScrobbleHistorySchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

// Bot API key for authenticating requests from the Discord bot
const BOT_API_KEY = process.env.BOT_API_KEY;

// Last.fm API credentials
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET;

// Public URL for external services
const rawPublic = (process.env.PUBLIC_URL || 
                  (process.env.REPL_SLUG && process.env.REPL_OWNER ? 
                   `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
                   "http://localhost:5000")).replace(/\/$/, "");

const ROOT_URL = rawPublic.endsWith("/api") ? rawPublic.slice(0, -4) : rawPublic;
const API_BASE = rawPublic.endsWith("/api") ? rawPublic : `${rawPublic}/api`;

const LASTFM_CALLBACK_URL = process.env.LASTFM_CALLBACK_URL || `${API_BASE}/lfm/auth/callback`;

// Temporary storage for auth tokens (in production, use Redis or database)
const authTokens = new Map<string, { discordUserId: string; expiresAt: number }>();

// Middleware to validate bot API key
const requireBotApiKey: RequestHandler = (req, res, next) => {
  const apiKey = req.headers["x-bot-api-key"] as string;

  if (!BOT_API_KEY) {
    console.warn("BOT_API_KEY not configured - bot endpoints are unprotected!");
    return next();
  }

  if (!apiKey || apiKey !== BOT_API_KEY) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }

  return next();
};

// Middleware to allow either bot API key OR authenticated user session
const requireBotApiKeyOrAuth: RequestHandler = (req, res, next) => {
  const apiKey = req.headers["x-bot-api-key"] as string;

  // If valid API key, allow through
  if (BOT_API_KEY && apiKey === BOT_API_KEY) {
    console.log(`[requireBotApiKeyOrAuth] ✓ Valid API key for ${req.path}`);
    return next();
  }

  // If no API key configured and no key provided, check for user session
  if (!BOT_API_KEY && !apiKey) {
    console.warn("BOT_API_KEY not configured - checking user auth instead");
  }

  // Otherwise, require authenticated user session
  if (req.isAuthenticated()) {
    console.log(`[requireBotApiKeyOrAuth] ✓ User authenticated for ${req.path}`);
    return next();
  }

  console.log(`[requireBotApiKeyOrAuth] ✗ Access denied for ${req.path}. Has API key: ${!!apiKey}, Is authenticated: ${req.isAuthenticated()}`);
  return res.status(401).json({ message: "Unauthorized - Please log in" });
};

// Middleware to check if user is an admin
const requireAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = req.user as Express.User;
  const isAdmin = await storage.isAdmin(user.discordId);
  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

// Helper function to generate Last.fm API signature
function generateLastfmSignature(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .filter(key => key !== "format" && key !== "callback")
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");
  return crypto
    .createHash("md5")
    .update(sorted + LASTFM_API_SECRET)
    .digest("hex");
}

// Helper function to call Last.fm API
async function callLastfmApi(method: string, params: Record<string, string>): Promise<any> {
  const apiParams = {
    method,
    api_key: LASTFM_API_KEY!,
    format: "json",
    ...params,
  };

  apiParams.api_sig = generateLastfmSignature(apiParams);

  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  Object.entries(apiParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), { method: "POST" });
  return response.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // ============================================
  // AUTH ROUTES
  // ============================================

  // Check auth configuration status
  app.get("/api/auth/status", (req, res) => {
    res.json({
      configured: isDiscordConfigured(),
      authenticated: req.isAuthenticated(),
      user: req.user
        ? {
            id: req.user.id,
            discordId: req.user.discordId,
            username: req.user.username,
            avatar: req.user.avatar,
            hasRequiredRole: req.user.hasRequiredRole,
          }
        : null,
    });
  });

  // Initiate Discord OAuth login
  app.get(
    "/api/auth/discord",
    passport.authenticate("discord", {
      scope: ["identify", "email", "guilds"],
    })
  );

  // Discord OAuth callback
  app.get(
    "/api/auth/discord/callback",
    passport.authenticate("discord", {
      failureRedirect: "/login?error=auth_failed",
    }),
    (req, res) => {
      // Check if user has required role
      const user = req.user as Express.User;
      if (!user.hasRequiredRole) {
        return res.redirect("/login?error=no_role");
      }
      res.redirect("/");
    }
  );

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user as Express.User;
    res.json({
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
      email: user.email,
      hasRequiredRole: user.hasRequiredRole,
    });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session destruction failed" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // ============================================
  // PROTECTED API ROUTES
  // ============================================

  app.get(api.logs.list.path, requireAuth, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;
    const level = req.query.level as string | undefined;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const userId = req.query.userId as string | undefined;

    // Debug date filters
    if (startDate || endDate) {
      console.log('Date filters received:', { startDate, endDate });
    }

    const [logs, stats, categoryStats, filteredCount] = await Promise.all([
      storage.getLogs(limit, offset, level, search, category, startDate, endDate, userId),
      storage.getLogsStats(),
      storage.getCategoryStats(),
      storage.getLogsCount(level, search, category, startDate, endDate, userId)
    ]);

    res.json({
      logs,
      stats,
      categoryStats,
      limit,
      offset,
      total: filteredCount,
      hasMore: offset + logs.length < filteredCount
    });
  });

  // Logs route - allows both Discord bot (API key) and dashboard users (session auth)
  app.post(api.logs.create.path, requireBotApiKeyOrAuth, async (req, res) => {
    try {
      const input = api.logs.create.input.parse(req.body);
      const log = await storage.createLog(input);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // Delete logs route - admin only
  app.delete("/api/logs", requireAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const deletedCount = await storage.deleteLogs(category);

      res.json({
        message: category
          ? `Deleted ${deletedCount} logs from category: ${category}`
          : `Deleted all ${deletedCount} logs`,
        deletedCount,
        category: category || "all"
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete logs" });
    }
  });

  // Delete single log by ID - admin only
  app.delete("/api/logs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }

      const success = await storage.deleteLog(id);
      if (!success) {
        return res.status(404).json({ message: "Log not found" });
      }

      res.json({ message: "Log deleted successfully", id });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete log" });
    }
  });

  // Bulk delete logs by IDs - admin only
  app.post("/api/logs/bulk-delete", requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids must be a non-empty array" });
      }

      if (ids.some(id => typeof id !== 'number' || isNaN(id))) {
        return res.status(400).json({ message: "Invalid request: all ids must be numbers" });
      }

      const deletedCount = await storage.bulkDeleteLogs(ids);

      res.json({
        message: `Successfully deleted ${deletedCount} log${deletedCount !== 1 ? 's' : ''}`,
        deletedCount,
        requestedCount: ids.length
      });
    } catch (err) {
      console.error("Error bulk deleting logs:", err);
      res.status(500).json({ message: "Failed to bulk delete logs" });
    }
  });

  app.get("/api/warns", requireAuth, async (req, res) => {
    const warns = await storage.getWarns();
    res.json(warns);
  });

  // Warns route is used by the Discord bot - protected by API key
  app.post("/api/warns", requireBotApiKey, async (req, res) => {
    try {
      const input = insertWarnSchema.parse(req.body);
      const warn = await storage.createWarn(input);
      res.status(201).json(warn);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // ============================================
  // LAST.FM ROUTES
  // ============================================

  // Start Last.fm authentication
  app.get("/api/lfm/auth/start", requireBotApiKeyOrAuth, async (req, res) => {
    try {
      const discordUserId = req.query.discordUserId as string;
      if (!discordUserId) {
        return res.status(400).json({ message: "discordUserId is required" });
      }

      if (!LASTFM_API_KEY) {
        return res.status(500).json({ message: "Last.fm API not configured" });
      }

      // Generate unique auth token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 60 * 60 * 1000; // 60 minutes

      // Store token with user ID
      authTokens.set(token, { discordUserId, expiresAt });

      // Clean up expired tokens
      for (const [key, value] of authTokens.entries()) {
        if (value.expiresAt < Date.now()) {
          authTokens.delete(key);
        }
      }

      // Return Last.fm auth URL
      const authUrl = `https://www.last.fm/api/auth?api_key=${LASTFM_API_KEY}&cb=${encodeURIComponent(
        `${LASTFM_CALLBACK_URL}?state=${token}`
      )}`;

      res.json({
        authUrl,
        token,
        expiresIn: 3600,
      });
    } catch (err) {
      console.error("Error starting Last.fm auth:", err);
      res.status(500).json({ message: "Failed to start authentication" });
    }
  });

  // Last.fm authentication callback
  app.get("/api/lfm/auth/callback", async (req, res) => {
    try {
      const token = req.query.state as string; // Our internal token (passed as state)
      const lfmToken = req.query.token as string; // Last.fm sends back 'token' parameter

      if (!token) {
        return res.status(400).send("Missing token parameter");
      }

      // Get stored auth data
      const authData = authTokens.get(token);
      if (!authData || authData.expiresAt < Date.now()) {
        authTokens.delete(token);
        return res.status(400).send("Invalid or expired token");
      }

      if (!LASTFM_API_KEY || !LASTFM_API_SECRET) {
        return res.status(500).send("Last.fm API not configured");
      }

      // Get session key from Last.fm
      const sessionData = await callLastfmApi("auth.getSession", { token: lfmToken });

      if (sessionData.error) {
        console.error("Last.fm auth error:", sessionData);
        return res.status(400).send(`Last.fm authentication failed: ${sessionData.message}`);
      }

      const sessionKey = sessionData.session.key;
      const username = sessionData.session.name;

      // Store in database
      await storage.createOrUpdateLfmConnection({
        discordUserId: authData.discordUserId,
        lastfmUsername: username,
        sessionKey,
        scrobblingEnabled: true,
      });

      // Clean up token
      authTokens.delete(token);

      // Redirect to success page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Last.fm Connected</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #d51007; }
            p { font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>Success!</h1>
          <p>Your Last.fm account <strong>${username}</strong> has been connected.</p>
          <p>You can close this window and return to Discord.</p>
        </body>
        </html>
      `);
    } catch (err) {
      console.error("Error in Last.fm callback:", err);
      res.status(500).send("Authentication failed. Please try again.");
    }
  });

  // Get Last.fm connection for user
  app.get("/api/lfm/:discordUserId", requireBotApiKey, async (req, res) => {
    try {
      const connection = await storage.getLfmConnection(req.params.discordUserId);
      if (!connection) {
        return res.status(404).json({ message: "Last.fm connection not found" });
      }
      res.json(connection);
    } catch (err) {
      res.status(500).json({ message: "Error fetching Last.fm connection" });
    }
  });

  // Toggle scrobbling for user
  app.put("/api/lfm/:discordUserId/toggle", requireBotApiKey, async (req, res) => {
    try {
      const connection = await storage.toggleLfmScrobbling(req.params.discordUserId);
      res.json(connection);
    } catch (err) {
      res.status(500).json({ message: "Error toggling scrobbling" });
    }
  });

  // Delete Last.fm connection
  app.delete("/api/lfm/:discordUserId", requireBotApiKey, async (req, res) => {
    try {
      await storage.deleteLfmConnection(req.params.discordUserId);
      res.json({ message: "Last.fm connection deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting Last.fm connection" });
    }
  });

  // Get scrobble history
  app.get("/api/lfm/scrobbles/:discordUserId", requireAuth, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
      const offset = parseInt(req.query.offset as string) || 0;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const [history, stats] = await Promise.all([
        storage.getScrobbleHistory(req.params.discordUserId, { limit, offset, startDate, endDate }),
        storage.getScrobbleStats(req.params.discordUserId),
      ]);

      res.json({
        history,
        stats,
        limit,
        offset,
      });
    } catch (err) {
      console.error("Error fetching scrobble history:", err);
      res.status(500).json({ message: "Error fetching scrobble history" });
    }
  });

  // Batch scrobble endpoint
  app.post("/api/lfm/scrobble", requireBotApiKey, async (req, res) => {
    try {
      const scrobbles = req.body.scrobbles as Array<{
        discordUserId: string;
        artist: string;
        track: string;
        album?: string;
        timestamp: number;
        duration?: number;
      }>;

      if (!Array.isArray(scrobbles) || scrobbles.length === 0) {
        return res.status(400).json({ message: "scrobbles array is required" });
      }

      const results = [];

      for (const scrobble of scrobbles) {
        try {
          // Get user's Last.fm connection
          const connection = await storage.getLfmConnection(scrobble.discordUserId);

          if (!connection || !connection.sessionKey || !connection.scrobblingEnabled) {
            results.push({
              discordUserId: scrobble.discordUserId,
              success: false,
              error: "User not connected or scrobbling disabled",
            });
            continue;
          }

          // Call Last.fm API to scrobble
          const params: Record<string, string> = {
            sk: connection.sessionKey,
            artist: scrobble.artist,
            track: scrobble.track,
            timestamp: Math.floor(scrobble.timestamp / 1000).toString(),
          };

          if (scrobble.album) params.album = scrobble.album;
          if (scrobble.duration) params.duration = scrobble.duration.toString();

          const response = await callLastfmApi("track.scrobble", params);

          const success = !response.error;
          const errorMessage = response.error ? response.message : undefined;

          // Store in history
          await storage.createScrobbleRecord({
            discordUserId: scrobble.discordUserId,
            artist: scrobble.artist,
            track: scrobble.track,
            album: scrobble.album || null,
            timestamp: new Date(scrobble.timestamp),
            success,
            errorMessage: errorMessage || null,
          });

          results.push({
            discordUserId: scrobble.discordUserId,
            success,
            error: errorMessage,
          });
        } catch (err) {
          console.error(`Error scrobbling for user ${scrobble.discordUserId}:`, err);
          results.push({
            discordUserId: scrobble.discordUserId,
            success: false,
            error: "Internal error",
          });
        }
      }

      res.json({ results });
    } catch (err) {
      console.error("Error in batch scrobble:", err);
      res.status(500).json({ message: "Error processing scrobbles" });
    }
  });

  // Update Now Playing
  app.post("/api/lfm/now-playing", requireBotApiKey, async (req, res) => {
    try {
      const nowPlaying = req.body.nowPlaying as Array<{
        discordUserId: string;
        artist: string;
        track: string;
        album?: string;
        duration?: number;
      }>;

      if (!Array.isArray(nowPlaying) || nowPlaying.length === 0) {
        return res.status(400).json({ message: "nowPlaying array is required" });
      }

      const results = [];

      for (const np of nowPlaying) {
        try {
          const connection = await storage.getLfmConnection(np.discordUserId);

          if (!connection || !connection.sessionKey || !connection.scrobblingEnabled) {
            results.push({
              discordUserId: np.discordUserId,
              success: false,
              error: "User not connected or scrobbling disabled",
            });
            continue;
          }

          const params: Record<string, string> = {
            sk: connection.sessionKey,
            artist: np.artist,
            track: np.track,
          };

          if (np.album) params.album = np.album;
          if (np.duration) params.duration = np.duration.toString();

          const response = await callLastfmApi("track.updateNowPlaying", params);

          results.push({
            discordUserId: np.discordUserId,
            success: !response.error,
            error: response.error ? response.message : undefined,
          });
        } catch (err) {
          console.error(`Error updating now playing for user ${np.discordUserId}:`, err);
          results.push({
            discordUserId: np.discordUserId,
            success: false,
            error: "Internal error",
          });
        }
      }

      res.json({ results });
    } catch (err) {
      console.error("Error in now playing update:", err);
      res.status(500).json({ message: "Error updating now playing" });
    }
  });

  // ============================================
  // BOT STATUS ROUTES
  // ============================================

  // Bot heartbeat endpoint - protected by API key
  app.post("/api/bot/heartbeat", requireBotApiKey, async (req, res) => {
    try {
      const { status, uptime, errorMessage } = req.body;
      const botStatusResult = await storage.updateBotHeartbeat(
        status || "online",
        uptime,
        errorMessage
      );
      res.json(botStatusResult);
    } catch (err) {
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  // Get bot status (protected for dashboard)
  app.get("/api/bot/status", requireAuth, async (req, res) => {
    try {
      const status = await storage.getBotStatus();
      if (!status) {
        return res.json({
          status: "offline",
          lastHeartbeat: null,
          isOnline: false,
          lastSeenText: "Never connected",
          uptime: null,
        });
      }

      // Check if bot is considered offline (no heartbeat in 60 seconds)
      const now = new Date();
      const lastHeartbeat = new Date(status.lastHeartbeat!);
      const secondsSinceHeartbeat = (now.getTime() - lastHeartbeat.getTime()) / 1000;
      const isOnline = secondsSinceHeartbeat < 60;

      let lastSeenText = "Online";
      if (!isOnline) {
        const minutes = Math.floor(secondsSinceHeartbeat / 60);
        if (minutes < 60) {
          lastSeenText = `Last seen: ${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
        } else {
          const hours = Math.floor(minutes / 60);
          lastSeenText = `Last seen: ${hours} hour${hours !== 1 ? "s" : ""} ago`;
        }
      }

      res.json({
        ...status,
        isOnline,
        lastSeenText,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch bot status" });
    }
  });

  // ============================================
  // BOT CONFIG ROUTES
  // ============================================

  // Get bot config (for bot - protected by API key)
  app.get("/api/bot/config", requireBotApiKey, async (req, res) => {
    try {
      const [config, starboardConfigs, autoreactConfigs] = await Promise.all([
        storage.getBotConfig(),
        storage.getStarboardConfigs(),
        storage.getAutoreactConfigs(),
      ]);

      // Convert arrays to objects keyed by guildId for easier bot access
      const starboard: Record<string, any> = {};
      for (const sc of starboardConfigs) {
        starboard[sc.guildId] = {
          monitored_channel_id: sc.monitoredChannelId,
          emoji: sc.emoji,
          threshold: sc.threshold,
          starboard_channel_id: sc.starboardChannelId,
        };
      }

      const autoreact: Record<string, any> = {};
      for (const ac of autoreactConfigs) {
        autoreact[ac.guildId] = {
          channel_id: ac.channelId,
          type: ac.type,
          emojis: ac.emojis,
        };
      }

      res.json({
        ...config,
        starboard,
        autoreact,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  // Get bot config (for dashboard - with auth)
  app.get("/api/config", requireAuth, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const [config, isAdmin] = await Promise.all([
        storage.getBotConfig(),
        storage.isAdmin(user.discordId),
      ]);
      res.json({ config, isAdmin });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  // Update bot config (admin only)
  app.put("/api/config", requireAdmin, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { prefix, disabledCommands, allowedChannels } = req.body;

      const config = await storage.updateBotConfig(
        {
          prefix,
          disabledCommands,
          allowedChannels,
        },
        user.discordId
      );

      res.json(config);
    } catch (err) {
      res.status(500).json({ message: "Failed to update config" });
    }
  });

  // ============================================
  // ADMIN MANAGEMENT ROUTES
  // ============================================

  // Get admin users (admin only)
  app.get("/api/admins", requireAdmin, async (req, res) => {
    try {
      const admins = await storage.getAdminUsers();
      const defaultAdmins = storage.getDefaultAdmins();
      res.json({
        admins,
        defaultAdmins,
        allAdminIds: [...defaultAdmins, ...admins.map((a) => a.discordId)],
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  // Add admin user (admin only)
  app.post("/api/admins", requireAdmin, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { discordId } = req.body;

      if (!discordId) {
        return res.status(400).json({ message: "Discord ID required" });
      }

      const admin = await storage.addAdminUser(discordId, user.discordId);
      res.status(201).json(admin);
    } catch (err) {
      res.status(500).json({ message: "Failed to add admin" });
    }
  });

  // Remove admin user (admin only)
  app.delete("/api/admins/:discordId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.removeAdminUser(req.params.discordId);
      if (!success) {
        return res.status(400).json({ message: "Cannot remove default admin" });
      }
      res.json({ message: "Admin removed" });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove admin" });
    }
  });

  // ============================================
  // AUTH BYPASS MANAGEMENT ROUTES
  // ============================================

  // Get auth bypass users (admin only)
  app.get("/api/auth-bypass", requireAdmin, async (req, res) => {
    try {
      const bypassUsers = await storage.getAuthBypassUsers();
      const defaultBypass = storage.getDefaultAuthBypass();
      res.json({
        bypassUsers,
        defaultBypass,
        allBypassIds: [...defaultBypass, ...bypassUsers.map((u) => u.discordId)],
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch auth bypass users" });
    }
  });

  // Add auth bypass user (admin only)
  app.post("/api/auth-bypass", requireAdmin, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { discordId } = req.body;

      if (!discordId) {
        return res.status(400).json({ message: "Discord ID required" });
      }

      const bypassUser = await storage.addAuthBypassUser(discordId, user.discordId);
      res.status(201).json(bypassUser);
    } catch (err) {
      res.status(500).json({ message: "Failed to add auth bypass user" });
    }
  });

  // Remove auth bypass user (admin only)
  app.delete("/api/auth-bypass/:discordId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.removeAuthBypassUser(req.params.discordId);
      if (!success) {
        return res.status(400).json({ message: "Cannot remove default auth bypass user" });
      }
      res.json({ message: "Auth bypass user removed" });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove auth bypass user" });
    }
  });

  // ============================================
  // ANALYTICS ROUTES
  // ============================================

  // Get performance metrics (protected for dashboard)
  app.get("/api/performance", requireBotApiKeyOrAuth, async (req, res) => {
    try {
      const metrics = await storage.getPerformanceMetrics();
      res.json(metrics);
    } catch (err) {
      console.error("Error fetching performance metrics:", err);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Get user activity (protected for dashboard)
  app.get("/api/analytics/users", requireBotApiKeyOrAuth, async (req, res) => {
    try {
      const activity = await storage.getUserActivity();
      res.json(activity);
    } catch (err) {
      console.error("Error fetching user activity:", err);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // Search presets endpoints
  app.get("/api/search-presets", requireAuth, async (req, res) => {
    try {
      if (!req.user?.discordId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const presets = await storage.getSearchPresets(req.user.discordId);
      res.json(presets);
    } catch (err) {
      console.error("Error fetching search presets:", err);
      res.status(500).json({ message: "Failed to fetch search presets" });
    }
  });

  app.post("/api/search-presets", requireAuth, async (req, res) => {
    try {
      if (!req.user?.discordId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, filters } = req.body;
      if (!name || !filters) {
        return res.status(400).json({ message: "Name and filters are required" });
      }

      const preset = await storage.createSearchPreset({
        name,
        userId: req.user.discordId,
        filters: JSON.stringify(filters),
      });

      res.status(201).json(preset);
    } catch (err) {
      console.error("Error creating search preset:", err);
      res.status(500).json({ message: "Failed to create search preset" });
    }
  });

  app.delete("/api/search-presets/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user?.discordId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid preset ID" });
      }

      const deleted = await storage.deleteSearchPreset(id, req.user.discordId);
      if (!deleted) {
        return res.status(404).json({ message: "Preset not found or unauthorized" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting search preset:", err);
      res.status(500).json({ message: "Failed to delete search preset" });
    }
  });

  // ============================================
  // EMBED TEMPLATE ROUTES (Admin only)
  // ============================================

  // Get all embed templates
  app.get("/api/embed-templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getEmbedTemplates();
      res.json(templates);
    } catch (err) {
      console.error("Error fetching embed templates:", err);
      res.status(500).json({ message: "Failed to fetch embed templates" });
    }
  });

  // Get single embed template by ID
  app.get("/api/embed-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getEmbedTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (err) {
      console.error("Error fetching embed template:", err);
      res.status(500).json({ message: "Failed to fetch embed template" });
    }
  });

  // Create embed template
  app.post("/api/embed-templates", requireAdmin, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { name, description, category, templateData, isDefault } = req.body;

      if (!name || !templateData) {
        return res.status(400).json({ message: "Name and templateData are required" });
      }

      // Validate template_data is valid JSON
      try {
        if (typeof templateData === "string") {
          JSON.parse(templateData);
        }
      } catch {
        return res.status(400).json({ message: "templateData must be valid JSON" });
      }

      const template = await storage.createEmbedTemplate({
        name,
        description,
        category,
        templateData: typeof templateData === "string" ? templateData : JSON.stringify(templateData),
        isDefault: isDefault || false,
        createdBy: user.discordId,
      });

      res.status(201).json(template);
    } catch (err) {
      console.error("Error creating embed template:", err);
      res.status(500).json({ message: "Failed to create embed template" });
    }
  });

  // Update embed template
  app.put("/api/embed-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const { name, description, category, templateData, isDefault } = req.body;

      // Validate template_data if provided
      if (templateData) {
        try {
          if (typeof templateData === "string") {
            JSON.parse(templateData);
          }
        } catch {
          return res.status(400).json({ message: "templateData must be valid JSON" });
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (templateData !== undefined) {
        updateData.templateData = typeof templateData === "string" ? templateData : JSON.stringify(templateData);
      }
      if (isDefault !== undefined) updateData.isDefault = isDefault;

      const template = await storage.updateEmbedTemplate(id, updateData);
      res.json(template);
    } catch (err) {
      console.error("Error updating embed template:", err);
      res.status(500).json({ message: "Failed to update embed template" });
    }
  });

  // Delete embed template
  app.delete("/api/embed-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const deleted = await storage.deleteEmbedTemplate(id);
      if (!deleted) {
        return res.status(403).json({ message: "Cannot delete default template" });
      }

      res.json({ message: "Template deleted successfully", id });
    } catch (err) {
      console.error("Error deleting embed template:", err);
      res.status(500).json({ message: "Failed to delete embed template" });
    }
  });

  // ============================================
  // COMMAND TEMPLATE MAPPING ROUTES (Admin only)
  // ============================================

  // Get all command template mappings
  app.get("/api/command-template-mappings", requireAdmin, async (req, res) => {
    try {
      const mappings = await storage.getCommandTemplateMappings();
      res.json(mappings);
    } catch (err) {
      console.error("Error fetching command template mappings:", err);
      res.status(500).json({ message: "Failed to fetch command template mappings" });
    }
  });

  // Get command template mapping for bot (API key protected)
  app.get("/api/bot/template/:commandName", requireBotApiKey, async (req, res) => {
    try {
      const { commandName } = req.params;
      const context = req.query.context as string | undefined;

      const mapping = await storage.getCommandTemplateMapping(commandName, context);
      if (!mapping) {
        return res.status(404).json({ message: "Mapping not found" });
      }

      // Also fetch the template data
      const template = await storage.getEmbedTemplate(mapping.templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json({
        mapping,
        template_data: typeof template.templateData === "string" ? JSON.parse(template.templateData) : template.templateData,
      });
    } catch (err) {
      console.error("Error fetching command template mapping:", err);
      res.status(500).json({ message: "Failed to fetch command template mapping" });
    }
  });

  // Create command template mapping
  app.post("/api/command-template-mappings", requireAdmin, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { commandName, templateId, context } = req.body;

      if (!commandName || !templateId) {
        return res.status(400).json({ message: "commandName and templateId are required" });
      }

      const mapping = await storage.createCommandTemplateMapping({
        commandName,
        templateId,
        context: context || "default",
        createdBy: user.discordId,
      });

      res.status(201).json(mapping);
    } catch (err) {
      console.error("Error creating command template mapping:", err);
      res.status(500).json({ message: "Failed to create command template mapping" });
    }
  });

  // Update command template mapping
  app.put("/api/command-template-mappings/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }

      const { commandName, templateId, context } = req.body;

      const updateData: any = {};
      if (commandName !== undefined) updateData.commandName = commandName;
      if (templateId !== undefined) updateData.templateId = templateId;
      if (context !== undefined) updateData.context = context;

      const mapping = await storage.updateCommandTemplateMapping(id, updateData);
      res.json(mapping);
    } catch (err) {
      console.error("Error updating command template mapping:", err);
      res.status(500).json({ message: "Failed to update command template mapping" });
    }
  });

  // Delete command template mapping
  app.delete("/api/command-template-mappings/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }

      const deleted = await storage.deleteCommandTemplateMapping(id);
      if (!deleted) {
        return res.status(404).json({ message: "Mapping not found" });
      }

      res.json({ message: "Mapping deleted successfully", id });
    } catch (err) {
      console.error("Error deleting command template mapping:", err);
      res.status(500).json({ message: "Failed to delete command template mapping" });
    }
  });

  // ============================================
  // STARBOARD CONFIGURATION ROUTES (Admin only)
  // ============================================

  const GUILD_ID = process.env.DISCORD_GUILD_ID;

  // Get starboard config for the configured guild
  app.get("/api/starboard", requireAdmin, async (req, res) => {
    try {
      if (!GUILD_ID) {
        return res.status(500).json({ message: "Guild ID not configured" });
      }
      const config = await storage.getStarboardConfig(GUILD_ID);
      if (!config) {
        return res.status(404).json({ message: "Starboard configuration not found" });
      }
      res.json(config);
    } catch (err) {
      console.error("Error fetching starboard config:", err);
      res.status(500).json({ message: "Failed to fetch starboard configuration" });
    }
  });

  // Create or update starboard configuration
  app.post("/api/starboard", requireAdmin, async (req, res) => {
    try {
      if (!GUILD_ID) {
        return res.status(500).json({ message: "Guild ID not configured" });
      }

      const user = req.user as Express.User;
      const { monitoredChannelId, emoji, threshold, starboardChannelId } = req.body;

      // Check if config already exists
      const existing = await storage.getStarboardConfig(GUILD_ID);

      let config;
      if (existing) {
        // Update existing
        config = await storage.updateStarboardConfig(GUILD_ID, {
          monitoredChannelId,
          emoji,
          threshold,
          starboardChannelId,
          createdBy: user.discordId,
        });
      } else {
        // Create new
        config = await storage.createStarboardConfig({
          guildId: GUILD_ID,
          monitoredChannelId,
          emoji,
          threshold,
          starboardChannelId,
          createdBy: user.discordId,
        });
      }

      res.json(config);
    } catch (err) {
      console.error("Error saving starboard config:", err);
      res.status(500).json({ message: "Failed to save starboard configuration" });
    }
  });

  // Delete starboard configuration
  app.delete("/api/starboard", requireAdmin, async (req, res) => {
    try {
      if (!GUILD_ID) {
        return res.status(500).json({ message: "Guild ID not configured" });
      }
      const success = await storage.deleteStarboardConfig(GUILD_ID);
      if (!success) {
        return res.status(404).json({ message: "Starboard configuration not found" });
      }
      res.json({ message: "Starboard configuration deleted" });
    } catch (err) {
      console.error("Error deleting starboard config:", err);
      res.status(500).json({ message: "Failed to delete starboard configuration" });
    }
  });

  // ============================================
  // AUTOREACT CONFIGURATION ROUTES (Admin only)
  // ============================================

  // Get autoreact config for the configured guild
  app.get("/api/autoreact", requireAdmin, async (req, res) => {
    try {
      if (!GUILD_ID) {
        return res.status(500).json({ message: "Guild ID not configured" });
      }
      const config = await storage.getAutoreactConfig(GUILD_ID);
      if (!config) {
        return res.status(404).json({ message: "AutoReact configuration not found" });
      }
      res.json(config);
    } catch (err) {
      console.error("Error fetching autoreact config:", err);
      res.status(500).json({ message: "Failed to fetch autoreact configuration" });
    }
  });

  // Create or update autoreact configuration
  app.post("/api/autoreact", requireAdmin, async (req, res) => {
    try {
      if (!GUILD_ID) {
        return res.status(500).json({ message: "Guild ID not configured" });
      }

      const user = req.user as Express.User;
      const { channelId, type, emojis } = req.body;

      // Check if config already exists
      const existing = await storage.getAutoreactConfig(GUILD_ID);

      let config;
      if (existing) {
        // Update existing
        config = await storage.updateAutoreactConfig(GUILD_ID, {
          channelId,
          type,
          emojis,
          createdBy: user.discordId,
        });
      } else {
        // Create new
        config = await storage.createAutoreactConfig({
          guildId: GUILD_ID,
          channelId,
          type,
          emojis,
          createdBy: user.discordId,
        });
      }

      res.json(config);
    } catch (err) {
      console.error("Error saving autoreact config:", err);
      res.status(500).json({ message: "Failed to save autoreact configuration" });
    }
  });

  // Delete autoreact configuration
  app.delete("/api/autoreact", requireAdmin, async (req, res) => {
    try {
      if (!GUILD_ID) {
        return res.status(500).json({ message: "Guild ID not configured" });
      }
      const success = await storage.deleteAutoreactConfig(GUILD_ID);
      if (!success) {
        return res.status(404).json({ message: "AutoReact configuration not found" });
      }
      res.json({ message: "AutoReact configuration deleted" });
    } catch (err) {
      console.error("Error deleting autoreact config:", err);
      res.status(500).json({ message: "Failed to delete autoreact configuration" });
    }
  });

  // ============================================
  // EMBED VARIABLES REFERENCE (Admin only)
  // ============================================

  // Get available embed variables
  app.get("/api/embed-variables", requireAdmin, async (req, res) => {
    try {
      const variables = {
        user: [
          { name: "user.name", description: "User's display name", example: "JohnDoe" },
          { name: "user.mention", description: "Mentionable user tag", example: "@JohnDoe" },
          { name: "user.id", description: "User's Discord ID", example: "123456789" },
          { name: "user.display_avatar.url", description: "URL to user's avatar", example: "https://cdn.discordapp.com/..." }
        ],
        leveling: [
          { name: "level", description: "User's current level", example: "5" },
          { name: "xp", description: "User's current XP", example: "350" },
          { name: "xp_needed", description: "XP needed for next level", example: "150" }
        ],
        timestamp: [
          { name: "timestamp", description: "Current date and time", example: "2024-01-09 14:30:00" },
          { name: "date", description: "Current date", example: "2024-01-09" },
          { name: "time", description: "Current time", example: "14:30:00" }
        ]
      };
      res.json(variables);
    } catch (err) {
      console.error("Error fetching embed variables:", err);
      res.status(500).json({ message: "Failed to fetch embed variables" });
    }
  });

  return httpServer;
}
