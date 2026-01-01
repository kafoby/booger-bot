import { db } from "./db";
import {
  logs, warns, lfmConnections, users, botStatus, botConfig, adminUsers, authBypassUsers, searchPresets,
  type InsertLog, type Log, type InsertWarn, type Warn,
  type InsertLfmConnection, type LfmConnection, type User, type InsertUser,
  type BotStatus, type BotConfig, type AdminUser, type AuthBypassUser,
  type SearchPreset, type InsertSearchPreset
} from "@shared/schema";
import { eq, desc, count, sql, and, gte, lte } from "drizzle-orm";

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
  output: number;
  moderation: number;
  system: number;
}

export interface PerformanceMetrics {
  commandsPerHour: { hour: string; count: number }[];
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  errorRate: { total: number; errors: number; percentage: number };
  recentActivity: { timestamp: string; count: number }[];
  topCommands: { command: string; count: number }[];
}

export interface UserActivity {
  topUsers: { username: string; count: number; percentage: number }[];
  userTimeline: { date: string; count: number }[];
  commandsByUser: { username: string; commands: number; messages: number }[];
  activityByCategory: { username: string; category: string; count: number }[];
}

export interface AdvancedLogFilters {
  level?: string;
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface IStorage {
  getLogs(limit?: number, offset?: number, level?: string, search?: string, category?: string, startDate?: string, endDate?: string, userId?: string): Promise<Log[]>;
  getLogsCount(level?: string, search?: string, category?: string, startDate?: string, endDate?: string, userId?: string): Promise<number>;
  getLogsStats(): Promise<LogStats>;
  getCategoryStats(): Promise<CategoryStats>;
  createLog(log: InsertLog): Promise<Log>;
  deleteLogs(category?: string): Promise<number>;
  deleteLog(id: number): Promise<boolean>;
  bulkDeleteLogs(ids: number[]): Promise<number>;
  // Search presets
  getSearchPresets(userId: string): Promise<SearchPreset[]>;
  getSearchPreset(id: number, userId: string): Promise<SearchPreset | undefined>;
  createSearchPreset(preset: InsertSearchPreset): Promise<SearchPreset>;
  deleteSearchPreset(id: number, userId: string): Promise<boolean>;
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
  // Performance and analytics methods
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
  getUserActivity(): Promise<UserActivity>;
}

export class DatabaseStorage implements IStorage {
  async getLogs(limit: number = 100, offset: number = 0, level?: string, search?: string, category?: string, startDate?: string, endDate?: string, userId?: string): Promise<Log[]> {
    const conditions = [];

    if (level) {
      conditions.push(sql`LOWER(${logs.level}) = ${level.toLowerCase()}`);
    }

    if (category) {
      conditions.push(sql`LOWER(${logs.category}) = ${category.toLowerCase()}`);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(sql`LOWER(${logs.message}) LIKE ${searchTerm}`);
    }

    if (startDate) {
      console.log('Adding startDate condition:', startDate);
      conditions.push(sql`${logs.timestamp} >= ${startDate}::timestamp`);
    }

    if (endDate) {
      console.log('Adding endDate condition:', endDate);
      conditions.push(sql`${logs.timestamp} <= ${endDate}::timestamp`);
    }

    if (userId && userId.trim()) {
      const userPattern = `%${userId}%`;
      conditions.push(sql`LOWER(${logs.message}) LIKE ${userPattern.toLowerCase()}`);
    }

    let query = db.select().from(logs);

    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as typeof query;
    }

    const results = await query
      .orderBy(desc(logs.id))
      .limit(limit)
      .offset(offset);

    if (startDate || endDate) {
      console.log(`Query returned ${results.length} logs with date filters`);
    }

    return results;
  }

  async getLogsCount(level?: string, search?: string, category?: string, startDate?: string, endDate?: string, userId?: string): Promise<number> {
    const conditions = [];

    if (level) {
      conditions.push(sql`LOWER(${logs.level}) = ${level.toLowerCase()}`);
    }

    if (category) {
      conditions.push(sql`LOWER(${logs.category}) = ${category.toLowerCase()}`);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(sql`LOWER(${logs.message}) LIKE ${searchTerm}`);
    }

    if (startDate) {
      conditions.push(sql`${logs.timestamp} >= ${startDate}::timestamp`);
    }

    if (endDate) {
      conditions.push(sql`${logs.timestamp} <= ${endDate}::timestamp`);
    }

    if (userId && userId.trim()) {
      const userPattern = `%${userId}%`;
      conditions.push(sql`LOWER(${logs.message}) LIKE ${userPattern.toLowerCase()}`);
    }

    let query = db.select({ count: count() }).from(logs);

    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as typeof query;
    }

