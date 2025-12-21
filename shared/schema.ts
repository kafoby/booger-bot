import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  level: text("level").notNull().default("info"),
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

export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });
export const insertWarnSchema = createInsertSchema(warns).omit({ id: true, timestamp: true });
export const insertLfmSchema = createInsertSchema(lfmConnections).omit({ id: true, timestamp: true });

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Warn = typeof warns.$inferSelect;
export type InsertWarn = z.infer<typeof insertWarnSchema>;
export type LfmConnection = typeof lfmConnections.$inferSelect;
export type InsertLfmConnection = z.infer<typeof insertLfmSchema>;
