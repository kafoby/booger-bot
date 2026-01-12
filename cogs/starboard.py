import discord
from discord.ext import commands
import json
import os
from typing import Dict, Set
from config.settings import config


STARRED_MESSAGES_FILE = "data/starred_messages.json"


class Starboard(commands.Cog):
    """Starboard feature - highlight popular messages with reactions

    Configuration is managed via the dashboard and fetched from the API.
    Starred message tracking is stored locally to prevent duplicates.
    """

    def __init__(self, bot):
        self.bot = bot
        self.starred_messages = self._load_starred_messages()

    def _load_starred_messages(self) -> Dict[str, list]:
        """Load starred message IDs from JSON file to prevent duplicates"""
        if not os.path.exists("data"):
            os.makedirs("data")

        if os.path.exists(STARRED_MESSAGES_FILE):
            try:
                with open(STARRED_MESSAGES_FILE, "r") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading starred messages: {e}")
                return {}
        return {}

    def _save_starred_messages(self):
        """Save starred message IDs to JSON file"""
        try:
            with open(STARRED_MESSAGES_FILE, "w") as f:
                json.dump(self.starred_messages, f, indent=4)
        except Exception as e:
            print(f"Error saving starred messages: {e}")

    def _get_guild_starred_messages(self, guild_id: str) -> Set[int]:
        """Get set of starred message IDs for a guild"""
        if guild_id not in self.starred_messages:
            self.starred_messages[guild_id] = []
        return set(self.starred_messages[guild_id])

    def _add_starred_message(self, guild_id: str, message_id: int):
        """Add a message ID to the starred set for a guild"""
        if guild_id not in self.starred_messages:
            self.starred_messages[guild_id] = []
        if message_id not in self.starred_messages[guild_id]:
            self.starred_messages[guild_id].append(message_id)
            self._save_starred_messages()

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        """Handle reaction additions for starboard"""
        # Get guild ID as string for consistency with config structure
        guild_id = str(payload.guild_id)

        # Get starboard config from ConfigManager (fetched from dashboard)
        starboard_config = config.starboard_config.get(guild_id)

        # Check if starboard is configured for this guild
        if not starboard_config:
            return

        # Check if reaction is in monitored channel
        monitored_channel_id = starboard_config.get("monitored_channel_id")
        if not monitored_channel_id or payload.channel_id != monitored_channel_id:
            return

        # Check if reaction is the configured emoji
        configured_emoji = starboard_config.get("emoji")
        if not configured_emoji or str(payload.emoji) != configured_emoji:
            return

        # Get guild and channel
        guild = self.bot.get_guild(payload.guild_id)
        if not guild:
            return

        channel = guild.get_channel(payload.channel_id)
        if not channel:
            return

        # Fetch the message
        try:
            message = await channel.fetch_message(payload.message_id)
        except discord.NotFound:
            return
        except discord.Forbidden:
            print(f"Missing permissions to fetch message in {channel.name}")
            return

        # Check if message is already starred
        starred_set = self._get_guild_starred_messages(guild_id)
        if message.id in starred_set:
            return

        # Get the reaction and check if threshold is met
        threshold = starboard_config.get("threshold", 5)
        reaction = discord.utils.get(message.reactions, emoji=configured_emoji)
        if not reaction or reaction.count < threshold:
            return

        # Get starboard channel
        starboard_channel_id = starboard_config.get("starboard_channel_id")
        if not starboard_channel_id:
            return

        starboard_channel = guild.get_channel(starboard_channel_id)
        if not starboard_channel:
            print(f"Starboard channel not found for guild {guild.name}")
            return

        # Create starboard embed
        embed = discord.Embed(
            description=message.content or "*No text content*",
            color=0x9b59b6,
            timestamp=message.created_at
        )
        embed.set_author(
            name=message.author.name,
            icon_url=message.author.display_avatar.url
        )

        # Add jump link
        embed.add_field(
            name="\u200b",
            value=f"[Jump to message]({message.jump_url})",
            inline=False
        )

        # Add footer with reaction count
        embed.set_footer(text=f"{configured_emoji} {reaction.count}")

        # Add image if present
        if message.attachments:
            # Add first image attachment
            for attachment in message.attachments:
                if attachment.content_type and attachment.content_type.startswith("image/"):
                    embed.set_image(url=attachment.url)
                    break

        # Post to starboard channel
        try:
            await starboard_channel.send(embed=embed)

            # Mark message as starred
            self._add_starred_message(guild_id, message.id)
        except discord.Forbidden:
            print(f"Missing permissions to send to starboard channel in {guild.name}")
        except Exception as e:
            print(f"Error posting to starboard: {e}")


async def setup(bot):
    await bot.add_cog(Starboard(bot))
