import { db, pool } from "./server/db";
import { users, sessions } from "@shared/schema";

async function clearAuthData() {
  console.log("Clearing all authentication data...");

  try {
    // Delete all sessions
    const sessionResult = await db.delete(sessions);
    console.log("✓ Cleared all sessions");

    // Delete all users
    const userResult = await db.delete(users);
    console.log("✓ Cleared all users");

    console.log("\nAll authentication data has been cleared!");
  } catch (error) {
    console.error("Error clearing auth data:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

clearAuthData();
