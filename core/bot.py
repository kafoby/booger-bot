import discord
from discord.ext import commands
import os
from config.settings import config
from utils.logging import BotLogger

class DiscordBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.messages = True
        intents.guilds = True
        intents.members = True
        intents.voice_states = True
        
        super().__init__(
            command_prefix=self._get_prefix,
            intents=intents,
            help_command=None
        )

    def _get_prefix(self, bot, message):
        return config.prefix

    async def setup_hook(self):
        # Load core events
        await self.load_extension('core.events')

        # Load cogs
        await self.load_extension('cogs.media')
        await self.load_extension('cogs.images')
        await self.load_extension('cogs.utility')
        await self.load_extension('cogs.search')
        await self.load_extension('cogs.fun')
        await self.load_extension('cogs.auto_responses')
        await self.load_extension('cogs.ai')
        await self.load_extension('cogs.memes')
        await self.load_extension('cogs.admin')
        await self.load_extension('cogs.music')
        await self.load_extension('cogs.voice')
        await self.load_extension('cogs.levels')
        await self.load_extension('cogs.welcome')
        await self.load_extension('cogs.starboard')
        await self.load_extension('cogs.autoreact')
        await self.load_extension('cogs.verification')
        await self.load_extension('cogs.lastfm')

        # Sync slash commands
        try:
            synced = await self.tree.sync()
            await BotLogger.log(f"Synced {len(synced)} slash commands", "info", "system")
        except Exception as e:
            await BotLogger.log_error("Slash command sync failed", e, "system")

    async def on_connect(self):
        print(f"{self.user} has connected to Discord!")

    async def on_message(self, message):
        if message.author == self.user:
            return

        # Check allowed channels
        from utils.permissions import PermissionChecker
        if not PermissionChecker.is_in_allowed_channel(message.channel.id):
            # We don't log ignored messages to server to avoid spam? 
            # bot.py printed: "Ignored message in non-allowed channel: ..."
            print(f"Ignored message in non-allowed channel: {message.content}")
            return

        # Check disabled commands (for prefix commands)
        if message.content.startswith(config.prefix):
            parts = message.content[len(config.prefix):].split()
            if parts:
                command_name = parts[0].lower()
                if config.is_command_disabled(command_name):
                    await message.channel.send(f"The `{command_name}` command is currently disabled.")
                    return

        # Log message
        msg = f"Received message from {message.author}: {message.content}"
        # print(msg) # BotLogger prints
        await BotLogger.log(msg, "info", "message")

        # Process commands
        await self.process_commands(message)
