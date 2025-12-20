import { db } from "./db";
import { logs, warns, type InsertLog, type Log, type InsertWarn, type Warn } from "@shared/schema";

export interface IStorage {
  getLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  getWarns(): Promise<Warn[]>;
  createWarn(warn: InsertWarn): Promise<Warn>;
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
}

export const storage = new DatabaseStorage();