    const result = await query;
    return result[0]?.count || 0;
  }

  async getCategoryStats(): Promise<CategoryStats> {
    const result = await db
      .select({
        total: count(),
        message: count(sql`CASE WHEN LOWER(${logs.category}) = 'message' THEN 1 END`),
        command: count(sql`CASE WHEN LOWER(${logs.category}) = 'command' THEN 1 END`),
        output: count(sql`CASE WHEN LOWER(${logs.category}) = 'output' THEN 1 END`),
        moderation: count(sql`CASE WHEN LOWER(${logs.category}) = 'moderation' THEN 1 END`),
        system: count(sql`CASE WHEN LOWER(${logs.category}) = 'system' THEN 1 END`),
      })
      .from(logs);

    return {
      total: result[0]?.total || 0,
      message: result[0]?.message || 0,
      command: result[0]?.command || 0,
      output: result[0]?.output || 0,
      moderation: result[0]?.moderation || 0,
      system: result[0]?.system || 0,
    };
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

  async deleteLogs(category?: string): Promise<number> {
    let deleteQuery = db.delete(logs);

    if (category) {
      deleteQuery = deleteQuery.where(sql`LOWER(${logs.category}) = ${category.toLowerCase()}`) as typeof deleteQuery;
    }

    const result = await deleteQuery.returning({ id: logs.id });
    return result.length;
  }

  async deleteLog(id: number): Promise<boolean> {
    const result = await db.delete(logs).where(eq(logs.id, id)).returning({ id: logs.id });
    return result.length > 0;
  }

  async bulkDeleteLogs(ids: number[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const result = await db.delete(logs).where(sql`${logs.id} = ANY(${ids})`).returning({ id: logs.id });
    return result.length;
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

  // Performance and analytics methods
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Get commands per hour for the last 24 hours
    const commandsPerHour = await db
      .select({
        hour: sql<string>`to_char(${logs.timestamp}, 'YYYY-MM-DD HH24:00')`,
        count: count(),
      })
      .from(logs)
      .where(sql`${logs.timestamp} >= NOW() - INTERVAL '24 hours' AND LOWER(${logs.category}) = 'command'`)
      .groupBy(sql`to_char(${logs.timestamp}, 'YYYY-MM-DD HH24:00')`)
      .orderBy(sql`to_char(${logs.timestamp}, 'YYYY-MM-DD HH24:00')`);

    // Get category breakdown
    const categoryStats = await this.getCategoryStats();
    const categoryBreakdown = [
      { category: 'Messages', count: categoryStats.message, percentage: categoryStats.total > 0 ? (categoryStats.message / categoryStats.total) * 100 : 0 },
      { category: 'Commands', count: categoryStats.command, percentage: categoryStats.total > 0 ? (categoryStats.command / categoryStats.total) * 100 : 0 },
      { category: 'Outputs', count: categoryStats.output, percentage: categoryStats.total > 0 ? (categoryStats.output / categoryStats.total) * 100 : 0 },
      { category: 'Moderation', count: categoryStats.moderation, percentage: categoryStats.total > 0 ? (categoryStats.moderation / categoryStats.total) * 100 : 0 },
      { category: 'System', count: categoryStats.system, percentage: categoryStats.total > 0 ? (categoryStats.system / categoryStats.total) * 100 : 0 },
    ].filter(c => c.count > 0);

    // Get error rate
    const logStats = await this.getLogsStats();
    const errorRate = {
      total: logStats.total,
      errors: logStats.error,
      percentage: logStats.total > 0 ? (logStats.error / logStats.total) * 100 : 0,
    };

    // Get recent activity (group by minute for last 2 hours)
    const recentActivity = await db
      .select({
        timestamp: sql<string>`to_char(${logs.timestamp}, 'YYYY-MM-DD HH24:MI')`,
        count: count(),
      })
      .from(logs)
      .where(sql`${logs.timestamp} >= NOW() - INTERVAL '2 hours'`)
      .groupBy(sql`to_char(${logs.timestamp}, 'YYYY-MM-DD HH24:MI')`)
      .orderBy(sql`to_char(${logs.timestamp}, 'YYYY-MM-DD HH24:MI')`);

    // Get top commands by extracting command names from log messages
    const commandLogs = await db
      .select({ message: logs.message })
      .from(logs)
      .where(sql`LOWER(${logs.category}) = 'command'`)
      .limit(1000);

    const commandCounts = new Map<string, number>();
    for (const log of commandLogs) {
      // Extract command from messages like "user used ,command" or "/command"
      const match = log.message.match(/used\s+([,/]\w+)|used\s+(\w+)\s+command/i);
      if (match) {
        const command = match[1] || match[2];
        commandCounts.set(command, (commandCounts.get(command) || 0) + 1);
      }
    }

    const topCommands = Array.from(commandCounts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      commandsPerHour,
      categoryBreakdown,
      errorRate,
      recentActivity,
      topCommands,
    };
  }

  async getUserActivity(): Promise<UserActivity> {
    // Extract usernames from log messages
    const allLogs = await db
      .select({ message: logs.message, category: logs.category, timestamp: logs.timestamp })
      .from(logs)
      .orderBy(desc(logs.id))
      .limit(5000);

    const userStats = new Map<string, { messages: number; commands: number; byCategory: Map<string, number> }>();

    for (const log of allLogs) {
      // Extract username from messages like "user did something" or "Received message from user:"
      const patterns = [
        /^(\w+)\s+(?:used|warned|timed out|set|viewed|enabled|disabled)/i,
        /from\s+(\w+(?:#\d+)?)/i,
        /by\s+(\w+(?:#\d+)?)/i,
      ];

      for (const pattern of patterns) {
        const match = log.message.match(pattern);
        if (match) {
          const username = match[1].replace(/#\d+$/, ''); // Remove discriminator if present
          if (!userStats.has(username)) {
            userStats.set(username, { messages: 0, commands: 0, byCategory: new Map() });
          }
          const stats = userStats.get(username)!;

          if (log.category.toLowerCase() === 'command') {
            stats.commands++;
          } else if (log.category.toLowerCase() === 'message') {
            stats.messages++;
          }

          stats.byCategory.set(log.category, (stats.byCategory.get(log.category) || 0) + 1);
          break;
        }
      }
    }

    // Calculate top users
    const totalActions = Array.from(userStats.values()).reduce((sum, s) => sum + s.messages + s.commands, 0);
    const topUsers = Array.from(userStats.entries())
      .map(([username, stats]) => ({
        username,
        count: stats.messages + stats.commands,
        percentage: totalActions > 0 ? ((stats.messages + stats.commands) / totalActions) * 100 : 0,
      }))
      .filter(u => u.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get user timeline (activity per day for last 7 days)
    const userTimeline = await db
      .select({
        date: sql<string>`to_char(${logs.timestamp}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(logs)
      .where(sql`${logs.timestamp} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`to_char(${logs.timestamp}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${logs.timestamp}, 'YYYY-MM-DD')`);

    // Commands by user
    const commandsByUser = Array.from(userStats.entries())
      .map(([username, stats]) => ({
        username,
        commands: stats.commands,
        messages: stats.messages,
      }))
      .filter(u => u.commands + u.messages > 0)
      .sort((a, b) => (b.commands + b.messages) - (a.commands + a.messages))
      .slice(0, 15);

    // Activity by category for top users
    const activityByCategory: { username: string; category: string; count: number }[] = [];
    for (const [username, stats] of Array.from(userStats.entries()).slice(0, 10)) {
      for (const [category, count] of stats.byCategory.entries()) {
        activityByCategory.push({ username, category, count });
      }
    }

    return {
      topUsers,
      userTimeline,
      commandsByUser,
      activityByCategory,
    };
  }

  // Search preset methods
  async getSearchPresets(userId: string): Promise<SearchPreset[]> {
    return await db
      .select()
      .from(searchPresets)
      .where(eq(searchPresets.userId, userId))
      .orderBy(desc(searchPresets.updatedAt));
  }

  async getSearchPreset(id: number, userId: string): Promise<SearchPreset | undefined> {
    const result = await db
      .select()
      .from(searchPresets)
      .where(and(eq(searchPresets.id, id), eq(searchPresets.userId, userId)));
    return result[0];
  }

  async createSearchPreset(preset: InsertSearchPreset): Promise<SearchPreset> {
    const [created] = await db
      .insert(searchPresets)
      .values(preset)
      .returning();
    return created;
  }

  async deleteSearchPreset(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(searchPresets)
      .where(and(eq(searchPresets.id, id), eq(searchPresets.userId, userId)))
      .returning({ id: searchPresets.id });
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
