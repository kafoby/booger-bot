import { db } from "./db";
import { logs, type InsertLog, type Log } from "@shared/schema";

export interface IStorage {
  getLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
}

export class DatabaseStorage implements IStorage {
  async getLogs(): Promise<Log[]> {
    return await db.select().from(logs).orderBy(logs.id);
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const [created] = await db.insert(logs).values(insertLog).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
