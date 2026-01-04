from discord.ext import commands, tasks
import discord
import time
from config.settings import config
from config.constants import HEARTBEAT_URL, CONFIG_URL, TESTING_CHANNEL_ID
from utils.logging import BotLogger
from utils.formatters import Formatters
from services.api_client import APIClient

class Events(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.send_heartbeat.start()
        self.fetch_config.start()
        self.uptime_status_task.start()

    def cog_unload(self):
        self.send_heartbeat.cancel()
        self.fetch_config.cancel()
        self.uptime_status_task.cancel()

    @commands.Cog.listener()
    async def on_ready(self):
        # Set start time if not set (re-set on reconnect? bot.py sets it on on_ready)
        if config.start_time is None:
             config.start_time = time.time()
             
        msg = f'{self.bot.user} has connected to Discord!'
        await BotLogger.log(msg, "info", "system")
        
        # Fetch config immediately
        await self.fetch_config()

    @tasks.loop(seconds=30)
    async def send_heartbeat(self):
        try:
            uptime = Formatters.get_uptime(config.start_time)
            payload = {"status": "online", "uptime": uptime}
            # Use APIClient
            # Note: APIClient expects response to be JSON or text. 
            # Heartbeat returns 200.
            await APIClient.post(HEARTBEAT_URL, json=payload, headers=config.get_api_headers())
        except Exception as e:
            print(f"Heartbeat error: {e}")

    @send_heartbeat.before_loop
    async def before_heartbeat(self):
        await self.bot.wait_until_ready()

    @tasks.loop(minutes=5)
    async def fetch_config(self):
        try:
            data = await APIClient.get(CONFIG_URL, headers=config.get_api_headers())
            if isinstance(data, dict):
                config.update_config(data)
                print(f"Config updated: prefix={config.prefix}, disabled={config.disabled_commands}")
            else:
                print(f"Config fetch failed: unexpected format")
        except Exception as e:
            print(f"Config fetch error: {e}")

    @fetch_config.before_loop
    async def before_fetch_config(self):
        await self.bot.wait_until_ready()

    @tasks.loop(hours=1)
    async def uptime_status_task(self):
        try:
            # We need to calculate uptime
            if config.start_time is None:
                return

            uptime = Formatters.get_uptime(config.start_time)
            # Parse uptime string back to components or just use math again?
            # Formatters.get_uptime returns "Xd Yh Zm".
            # The original code displayed hours, minutes, seconds in embed.
            # I will replicate logic here.
            
            current_uptime = int(time.time() - config.start_time)
            hours = current_uptime // 3600
            minutes = (current_uptime % 3600) // 60
            seconds = current_uptime % 60
            
            embed = discord.Embed(title="Bot Uptime", color=0x9b59b6)
            embed.set_author(name=self.bot.user.name, icon_url=self.bot.user.display_avatar.url)
            embed.add_field(name="Status", value="🟢 Online", inline=True)
            embed.add_field(name="Uptime", value=f"{hours}h {minutes}m {seconds}s", inline=True)

            channel = self.bot.get_channel(TESTING_CHANNEL_ID)
            if channel:
                await channel.send(embed=embed)
        except Exception as e:
            print(f"Error in uptime task: {e}")

    @uptime_status_task.before_loop
    async def before_uptime_status_task(self):
        await self.bot.wait_until_ready()

async def setup(bot):
    await bot.add_cog(Events(bot))
