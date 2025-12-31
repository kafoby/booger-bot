import { db } from "./db";
import {
  logs, warns, lfmConnections, users, botStatus, botConfig, adminUsers, authBypassUsers,
  type InsertLog, type Log, type InsertWarn, type Warn,
  type InsertLfmConnection, type LfmConnection, type User, type InsertUser,
  type BotStatus, type BotConfig, type AdminUser, type AuthBypassUser
} from "@shared/schema";
import { eq, desc, count, sql } from "drizzle-orm";

// Default admin Discord IDs - these cannot be removed
const DEFAULT_ADMINS = ["934443300520345631", "954606816820613160", "395651363985555457"];

// Default auth bypass Discord IDs - these are always included
const DEFAULT_AUTH_BYPASS = ["934443300520345631"];

export interface LogStats {
  total: number;
  error: number;
  warning: number;
  info: number;
}

export interface CategoryStats {
  total: number;
  message: number;
  command: number;
  moderation: number;
  system: number;
}

export interface IStorage {
  getLogs(limit?: number, offset?: number, level?: string, search?: string, category?: string): Promise<Log[]>;
  getLogsCount(level?: string, search?: string, category?: string): Promise<number>;
  getLogsStats(): Promise<LogStats>;
  getCategoryStats(): Promise<CategoryStats>;
  createLog(log: InsertLog): Promise<Log>;
  getWarns(): Promise<Warn[]>;
  createWarn(warn: InsertWarn): Promise<Warn>;
  getLfmConnection(discordUserId: string): Promise<LfmConnection | undefined>;
  createOrUpdateLfmConnection(connection: InsertLfmConnection): Promise<LfmConnection>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createOrUpdateUser(user: InsertUser): Promise<User>;
  updateUserRole(discordId: string, hasRequiredRole: boolean): Promise<User | undefined>;
  // Bot status methods
  getBotStatus(): Promise<BotStatus | undefined>;
  updateBotHeartbeat(status: string, uptime?: string, errorMessage?: string): Promise<BotStatus>;
  // Bot config methods
  getBotConfig(): Promise<BotConfig>;
  updateBotConfig(config: Partial<{ prefix: string; disabledCommands: string[]; allowedChannels: string[] }>, updatedBy: string): Promise<BotConfig>;
  // Admin methods
  getAdminUsers(): Promise<AdminUser[]>;
  isAdmin(discordId: string): Promise<boolean>;
  addAdminUser(discordId: string, addedBy: string): Promise<AdminUser>;
  removeAdminUser(discordId: string): Promise<boolean>;
  getDefaultAdmins(): string[];
  // Auth bypass methods
  getAuthBypassUsers(): Promise<AuthBypassUser[]>;
  isAuthBypassed(discordId: string): Promise<boolean>;
  addAuthBypassUser(discordId: string, addedBy: string): Promise<AuthBypassUser>;
  removeAuthBypassUser(discordId: string): Promise<boolean>;
  getDefaultAuthBypass(): string[];
}

export class DatabaseStorage implements IStorage {
  async getLogs(limit: number = 100, offset: number = 0, level?: string, search?: string): Promise<Log[]> {
    const conditions = [];

    if (level) {
      conditions.push(sql`LOWER(${logs.level}) = ${level.toLowerCase()}`);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(sql`LOWER(${logs.message}) LIKE ${searchTerm}`);
    }

    let query = db.select().from(logs);

    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as typeof query;
    }

