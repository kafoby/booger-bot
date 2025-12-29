import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import type { Express, RequestHandler } from "express";
import type { User } from "@shared/schema";

// Extend Express types to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      discordId: string;
      username: string;
      discriminator: string | null;
      avatar: string | null;
      email: string | null;
      accessToken: string | null;
      refreshToken: string | null;
      hasRequiredRole: boolean | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}

// Environment variables for Discord OAuth
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_CALLBACK_URL = process.env.DISCORD_CALLBACK_URL || "/api/auth/discord/callback";
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID || "1452267489970094211";
const SESSION_SECRET = process.env.SESSION_SECRET || "your-session-secret-change-in-production";

// Check if Discord credentials are configured
export function isDiscordConfigured(): boolean {
  return !!(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET);
}

// Fetch user's guild member data to check roles
async function checkUserRole(accessToken: string, discordId: string): Promise<boolean> {
  console.log("=== ROLE CHECK START ===");
  console.log(`Checking role for Discord user: ${discordId}`);
  console.log(`Required Role ID: ${REQUIRED_ROLE_ID}`);
  console.log(`Guild ID: ${DISCORD_GUILD_ID}`);

  if (!DISCORD_GUILD_ID) {
    console.error("❌ DISCORD_GUILD_ID not set, skipping role check");
    return false;
  }

  try {
    // First, get the user's guilds to verify they're in the target guild
    console.log("Fetching user's guilds from Discord API...");
    const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!guildsResponse.ok) {
      console.error(`❌ Failed to fetch user guilds. Status: ${guildsResponse.status}`);
      const errorText = await guildsResponse.text();
      console.error(`Response: ${errorText}`);
      return false;
    }

    const guilds = await guildsResponse.json();
    console.log(`✓ User is in ${guilds.length} guilds`);
    console.log("Guild IDs:", guilds.map((g: any) => `${g.name} (${g.id})`).join(", "));

    const isInGuild = guilds.some((guild: { id: string }) => guild.id === DISCORD_GUILD_ID);

    if (!isInGuild) {
      console.error(`❌ User ${discordId} is NOT in the required guild ${DISCORD_GUILD_ID}`);
      return false;
    }

    console.log(`✓ User IS in the required guild`);

    // Use the bot token to fetch member data (OAuth tokens can't access guild member endpoints directly)
    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken) {
      console.error("❌ DISCORD_TOKEN (bot token) not available, cannot verify roles");
      return false;
    }

    console.log(`Fetching member data from guild using bot token...`);
    const memberResponse = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!memberResponse.ok) {
      console.error(`❌ Failed to fetch member data. Status: ${memberResponse.status}`);
      const errorText = await memberResponse.text();
      console.error(`Response: ${errorText}`);
      return false;
    }

    const memberData = await memberResponse.json();
    console.log(`✓ Member data retrieved. Username: ${memberData.user?.username}`);
    console.log(`Member roles (${memberData.roles?.length || 0}):`, memberData.roles);

    const hasRole = memberData.roles?.includes(REQUIRED_ROLE_ID) || false;

    console.log(`Role check result: ${hasRole ? "✓ HAS REQUIRED ROLE" : "❌ MISSING REQUIRED ROLE"}`);
    console.log("=== ROLE CHECK END ===\n");

    return hasRole;
  } catch (error) {
    console.error("❌ Exception during role check:", error);
    console.log("=== ROLE CHECK END (ERROR) ===\n");
    return false;
  }
}

