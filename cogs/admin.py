import discord
from discord.ext import commands
from datetime import timedelta
from config.settings import config
from utils.logging import BotLogger
from utils.permissions import PermissionChecker
from utils.embed_builder import EmbedBuilder
from services.api_client import APIClient
from services.google_search import GoogleSearchService
import random

class Admin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        # State for rape command toggle
        self.bot.rape_enabled = False

    @commands.command(name="rapeon")
    async def rapeon(self, ctx):
        """Enable the rape command (admin only)"""
        if not PermissionChecker.is_admin(ctx.author.id):
            await ctx.send("You are not allowed to use this command.")
            await BotLogger.log(
                f"Unauthorized ,rapeon attempt by {ctx.author}",
                "warning",
                "command"
            )
            return

        self.bot.rape_enabled = True
        await ctx.send("Rape mode ON😈")
        await BotLogger.log(f"{ctx.author} enabled rape mode", "info", "command")

    @commands.command(name="rapeoff")
    async def rapeoff(self, ctx):
        """Disable the rape command (admin only)"""
        if not PermissionChecker.is_admin(ctx.author.id):
            await ctx.send("You are not allowed to use this command.")
            await BotLogger.log(
                f"Unauthorized ,rapeoff attempt by {ctx.author}",
                "warning",
                "command"
            )
            return

        self.bot.rape_enabled = False
        await ctx.send("Rape mode OFF <a:cr_asad:1166759175217487902>")
        await BotLogger.log(f"{ctx.author} disabled rape mode", "info", "command")

    @commands.command(name="rape")
    async def rape(self, ctx):
        """Send a random rape-themed image (admin only, toggle required)"""
        if not PermissionChecker.is_admin(ctx.author.id):
            await ctx.send("You are not allowed to use this command.")
            return

        if not getattr(self.bot, 'rape_enabled', False):
            await ctx.send("The `rape` command is currently disabled.")
            return

        try:
            if not ctx.message.mentions:
                await ctx.send('Please mention a user to rape')
                return

            target_user = ctx.message.mentions[0]
            author = ctx.author

            search_queries = [
                "rape hentai gif",
                "rape hentai animated",
                "yuri rape gif",
                "femboy rape hentai",
                "cat girl rape hentai",
                "ebony rape hentai"
            ]

            search_query = random.choice(search_queries)
            image_url = await GoogleSearchService.get_random_image(
                [search_query],
                num=random.randint(1, 10),
                start=random.randint(1, 100)
            )

            if not image_url:
                await ctx.send('Could not find rape images')
                return

            embed = EmbedBuilder.create_embed(
                title=f"{author.name} raped {target_user.name}",
                image_url=image_url,
                color=discord.Color.from_rgb(255, 192, 203)
            )

            await ctx.send(embed=embed)
            await BotLogger.log(
                f"{author} used ,rape command on {target_user}",
                "info",
                "command"
            )

        except Exception as e:
            await BotLogger.log_error("Error with ,rape command", e)
            await ctx.send(f'Error: {str(e)}')

    @commands.command(name="warn")
    async def warn(self, ctx, *, reason: str = None):
        """Warn a user (saves to database via API)"""
        try:
            if not ctx.message.mentions:
                await ctx.send('Usage: ,warn @user <reason>\nExample: ,warn @user spamming')
                return

            if not reason:
                await ctx.send('Usage: ,warn @user <reason>\nExample: ,warn @user spamming')
                return

            target_user = ctx.message.mentions[0]

            payload = {
                "userId": str(target_user.id),
                "userName": target_user.name,
                "reason": reason
            }

            response = await APIClient.post(config.WARNS_URL, json=payload, headers=config.get_api_headers())

            if response.get("_status") == 201 or "userId" in response:
                await ctx.send(f'{target_user.mention} has been warned for: {reason}')
                await BotLogger.log(
                    f"{ctx.author} warned {target_user.name} (ID: {target_user.id}) for: {reason}",
                    "warning",
                    "moderation"
                )
            else:
                await ctx.send('Error: Failed to save warning')

        except Exception as e:
            await BotLogger.log_error("Error warning user", e)
            await ctx.send(f'Error: {str(e)}')

    @commands.command(name="warns")
    async def warns(self, ctx):
        """List all warnings or warnings for a specific user"""
        try:
            warns = await APIClient.get(config.WARNS_URL, headers=config.get_api_headers())

            if ctx.message.mentions:
                target_user = ctx.message.mentions[0]
                warns = [w for w in warns if w['userId'] == str(target_user.id)]
                if not warns:
                    await ctx.send(f'No warns found for {target_user.mention}')
                    return
                title = f'Warns for {target_user.name}'
            else:
                if not warns:
                    await ctx.send('No warns recorded')
                    return
                title = 'All Warns'

            embed = EmbedBuilder.create_embed(title=title)

            for warn in warns:
                embed.add_field(
                    name=f"{warn['userName']} (ID: {warn['userId']})",
                    value=f"**Reason:** {warn['reason']}\n**Date:** {warn['timestamp'][:10]}",
                    inline=False
                )

            await ctx.send(embed=embed)
            await BotLogger.log(
                f"{ctx.author} viewed warns in {ctx.channel}",
                "info",
                "command"
            )

        except Exception as e:
            await BotLogger.log_error("Error fetching warns", e)
            await ctx.send(f'Error: {str(e)}')

    @commands.command(name="timeout")
    async def timeout(self, ctx, duration: str = None):
        """Timeout a mentioned user for a specified duration"""
        try:
            if not ctx.message.mentions:
                await ctx.send('Usage: ,timeout @user <duration>\nExample: ,timeout @user 10m')
                return

            if not duration:
                await ctx.send('Usage: ,timeout @user <duration>\nExample: ,timeout @user 10m')
                return

            target_user = ctx.message.mentions[0]

            # Parse duration
            unit = duration[-1].lower()
            try:
                value = int(duration[:-1])
            except ValueError:
                await ctx.send('Invalid duration format. Use: 10s, 5m, 1h, 2d')
                return

            if unit == 's':
                delta = timedelta(seconds=value)
            elif unit == 'm':
                delta = timedelta(minutes=value)
            elif unit == 'h':
                delta = timedelta(hours=value)
            elif unit == 'd':
                delta = timedelta(days=value)
            else:
                await ctx.send('Invalid time unit. Use: s (seconds), m (minutes), h (hours), d (days)')
                return

            await target_user.timeout(delta, reason=f"Timed out by {ctx.author}")
            await ctx.send(f'{target_user.mention} has been timed out for {duration}')
            await BotLogger.log(
                f"{ctx.author} timed out {target_user.name} for {duration}",
                "warning",
                "moderation"
            )

        except Exception as e:
            await BotLogger.log_error("Error timing out user", e)
            await ctx.send(f'Error: {str(e)}')

async def setup(bot):
    await bot.add_cog(Admin(bot))
