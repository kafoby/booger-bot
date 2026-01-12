import discord
from discord.ext import commands
from discord import app_commands
import json
import os
from config.constants import ALLOWED_GUILD_ID
from utils.logging import BotLogger

BOOST_CONFIG_FILE = "boost_config.json"

class Boost(commands.Cog):
    """Handles server boost notifications"""

    def __init__(self, bot):
        self.bot = bot
        self._ensure_config_file()

    def _ensure_config_file(self):
        """Create boost_config.json if it doesn't exist"""
        if not os.path.exists(BOOST_CONFIG_FILE):
            with open(BOOST_CONFIG_FILE, "w") as f:
                json.dump({"boost_channel_id": None}, f)

    def _load_config(self):
        """Load boost configuration from JSON file"""
        try:
            with open(BOOST_CONFIG_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            BotLogger.log_error("Error loading boost config file", e, "system")
            return {"boost_channel_id": None}

    def _save_config(self, data):
        """Save boost configuration to JSON file"""
        try:
            with open(BOOST_CONFIG_FILE, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            BotLogger.log_error("Error saving boost config file", e, "system")

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        """Detect when a member boosts the server"""
        # Only process events from the allowed guild
        if after.guild.id != ALLOWED_GUILD_ID:
            return

        # Check if the member started boosting
        before_boosting = before.premium_since is not None
        after_boosting = after.premium_since is not None

        if not before_boosting and after_boosting:
            # Member just boosted!
            await self._send_boost_notification(after)

    async def _send_boost_notification(self, member: discord.Member):
        """Send boost notification to configured channel"""
        config_data = self._load_config()
        channel_id = config_data.get("boost_channel_id")

        if not channel_id:
            await BotLogger.log(
                f"{member.name} boosted but no boost channel is configured",
                "warning",
                "system"
            )
            return

        channel = self.bot.get_channel(channel_id)
        if not channel:
            await BotLogger.log(
                f"Boost channel {channel_id} not found",
                "warning",
                "system"
            )
            return

        try:
            guild = member.guild
            boost_count = guild.premium_subscription_count

            # Create embed
            embed = discord.Embed(color=0x9b59b6)

            # Header with user info
            embed.set_author(
                name=f"{member.display_name} boosted the server!",
                icon_url=member.display_avatar.url
            )

            # Body with boost count and thanks
            embed.description = (
                f"**{guild.name}** currently has **{boost_count}** boosts!\n\n"
                f"Thanks for the boost, booger is pleased! <:boogerchaos:1457274782675505185>\n\n"
                f"Check out your perks in <#1456996668569288769>"
            )

            # Bot avatar as thumbnail
            bot_user = self.bot.user
            if bot_user and bot_user.display_avatar:
                embed.set_thumbnail(url=bot_user.display_avatar.url)

            # Footer
            embed.set_footer(
                text=f"{member.name} is now a part of the booger family",
                icon_url="https://cdn.discordapp.com/attachments/1454816480909594829/1457156046291341496/IMG_0979.gif"
            )

            await channel.send(embed=embed)

            await BotLogger.log(
                f"{member.name} boosted the server (Total: {boost_count})",
                "info",
                "system"
            )

        except Exception as e:
            await BotLogger.log_error(
                f"Error sending boost notification for {member.name}",
                e,
                "system"
            )

    @app_commands.command(name="setboostchannel", description="Set the channel for boost notifications")
    @app_commands.describe(channel="The channel where boost notifications will be sent")
    async def set_boost_channel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        """Set the channel for boost notifications"""
        # Check if user has administrator permissions
        if not interaction.user.guild_permissions.administrator:
            await interaction.response.send_message(
                "You need administrator permissions to use this command.",
                ephemeral=True
            )
            return

        config_data = self._load_config()
        config_data["boost_channel_id"] = channel.id
        self._save_config(config_data)

        await interaction.response.send_message(
            f"Boost notifications will now be sent to {channel.mention}",
            ephemeral=True
        )

        await BotLogger.log(
            f"{interaction.user.name} set boost channel to #{channel.name} (ID: {channel.id})",
            "info",
            "system"
        )

    @app_commands.command(name="testboost", description="Test the boost notification (admin only)")
    async def test_boost(self, interaction: discord.Interaction):
        """Test the boost notification"""
        # Check if user has administrator permissions
        if not interaction.user.guild_permissions.administrator:
            await interaction.response.send_message(
                "You need administrator permissions to use this command.",
                ephemeral=True
            )
            return

        await interaction.response.defer(ephemeral=True)

        # Manually trigger boost notification for the user
        await self._send_boost_notification(interaction.user)

        await interaction.followup.send(
            "Boost notification test sent!",
            ephemeral=True
        )

async def setup(bot):
    await bot.add_cog(Boost(bot))
