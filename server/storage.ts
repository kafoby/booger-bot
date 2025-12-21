import { db } from "./db";
import { logs, warns, lfmConnections, type InsertLog, type Log, type InsertWarn, type Warn, type InsertLfmConnection, type LfmConnection } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  getWarns(): Promise<Warn[]>;
  createWarn(warn: InsertWarn): Promise<Warn>;
  getLfmConnection(discordUserId: string): Promise<LfmConnection | undefined>;
  createOrUpdateLfmConnection(connection: InsertLfmConnection): Promise<LfmConnection>;
}

export class DatabaseStorage implements IStorage {
  async getLogs(): Promise<Log[]> {
    return await db.select().from(logs).orderBy(logs.id);
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
}

export const storage = new DatabaseStorage();
