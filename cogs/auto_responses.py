import discord
from discord.ext import commands
import re
from utils.logging import BotLogger

class AutoResponses(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.author == self.bot.user:
            return

        content = message.content.lower()

        if 'faggot' in content:
            try:
                await message.channel.send('https://cdn.discordapp.com/attachments/1279123313519624212/1316546100617805904/attachment-3.gif')
                await BotLogger.log(f"Auto-response triggered by keyword in message from {message.author}", "info", "output")
            except Exception as e:
                await BotLogger.log_error("Error sending gif", e)

        if re.search(r'\brape\b', content):
            try:
                await message.channel.send("https://i.postimg.cc/Z5G9xTvx/rape.webp")
                await BotLogger.log(f"Auto-response triggered by keyword in message from {message.author}", "info", "output")
            except Exception as e:
                await BotLogger.log_error("Error sending rape message", e)

        if re.search(r'\b(hi|hello|hey|wave)\b', content):
            try:
                await message.add_reaction('<a:wave:1166754943785500722>')
                await BotLogger.log(f"Auto-reacted to greeting from {message.author}", "info", "output")
            except Exception as e:
                await BotLogger.log_error("Error reacting to message", e)

async def setup(bot):
    await bot.add_cog(AutoResponses(bot))
