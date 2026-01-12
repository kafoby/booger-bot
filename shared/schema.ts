import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for Discord OAuth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  discriminator: text("discriminator"),
  avatar: text("avatar"),
  email: text("email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  hasRequiredRole: boolean("has_required_role").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for express-session with connect-pg-simple
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  level: text("level").notNull().default("info"),
  category: text("category").notNull().default("system"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const warns = pgTable("warns", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  reason: text("reason").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const lfmConnections = pgTable("lfm_connections", {
  id: serial("id").primaryKey(),
  discordUserId: text("discord_user_id").notNull().unique(),
  lastfmUsername: text("lastfm_username").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Bot status for heartbeat tracking
export const botStatus = pgTable("bot_status", {
  id: serial("id").primaryKey(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
  status: text("status").notNull().default("offline"),
  uptime: text("uptime"),
  startedAt: timestamp("started_at"),
  errorMessage: text("error_message"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bot configuration
export const botConfig = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  prefix: text("prefix").notNull().default(","),
  disabledCommands: text("disabled_commands").array().default([]),
  allowedChannels: text("allowed_channels").array().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

// Admin users (beyond hardcoded defaults)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  addedAt: timestamp("added_at").defaultNow(),
  addedBy: text("added_by"),
});

// Auth bypass users (users who can bypass role check)
export const authBypassUsers = pgTable("auth_bypass_users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  addedAt: timestamp("added_at").defaultNow(),
  addedBy: text("added_by"),
});

// Search presets for saving advanced search filters
export const searchPresets = pgTable("search_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").notNull(), // Discord ID of the user who created it
  filters: text("filters").notNull(), // JSON stringified filters object
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });
export const insertWarnSchema = createInsertSchema(warns).omit({ id: true, timestamp: true });
export const insertLfmSchema = createInsertSchema(lfmConnections).omit({ id: true, timestamp: true });
export const insertBotStatusSchema = createInsertSchema(botStatus).omit({ id: true, updatedAt: true });
export const insertBotConfigSchema = createInsertSchema(botConfig).omit({ id: true, updatedAt: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, addedAt: true });
export const insertAuthBypassUserSchema = createInsertSchema(authBypassUsers).omit({ id: true, addedAt: true });
export const insertSearchPresetSchema = createInsertSchema(searchPresets).omit({ id: true, createdAt: true, updatedAt: true });

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Warn = typeof warns.$inferSelect;
export type InsertWarn = z.infer<typeof insertWarnSchema>;
export type LfmConnection = typeof lfmConnections.$inferSelect;
export type InsertLfmConnection = z.infer<typeof insertLfmSchema>;
export type BotStatus = typeof botStatus.$inferSelect;
export type InsertBotStatus = z.infer<typeof insertBotStatusSchema>;
export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AuthBypassUser = typeof authBypassUsers.$inferSelect;
export type InsertAuthBypassUser = z.infer<typeof insertAuthBypassUserSchema>;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SearchPreset = typeof searchPresets.$inferSelect;
export type InsertSearchPreset = z.infer<typeof insertSearchPresetSchema>;

// Embed templates for GUI embed builder
export const embedTemplates = pgTable("embed_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  category: text("category"),
  templateData: text("template_data").notNull(), // JSON stringified embed configuration
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Command to template mappings
export const commandTemplateMappings = pgTable("command_template_mappings", {
  id: serial("id").primaryKey(),
  commandName: text("command_name").notNull().unique(),
  templateId: serial("template_id").references(() => embedTemplates.id),
  context: text("context"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmbedTemplateSchema = createInsertSchema(embedTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommandTemplateMappingSchema = createInsertSchema(commandTemplateMappings).omit({ id: true, createdAt: true, updatedAt: true });

export type EmbedTemplate = typeof embedTemplates.$inferSelect;
export type InsertEmbedTemplate = z.infer<typeof insertEmbedTemplateSchema>;
export type CommandTemplateMapping = typeof commandTemplateMappings.$inferSelect;
export type InsertCommandTemplateMapping = z.infer<typeof insertCommandTemplateMappingSchema>;

// Starboard configuration (per-guild)
export const starboardConfig = pgTable("starboard_config", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  monitoredChannelId: text("monitored_channel_id").notNull(),
  emoji: text("emoji").notNull(),
  threshold: integer("threshold").notNull().default(5),
  starboardChannelId: text("starboard_channel_id").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AutoReact configuration (per-guild)
export const autoreactConfig = pgTable("autoreact_config", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  channelId: text("channel_id").notNull(),
  type: text("type").notNull().default("all"), // "all", "embed", or "file"
  emojis: text("emojis").array().notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStarboardConfigSchema = createInsertSchema(starboardConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAutoreactConfigSchema = createInsertSchema(autoreactConfig).omit({ id: true, createdAt: true, updatedAt: true });

export type StarboardConfig = typeof starboardConfig.$inferSelect;
export type InsertStarboardConfig = z.infer<typeof insertStarboardConfigSchema>;
export type AutoreactConfig = typeof autoreactConfig.$inferSelect;
export type InsertAutoreactConfig = z.infer<typeof insertAutoreactConfigSchema>;