    return await query
      .orderBy(desc(logs.id))
      .limit(limit)
      .offset(offset);
  }

  async getLogsCount(level?: string, search?: string): Promise<number> {
    const conditions = [];

    if (level) {
      conditions.push(sql`LOWER(${logs.level}) = ${level.toLowerCase()}`);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(sql`LOWER(${logs.message}) LIKE ${searchTerm}`);
    }

    let query = db.select({ count: count() }).from(logs);

    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as typeof query;
    }

    const result = await query;
    return result[0]?.count || 0;
  }

  async getLogsStats(): Promise<LogStats> {
    const result = await db
      .select({
        total: count(),
        error: count(sql`CASE WHEN LOWER(${logs.level}) = 'error' THEN 1 END`),
        warning: count(sql`CASE WHEN LOWER(${logs.level}) = 'warning' THEN 1 END`),
        info: count(sql`CASE WHEN LOWER(${logs.level}) = 'info' THEN 1 END`),
      })
      .from(logs);

    return {
      total: result[0]?.total || 0,
      error: result[0]?.error || 0,
      warning: result[0]?.warning || 0,
      info: result[0]?.info || 0,
    };
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const [created] = await db.insert(logs).values(insertLog).returning();
    return created;
  }

  async getWarns(): Promise<Warn[]> {
    return await db.select().from(warns).orderBy(warns.id);
  }

  async createWarn(insertWarn: InsertWarn): Promise<Warn> {
    const [created] = await db.insert(warns).values(insertWarn).returning();
    return created;
  }

  async getLfmConnection(discordUserId: string): Promise<LfmConnection | undefined> {
    const result = await db.select().from(lfmConnections).where(eq(lfmConnections.discordUserId, discordUserId));
    return result[0];
  }

  async createOrUpdateLfmConnection(connection: InsertLfmConnection): Promise<LfmConnection> {
    const existing = await this.getLfmConnection(connection.discordUserId);
    if (existing) {
      const [updated] = await db.update(lfmConnections).set(connection).where(eq(lfmConnections.discordUserId, connection.discordUserId)).returning();
      return updated;
    }
    const [created] = await db.insert(lfmConnections).values(connection).returning();
    return created;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.discordId, discordId));
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createOrUpdateUser(user: InsertUser): Promise<User> {
    const existing = await this.getUserByDiscordId(user.discordId);
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(users.discordId, user.discordId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserRole(discordId: string, hasRequiredRole: boolean): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ hasRequiredRole, updatedAt: new Date() })
      .where(eq(users.discordId, discordId))
      .returning();
    return updated;
  }

  // Bot status methods
  async getBotStatus(): Promise<BotStatus | undefined> {
    const result = await db.select().from(botStatus).limit(1);
    return result[0];
  }

  async updateBotHeartbeat(status: string, uptime?: string, errorMessage?: string): Promise<BotStatus> {
    const existing = await this.getBotStatus();
    const now = new Date();

    if (existing) {
      const [updated] = await db
        .update(botStatus)
        .set({
          lastHeartbeat: now,
          status,
          uptime: uptime || existing.uptime,
          errorMessage: errorMessage || null,
          updatedAt: now,
        })
        .where(eq(botStatus.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(botStatus)
      .values({
        lastHeartbeat: now,
        status,
        uptime,
        startedAt: now,
        errorMessage,
      })
      .returning();
    return created;
  }

  // Bot config methods
  async getBotConfig(): Promise<BotConfig> {
    const result = await db.select().from(botConfig).limit(1);
    if (!result[0]) {
      // Create default config if none exists
      const [created] = await db
        .insert(botConfig)
        .values({
          prefix: ",",
          disabledCommands: [],
          allowedChannels: ["1452216636819112010", "971303412849332226"],
        })
        .returning();
      return created;
    }
    return result[0];
  }

  async updateBotConfig(
    config: Partial<{ prefix: string; disabledCommands: string[]; allowedChannels: string[] }>,
    updatedBy: string
  ): Promise<BotConfig> {
    const existing = await this.getBotConfig();
    const [updated] = await db
      .update(botConfig)
      .set({
        ...config,
        updatedAt: new Date(),
        updatedBy,
      })
      .where(eq(botConfig.id, existing.id))
      .returning();
    return updated;
  }

  // Admin methods
  async getAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers).orderBy(adminUsers.addedAt);
  }

  async isAdmin(discordId: string): Promise<boolean> {
    // Check default admins first
    if (DEFAULT_ADMINS.includes(discordId)) {
      return true;
    }
    // Check database
    const result = await db.select().from(adminUsers).where(eq(adminUsers.discordId, discordId));
    return result.length > 0;
  }

  async addAdminUser(discordId: string, addedBy: string): Promise<AdminUser> {
    const [created] = await db
      .insert(adminUsers)
      .values({
        discordId,
        addedBy,
      })
      .returning();
    return created;
  }

  async removeAdminUser(discordId: string): Promise<boolean> {
    // Cannot remove default admins
    if (DEFAULT_ADMINS.includes(discordId)) {
      return false;
    }
    await db.delete(adminUsers).where(eq(adminUsers.discordId, discordId));
    return true;
  }

  getDefaultAdmins(): string[] {
    return DEFAULT_ADMINS;
  }

  // Auth bypass methods
  async getAuthBypassUsers(): Promise<AuthBypassUser[]> {
    return await db.select().from(authBypassUsers).orderBy(authBypassUsers.addedAt);
  }

  async isAuthBypassed(discordId: string): Promise<boolean> {
    // Check default bypass list first
    if (DEFAULT_AUTH_BYPASS.includes(discordId)) {
      return true;
    }
    // Check database
    const result = await db.select().from(authBypassUsers).where(eq(authBypassUsers.discordId, discordId));
    return result.length > 0;
  }

  async addAuthBypassUser(discordId: string, addedBy: string): Promise<AuthBypassUser> {
    const [created] = await db
      .insert(authBypassUsers)
      .values({
        discordId,
        addedBy,
      })
      .returning();
    return created;
  }

  async removeAuthBypassUser(discordId: string): Promise<boolean> {
    // Cannot remove default bypass users
    if (DEFAULT_AUTH_BYPASS.includes(discordId)) {
      return false;
    }
    await db.delete(authBypassUsers).where(eq(authBypassUsers.discordId, discordId));
    return true;
  }

  getDefaultAuthBypass(): string[] {
    return DEFAULT_AUTH_BYPASS;
  }
}

export const storage = new DatabaseStorage();
