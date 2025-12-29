#!/usr/bin/env node

// Simple diagnostic script to check Discord auth configuration
// Run with: node check-auth-config.js

console.log("\n=== Discord Auth Configuration Check ===\n");

const checks = [
  { name: "DISCORD_CLIENT_ID", env: process.env.DISCORD_CLIENT_ID },
  { name: "DISCORD_CLIENT_SECRET", env: process.env.DISCORD_CLIENT_SECRET },
  { name: "DISCORD_GUILD_ID", env: process.env.DISCORD_GUILD_ID },
  { name: "DISCORD_TOKEN (bot)", env: process.env.DISCORD_TOKEN },
  { name: "REQUIRED_ROLE_ID", env: process.env.REQUIRED_ROLE_ID || "1452267489970094211" },
  { name: "SESSION_SECRET", env: process.env.SESSION_SECRET },
  { name: "DISCORD_CALLBACK_URL", env: process.env.DISCORD_CALLBACK_URL },
  { name: "DATABASE_URL", env: process.env.DATABASE_URL },
];

let allGood = true;

checks.forEach(({ name, env }) => {
  const status = env ? "✓" : "❌";
  const color = env ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";

  let display = env ? "Set" : "MISSING";

  // Show partial value for debugging (but not full secrets)
  if (env && name.includes("SECRET") || name.includes("TOKEN")) {
    display = `Set (${env.substring(0, 8)}...)`;
  } else if (env && name.includes("URL")) {
    display = env;
  } else if (env && name.includes("ID")) {
    display = env;
  }

  console.log(`${color}${status}${reset} ${name.padEnd(25)} ${display}`);

  if (!env && !name.includes("CALLBACK_URL")) {
    allGood = false;
  }
});

console.log("\n" + "=".repeat(50));

if (allGood) {
  console.log("\x1b[32m✓ All required configuration is set!\x1b[0m");
  console.log("\nNext steps:");
  console.log("1. Make sure these match your Discord Developer Portal settings");
  console.log("2. Verify DISCORD_GUILD_ID is your actual Discord server ID");
  console.log("3. Verify REQUIRED_ROLE_ID is the correct role ID (currently: " + (process.env.REQUIRED_ROLE_ID || "1452267489970094211") + ")");
} else {
  console.log("\x1b[31m❌ Some configuration is missing!\x1b[0m");
  console.log("\nPlease add the missing secrets in Replit:");
  console.log("Tools > Secrets (or click the lock icon)");
}

console.log("\n=== End Configuration Check ===\n");
