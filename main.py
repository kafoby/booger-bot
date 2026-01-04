import os
from config.settings import config
from core.bot import DiscordBot

def main():
    """Entry point for the Discord bot"""
    TOKEN = config.DISCORD_TOKEN

    if not TOKEN:
        print("Error: DISCORD_TOKEN not found in environment variables")
        return

    print("Starting Discord bot...")
    bot = DiscordBot()
    bot.run(TOKEN)

if __name__ == "__main__":
    main()
