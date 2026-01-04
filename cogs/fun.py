import discord
from discord import app_commands
from discord.ext import commands
import random
import asyncio
import io
from PIL import Image, ImageDraw
import aiohttp
from config.settings import config
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder
from services.google_search import GoogleSearchService

class Fun(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="gay")
    async def gay(self, ctx):
        if not ctx.message.mentions:
            await ctx.send('Please mention a user')
            return

        target_user = ctx.message.mentions[0]
        gay_percentage = random.randint(0, 100)

        embed = EmbedBuilder.create_embed(
            title=f"{target_user.name} Gay Meter",
            description=f"{gay_percentage}% gay"
        )

        if target_user.avatar:
            embed.set_thumbnail(url=target_user.avatar.url)

        await ctx.send(embed=embed)
        await BotLogger.log(f"{ctx.author} used ,gay command on {target_user.name}: {gay_percentage}%", "info", "output")

    @commands.command(name="kiss")
    async def kiss(self, ctx):
        if not ctx.message.mentions:
            await ctx.send('Please mention a user to kiss')
            return

        target_user = ctx.message.mentions[0]
        author = ctx.author

        kiss_gifs = ['https://cdn.nekotina.com/images/AQL8dPyM.gif']
        gif_url = random.choice(kiss_gifs)

        embed = EmbedBuilder.create_embed(
            title=f"{author.name} kissed {target_user.name}",
            image_url=gif_url
        )

        await ctx.send(embed=embed)
        await BotLogger.log(f"{author.name} used ,kiss command on {target_user.name}", "info", "output")

    @commands.command(name="slap")
    async def slap(self, ctx):
        if not ctx.message.mentions:
            await ctx.send('Please mention a user to slap')
            return

        target_user = ctx.message.mentions[0]
        author = ctx.author

        try:
            search_queries = [
                "anime girl slap gif", "anime girl slap animated",
                "yuri slap gif", "yuri slap animated",
                "anime cat girl slap gif", "anime cat girl slap animated"
            ]
            
            image_url = await GoogleSearchService.get_random_image(search_queries)

            if not image_url:
                await ctx.send('Could not find slap images')
                return

            embed = EmbedBuilder.create_embed(
                title=f"{author.name} slapped {target_user.name}",
                image_url=image_url
            )

            await ctx.send(embed=embed)
            await BotLogger.log(f"{author.name} used ,slap command on {target_user.name}", "info", "output")
        except Exception as e:
            await BotLogger.log_error("Error with ,slap command", e)
            await ctx.send(f"Error: {str(e)}")

    @commands.command(name="diddle")
    async def diddle(self, ctx):
        if not ctx.message.mentions:
            await ctx.send("Please mention a user to diddle.")
            return

        target = ctx.message.mentions[0]
        author = ctx.author

        try:
            items = await GoogleSearchService.search_images("diddy gif", num=10)
            
            gif_items = [
                item["link"] for item in items
                if item.get("mime") == "image/gif"
            ]

            if not gif_items:
                await ctx.send("Couldn't find any Diddy GIFs right now.")
                return

            gif_url = random.choice(gif_items)

            embed = EmbedBuilder.create_embed(
                title=f"{author.name} diddled {target.name}",
                image_url=gif_url
            )

            await ctx.send(embed=embed)
            await BotLogger.log(f"{author.name} used ,diddle command on {target.name}", "info", "output")

        except Exception as e:
            await BotLogger.log_error("Error with ,diddle command", e, "command")
            await ctx.send("Something went wrong while fetching the GIF.")

    @app_commands.command(name="nuke", description="fake nuke")
    async def nuke(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        if config.is_command_disabled("nuke"):
            await interaction.followup.send("The `nuke` command is currently disabled.", ephemeral=True)
            return

        await interaction.channel.send("🚨 **NUKE ACTIVATED** 🚨")
        await asyncio.sleep(1.5)
        await interaction.channel.send("Deleting all messages... 69%")
        await asyncio.sleep(1.5)
        await interaction.channel.send("Banning everyone... 99%")
        await asyncio.sleep(1.5)
        await interaction.channel.send("Server exploding in:")
        await interaction.channel.send("**3**...")
        await asyncio.sleep(1)
        await interaction.channel.send("**2**...")
        await asyncio.sleep(1)
        await interaction.channel.send("**1**...")
        await asyncio.sleep(1)
        await interaction.channel.send("https://tenor.com/view/house-explosion-explode-boom-kaboom-gif-19506150")
        await asyncio.sleep(1.5)
        await interaction.channel.send("**jk server safe silly🥱**")
        await BotLogger.log(f"{interaction.user} used /nuke command", "info", "command")

    @app_commands.command(name="ship", description="Ship two users")
    @app_commands.describe(user1="user1", user2="user2")
    async def ship(self, interaction: discord.Interaction, user1: discord.Member, user2: discord.Member):
        await interaction.response.defer()

        if config.is_command_disabled("ship"):
            await interaction.followup.send("The `ship` command is currently disabled.")
            return

        if user1 == user2:
            await interaction.followup.send("You can't ship someone with themselves!")
            return

        percent = random.randint(0, 100)
        comment = self._get_ship_comment(percent)

        try:
            buffer = await self._create_ship_image(user1, user2)
            embed = EmbedBuilder.create_embed(
                title=f"{user1.name} ❤️ {user2.name}",
                description=f"Ship Percentage: {percent}%\n{comment}",
                image_url="attachment://ship.png"
            )

            await interaction.followup.send(embed=embed, file=discord.File(buffer, filename="ship.png"))
            await BotLogger.log(f"{interaction.user} used /ship on {user1.name} and {user2.name}: {percent}%", "info", "output")

        except Exception as e:
            await BotLogger.log_error("Error with /ship command", e, "command")
            await interaction.followup.send("Something went wrong while creating the ship image.")

    def _get_ship_comment(self, percent):
        if percent >= 90: return "They have each other's voodoo doll, I can bet!"
        elif percent >= 70: return "They prolly fuh!"
        elif percent >= 50: return "There's some potential in investing in ts."
        elif percent >= 30: return "It's complicated but idk son could work."
        return "Fuh naw there no love in this block."

    async def _create_ship_image(self, user1, user2):
        async with aiohttp.ClientSession() as session:
            async with session.get(user1.display_avatar.with_format("png").with_size(256).url) as resp1:
                avatar1_bytes = await resp1.read()
            async with session.get(user2.display_avatar.with_format("png").with_size(256).url) as resp2:
                avatar2_bytes = await resp2.read()

        avatar1 = Image.open(io.BytesIO(avatar1_bytes)).resize((256, 256)).convert("RGBA")
        avatar2 = Image.open(io.BytesIO(avatar2_bytes)).resize((256, 256)).convert("RGBA")

        img = Image.new("RGBA", (256 + 150 + 256, 256), color=(0, 0, 0, 0))
        img.paste(avatar1, (0, 0), avatar1)
        img.paste(avatar2, (256 + 150, 0), avatar2)

        draw = ImageDraw.Draw(img)
        plus_x, plus_y = 256 + 75, 128
        pink = (255, 105, 180)
        draw.rectangle([plus_x - 40, plus_y - 15, plus_x + 40, plus_y + 15], fill=pink)
        draw.rectangle([plus_x - 15, plus_y - 40, plus_x + 15, plus_y + 40], fill=pink)

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer

async def setup(bot):
    await bot.add_cog(Fun(bot))