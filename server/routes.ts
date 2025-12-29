import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, requireAuth, isAuthenticated, isDiscordConfigured } from "./auth";
import { api } from "@shared/routes";
import { insertWarnSchema, insertLfmSchema } from "@shared/schema";
import { z } from "zod";

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

    const [logs, stats, filteredCount] = await Promise.all([
      storage.getLogs(limit, offset, level, search),
      storage.getLogsStats(),
      storage.getLogsCount(level, search)
    ]);

    res.json({
      logs,
      stats,
      limit,
      offset,
      total: filteredCount,
      hasMore: offset + logs.length < filteredCount
    });
  });

  // Logs route is used by the Discord bot, so we don't protect it
  // The bot sends requests from the same machine
  app.post(api.logs.create.path, async (req, res) => {
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

  app.get("/api/warns", requireAuth, async (req, res) => {
    const warns = await storage.getWarns();
    res.json(warns);
  });

  // Warns route is used by the Discord bot, so we don't protect it
  // The bot sends requests from the same machine
  app.post("/api/warns", async (req, res) => {
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

  // LFM routes are used by the Discord bot, so we don't protect them
  // The bot sends requests from the same machine
  app.get("/api/lfm/:discordUserId", async (req, res) => {
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

  app.post("/api/lfm", async (req, res) => {
    try {
      const input = insertLfmSchema.parse(req.body);
      const connection = await storage.createOrUpdateLfmConnection(input);
      res.status(201).json(connection);
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
  // BOT STATUS ROUTES
  // ============================================

  // Bot heartbeat endpoint (bot-facing, no auth required)
  app.post("/api/bot/heartbeat", async (req, res) => {
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

  // Get bot config (for bot - no auth, from localhost)
  app.get("/api/bot/config", async (req, res) => {
    try {
      const config = await storage.getBotConfig();
      res.json(config);
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

  return httpServer;
}
