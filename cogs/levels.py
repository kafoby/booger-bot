import discord
from discord import app_commands
from discord.ext import commands
import json
import os
from config.constants import LEVEL_UP_CHANNEL_ID, LEVEL_FILE
from config.settings import config
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder

class Levels(commands.Cog):
    """Handles XP tracking, leveling, and leaderboards"""

    def __init__(self, bot):
        self.bot = bot
        self._ensure_level_file()

    def _ensure_level_file(self):
        """Create levels.json if it doesn't exist"""
        if not os.path.exists(LEVEL_FILE):
            with open(LEVEL_FILE, "w") as f:
                json.dump({}, f)

    def _load_levels(self):
        """Load levels data from JSON file"""
        try:
            with open(LEVEL_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            BotLogger.log_error("Error loading levels file", e, "system")
            return {}

    def _save_levels(self, data):
        """Save levels data to JSON file"""
        try:
            with open(LEVEL_FILE, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            BotLogger.log_error("Error saving levels file", e, "system")

    def _get_xp_for_level(self, level):
        """Calculate XP required for a given level"""
        return 100 * (level ** 2) + 100 * level

    @commands.Cog.listener()
    async def on_message(self, message):
        """Award XP for messages and handle level ups"""
        # Ignore bot messages
        if message.author.bot:
            return

        levels = self._load_levels()
        user_id = str(message.author.id)

        # Initialize user if not in database
        if user_id not in levels:
            levels[user_id] = {"xp": 0, "level": 1}

        # Award XP
        levels[user_id]["xp"] += 15

        current_level = levels[user_id]["level"]
        required_xp = self._get_xp_for_level(current_level)

        # Check for level up
        if levels[user_id]["xp"] >= required_xp:
            levels[user_id]["level"] += 1
            levels[user_id]["xp"] -= required_xp

            # Send level up notification
            channel = self.bot.get_channel(LEVEL_UP_CHANNEL_ID)
            if channel:
                try:
                    embed = EmbedBuilder.create_embed(
                        title="Level Up!",
                        color=0x9b59b6
                    )
                    embed.description = f"{message.author.mention} reached **Level {levels[user_id]['level']}**"
                    embed.set_thumbnail(url=message.author.display_avatar.url)

                    await channel.send(embed=embed)
                    await BotLogger.log(
                        f"{message.author.name} leveled up to {levels[user_id]['level']}",
                        "info",
                        "system"
                    )
                except Exception as e:
                    await BotLogger.log_error("Error sending level up message", e, "system")

        self._save_levels(levels)

    @commands.command(name="rank")
    async def rank_prefix(self, ctx, member: discord.Member = None):
        """Show rank for a user (prefix command)"""
        if config.is_command_disabled("rank"):
            await ctx.send("The `rank` command is currently disabled.")
            return

        member = member or ctx.author
        levels = self._load_levels()
        user_id = str(member.id)

        if user_id not in levels:
            await ctx.send(f"{member.mention} has no XP yet.")
            return

        level = levels[user_id]["level"]
        xp = levels[user_id]["xp"]
        next_level_xp = self._get_xp_for_level(level)
        xp_needed = next_level_xp - xp

        embed = EmbedBuilder.create_embed(
            title=f"{member.name}'s Rank",
            color=0x9b59b6
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="Level", value=str(level), inline=True)
        embed.add_field(name="Current XP", value=str(xp), inline=True)
        embed.add_field(name="XP to Next Level", value=str(xp_needed), inline=True)

        await ctx.send(embed=embed)
        await BotLogger.log(f"{ctx.author} checked rank for {member.name}", "info", "command")

    @app_commands.command(name="rank", description="Check your or another user's rank and XP")
    @app_commands.describe(member="The user to check (leave empty for yourself)")
    async def rank_slash(self, interaction: discord.Interaction, member: discord.Member = None):
        """Show rank for a user (slash command)"""
        await interaction.response.defer()

        if config.is_command_disabled("rank"):
            await interaction.followup.send("The `rank` command is currently disabled.")
            return

        member = member or interaction.user
        levels = self._load_levels()
        user_id = str(member.id)

        if user_id not in levels:
            await interaction.followup.send(f"{member.mention} has no XP yet.")
            return

        level = levels[user_id]["level"]
        xp = levels[user_id]["xp"]
        next_level_xp = self._get_xp_for_level(level)
        xp_needed = next_level_xp - xp

        embed = EmbedBuilder.create_embed(
            title=f"{member.name}'s Rank",
            color=0x9b59b6
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="Level", value=str(level), inline=True)
        embed.add_field(name="Current XP", value=str(xp), inline=True)
        embed.add_field(name="XP to Next Level", value=str(xp_needed), inline=True)

        await interaction.followup.send(embed=embed)
        await BotLogger.log(f"{interaction.user} checked rank for {member.name}", "info", "command")

    @commands.command(name="leaderboard")
    async def leaderboard_prefix(self, ctx):
        """Show the top 10 users by level (prefix command)"""
        if config.is_command_disabled("leaderboard"):
            await ctx.send("The `leaderboard` command is currently disabled.")
            return

        levels = self._load_levels()
        if not levels:
            await ctx.send("Leaderboard is empty.")
            return

        # Sort by level (descending), then by XP (descending)
        sorted_users = sorted(
            levels.items(),
            key=lambda x: (x[1]["level"], x[1]["xp"]),
            reverse=True
        )[:10]

        embed = EmbedBuilder.create_embed(
            title="Leaderboard - Top 10",
            color=0x9b59b6
        )

        for i, (user_id, data) in enumerate(sorted_users, 1):
            user = self.bot.get_user(int(user_id))
            name = user.name if user else "Unknown User"
            embed.add_field(
                name=f"{i}. {name}",
                value=f"Level {data['level']} ({data['xp']} XP)",
                inline=False
            )

        await ctx.send(embed=embed)
        await BotLogger.log(f"{ctx.author} viewed leaderboard", "info", "command")

    @app_commands.command(name="leaderboard", description="View the top 10 users by level")
    async def leaderboard_slash(self, interaction: discord.Interaction):
        """Show the top 10 users by level (slash command)"""
        await interaction.response.defer()

        if config.is_command_disabled("leaderboard"):
            await interaction.followup.send("The `leaderboard` command is currently disabled.")
            return

        levels = self._load_levels()
        if not levels:
            await interaction.followup.send("Leaderboard is empty.")
            return

        # Sort by level (descending), then by XP (descending)
        sorted_users = sorted(
            levels.items(),
            key=lambda x: (x[1]["level"], x[1]["xp"]),
            reverse=True
        )[:10]

        embed = EmbedBuilder.create_embed(
            title="Leaderboard - Top 10",
            color=0x9b59b6
        )

        for i, (user_id, data) in enumerate(sorted_users, 1):
            user = self.bot.get_user(int(user_id))
            name = user.name if user else "Unknown User"
            embed.add_field(
                name=f"{i}. {name}",
                value=f"Level {data['level']} ({data['xp']} XP)",
                inline=False
            )

        await interaction.followup.send(embed=embed)
        await BotLogger.log(f"{interaction.user} viewed leaderboard", "info", "command")

async def setup(bot):
    await bot.add_cog(Levels(bot))
