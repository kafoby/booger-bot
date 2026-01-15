import discord
from discord import app_commands
from discord.ext import commands
import aiohttp
import asyncio
from datetime import datetime, timedelta
from config.settings import config
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder
from utils.formatters import Formatters
from models.reminder import reminder_manager

class Utility(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="say")
    async def say(self, ctx):
        if config.is_command_disabled("say"):
            await ctx.send("The `say` command is currently disabled.")
            return

        try:
            # message content format: ,say <text>
            text_to_say = ctx.message.content[5:].strip()
            if not text_to_say:
                await ctx.send('Usage: ,say <text>')
                return

            # Sanitize mentions
            text_to_say = text_to_say.replace('<#', '').replace('>', '')
            text_to_say = text_to_say.replace('<@', '').replace('!', '').replace('>', '')

            try:
                await ctx.message.delete()
            except Exception as e:
                await BotLogger.log(f"Failed to delete message: {e}", "warning")
                pass

            await ctx.send(text_to_say)
            await BotLogger.log(
                f"{ctx.author} used ,say command: {text_to_say[:100]}{'...' if len(text_to_say) > 100 else ''}",
                "info", "command"
            )
        except Exception as e:
            await BotLogger.log_error("Error with ,say command", e)

    @commands.command(name="say2")
    async def say2(self, ctx):
        if config.is_command_disabled("say2"):
            await ctx.send("The `say2` command is currently disabled.")
            return

        try:
            parts = ctx.message.content.split(maxsplit=2)
            if len(parts) < 3:
                await ctx.send('Usage: ,say2 @user <message>')
                return

            if not ctx.message.mentions:
                await ctx.send('Please mention a user to send a DM to')
                return

            target_user = ctx.message.mentions[0]
            text_to_send = parts[2]

            try:
                await ctx.message.delete()
            except Exception as e:
                await BotLogger.log(f"Failed to delete message: {e}", "warning")
                pass

            try:
                await target_user.send(text_to_send)
                await BotLogger.log(
                    f"{ctx.author} used ,say2 to DM {target_user.name}: {text_to_send[:100]}{'...' if len(text_to_send) > 100 else ''}",
                    "info", "command"
                )
            except discord.Forbidden:
                await BotLogger.log(f"Failed to send DM to {target_user} - DMs disabled", "error")
        except Exception as e:
            await BotLogger.log_error("Error with ,say2 command", e)

    @app_commands.command(name="info", description="shows bot info and commands list")
    async def info(self, interaction: discord.Interaction):
        await interaction.response.defer()

        if config.is_command_disabled("info"):
            await interaction.followup.send("The `info` command is currently disabled.")
            return

        embed = EmbedBuilder.create_embed(title="Bot Info")
        embed.set_author(name=interaction.client.user.name, icon_url=interaction.client.user.display_avatar.url)
        embed.description = "A retarded Discord bot made by lumiin4 and kfb"
        
        embed.add_field(
            name="Commands List",
            value="[View command list here](https://docs.google.com/document/d/12k-jomc8g4efri6MjKReGAae00r9WVJiBoFdwWnDujY/edit)",
            inline=False
        )
        embed.add_field(
            name="Links",
            value=f"[Bot Dashboard]({config.API_BASE_URL.replace('/api', '')}) | [UptimeBot](https://stats.uptimerobot.com/6neDK1LPEd/)",
            inline=False
        )
        embed.set_footer(text="Made with love ❤️")

        await interaction.followup.send(embed=embed)
        await BotLogger.log(f"{interaction.user} used /info command", "info", "command")

    @app_commands.command(name="weather", description="get current weather for a location")
    @app_commands.describe(location="city name (e.g. London, New York)")
    async def weather(self, interaction: discord.Interaction, location: str):
        await interaction.response.defer()

        if config.is_command_disabled("weather"):
            await interaction.followup.send("The `weather` command is currently disabled.")
            return

        try:
            async with aiohttp.ClientSession() as session:
                # First, geocode the location to get coordinates
                geocode_params = {
                    "name": location,
                    "count": 1,
                    "language": "en",
                    "format": "json"
                }
                async with session.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params=geocode_params
                ) as geo_resp:
                    if geo_resp.status != 200:
                        await interaction.followup.send("Failed to find location.")
                        await BotLogger.log(f"Weather geocoding error: {geo_resp.status}", "error", "command")
                        return
                    geo_data = await geo_resp.json()

                if not geo_data.get("results"):
                    await interaction.followup.send(f"Location '{location}' not found.")
                    return

                result = geo_data["results"][0]
                lat = result["latitude"]
                lon = result["longitude"]
                city_name = result["name"]
                country = result.get("country", "")

                # Now get weather data
                weather_params = {
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m",
                    "temperature_unit": "celsius",
                    "wind_speed_unit": "kmh",
                    "timezone": "auto"
                }
                async with session.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params=weather_params
                ) as weather_resp:
                    if weather_resp.status != 200:
                        await interaction.followup.send("Failed to fetch weather data.")
                        await BotLogger.log(f"Weather API error: {weather_resp.status}", "error", "command")
                        return
                    data = await weather_resp.json()

            current = data["current"]
            temp = current["temperature_2m"]
            humidity = current["relative_humidity_2m"]
            wind = current["wind_speed_10m"]
            code = current["weather_code"]

            weather_descriptions = {
                0: "Clear sky ☀️",
                1: "Mainly clear ☀️",
                2: "Partly cloudy ⛅",
                3: "Overcast ☁️",
                45: "Fog 🌫️",
                48: "Depositing rime fog 🌫️",
                51: "Light drizzle 🌧️",
                53: "Moderate drizzle 🌧️",
                55: "Dense drizzle 🌧️",
                61: "Slight rain 🌧️",
                63: "Moderate rain 🌧️",
                65: "Heavy rain 🌧️",
                71: "Slight snow ❄️",
                73: "Moderate snow ❄️",
                75: "Heavy snow ❄️",
                80: "Slight rain showers 🌦️",
                81: "Moderate rain showers 🌦️",
                82: "Violent rain showers 🌦️",
                95: "Thunderstorm ⛈️"
            }
            description = weather_descriptions.get(code, "Unknown")

            location_display = f"{city_name}, {country}" if country else city_name
            embed = EmbedBuilder.create_embed(title=f"Weather in {location_display}")
            embed.add_field(name="Temperature", value=f"{temp}°C", inline=True)
            embed.add_field(name="Condition", value=description, inline=True)
            embed.add_field(name="Humidity", value=f"{humidity}%", inline=True)
            embed.add_field(name="Wind Speed", value=f"{wind} km/h", inline=True)

            await interaction.followup.send(embed=embed)
            await BotLogger.log(f"{interaction.user} used /weather for location: {location}", "info", "output")

        except Exception as e:
            await BotLogger.log_error("Error with /weather command", e, "command")
            await interaction.followup.send("Location not found or error fetching weather.")

    @app_commands.command(name="remindme", description="Set a reminder")
    @app_commands.describe(
        message="The reminder message",
        time="When should I remind you like 1h, 30m, 2d?"
    )
    async def remindme(self, interaction: discord.Interaction, message: str, time: str):
        await interaction.response.defer()

        if config.is_command_disabled("remindme"):
            await interaction.followup.send("The `remindme` command is currently disabled.")
            return

        seconds = Formatters.parse_time_string(time)
        if not seconds or seconds < 30:
            await interaction.followup.send("Invalid time format or too short (min 30s). Use like 1h, 30m, 2d.")
            return

        remind_time = datetime.now() + timedelta(seconds=seconds)
        user_id = interaction.user.id

        # Add reminder
        reminder_manager.add_reminder(user_id, message, interaction.channel_id, remind_time)

        embed = EmbedBuilder.create_embed(title="Reminder Set!")
        embed.description = f"I'll remind you in **{time}**:\n**{message}**"
        embed.set_footer(text=f"At {remind_time.strftime('%Y-%m-%d %H:%M:%S')}")

        await interaction.followup.send(embed=embed)

        # Wait and then send reminder
        await asyncio.sleep(seconds)

        reminder_embed = EmbedBuilder.create_embed(
            title="⏰ Reminder!",
            description=f"**{message}**",
            color=0xff0000
        )
        reminder_embed.set_footer(text=f"Set {time} ago")

        try:
            await interaction.user.send(embed=reminder_embed)
        except:
            channel = self.bot.get_channel(interaction.channel_id)
            if channel:
                await channel.send(
                    f"{interaction.user.mention} Reminder: **{message}**",
                    embed=reminder_embed
                )

        # Remove reminder after sending
        reminder_manager.remove_reminder(user_id, remind_time.timestamp())

    @app_commands.command(name="reminders", description="List your active reminders")
    async def reminders_list(self, interaction: discord.Interaction):
        await interaction.response.defer()

        if config.is_command_disabled("reminders"):
            await interaction.followup.send("The `reminders` command is currently disabled.")
            return

        user_id = interaction.user.id

        if not reminder_manager.has_reminders(user_id):
            await interaction.followup.send("You have no active reminders.")
            return

        embed = EmbedBuilder.create_embed(title="Your Active Reminders")
        reminders = reminder_manager.get_reminders(user_id)

        for i, r in enumerate(reminders, 1):
            embed.add_field(
                name=f"{i}. {r['message']}",
                value=f"<t:{int(r['time'])}:R>",
                inline=False
            )

        await interaction.followup.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Utility(bot))
