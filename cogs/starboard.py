import discord
from discord import app_commands
from discord.ext import commands
import json
import os
from typing import Dict, Set

STARBOARD_FILE = "data/starboard.json"


class Starboard(commands.Cog):
    """Starboard feature - highlight popular messages with reactions"""

    def __init__(self, bot):
        self.bot = bot
        self.starboard_config = self._load_config()

    def _load_config(self) -> Dict:
        """Load starboard configuration from JSON file"""
        if not os.path.exists("data"):
            os.makedirs("data")

        if os.path.exists(STARBOARD_FILE):
            try:
                with open(STARBOARD_FILE, "r") as f:
                    data = json.load(f)
                    # Convert starred_messages lists back to sets
                    for guild_id, config in data.items():
                        if "starred_messages" in config:
                            config["starred_messages"] = set(config["starred_messages"])
                    return data
            except Exception as e:
                print(f"Error loading starboard config: {e}")
                return {}
        return {}

    def _save_config(self):
        """Save starboard configuration to JSON file"""
        try:
            # Convert sets to lists for JSON serialization
            data = {}
            for guild_id, config in self.starboard_config.items():
                data[guild_id] = config.copy()
                if "starred_messages" in data[guild_id]:
                    data[guild_id]["starred_messages"] = list(data[guild_id]["starred_messages"])

            with open(STARBOARD_FILE, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print(f"Error saving starboard config: {e}")

    @app_commands.command(name="starboard", description="Set up the starboard feature")
    @app_commands.describe(
        monitored_channel="Channel to monitor for reactions",
        emoji="Emoji to trigger the starboard (e.g. ⭐, 👍, 👎)",
        threshold="Number of reactions needed",
        starboard_channel="Channel to post starred messages"
    )
    async def starboard(
        self,
        interaction: discord.Interaction,
        monitored_channel: discord.TextChannel,
        emoji: str,
        threshold: int,
        starboard_channel: discord.TextChannel
    ):
        """Configure starboard settings for this server"""
        # Check permissions
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message(
                "You need Manage Messages permission to use this command.",
                ephemeral=True
            )
            return

        # Validate threshold
        if threshold < 1:
            await interaction.response.send_message(
                "Threshold must be at least 1.",
                ephemeral=True
            )
            return

        # Store configuration
        guild_id = str(interaction.guild.id)
        self.starboard_config[guild_id] = {
            "monitored_channel_id": monitored_channel.id,
            "emoji": emoji,
            "threshold": threshold,
            "starboard_channel_id": starboard_channel.id,
            "starred_messages": set()
        }

        # Save to file
        self._save_config()

        # Create response embed
        embed = discord.Embed(title="Starboard Set Up", color=0x9b59b6)
        embed.description = (
            f"Monitoring {monitored_channel.mention} for {emoji} reactions (threshold: {threshold})\n"
            f"Starred messages will post in {starboard_channel.mention}"
        )

        await interaction.response.send_message(embed=embed, ephemeral=True)

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        """Handle reaction additions for starboard"""
        # Get guild config
        guild_id = str(payload.guild_id)
        config = self.starboard_config.get(guild_id)

        # Check if starboard is configured for this guild
        if not config:
            return

        # Check if reaction is in monitored channel
        if payload.channel_id != config["monitored_channel_id"]:
            return

        # Check if reaction is the configured emoji
        if str(payload.emoji) != config["emoji"]:
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
        if message.id in config["starred_messages"]:
            return

        # Get the reaction and check if threshold is met
        reaction = discord.utils.get(message.reactions, emoji=str(payload.emoji))
        if not reaction or reaction.count < config["threshold"]:
            return

        # Get starboard channel
        starboard_channel = guild.get_channel(config["starboard_channel_id"])
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
        embed.set_footer(text=f"{config['emoji']} {reaction.count}")

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
            config["starred_messages"].add(message.id)
            self._save_config()
        except discord.Forbidden:
            print(f"Missing permissions to send to starboard channel in {guild.name}")
        except Exception as e:
            print(f"Error posting to starboard: {e}")


async def setup(bot):
    await bot.add_cog(Starboard(bot))
