import discord
from discord.ext import commands
import asyncio
from config.constants import (
    ALLOWED_GUILD_ID,
    JOIN_TO_CREATE_CHANNEL_ID,
    CUSTOM_VC_CATEGORY_ID
)
from utils.logging import BotLogger

class Voice(commands.Cog):
    """Handles join-to-create voice channels and automatic cleanup"""

    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_voice_state_update(
        self,
        member: discord.Member,
        before: discord.VoiceState,
        after: discord.VoiceState
    ):
        """
        Handles voice channel events:
        - Creates temporary voice channels when users join the join-to-create channel
        - Deletes empty temporary voice channels after users leave
        """
        # Only process events from the allowed guild
        if member.guild.id != ALLOWED_GUILD_ID:
            return

        # Handle join-to-create channel
        if (after.channel and
            after.channel.id == JOIN_TO_CREATE_CHANNEL_ID and
            (before.channel is None or before.channel.id != JOIN_TO_CREATE_CHANNEL_ID)):

            try:
                guild = member.guild
                category = guild.get_channel(CUSTOM_VC_CATEGORY_ID)

                # Create new voice channel
                new_channel = await guild.create_voice_channel(
                    name=f"{member.name}'s Channel",
                    category=category,
                    reason=f"Join-to-create for {member}"
                )

                # Move user to the new channel
                await member.move_to(new_channel)

                # Give the user permissions to manage their channel
                await new_channel.set_permissions(
                    member,
                    manage_channels=True,
                    manage_permissions=True
                )

                await BotLogger.log(
                    f"Created temporary voice channel for {member.name} (ID: {member.id})",
                    "info",
                    "system"
                )

            except Exception as e:
                await BotLogger.log_error(
                    f"Error creating voice channel for {member.name}",
                    e,
                    "system"
                )

        # Handle cleanup of empty custom voice channels
        if (before.channel and
            before.channel.category_id == CUSTOM_VC_CATEGORY_ID and
            len(before.channel.members) == 0):

            try:
                # Wait briefly to ensure channel is truly empty
                await asyncio.sleep(3)

                # Double-check the channel is still empty
                if len(before.channel.members) == 0:
                    channel_name = before.channel.name
                    await before.channel.delete(reason="Empty custom voice channel")

                    await BotLogger.log(
                        f"Deleted empty voice channel: {channel_name}",
                        "info",
                        "system"
                    )

            except Exception as e:
                await BotLogger.log_error(
                    f"Error deleting empty voice channel",
                    e,
                    "system"
                )

async def setup(bot):
    await bot.add_cog(Voice(bot))
