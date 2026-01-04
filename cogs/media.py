import discord
from discord import app_commands
from discord.ext import commands
import re
from config.settings import config
from utils.logging import BotLogger

class Media(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="youtube", description="share youtube video with download options")
    @app_commands.describe(link="youtube url")
    async def youtube(self, interaction: discord.Interaction, link: str):
        await interaction.response.defer()

        if config.is_command_disabled("youtube"):
            await interaction.followup.send("The `youtube` command is currently disabled.")
            return

        if "youtube.com" not in link and "youtu.be" not in link:
            await interaction.followup.send("Invalid YouTube link.")
            await BotLogger.log(f"{interaction.user} used /youtube with invalid link", "warning", "command")
            return

        await interaction.followup.send(f"[yt]({link})")

        ss_download = link.replace("youtube.com", "ssyoutube.com").replace("youtu.be", "ssyoutube.com")

        embed = discord.Embed(color=0xFF0000)
        embed.description = f"[Download video (up to 720p)]({ss_download})\n[Upload downloaded video to catbox.moe for permanent share](https://catbox.moe/)"

        await interaction.followup.send(embed=embed)
        await BotLogger.log(
            f"{interaction.user} used /youtube command with link: {link[:50]}{'...' if len(link) > 50 else ''}", 
            "info", "command"
        )

    @app_commands.command(name="reel", description="embeds an insta reel of your choice")
    @app_commands.describe(link="reel url")
    async def reel(self, interaction: discord.Interaction, link: str):
        await interaction.response.defer()

        if config.is_command_disabled("reel"):
            await interaction.followup.send("The `reel` command is currently disabled.")
            return

        modified_link = link.replace("instagram.com", "kkinstagram.com")

        await interaction.followup.send(f"[reel]({modified_link})")
        await BotLogger.log(f"{interaction.user} used /reel command", "info", "output")

    @app_commands.command(name="tiktok", description="embed tiktok url of your choice")
    @app_commands.describe(link="url")
    async def tiktok(self, interaction: discord.Interaction, link: str):
        await interaction.response.defer()

        if config.is_command_disabled("tiktok"):
            await interaction.followup.send("The `tiktok` command is currently disabled.")
            return

        modified_link = re.sub(r"https://.*\.tiktok", "https://d.tnktok", link)

        await interaction.followup.send(f"[tiktok]({modified_link})")
        await BotLogger.log(f"{interaction.user} used /tiktok command", "info", "output")

async def setup(bot):
    await bot.add_cog(Media(bot))