import discord
from discord.ext import commands
import random
import io
import aiohttp
from petpetgif import petpet
from config.settings import config
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder
from services.api_client import APIClient
from services.google_search import GoogleSearchService

class Images(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="pet")
    async def pet(self, ctx):
        if config.is_command_disabled("pet"):
            await ctx.send("The `pet` command is currently disabled.")
            return

        try:
            if not ctx.message.mentions:
                await ctx.send("Mention a user to pet")
                return

            target = ctx.message.mentions[0]
            author = ctx.author

            avatar_url = target.display_avatar.with_format("png").with_size(512).url

            async with aiohttp.ClientSession() as session:
                async with session.get(avatar_url) as resp:
                    avatar_bytes = await resp.read()

            source = io.BytesIO(avatar_bytes)
            dest = io.BytesIO()

            petpet.make(source, dest)
            dest.seek(0)

            embed = EmbedBuilder.create_embed(title=f"{author.name} pets {target.name}")
            embed.set_image(url="attachment://pet.gif")

            await ctx.send(embed=embed, file=discord.File(dest, filename="pet.gif"))
            await BotLogger.log(f"{author.name} used ,pet command on {target.name}", "info", "output")

        except Exception as e:
            await BotLogger.log_error("Error with ,pet command", e, "command")
            await ctx.send(str(e))

    @commands.command(name="cat")
    async def cat(self, ctx):
        if config.is_command_disabled("cat"):
            await ctx.send("The `cat` command is currently disabled.")
            return

        try:
            data = await APIClient.get('https://api.thecatapi.com/v1/images/search?mime_types=gif&limit=1')
            if data and len(data) > 0:
                cat_url = data[0]['url']
                embed = EmbedBuilder.create_embed(
                    title="Here's a cat for you!",
                    image_url=cat_url
                )
                await ctx.send(embed=embed)
                await BotLogger.log(f"{ctx.author} used ,cat command", "info", "output")
        except Exception as e:
            await BotLogger.log_error("Error fetching cat gif", e)
            await ctx.send("Error fetching cat gif.")

    @commands.command(name="dog")
    async def dog(self, ctx):
        if config.is_command_disabled("dog"):
            await ctx.send("The `dog` command is currently disabled.")
            return

        try:
            data = await APIClient.get('https://random.dog/woof.json?include=gif')
            dog_url = data.get('url')
            if dog_url:
                embed = EmbedBuilder.create_embed(
                    title="Here's a dog for you!",
                    image_url=dog_url
                )
                await ctx.send(embed=embed)
                await BotLogger.log(f"{ctx.author} used ,dog command", "info", "output")
        except Exception as e:
            await BotLogger.log_error("Error fetching dog gif", e)
            await ctx.send("Error fetching dog gif.")

    @commands.command(name="crocodile")
    async def crocodile(self, ctx):
        if config.is_command_disabled("crocodile"):
            await ctx.send("The `crocodile` command is currently disabled.")
            return

        try:
            search_queries = [
                "crocodile gif", "crocodile animated", "cute crocodile",
                "crocodile meme", "crocodile"
            ]
            
            image_url = await GoogleSearchService.get_random_image(search_queries)

            if not image_url:
                await ctx.send("Couldn't find any crocodiles right now")
                return

            embed = EmbedBuilder.create_embed(
                title="Here is a crocodile for you!",
                image_url=image_url
            )

            await ctx.send(embed=embed)
            await BotLogger.log(f"{ctx.author} used ,crocodile command", "info", "output")
        except Exception as e:
            await BotLogger.log_error("Error with ,crocodile command", e, "command")
            await ctx.send(f"Error: {str(e)}")

    @commands.command(name="seal")
    async def seal(self, ctx):
        if config.is_command_disabled("seal"):
            await ctx.send("The `seal` command is currently disabled.")
            return

        try:
            search_queries = [
                "baby harp seal", "harp seal pup", "baby seal gif",
                "harp seal pup gif"
            ]
            
            image_url = await GoogleSearchService.get_random_image(search_queries)

            if not image_url:
                await ctx.send("Couldn't find any seals right now")
                return

            embed = EmbedBuilder.create_embed(
                title="Here is a baby harp seal for you!",
                image_url=image_url
            )

            await ctx.send(embed=embed)
            await BotLogger.log(f"{ctx.author} used ,seal command", "info", "output")
        except Exception as e:
            await BotLogger.log_error("Error with ,seal command", e)
            await ctx.send(f"Error: {str(e)}")

async def setup(bot):
    await bot.add_cog(Images(bot))
