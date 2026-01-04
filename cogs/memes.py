import discord
from discord import app_commands
from discord.ext import commands
from config.settings import config
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder
from services.google_search import GoogleSearchService
from services.image_processor import ImageProcessor

class Memes(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="quote")
    async def quote(self, ctx):
        """Quote a replied message as an inspirational quote image"""
        if not ctx.message.reference:
            await ctx.send("Please reply to a message to quote it!")
            return

        try:
            replied = await ctx.channel.fetch_message(ctx.message.reference.message_id)

            author = replied.author
            content = replied.content.strip()

            if not content:
                await ctx.send("The replied message could not be quoted, try again!")
                return

            avatar_url = str(author.display_avatar.url)

            # Create quote image
            buffer = await ImageProcessor.create_quote_image(avatar_url, content, author.name)

            embed = EmbedBuilder.create_embed()
            embed.set_image(url="attachment://quote.png")

            await ctx.send(embed=embed, file=discord.File(buffer, filename="quote.png"))
            await BotLogger.log(
                f"{ctx.author} used ,quote command on message by {author.name}",
                "info",
                "output"
            )

        except Exception as e:
            await BotLogger.log_error("Error with ,quote command", e, "command")
            await ctx.send("Something went wrong while quoting.")

    @app_commands.command(
        name="meme",
        description="search a meme on google images and add (optional) text to it"
    )
    @app_commands.describe(
        query="meme template to search for",
        top="text at the top (optional)",
        bottom="text at the bottom (optional)"
    )
    async def meme(self, interaction: discord.Interaction, query: str, top: str = "", bottom: str = ""):
        await interaction.response.defer()

        if config.is_command_disabled("meme"):
            await interaction.followup.send("The `meme` command is currently disabled.")
            return

        try:
            # Search for meme template
            items = await GoogleSearchService.search_images(
                f"{query} meme template",
                num=10,
                file_type="png,jpg"
            )

            if not items:
                await interaction.followup.send("No meme templates found.")
                return

            template_url = items[0]["link"]

            # Create meme with text overlay
            buffer = await ImageProcessor.create_meme(template_url, top, bottom)

            embed = EmbedBuilder.create_embed()
            embed.set_image(url="attachment://meme.png")

            await interaction.followup.send(embed=embed, file=discord.File(buffer, filename="meme.png"))
            await BotLogger.log(
                f"{interaction.user} used /meme command with query='{query[:50]}' top='{top[:50]}' bottom='{bottom[:50]}'",
                "info",
                "output"
            )

        except Exception as e:
            await BotLogger.log_error("Error with /meme command", e, "command")
            await interaction.followup.send("Something went wrong generating the meme.")

async def setup(bot):
    await bot.add_cog(Memes(bot))