export function setupAuth(app: Express): void {
  console.log("\n=== AUTH SETUP ===");
  console.log("Environment Configuration:");
  console.log(`- DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID ? "✓ Set" : "❌ Missing"}`);
  console.log(`- DISCORD_CLIENT_SECRET: ${DISCORD_CLIENT_SECRET ? "✓ Set" : "❌ Missing"}`);
  console.log(`- DISCORD_GUILD_ID: ${DISCORD_GUILD_ID || "❌ Missing"}`);
  console.log(`- DISCORD_TOKEN (bot): ${process.env.DISCORD_TOKEN ? "✓ Set" : "❌ Missing"}`);
  console.log(`- REQUIRED_ROLE_ID: ${REQUIRED_ROLE_ID}`);
  console.log(`- SESSION_SECRET: ${SESSION_SECRET ? "✓ Set" : "❌ Using default (insecure)"}`);
  console.log(`- DISCORD_CALLBACK_URL: ${DISCORD_CALLBACK_URL}`);

  if (!isDiscordConfigured()) {
    console.error("❌ Discord OAuth not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.");
    console.log("=== AUTH SETUP END (NOT CONFIGURED) ===\n");
    return;
  }

  // Session store using PostgreSQL
  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Discord OAuth2 Strategy
  passport.use(
    new DiscordStrategy(
      {
        clientID: DISCORD_CLIENT_ID!,
        clientSecret: DISCORD_CLIENT_SECRET!,
        callbackURL: DISCORD_CALLBACK_URL,
        scope: ["identify", "email", "guilds"],
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log("\n=== DISCORD OAUTH CALLBACK ===");
        console.log(`User authenticated: ${profile.username} (${profile.id})`);
        console.log(`Email: ${profile.email || "not provided"}`);

        try {
          // Check if user has the required role
          const hasRequiredRole = await checkUserRole(accessToken, profile.id);

          console.log(`Creating/updating user in database with hasRequiredRole=${hasRequiredRole}`);

          // Create or update user in database
          const user = await storage.createOrUpdateUser({
            discordId: profile.id,
            username: profile.username,
            discriminator: profile.discriminator || null,
            avatar: profile.avatar || null,
            email: profile.email || null,
            accessToken,
            refreshToken,
            hasRequiredRole,
          });

          console.log(`✓ User saved to database. ID: ${user.id}, hasRequiredRole: ${user.hasRequiredRole}`);
          console.log("=== DISCORD OAUTH CALLBACK END ===\n");

          return done(null, user);
        } catch (error) {
          console.error("❌ Error in Discord strategy:", error);
          console.log("=== DISCORD OAUTH CALLBACK END (ERROR) ===\n");
          return done(error as Error);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        console.warn(`Session deserialization: User ID ${id} not found in database`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Session deserialization error:", error);
      done(error);
    }
  });

  console.log("✓ Discord OAuth configured successfully");
  console.log("=== AUTH SETUP END ===\n");
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log(`Auth check failed: User not authenticated. Path: ${req.path}`);
  res.status(401).json({ message: "Unauthorized - Please log in" });
};

// Middleware to check if user has the required role
export const hasRequiredRole: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    console.log(`Role check failed: User not authenticated. Path: ${req.path}`);
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }

  const user = req.user as Express.User;
  if (!user.hasRequiredRole) {
    console.log(`Role check failed: User ${user.username} (${user.discordId}) missing required role. Path: ${req.path}`);
    return res.status(403).json({
      message: "Forbidden - You don't have the required Discord role to access this resource",
      roleRequired: REQUIRED_ROLE_ID,
    });
  }

  return next();
};

// Combined middleware for protected routes
export const requireAuth: RequestHandler = (req, res, next) => {
  const path = req.path;

  if (!req.isAuthenticated()) {
    console.log(`[requireAuth] ❌ Not authenticated. Path: ${path}`);
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }

  const user = req.user as Express.User;
  console.log(`[requireAuth] User ${user.username} (${user.discordId}) accessing ${path}. hasRequiredRole: ${user.hasRequiredRole}`);

  if (!user.hasRequiredRole) {
    console.log(`[requireAuth] ❌ Access denied - missing required role. Path: ${path}`);
    return res.status(403).json({
      message: "Forbidden - You don't have the required Discord role",
    });
  }

  console.log(`[requireAuth] ✓ Access granted. Path: ${path}`);
  return next();
};
