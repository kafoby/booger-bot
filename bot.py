import discord
import os
import aiohttp
import random
import urllib.parse
import spotipy
import yt_dlp
from spotipy.oauth2 import SpotifyClientCredentials
import asyncio
from discord import app_commands
from datetime import timedelta, datetime
from discord.ext import commands, tasks
import re
from petpetgif import petpet
import io
import time
from PIL import Image, ImageDraw, ImageFont
import textwrap

from config.settings import config
from config.constants import *
from utils.logging import BotLogger
from utils.formatters import Formatters
from utils.permissions import PermissionChecker
from core.bot import DiscordBot

TOKEN = config.DISCORD_TOKEN
GITHUB_TOKEN = config.GITHUB_TOKEN
GOOGLE_API_KEY = config.GOOGLE_API_KEY
CSE_ID = config.GOOGLE_CSE_ID
LASTFM_API_KEY = config.LASTFM_API_KEY
BOT_API_KEY = config.BOT_API_KEY

def get_api_headers():
    return config.get_api_headers()

# Legacy bot_config map for compatibility (references config singleton)
class BotConfigProxy:
    def get(self, key, default=None):
        if key == "prefix": return config.prefix
        if key == "disabledCommands": return config.disabled_commands
        if key == "allowedChannels": return config.allowed_channels
        return default
bot_config = BotConfigProxy()

ALLOWED_CHANNELS = config.allowed_channels

# print(f"Token available: {bool(TOKEN)}")

bot = DiscordBot()
tree = bot.tree

# print("Discord bot initialized")


# async def log_to_server(message, level="info", category="system"):
#     """Send log to the web server API"""
#     await BotLogger.log(message, level, category)





# @bot.event
# async def on_message(message):
#
#     if message.author == bot.user:
#         return
#
#     # Use dynamic config for allowed channels, fallback to legacy constant
#     allowed_channels = bot_config.get("allowedChannels",
#                                       []) or ALLOWED_CHANNELS
#     if allowed_channels and message.channel.id not in allowed_channels:
#         # print(f"Ignored message in non-allowed channel: {message.content}")
#         return
#
#     # Check if command is disabled
#     content = message.content
#     prefix = config.prefix
#     if content.startswith(prefix):
#         command_name = content[len(prefix):].split()[0].lower(
#         ) if content[len(prefix):].split() else ""
#         if config.is_command_disabled(command_name):
#             await message.channel.send(
#                 f"The `{command_name}` command is currently disabled.")
#             return
#
#     msg = f"Received message from {message.author}: {message.content}"
#     # print(msg)
#     await log_to_server(msg, "info", "message")

    # Migrated to cogs/admin.py
    # if message.content.startswith(',rapeon'):
    #     if not PermissionChecker.is_admin(message.author.id):
    #         await message.channel.send(
    #             "You are not allowed to use this command.")
    #         await log_to_server(
    #             f"Unauthorized ,rapeon attempt by {message.author}", "warning",
    #             "command")
    #         return
    #
    #     bot.rape_enabled = True
    #     await message.channel.send("Rape mode ON😈")
    #     await log_to_server(f"{message.author} enabled rape mode", "info",
    #                         "command")
    #     return
    #
    # if message.content.startswith(',rapeoff'):
    #     if not PermissionChecker.is_admin(message.author.id):
    #         await message.channel.send(
    #             "You are not allowed to use this command.")
    #         await log_to_server(
    #             f"Unauthorized ,rapeoff attempt by {message.author}",
    #             "warning", "command")
    #         return
    #
    #     bot.rape_enabled = False
    #     await message.channel.send(
    #         "Rape mode OFF <a:cr_asad:1166759175217487902>")
    #     await log_to_server(f"{message.author} disabled rape mode", "info",
    #                         "command")
    #     return
    #
    # if message.content.startswith(',rape '):
    #     if not PermissionChecker.is_admin(message.author.id):
    #         await message.channel.send(
    #             "You are not allowed to use this command.")
    #         return
    #
    #     if not getattr(bot, 'rape_enabled', False):
    #         await message.channel.send(
    #             "The `rape` command is currently disabled.")
    #         return
    #
    #     try:
    #         if not message.mentions:
    #             await message.channel.send('Please mention a user to rape')
    #             return
    #
    #         target_user = message.mentions[0]
    #         author = message.author
    #
    #         async with aiohttp.ClientSession() as session:
    #
    #             search_queries = [
    #                 "rape hentai gif", "rape hentai animated", "yuri rape gif",
    #                 "femboy rape hentai", "cat girl rape hentai",
    #                 "ebony rape hentai"
    #             ]
    #             search_query = random.choice(search_queries)
    #
    #             search_params = {
    #                 "key": GOOGLE_API_KEY,
    #                 "cx": CSE_ID,
    #                 "q": search_query,
    #                 "searchType": "image",
    #                 "num": random.randint(1, 10),
    #                 "start": random.randint(1, 100)
    #             }
    #             async with session.get(
    #                     "https://www.googleapis.com/customsearch/v1",
    #                     params=search_params,
    #                     timeout=aiohttp.ClientTimeout(total=5)) as resp:
    #                 if resp.status != 200:
    #                     await message.channel.send('Error fetching rape image')
    #                     await log_to_server(f"Google API error: {resp.status}",
    #                                         "error")
    #                     return
    #
    #                 data = await resp.json()
    #
    #                 if 'items' not in data or not data['items']:
    #                     await message.channel.send('Could not find rape images'
    #                                                )
    #                     return
    #
    #                 random_result = random.choice(data['items'])
    #                 image_url = random_result.get('link')
    #
    #                 if not image_url:
    #                     await message.channel.send('Could not get image URL')
    #                     return
    #
    #                 embed = discord.Embed(
    #                     title=f"{author.name} raped {target_user.name}",
    #                     color=discord.Color.from_rgb(255, 192, 203))
    #                 embed.set_image(url=image_url)
    #
    #                 await message.channel.send(embed=embed)
    #                 await log_to_server(
    #                     f"{author} used ,rape command on {target_user}",
    #                     "info", "command")
    #                 return
    #     except Exception as e:
    #         print(f"Error with ,rape command: {e}")
    #         await message.channel.send(f'Error: {str(e)}')
    #         await log_to_server(f"Error with ,rape command: {e}", "error")
    #
    # if message.content.startswith(',warn '):
    #     try:
    #         parts = message.content.split(maxsplit=2)
    #         if len(parts) < 3:
    #             await message.channel.send(
    #                 'Usage: ,warn @user <reason>\nExample: ,warn @user spamming'
    #             )
    #             return
    #
    #         if not message.mentions:
    #             await message.channel.send('Please mention a user to warn')
    #             return
    #
    #         target_user = message.mentions[0]
    #         reason = parts[2]
    #
    #         async with aiohttp.ClientSession() as session:
    #             payload = {
    #                 "userId": str(target_user.id),
    #                 "userName": target_user.name,
    #                 "reason": reason
    #             }
    #             async with session.post(WARNS_URL,
    #                                     json=payload,
    #                                     headers=get_api_headers()) as response:
    #                 if response.status == 201:
    #                     await message.channel.send(
    #                         f'{target_user.mention} has been warned for: {reason}'
    #                     )
    #                     await log_to_server(
    #                         f"{message.author} warned {target_user.name} (ID: {target_user.id}) for: {reason}",
    #                         "warning", "moderation")
    #                 else:
    #                     await message.channel.send(
    #                         'Error: Failed to save warning')
    #     except Exception as e:
    #         print(f"Error warning user: {e}")
    #         await message.channel.send(f'Error: {str(e)}')
    #         await log_to_server(f"Error warning user: {e}", "error")
    #
    # if message.content.startswith(',warns'):
    #     try:
    #         async with aiohttp.ClientSession() as session:
    #             async with session.get(WARNS_URL,
    #                                    headers=get_api_headers()) as response:
    #                 if response.status == 200:
    #                     warns = await response.json()
    #
    #                     if message.mentions:
    #                         target_user = message.mentions[0]
    #                         warns = [
    #                             w for w in warns
    #                             if w['userId'] == str(target_user.id)
    #                         ]
    #                         if not warns:
    #                             await message.channel.send(
    #                                 f'No warns found for {target_user.mention}'
    #                             )
    #                             return
    #                         title = f'Warns for {target_user.name}'
    #                     else:
    #                         if not warns:
    #                             await message.channel.send('No warns recorded')
    #                             return
    #                         title = 'All Warns'
    #
    #                     embed = discord.Embed(title=title,
    #                                           color=discord.Color.purple())
    #
    #                     for warn in warns:
    #                         embed.add_field(
    #                             name=
    #                             f"{warn['userName']} (ID: {warn['userId']})",
    #                             value=
    #                             f"**Reason:** {warn['reason']}\n**Date:** {warn['timestamp'][:10]}",
    #                             inline=False)
    #
    #                     await message.channel.send(embed=embed)
    #                     await log_to_server(
    #                         f"{message.author} viewed warns in {message.channel}",
    #                         "info", "command")
    #                 else:
    #                     await message.channel.send(
    #                         'Error: Could not fetch warns')
    #     except Exception as e:
    #         print(f"Error fetching warns: {e}")
    #         await message.channel.send(f'Error: {str(e)}')
    #         await log_to_server(f"Error fetching warns: {e}", "error")

    # Migrated to cogs/utility.py
    # if message.content.startswith(',say '):
    #     try:
    #         text_to_say = message.content[5:].strip()
    #         if not text_to_say:
    #             await message.channel.send('Usage: ,say <text>')
    #             return

    #         text_to_say = text_to_say.replace('<#', '').replace('>', '')
    #         text_to_say = text_to_say.replace('<@',
    #                                           '').replace('!',
    #                                                       '').replace('>', '')

    #         try:
    #             await message.delete()
    #         except Exception as e:
    #             await log_to_server(f"Failed to delete message: {e}")
    #             pass

    #         await message.channel.send(text_to_say)
    #         await log_to_server(
    #             f"{message.author} used ,say command: {text_to_say[:100]}{'...' if len(text_to_say) > 100 else ''}",
    #             "info", "command")
    #     except Exception as e:
    #         print(f"Error with ,say command: {e}")
    #         await log_to_server(f"Error with ,say command: {e}", "error")

    # Migrated to cogs/images.py
    # if message.content.startswith(',cat'):
    #     try:
    #         async with aiohttp.ClientSession() as session:
    #             async with session.get(
    #                     'https://api.thecatapi.com/v1/images/search?mime_types=gif&limit=1'
    #             ) as response:
    #                 if response.status == 200:
    #                     data = await response.json()
    #                     if data and len(data) > 0:
    #                         cat_url = data[0]['url']
    #                         embed = discord.Embed(
    #                             title="Here's a cat for you!",
    #                             color=discord.Color.purple())
    #                         embed.set_image(url=cat_url)
    #                         await message.channel.send(embed=embed)
    #                         await log_to_server(
    #                             f"{message.author} used ,cat command", "info",
    #                             "output")
    #     except Exception as e:
    #         print(f"Error fetching cat gif: {e}")
    #         await log_to_server(f"Error fetching cat gif: {e}", "error")

    # Migrated to cogs/images.py
    # if message.content.startswith(',dog'):
    #     try:
    #         async with aiohttp.ClientSession() as session:
    #             async with session.get(
    #                     'https://random.dog/woof.json?include=gif',
    #                     timeout=aiohttp.ClientTimeout(total=5)) as response:
    #                 if response.status == 200:
    #                     data = await response.json()
    #                     dog_url = data.get('url')
    #                     if dog_url:
    #                         embed = discord.Embed(
    #                             title="Here's a dog for you!",
    #                             color=discord.Color.purple())
    #                         embed.set_image(url=dog_url)
    #                         await message.channel.send(embed=embed)
    #                         await log_to_server(
    #                             f"{message.author} used ,dog command", "info",
    #                             "output")
    #     except Exception as e:
    #         print(f"Error fetching dog gif: {e}")
    #         await log_to_server(f"Error fetching dog gif: {e}", "error")

    # Migrated to cogs/fun.py
    # if message.content.startswith(',gay '):
    #     try:
    #         if not message.mentions:
    #             await message.channel.send('Please mention a user')
    #             return
    #
    #         target_user = message.mentions[0]
    #         gay_percentage = random.randint(0, 100)
    #
    #         embed = discord.Embed(title=f"{target_user.name} Gay Meter",
    #                               description=f"{gay_percentage}% gay",
    #                               color=discord.Color.purple())
    #
    #         if target_user.avatar:
    #             embed.set_thumbnail(url=target_user.avatar.url)
    #
    #         await message.channel.send(embed=embed)
    #         await log_to_server(
    #             f"{message.author} used ,gay command on {target_user.name}: {gay_percentage}%",
    #             "info", "output")
    #     except Exception as e:
    #         print(f"Error with ,gay command: {e}")
    #         await log_to_server(f"Error with ,gay command: {e}", "error")
    #
    # if message.content.startswith(',kiss '):
    #     try:
    #         if not message.mentions:
    #             await message.channel.send('Please mention a user to kiss')
    #             return
    #
    #         target_user = message.mentions[0]
    #         author = message.author
    #
    #         kiss_gifs = [
    #             'https://cdn.nekotina.com/images/AQL8dPyM.gif',
    #         ]
    #
    #         gif_url = random.choice(kiss_gifs)
    #
    #         embed = discord.Embed(
    #             title=f"{author.name} kissed {target_user.name}",
    #             color=discord.Color.purple())
    #         embed.set_image(url=gif_url)
    #
    #         await message.channel.send(embed=embed)
    #         await log_to_server(
    #             f"{author.name} used ,kiss command on {target_user.name}",
    #             "info", "output")
    #     except Exception as e:
    #         print(f"Error with ,kiss command: {e}")
    #         await message.channel.send(f'Error: {str(e)}')
    #         await log_to_server(f"Error with ,kiss command: {e}", "error")
    #
    # if message.content.startswith(',slap '):
    #     try:
    #         if not message.mentions:
    #             await message.channel.send('Please mention a user to slap')
    #             return
    #
    #         target_user = message.mentions[0]
    #         author = message.author
    #
    #         async with aiohttp.ClientSession() as session:
    #
    #             search_queries = [
    #                 "anime girl slap gif", "anime girl slap animated",
    #                 "yuri slap gif", "yuri slap animated",
    #                 "anime cat girl slap gif", "anime cat girl slap animated"
    #             ]
    #             search_query = random.choice(search_queries)
    #
    #             search_params = {
    #                 "key": GOOGLE_API_KEY,
    #                 "cx": CSE_ID,
    #                 "q": search_query,
    #                 "searchType": "image",
    #                 "num": random.randint(1, 10),
    #                 "start": random.randint(1, 100)
    #             }
    #             async with session.get(
    #                     "https://www.googleapis.com/customsearch/v1",
    #                     params=search_params,
    #                     timeout=aiohttp.ClientTimeout(total=5)) as resp:
    #                 if resp.status != 200:
    #                     await message.channel.send('Error fetching slap images'
    #                                                )
    #                     await log_to_server(f"Google API error: {resp.status}",
    #                                         "error")
    #                     return
    #
    #                 data = await resp.json()
    #
    #                 if 'items' not in data or not data['items']:
    #                     await message.channel.send('Could not find slap images'
    #                                                )
    #                     return
    #
    #                 random_result = random.choice(data['items'])
    #                 image_url = random_result.get('link')
    #
    #                 if not image_url:
    #                     await message.channel.send('Could not get image URL')
    #                     return
    #
    #                 embed = discord.Embed(
    #                     title=f"{author.name} slapped {target_user.name}",
    #                     color=discord.Color.purple())
    #                 embed.set_image(url=image_url)
    #
    #                 await message.channel.send(embed=embed)
    #                 await log_to_server(
    #                     f"{author.name} used ,slap command on {target_user.name}",
    #                     "info", "output")
    #     except Exception as e:
    #         print(f"Error with ,slap command: {e}")
    #         await message.channel.send(f'Error: {str(e)}')
    #         await log_to_server(f"Error with ,slap command: {e}", "error")

    # Migrated to cogs/images.py
    # if message.content.startswith(',crocodile'):
    #     try:
    #         async with aiohttp.ClientSession() as session:
    #             search_queries = [
    #                 "crocodile gif", "crocodile animated", "cute crocodile",
    #                 "crocodile meme", "crocodile"
    #             ]
    #             search_query = random.choice(search_queries)

    #             search_params = {
    #                 "key": GOOGLE_API_KEY,
    #                 "cx": CSE_ID,
    #                 "q": search_query,
    #                 "searchType": "image",
    #                 "num": random.randint(5, 10),
    #                 "start": random.randint(1, 50)
    #             }

    #             async with session.get(
    #                     "https://www.googleapis.com/customsearch/v1",
    #                     params=search_params,
    #                     timeout=aiohttp.ClientTimeout(total=10)) as resp:
    #                 if resp.status != 200:
    #                     await message.channel.send(
    #                         "Error fetching crocodile image")
    #                     return

    #                 data = await resp.json()

    #                 if 'items' not in data or not data['items']:
    #                     await message.channel.send(
    #                         "Couldn't find any crocodiles right now")
    #                     return

    #                 random_result = random.choice(data['items'])
    #                 image_url = random_result.get('link')

    #                 if not image_url:
    #                     await message.channel.send("Couldn't get image URL")
    #                     return

    #                 embed = discord.Embed(title="Here is a crocodile for you!",
    #                                       color=discord.Color.purple())
    #                 embed.set_image(url=image_url)

    #                 await message.channel.send(embed=embed)
    #                 await log_to_server(
    #                     f"{message.author} used ,crocodile command", "info",
    #                     "output")
    #     except Exception as e:
    #         print(f"Error with ,crocodile command: {e}")
    #         await message.channel.send(f"Error: {str(e)}")
    #         await log_to_server(f"Error with ,crocodile command: {e}", "error",
    #                             "command")

    # Migrated to cogs/images.py
    # if message.content.startswith(',seal'):
    #     try:
    #         async with aiohttp.ClientSession() as session:
    #             search_queries = [
    #                 "baby harp seal", "harp seal pup", "baby seal gif",
    #                 "harp seal pup gif"
    #             ]
    #             search_query = random.choice(search_queries)

    #             search_params = {
    #                 "key": GOOGLE_API_KEY,
    #                 "cx": CSE_ID,
    #                 "q": search_query,
    #                 "searchType": "image",
    #                 "num": random.randint(5, 10),
    #                 "start": random.randint(1, 50)
    #             }

    #             async with session.get(
    #                     "https://www.googleapis.com/customsearch/v1",
    #                     params=search_params,
    #                     timeout=aiohttp.ClientTimeout(total=10)) as resp:
    #                 if resp.status != 200:
    #                     await message.channel.send("Error fetching seal image")
    #                     return

    #                 data = await resp.json()

    #                 if 'items' not in data or not data['items']:
    #                     await message.channel.send(
    #                         "Couldn't find any seals right now")
    #                     return

    #                 random_result = random.choice(data['items'])
    #                 image_url = random_result.get('link')

    #                 if not image_url:
    #                     await message.channel.send("Couldn't get image URL")
    #                     return

    #                 embed = discord.Embed(
    #                     title="Here is a baby harp seal for you!",
    #                     color=discord.Color.purple())
    #                 embed.set_image(url=image_url)

    #                 await message.channel.send(embed=embed)
    #                 await log_to_server(f"{message.author} used ,seal command",
    #                                     "info", "output")
    #     except Exception as e:
    #         print(f"Error with ,seal command: {e}")
    #         await message.channel.send(f"Error: {str(e)}")
    #         await log_to_server(f"Error with ,seal command: {e}", "error")

    # Migrated to cogs/images.py
    # if message.content.startswith(",pet "):
    #     try:
    #         if not message.mentions:
    #             await message.channel.send("Mention a user to pet")
    #             return
    #
    #         target = message.mentions[0]
    #         author = message.author
    #
    #         avatar_url = target.display_avatar.with_format("png").with_size(
    #             512).url
    #
    #         async with aiohttp.ClientSession() as session:
    #             async with session.get(avatar_url) as resp:
    #                 avatar_bytes = await resp.read()
    #
    #         source = io.BytesIO(avatar_bytes)
    #         dest = io.BytesIO()
    #
    #         petpet.make(source, dest)
    #         dest.seek(0)
    #
    #         embed = discord.Embed(title=f"{author.name} pets {target.name}",
    #                               color=0x9b59b6)
    #         embed.set_image(url="attachment://pet.gif")
    #
    #         await message.channel.send(embed=embed,
    #                                    file=discord.File(dest,
    #                                                      filename="pet.gif"))
    #         await log_to_server(
    #             f"{author.name} used ,pet command on {target.name}", "info",
    #             "output")
    #
    #     except Exception as e:
    #         await message.channel.send(str(e))
    #         await log_to_server(f"Error with ,pet command: {e}", "error",
    #                             "command")

    # Migrated to cogs/utility.py
    # if message.content.startswith(',say2 '):
    #     try:
    #         parts = message.content.split(maxsplit=2)
    #         if len(parts) < 3:
    #             await message.channel.send('Usage: ,say2 @user <message>')
    #             return

    #         if not message.mentions:
    #             await message.channel.send(
    #                 'Please mention a user to send a DM to')
    #             return

    #         target_user = message.mentions[0]
    #         text_to_send = parts[2]

    #         try:
    #             await message.delete()
    #         except Exception as e:
    #             await log_to_server(f"Failed to delete message: {e}")
    #             pass

    #         try:
    #             await target_user.send(text_to_send)
    #             await log_to_server(
    #                 f"{message.author} used ,say2 to DM {target_user.name}: {text_to_send[:100]}{'...' if len(text_to_send) > 100 else ''}",
    #                 "info", "command")
    #         except discord.Forbidden:
    #             await log_to_server(
    #                 f"Failed to send DM to {target_user} - DMs disabled",
    #                 "error")
    #     except Exception as e:
    #         print(f"Error with ,say2 command: {e}")
    #         await log_to_server(f"Error with ,say2 command: {e}", "error")

    # Migrated to cogs/admin.py
    # if message.content.startswith(',timeout'):
    #     try:
    #         parts = message.content.split()
    #         if len(parts) < 3:
    #             await message.channel.send(
    #                 'Usage: ,timeout @user <duration>\nExample: ,timeout @user 10m (or 30s, 1h)'
    #             )
    #             return
    #
    #         if not message.mentions:
    #             await message.channel.send('Please mention a user to timeout')
    #             return
    #
    #         target_user = message.mentions[0]
    #         duration_str = parts[2]
    #
    #         duration_value = int(''.join(c for c in duration_str
    #                                      if c.isdigit()))
    #         duration_unit = ''.join(c for c in duration_str
    #                                 if c.isalpha()).lower()
    #
    #         if duration_unit == 'm':
    #             timeout_duration = timedelta(minutes=duration_value)
    #         elif duration_unit == 's':
    #             timeout_duration = timedelta(seconds=duration_value)
    #         elif duration_unit == 'h':
    #             timeout_duration = timedelta(hours=duration_value)
    #         else:
    #             await message.channel.send(
    #                 'Invalid duration. Use format: 10m, 30s, or 1h')
    #             return
    #
    #         await target_user.timeout(timeout_duration,
    #                                   reason="Timed out by bot command")
    #         await message.channel.send(
    #             f'{target_user.mention} has been timed out for {duration_str}')
    #         await log_to_server(
    #             f"{message.author} timed out {target_user.name} (ID: {target_user.id}) for {duration_str}",
    #             "warning", "moderation")
    #     except Exception as e:
    #         print(f"Error timing out user: {e}")
    #         await message.channel.send(f'Error: {str(e)}')
    #         await log_to_server(f"Error timing out user: {e}", "error")

    # Migrated to cogs/fun.py
    # if message.content.startswith(',diddle '):
    #     try:
    #         if not message.mentions:
    #             await message.channel.send("Please mention a user to diddle.")
    #             return
    #
    #         target = message.mentions[0]
    #         author = message.author
    #
    #         async with aiohttp.ClientSession() as session:
    #             params = {
    #                 "key": GOOGLE_API_KEY,
    #                 "cx": CSE_ID,
    #                 "searchType": "image",
    #                 "q": "diddy gif",
    #                 "fileType": "gif",
    #                 "num": 10
    #             }
    #
    #             async with session.get(
    #                     "https://www.googleapis.com/customsearch/v1",
    #                     params=params,
    #                     timeout=30) as resp:
    #                 if resp.status != 200:
    #                     await message.channel.send("Error fetching Diddy GIFs."
    #                                                )
    #                     return
    #                 data = await resp.json()
    #
    #         gif_items = [
    #             item["link"] for item in data.get("items", [])
    #             if item.get("mime") == "image/gif"
    #         ]
    #
    #         if not gif_items:
    #             await message.channel.send(
    #                 "Couldn't find any Diddy GIFs right now.")
    #             return
    #
    #         gif_url = random.choice(gif_items)
    #
    #         embed = discord.Embed(title=f"{author.name} diddled {target.name}",
    #                               color=discord.Color.purple())
    #         embed.set_image(url=gif_url)
    #
    #         await message.channel.send(embed=embed)
    #         await log_to_server(
    #             f"{author.name} used ,diddle command on {target.name}", "info",
    #             "output")
    #
    #     except Exception as e:
    #         print(f"Error with ,diddle command: {e}")
    #         await message.channel.send(
    #             "Something went wrong while fetching the GIF.")
    #         await log_to_server(f"Error with ,diddle command: {e}", "error",
    #                             "command")

    # Migrated to cogs/music.py
    # if message.content.startswith(',fmset '):
    #     try:
    #         lfm_username = message.content[7:].strip()
    #         if not lfm_username:
    #             await message.channel.send('Usage: ,fmset <lastfm_username>')
    #             return
    #
    #         async with aiohttp.ClientSession() as session:
    #             payload = {
    #                 "discordUserId": str(message.author.id),
    #                 "lastfmUsername": lfm_username
    #             }
    #             async with session.post(
    #                     LFM_URL,
    #                     json=payload,
    #                     headers=get_api_headers(),
    #                     timeout=aiohttp.ClientTimeout(total=10)) as response:
    #                 if response.status in [200, 201]:
    #                     await message.channel.send(
    #                         f'Last.fm account set to `{lfm_username}`')
    #                     await log_to_server(
    #                         f"{message.author} set Last.fm account to {lfm_username}",
    #                         "info", "command")
    #                 else:
    #                     await message.channel.send(
    #                         'Error setting Last.fm account')
    #     except Exception as e:
    #         print(f"Error with ,fmset command: {e}")
    #         await log_to_server(f"Error with ,fmset command: {e}", "error")

    # Migrated to cogs/memes.py
    # if message.content.strip().lower() == ',quote' and message.reference:
    #     try:
    #         replied = await message.channel.fetch_message(
    #             message.reference.message_id)
    #
    #         author = replied.author
    #         content = replied.content.strip()
    #         if not content:
    #             await message.channel.send(
    #                 "The replied message could not be quoted, try again!")
    #             return
    #
    #         avatar_url = str(author.display_avatar.url)
    #
    #         async with aiohttp.ClientSession() as session:
    #             async with session.get(avatar_url) as resp:
    #                 if resp.status != 200:
    #                     await message.channel.send("Failed to fetch avatar.")
    #                     return
    #                 avatar_data = await resp.read()
    #
    #         avatar = Image.open(io.BytesIO(avatar_data)).resize(
    #             (240, 240)).convert("RGBA")
    #
    #         # Create wider rectangular image for inspirational quote aesthetic
    #         img = Image.new("RGB", (1200, 500), color=(20, 20, 20))
    #         draw = ImageDraw.Draw(img)
    #
    #         # Draw rounded rectangle background
    #         draw.rounded_rectangle((20, 20, 1180, 480),
    #                                radius=30,
    #                                fill=(40, 40, 40))
    #
    #         # Position avatar on the left side
    #         avatar_x = 50
    #         avatar_y = (500 - 240) // 2
    #         img.paste(avatar, (avatar_x, avatar_y),
    #                   avatar if avatar.mode == 'RGBA' else None)
    #
    #         # Load fonts - try serif for fancy inspirational feel
    #         try:
    #             font = ImageFont.truetype(
    #                 "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 56)
    #             attr_font = ImageFont.truetype(
    #                 "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 32)
    #         except:
    #             try:
    #                 font = ImageFont.truetype("arial.ttf", 56)
    #                 attr_font = ImageFont.truetype("arial.ttf", 32)
    #             except:
    #                 font = ImageFont.load_default()
    #                 attr_font = ImageFont.load_default()
    #
    #         # Format quote with quotation marks
    #         quoted_text = f'"{content}"'
    #         wrapped_text = textwrap.fill(quoted_text, width=20)
    #
    #         # Center the quote text both horizontally and vertically
    #         bbox = draw.multiline_textbbox((0, 0), wrapped_text, font=font)
    #         text_width = bbox[2] - bbox[0]
    #         text_height = bbox[3] - bbox[1]
    #         text_x = 310 + (1200 - 310 - text_width) // 2
    #         text_y = (500 - text_height) // 2
    #
    #         draw.multiline_text((text_x, text_y),
    #                             wrapped_text,
    #                             font=font,
    #                             fill=(255, 255, 255),
    #                             align="center")
    #
    #         # Add attribution with em dash
    #         attribution = f"— {author.name}"
    #         attr_bbox = draw.textbbox((0, 0), attribution, font=attr_font)
    #         attr_width = attr_bbox[2] - attr_bbox[0]
    #         attr_x = 310 + (1200 - 310 - attr_width) // 2
    #
    #         draw.text((attr_x, text_y + text_height + 15),
    #                   attribution,
    #                   font=attr_font,
    #                   fill=(200, 200, 200))
    #
    #         buffer = io.BytesIO()
    #         img.save(buffer, format="PNG")
    #         buffer.seek(0)
    #
    #         embed = discord.Embed(color=0x9b59b6)
    #         embed.set_image(url="attachment://quote.png")
    #
    #         await message.channel.send(embed=embed,
    #                                    file=discord.File(buffer,
    #                                                      filename="quote.png"))
    #         await log_to_server(
    #             f"{message.author} used ,quote command on message by {author.name}",
    #             "info", "output")
    #
    #     except Exception as e:
    #         await message.channel.send("Something went wrong while quoting.")
    #         await log_to_server(f"Error with ,quote command: {e}", "error",
    #                             "command")

    # Migrated to cogs/music.py
    # if message.content.startswith(',fm'):
    #     try:
    #         if not LASTFM_API_KEY:
    #             await message.channel.send('Last.fm API key not configured')
    #             return
    #
    #         target_user = message.mentions[
    #             0] if message.mentions else message.author
    #
    #         async with aiohttp.ClientSession() as session:
    #             print(
    #                 f"Fetching LFM data for user {target_user.id} from {LFM_URL}/{target_user.id}"
    #             )
    #             async with session.get(
    #                     f'{LFM_URL}/{target_user.id}',
    #                     headers=get_api_headers(),
    #                     timeout=aiohttp.ClientTimeout(total=10)) as response:
    #                 print(f"LFM response status: {response.status}")
    #                 if response.status != 200:
    #                     error_text = await response.text()
    #                     print(f"LFM error response: {error_text}")
    #                     await message.channel.send(
    #                         f'{target_user.mention} has not set their Last.fm account. Use `,fmset <username>`'
    #                     )
    #                     return
    #
    #                 connection = await response.json()
    #                 print(f"LFM connection data: {connection}")
    #                 lfm_username = connection.get('lastfmUsername')
    #                 if not lfm_username:
    #                     await message.channel.send(
    #                         f'{target_user.mention} has not set their Last.fm account. Use `,fmset <username>`'
    #                     )
    #                     return
    #
    #             lfm_params = {
    #                 'method': 'user.getRecentTracks',
    #                 'user': lfm_username,
    #                 'api_key': LASTFM_API_KEY,
    #                 'format': 'json',
    #                 'limit': '1'
    #             }
    #             async with session.get('https://ws.audioscrobbler.com/2.0/',
    #                                    params=lfm_params,
    #                                    timeout=aiohttp.ClientTimeout(
    #                                        total=10)) as lfm_response:
    #                 if lfm_response.status != 200:
    #                     await message.channel.send(
    #                         'Error fetching Last.fm data')
    #                     return
    #
    #                 lfm_data = await lfm_response.json()
    #
    #                 if 'recenttracks' not in lfm_data or not lfm_data[
    #                         'recenttracks']['track']:
    #                     await message.channel.send(
    #                         f'{target_user.mention} has no recent tracks')
    #                     return
    #
    #                 track = lfm_data['recenttracks']['track']
    #                 if isinstance(track, list):
    #                     track = track[0]
    #
    #                 track_name = track.get('name', 'Unknown')
    #                 artist_name = track['artist']['#text'] if isinstance(
    #                     track['artist'], dict) else track['artist']
    #                 cover_url = None
    #                 if 'image' in track:
    #                     for img in track['image']:
    #                         if img['size'] == 'large':
    #                             cover_url = img['#text']
    #                             break
    #
    #                 user_params = {
    #                     'method': 'user.getInfo',
    #                     'user': lfm_username,
    #                     'api_key': LASTFM_API_KEY,
    #                     'format': 'json'
    #                 }
    #                 scrobbles = "Unknown"
    #                 try:
    #                     async with session.get(
    #                             'https://ws.audioscrobbler.com/2.0/',
    #                             params=user_params,
    #                             timeout=aiohttp.ClientTimeout(
    #                                 total=10)) as user_response:
    #                         if user_response.status == 200:
    #                             user_data = await user_response.json()
    #                             if 'user' in user_data:
    #                                 scrobbles = user_data['user'].get(
    #                                     'playcount', 'Unknown')
    #                 except Exception as e:
    #                     await log_to_server(
    #                         f"Failed to fetch scrobble count: {e}", "warn")
    #
    #                 album_name = "Unknown"
    #                 if 'album' in track:
    #                     album_name = track['album']['#text'] if isinstance(
    #                         track['album'], dict) else track['album']
    #
    #                 track_url = f"https://www.last.fm/music/{urllib.parse.quote(artist_name)}/+{urllib.parse.quote(track_name)}"
    #
    #                 embed = discord.Embed(
    #                     description=
    #                     f"[**{track_name}**]({track_url})\n{artist_name} • {album_name}\n\n{scrobbles} total scrobbles",
    #                     color=discord.Color.purple())
    #
    #                 if target_user.avatar:
    #                     embed.set_author(
    #                         name=f"Now playing - {target_user.display_name}",
    #                         icon_url=target_user.avatar.url)
    #                 else:
    #                     embed.set_author(
    #                         name=f"Now playing - {target_user.display_name}")
    #
    #                 if cover_url:
    #                     embed.set_thumbnail(url=cover_url)
    #
    #                 msg = await message.channel.send(embed=embed)
    #
    #                 try:
    #                     await msg.add_reaction('👍')
    #                     await msg.add_reaction('👎')
    #                 except Exception as e:
    #                     await log_to_server(f"Failed to add reactions: {e}")
    #                     pass
    #
    #                 await log_to_server(
    #                     f"{message.author} used ,fm command to view {target_user.name}'s now playing: {track_name} by {artist_name}",
    #                     "info", "output")
    #     except Exception as e:
    #         print(f"Error with ,fm command: {e}")
    #         await message.channel.send(f'Error: {str(e)}')
    #         await log_to_server(f"Error with ,fm command: {e}", "error")

    # Migrated to cogs/auto_responses.py
    # if 'faggot' in message.content.lower():
    #     try:
    #         await message.channel.send(
    #             'https://cdn.discordapp.com/attachments/1279123313519624212/1316546100617805904/attachment-3.gif'
    #         )
    #         await log_to_server(
    #             f"Auto-response triggered by keyword in message from {message.author}",
    #             "info", "output")
    #     except Exception as e:
    #         print(f"Error sending gif: {e}")
    #         await log_to_server(f"Error sending gif: {e}", "error")
    #
    # if re.search(r'\brape\b', message.content.lower()):
    #     try:
    #         await message.channel.send(
    #             "https://i.postimg.cc/Z5G9xTvx/rape.webp")
    #         await log_to_server(
    #             f"Auto-response triggered by keyword in message from {message.author}",
    #             "info", "output")
    #     except Exception as e:
    #         print(f"Error sending rape message: {e}")
    #         await log_to_server(f"Error sending rape message: {e}", "error")
    #
    # if re.search(r'\b(hi|hello|hey|wave)\b', message.content.lower()):
    #     try:
    #         await message.add_reaction('<a:wave:1166754943785500722>')
    #         await log_to_server(
    #             f"Auto-reacted to greeting from {message.author}", "info",
    #             "output")
    #     except Exception as e:
    #         print(f"Error reacting to message: {e}")
    #         await log_to_server(f"Error reacting to message: {e}", "error")


# Migrated to cogs/media.py
# @tree.command(name="youtube",
#               description="share youtube video with download options")
# @app_commands.describe(link="youtube url")
# async def youtube(interaction: discord.Interaction, link: str):
#     await interaction.response.defer()

#     if config.is_command_disabled("youtube"):
#         await interaction.followup.send(
#             "The `youtube` command is currently disabled.")
#         return

#     if "youtube.com" not in link and "youtu.be" not in link:
#         await interaction.followup.send("Invalid YouTube link.")
#         await log_to_server(
#             f"{interaction.user} used /youtube with invalid link", "warning",
#             "command")
#         return

#     await interaction.followup.send(f"[yt]({link})")

#     ss_download = link.replace("youtube.com", "ssyoutube.com").replace(
#         "youtu.be", "ssyoutube.com")

#     embed = discord.Embed(color=0xFF0000)
#     embed.description = f"[Download video (up to 720p)]({ss_download})\n[Upload downloaded video to catbox.moe for permanent share](https://catbox.moe/)"

#     await interaction.followup.send(embed=embed)
#     await log_to_server(
#         f"{interaction.user} used /youtube command with link: {link[:50]}{'...' if len(link) > 50 else ''}",
#         "info", "command")


# Migrated to cogs/search.py
# @tree.command(name="lumsearch", description="Search Google")
# @app_commands.describe(query="What do you want to search on Google?")
# async def search(interaction: discord.Interaction, query: str):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("lumsearch"):
#         await interaction.followup.send(
#             "The `lumsearch` command is currently disabled.")
#         return
#
#     try:
#         async with aiohttp.ClientSession() as session:
#             params = {
#                 "key": GOOGLE_API_KEY,
#                 "cx": CSE_ID,
#                 "q": query,
#                 "num": 5
#             }
#             async with session.get(
#                     "https://www.googleapis.com/customsearch/v1",
#                     params=params) as resp:
#                 if resp.status != 200:
#                     await interaction.followup.send(
#                         "Error contacting Google API.")
#                     await log_to_server(
#                         f"/lumsearch API error for query '{query}' by {interaction.user}",
#                         "error", "command")
#                     return
#                 data = await resp.json()
#
#         items = data.get("items", [])
#         if not items:
#             await interaction.followup.send("No results found for your query.")
#             await log_to_server(
#                 f"{interaction.user} used /lumsearch with query '{query}' - no results",
#                 "info", "output")
#             return
#
#         embed = discord.Embed(title="Google Results",
#                               description=f"Top 5 results for: **{query}**",
#                               color=discord.Color.purple())
#
#         for i, item in enumerate(items[:5], 1):
#             title = item.get("title", "No title")
#             link = item.get("link", "")
#             snippet = item.get("snippet", "No description available.")
#             embed.add_field(name=f"{i}. {title}",
#                             value=f"[Link]({link})\n{snippet}",
#                             inline=False)
#
#         await interaction.followup.send(embed=embed)
#         await log_to_server(
#             f"{interaction.user} used /lumsearch with query: {query[:100]}{'...' if len(query) > 100 else ''}",
#             "info", "output")
#
#     except Exception as e:
#         print(f"/lumsearch error: {e}")
#         await interaction.followup.send("Something went wrong while searching."
#                                         )
#         await log_to_server(f"Error with /lumsearch command: {e}", "error",
#                             "command")


# Migrated to cogs/media.py
# @tree.command(name="reel", description="embeds an insta reel of your choice")
# @app_commands.describe(link="reel url")
# async def reel(interaction: discord.Interaction, link: str):
#     await interaction.response.defer()

#     if config.is_command_disabled("reel"):
#         await interaction.followup.send(
#             "The `reel` command is currently disabled.")
#         return

#     modified_link = link.replace("instagram.com", "kkinstagram.com")

#     await interaction.followup.send(f"[reel]({modified_link})")
#     await log_to_server(f"{interaction.user} used /reel command", "info",
#                         "output")


# Migrated to cogs/media.py
# @tree.command(name="tiktok", description="embed tiktok url of your choice")
# @app_commands.describe(link="url")
# async def tiktok(interaction: discord.Interaction, link: str):
#     await interaction.response.defer()

#     if config.is_command_disabled("tiktok"):
#         await interaction.followup.send(
#             "The `tiktok` command is currently disabled.")
#         return

#     # modified_link = (
#     # link.replace("vm.tiktok.com", "d.tnktok.com")
#     #     .replace("www.tiktok.com", "d.tnktok.com")
#     #     .replace("tiktok.com", "d.tnktok.com")
#     #     .replace("vt.tiktok.com", "d.tnktok.com")
#     # )
#     modified_link = re.sub(r"https://.*\.tiktok", "https://d.tnktok", link)

#     await interaction.followup.send(f"[tiktok]({modified_link})")
#     await log_to_server(f"{interaction.user} used /tiktok command", "info",
#                         "output")


yt_dlp.utils.bug_reports_message = lambda: ''


# Migrated to cogs/search.py
# @tree.command(name="github", description="search stuff up on github")
# @app_commands.describe(query="what do you want to search?",
#                        type="repo (default), code, or user")
# async def github(interaction: discord.Interaction,
#                  query: str,
#                  type: str = "repo"):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("github"):
#         await interaction.followup.send(
#             "The `github` command is currently disabled.")
#         return
#
#     if type not in ["repo", "code", "user"]:
#         await interaction.followup.send(
#             "Type must be 'repo', 'code', or 'user'.")
#         return
#
#     search_type = "repositories" if type == "repo" else "code" if type == "code" else "users"
#
#     try:
#         async with aiohttp.ClientSession() as session:
#             url = f"https://api.github.com/search/{search_type}"
#             params = {"q": query, "per_page": 5}
#             headers = {
#                 "Accept": "application/vnd.github.v3+json",
#                 "Authorization": f"token {GITHUB_TOKEN}"
#             }
#             async with session.get(url, params=params,
#                                    headers=headers) as resp:
#                 if resp.status != 200:
#                     await interaction.followup.send(
#                         "Error contacting GitHub API (check token or rate limit)."
#                     )
#                     return
#                 data = await resp.json()
#
#         items = data.get("items", [])
#         if not items:
#             await interaction.followup.send("No results found.")
#             return
#
#         embed = discord.Embed(title="GitHub Search Results", color=0x9b59b6)
#         embed.description = f"Top 5 {type} results for: **{query}**"
#
#         for i, item in enumerate(items[:5], 1):
#             if type == "repo":
#                 name = item["full_name"]
#                 desc = item.get("description", "No description")
#                 url = item["html_url"]
#                 embed.add_field(name=f"{i}. {name}",
#                                 value=f"{desc}\n[View on GitHub]({url})",
#                                 inline=False)
#             elif type == "code":
#                 repo = item["repository"]["full_name"]
#                 path = item["path"]
#                 url = item["html_url"]
#                 embed.add_field(name=f"{i}. {repo} → {path}",
#                                 value=f"[View code]({url})",
#                                 inline=False)
#             elif type == "user":
#                 login = item["login"]
#                 url = item["html_url"]
#                 embed.add_field(name=f"{i}. @{login}",
#                                 value=f"[View profile]({url})",
#                                 inline=False)
#
#         await interaction.followup.send(embed=embed)
#         await log_to_server(
#             f"{interaction.user} used /github to search {type}: {query[:100]}{'...' if len(query) > 100 else ''}",
#             "info", "output")
#
#     except Exception as e:
#         await interaction.followup.send(
#             "Something went wrong while searching GitHub.")
#         await log_to_server(f"Error with /github command: {e}", "error",
#                             "command")


# Migrated to cogs/search.py
# @tree.command(name="stackoverflow", description="search on stack overflow")
# @app_commands.describe(query="what do you want to search?")
# async def so(interaction: discord.Interaction, query: str):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("stackoverflow"):
#         await interaction.followup.send(
#             "The `stackoverflow` command is currently disabled.")
#         return
#
#     try:
#         async with aiohttp.ClientSession() as session:
#             url = "https://api.stackexchange.com/2.3/search/advanced"
#             params = {
#                 "site": "stackoverflow",
#                 "order": "desc",
#                 "sort": "relevance",
#                 "q": query,
#                 "pagesize": 5
#             }
#             async with session.get(url, params=params) as resp:
#                 if resp.status != 200:
#                     await interaction.followup.send(
#                         "Error contacting Stack Exchange API.")
#                     return
#                 data = await resp.json()
#
#         items = data.get("items", [])
#         if not items:
#             await interaction.followup.send("No results found.")
#             return
#
#         embed = discord.Embed(title="Stack Overflow Results", color=0x9b59b6)
#         embed.description = f"Top 5 questions for: **{query}**"
#
#         for i, item in enumerate(items[:5], 1):
#             title = item["title"]
#             url = item["link"]
#             votes = item["score"]
#             answers = item["answer_count"]
#             answered = "✅" if item["is_answered"] else "❌"
#             embed.add_field(
#                 name=
#                 f"{i}. {title} ({votes} votes, {answers} answers {answered})",
#                 value=f"[View question]({url})",
#                 inline=False)
#
#         await interaction.followup.send(embed=embed)
#         await log_to_server(
#             f"{interaction.user} used /stackoverflow with query: {query[:100]}{'...' if len(query) > 100 else ''}",
#             "info", "output")
#
#     except Exception as e:
#         await interaction.followup.send(
#             "Something went wrong while searching Stack Overflow.")
#         await log_to_server(f"Error with /stackoverflow command: {e}", "error",
#                             "command")


# Migrated to cogs/ai.py
# @tree.command(name="askgpt", description="ask chatgpt a question")
# @app_commands.describe(question="Your question:")
# async def askchatgpt(interaction: discord.Interaction, question: str):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("askgpt"):
#         await interaction.followup.send(
#             "The `askgpt` command is currently disabled.")
#         return
#
#     openai_key = os.getenv('OPENAI_API_KEY')
#     if not openai_key:
#         await interaction.followup.send("OpenAI API key not configured.")
#         return
#
#     try:
#         async with aiohttp.ClientSession() as session:
#             headers = {
#                 "Authorization": f"Bearer {openai_key}",
#                 "Content-Type": "application/json"
#             }
#             payload = {
#                 "model":
#                 "gpt-4o-mini",
#                 "messages": [{
#                     "role":
#                     "system",
#                     "content":
#                     "You are ChatGPT, a helpful AI assistant that was made by lumiin."
#                 }, {
#                     "role": "user",
#                     "content": question
#                 }],
#                 "temperature":
#                 0.7
#             }
#
#             async with session.post(
#                     "https://api.openai.com/v1/chat/completions",
#                     json=payload,
#                     headers=headers) as resp:
#                 if resp.status != 200:
#                     await interaction.followup.send(
#                         "Error contacting OpenAI API.")
#                     return
#                 data = await resp.json()
#
#         answer = data["choices"][0]["message"]["content"]
#
#         if len(answer) > 2000:
#             answer = answer[:1997] + "..."
#
#         embed = discord.Embed(title="ChatGPT Answer",
#                               description=answer,
#                               color=0x9b59b6)
#         embed.set_footer(text=f"Asked by {interaction.user.display_name}")
#
#         await interaction.followup.send(embed=embed)
#         await log_to_server(
#             f"{interaction.user} used /askgpt with question: {question[:100]}{'...' if len(question) > 100 else ''}",
#             "info", "output")
#
#     except Exception as e:
#         await interaction.followup.send(
#             "Something went wrong while asking ChatGPT.")
#         await log_to_server(f"Error with /askgpt command: {e}", "error",
#                             "command")
#
#
# @tree.command(name="askgrok", description="ask grok something")
# @app_commands.describe(question="your question")
# async def askgrok(interaction: discord.Interaction, question: str):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("askgrok"):
#         await interaction.followup.send(
#             "The `askgrok` command is currently disabled.")
#         return
#
#     grok_key = os.getenv('GROK_API_KEY')
#     if not grok_key:
#         await interaction.followup.send("Grok API key not configured.")
#         return
#
#     try:
#         async with aiohttp.ClientSession() as session:
#             headers = {
#                 "Authorization": f"Bearer {grok_key}",
#                 "Content-Type": "application/json"
#             }
#             payload = {
#                 "model": "grok-4-1-fast",  # Updated model name
#                 "messages": [{
#                     "role": "user",
#                     "content": question
#                 }],
#                 "temperature": 0.8
#             }
#
#             async with session.post("https://api.x.ai/v1/chat/completions",
#                                     json=payload,
#                                     headers=headers) as resp:
#                 if resp.status != 200:
#                     text = await resp.text()
#                     await interaction.followup.send(
#                         f"API error {resp.status}: {text}")
#                     return
#                 data = await resp.json()
#
#         answer = data["choices"][0]["message"]["content"]
#         if len(answer) > 2000:
#             answer = answer[:1997] + "..."
#
#         embed = discord.Embed(title="Grok", description=answer, color=0x9b59b6)
#         embed.set_footer(text=f"Asked by {interaction.user.display_name}")
#
#         await interaction.followup.send(embed=embed)
#         await log_to_server(
#             f"{interaction.user} used /askgrok with question: {question[:100]}{'...' if len(question) > 100 else ''}",
#             "info", "output")
#
#     except Exception as e:
#         await interaction.followup.send(f"Error: {str(e)}")
#         await log_to_server(f"Error with /askgrok command: {e}", "error",
#                             "command")
#
#
# @tree.command(name="translate", description="translate text of your choice")
# @app_commands.describe(
#     text="text to translate",
#     target="target language code (e.g. en, es, fr, ja) - default: en")
# async def translate(interaction: discord.Interaction,
#                     text: str,
#                     target: str = "en"):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("translate"):
#         await interaction.followup.send(
#             "The `translate` command is currently disabled.")
#         return
#
#     try:
#         params = {
#             "client": "gtx",
#             "sl": "auto",
#             "tl": target.lower(),
#             "dt": "t",
#             "q": text
#         }
#
#         async with aiohttp.ClientSession() as session:
#             async with session.get(
#                     "https://translate.googleapis.com/translate_a/single",
#                     params=params) as resp:  #no more libretranslate
#                 if resp.status != 200:
#                     await interaction.followup.send("Translation error.")
#                     await log_to_server(
#                         f"Translation API error: {resp.status}", "error",
#                         "command")
#                     return
#                 data = await resp.json()
#
#         translated = "".join(
#             [sentence[0] for sentence in data[0] if sentence[0]])
#
#         flags = {
#             "en": "🇬🇧",
#             "es": "🇪🇸",
#             "fr": "🇫🇷",
#             "de": "🇩🇪",
#             "ja": "🇯🇵",
#             "ru": "🇷🇺",
#             "zh": "🇨🇳",
#             "ar": "🇸🇦"
#         }
#         flag = flags.get(target.lower(), "🌐")
#
#         embed = discord.Embed(title=f"Translation {flag}", color=0x9b59b6)
#         embed.add_field(name="Original", value=text, inline=False)
#         embed.add_field(name=f"To {target.upper()}",
#                         value=translated,
#                         inline=False)
#
#         await interaction.followup.send(embed=embed)
#         await log_to_server(
#             f"{interaction.user} used /translate to translate text to {target}: '{text[:50]}{'...' if len(text) > 50 else ''}'",
#             "info", "output")
#
#     except Exception as e:
#         await interaction.followup.send(
#             "Something went wrong with translation.")
#         await log_to_server(f"Error with /translate command: {e}", "error",
#                             "command")


# Migrated to cogs/music.py
# ytdl_format_options = {
#     'format': 'bestaudio/best',
#     'restrictfilenames': True,
#     'noplaylist': True,
#     'nocheckcertificate': True,
#     'ignoreerrors': False,
#     'quiet': True,
#     'no_warnings': True,
#     'default_search': 'ytsearch',
#     'source_address': '0.0.0.0'
# }
#
# ffmpeg_options = {
#     'before_options':
#     '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
#     'options': '-vn'
# }
#
# ytdl = yt_dlp.YoutubeDL(ytdl_format_options)
#
# SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
# SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
#
# sp = None
# if SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET:
#     sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
#         client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET))
#
#
# class YTDLSource(discord.PCMVolumeTransformer):
#
#     def __init__(self, source, *, data, volume=0.5):
#         super().__init__(source, volume)
#         self.data = data
#         self.title = data.get('title')
#         self.url = data.get('url')
#
#     @classmethod
#     async def from_url(cls, url, *, loop, stream=True):
#         data = await loop.run_in_executor(
#             None, lambda: ytdl.extract_info(url, download=not stream))
#         if 'entries' in data:
#             data = data['entries'][0]
#         source = discord.FFmpegPCMAudio(data['url'], **ffmpeg_options)
#         return cls(source, data=data)
#
#
# @tree.command(name="playspotify",
#               description="Play a song from Spotify or YouTube")
# @app_commands.describe(query="Spotify track link or song name")
# async def playspotify(interaction: discord.Interaction, query: str):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("playspotify"):
#         await interaction.followup.send(
#             "The `playspotify` command is currently disabled.")
#         return
#
#     if not interaction.user.voice:
#         await interaction.followup.send("You must be in a voice channel.")
#         return
#
#     channel = interaction.user.voice.channel
#     vc = interaction.guild.voice_client
#
#     for _ in range(3):
#         try:
#             if vc is None:
#                 vc = await channel.connect(reconnect=True)
#             elif vc.channel != channel:
#                 await vc.move_to(channel)
#             break
#         except Exception:
#             if vc:
#                 vc.cleanup()
#                 vc = None
#             await asyncio.sleep(2)
#     else:
#         await interaction.followup.send("Failed to connect to voice.")
#         return
#
#     if "spotify" in query:
#         if not sp:
#             await interaction.followup.send("Spotify is not configured.")
#             return
#         try:
#             track_id = None
#             if "spotify:track:" in query:
#                 track_id = query.split("spotify:track:")[1].split("?")[0]
#             elif "open.spotify.com/track/" in query:
#                 track_id = query.split("open.spotify.com/track/")[1].split(
#                     "?")[0]
#
#             if not track_id:
#                 await interaction.followup.send(
#                     "Invalid Spotify track link format.")
#                 return
#
#             track = sp.track(track_id)
#             search = f"{track['name']} {track['artists'][0]['name']}"
#         except Exception as e:
#             print(f"Spotify parsing error: {e}")
#             await interaction.followup.send("Invalid Spotify track link.")
#             return
#     else:
#         search = query
#
#     try:
#         player = await YTDLSource.from_url(search,
#                                            loop=interaction.client.loop,
#                                            stream=True)
#         if vc.is_playing() or vc.is_paused():
#             vc.stop()
#         vc.play(player)
#         await interaction.followup.send(f"Now playing: **{player.title}**")
#         await log_to_server(
#             f"{interaction.user} used /playspotify to play: {player.title}",
#             "info", "output")
#     except Exception as e:
#         await interaction.followup.send(f"Playback error: {e}")
#         await log_to_server(f"Error with /playspotify command: {e}", "error",
#                             "command")
#
#
# @tree.command(name="stop", description="Stop music and disconnect")
# async def stop_music(interaction: discord.Interaction):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("stop"):
#         await interaction.followup.send(
#             "The `stop` command is currently disabled.")
#         return
#
#     vc = interaction.guild.voice_client
#     if not vc:
#         await interaction.followup.send("Not connected.")
#         return
#
#     try:
#         if vc.is_playing() or vc.is_paused():
#             vc.stop()
#         await asyncio.wait_for(vc.disconnect(force=True), timeout=10)
#         await interaction.followup.send("Disconnected.")
#         await log_to_server(
#             f"{interaction.user} used /stop to disconnect from voice", "info",
#             "command")
#     except asyncio.TimeoutError:
#         vc.cleanup()
#         await interaction.followup.send("Disconnected.")
#         await log_to_server(
#             f"{interaction.user} used /stop to disconnect from voice", "info",
#             "command")
#     except Exception as e:
#         await interaction.followup.send(f"Disconnect error: {e}")
#         await log_to_server(f"Error with /stop command: {e}", "error",
#                             "command")


# Migrated to cogs/utility.py
# @tree.command(name="info", description="shows bot info and commands list")
# async def info(interaction: discord.Interaction):
#     await interaction.response.defer()

#     if config.is_command_disabled("info"):
#         await interaction.followup.send(
#             "The `info` command is currently disabled.")
#         return

#     embed = discord.Embed(title="Bot Info", color=0x9b59b6)
#     embed.set_author(name=interaction.client.user.name,
#                      icon_url=interaction.client.user.display_avatar.url)
#     embed.description = "A retarded Discord bot made by lumiin4 and kfb"
#     embed.add_field(
#         name="Commands List",
#         value=
#         "[View command list here](https://docs.google.com/document/d/12k-jomc8g4efri6MjKReGAae00r9WVJiBoFdwWnDujY/edit)",
#         inline=False)
#     embed.add_field(
#         name="Links",
#         value=
#         "[Bot Dashboard](https://ed842328-da25-41d0-a017-997bd0c48659-00-5a6gif8qp530.janeway.replit.dev/) | [UptimeBot](https://stats.uptimerobot.com/6neDK1LPEd/)",
#         inline=False)
#     embed.set_footer(text="Made with love ❤️")

#     await interaction.followup.send(embed=embed)
#     await log_to_server(f"{interaction.user} used /info command", "info",
#                         "command")


# Migrated to cogs/fun.py
# @tree.command(name="nuke", description="fake nuke")
# async def nuke(interaction: discord.Interaction):
#     await interaction.response.defer(ephemeral=True)
#
#     if config.is_command_disabled("nuke"):
#         await interaction.followup.send(
#             "The `nuke` command is currently disabled.", ephemeral=True)
#         return
#
#     await interaction.channel.send("🚨 **NUKE ACTIVATED** 🚨")
#
#     await asyncio.sleep(1.5)
#     await interaction.channel.send("Deleting all messages... 69%")
#
#     await asyncio.sleep(1.5)
#     await interaction.channel.send("Banning everyone... 99%")
#
#     await asyncio.sleep(1.5)
#     await interaction.channel.send("Server exploding in:")
#
#     await interaction.channel.send("**3**...")
#
#     await asyncio.sleep(1)
#     await interaction.channel.send("**2**...")
#
#     await asyncio.sleep(1)
#     await interaction.channel.send("**1**...")
#
#     await asyncio.sleep(1)
#     await interaction.channel.send(
#         "https://tenor.com/view/house-explosion-explode-boom-kaboom-gif-19506150"
#     )
#
#     await asyncio.sleep(1.5)
#     await interaction.channel.send("**jk server safe silly🥱**")
#     await log_to_server(f"{interaction.user} used /nuke command", "info",
#                         "command")


# Migrated to cogs/fun.py
# @tree.command(name="ship", description="Ship two users")
# @app_commands.describe(user1="user1", user2="user2")
# async def ship(interaction: discord.Interaction, user1: discord.Member,
#                user2: discord.Member):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("ship"):
#         await interaction.followup.send(
#             "The `ship` command is currently disabled.")
#         return
#
#     if user1 == user2:
#         await interaction.followup.send(
#             "You can't ship someone with themselves!")
#         return
#
#     percent = random.randint(0, 100)
#
#     if percent >= 90:
#         comment = "They have each other's voodoo doll, I can bet!"
#     elif percent >= 70:
#         comment = "They prolly fuh!"
#     elif percent >= 50:
#         comment = "There's some potential in investing in ts."
#     elif percent >= 30:
#         comment = "It's complicated but idk son could work."
#     else:
#         comment = "Fuh naw there no love in this block."
#
#     try:
#         avatar1_url = user1.display_avatar.with_format("png").with_size(
#             256).url
#         avatar2_url = user2.display_avatar.with_format("png").with_size(
#             256).url
#
#         async with aiohttp.ClientSession() as session:
#             async with session.get(avatar1_url) as resp1:
#                 avatar1_bytes = await resp1.read()
#             async with session.get(avatar2_url) as resp2:
#                 avatar2_bytes = await resp2.read()
#
#         avatar1 = Image.open(io.BytesIO(avatar1_bytes)).resize(
#             (256, 256)).convert("RGBA")
#         avatar2 = Image.open(io.BytesIO(avatar2_bytes)).resize(
#             (256, 256)).convert("RGBA")
#
#         # Create image with space for both avatars and a plus sign
#         img_width = 256 + 150 + 256  # avatar1 + space for + + avatar2
#         img_height = 256
#         img = Image.new("RGBA", (img_width, img_height), color=(0, 0, 0, 0))
#
#         # Paste avatars
#         img.paste(avatar1, (0, 0), avatar1)
#         img.paste(avatar2, (256 + 150, 0), avatar2)
#
#         # Draw pink + sign in the middle
#         draw = ImageDraw.Draw(img)
#         plus_x = 256 + 75  # Center of the middle space
#         plus_y = 128  # Center vertically
#         pink = (255, 105, 180)  # Hot pink color
#
#         # Draw horizontal line of the +
#         draw.rectangle([plus_x - 40, plus_y - 15, plus_x + 40, plus_y + 15],
#                        fill=pink)
#         # Draw vertical line of the +
#         draw.rectangle([plus_x - 15, plus_y - 40, plus_x + 15, plus_y + 40],
#                        fill=pink)
#
#         buffer = io.BytesIO()
#         img.save(buffer, format="PNG")
#         buffer.seek(0)
#
#         embed = discord.Embed(title=f"{user1.name} ❤️ {user2.name}",
#                               color=0x9b59b6)
#         embed.description = f"Ship Percentage: {percent}%\n{comment}"
#         embed.set_image(url="attachment://ship.png")
#
#         await interaction.followup.send(embed=embed,
#                                         file=discord.File(buffer,
#                                                           filename="ship.png"))
#         await log_to_server(
#             f"{interaction.user} used /ship on {user1.name} and {user2.name}: {percent}%",
#             "info", "output")
#
#     except Exception as e:
#         print(f"Error with /ship command: {e}")
#         await interaction.followup.send(
#             "Something went wrong while creating the ship image.")
#         await log_to_server(f"Error with /ship command: {e}", "error",
#                             "command")


# Migrated to cogs/utility.py
# reminders = {
# }  # Format: {user_id: [{"time": timestamp, "message": text, "channel_id": id}, ...]}


# Migrated to cogs/utility.py
# def parse_time(input_str: str):
#     return Formatters.parse_time_string(input_str)


# Migrated to cogs/utility.py
# @tree.command(name="remindme", description="Set a reminder")
# @app_commands.describe(message="The reminder message",
#                        time="When should, I remind you like 1h, 30m, 2d?")
# async def remindme(interaction: discord.Interaction, message: str, time: str):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("remindme"):
#         await interaction.followup.send(
#             "The `remindme` command is currently disabled.")
#         return
#
#     seconds = parse_time(time)
#     if not seconds or seconds < 30:
#         await interaction.followup.send(
#             "Invalid time format or too short (min 30s). Use like 1h, 30m, 2d."
#         )
#         return
#
#     remind_time = datetime.now() + timedelta(seconds=seconds)
#
#     user_id = interaction.user.id
#     if user_id not in reminders:
#         reminders[user_id] = []
#
#     reminders[user_id].append({
#         "time": remind_time.timestamp(),
#         "message": message,
#         "channel_id": interaction.channel_id
#     })
#
#     embed = discord.Embed(title="Reminder Set!", color=0x9b59b6)
#     embed.description = f"I'll remind you in **{time}**:\n**{message}**"
#     embed.set_footer(text=f"At {remind_time.strftime('%Y-%m-%d %H:%M:%S')}")
#
#     await interaction.followup.send(embed=embed)
#
#     await asyncio.sleep(seconds)
#
#     embed = discord.Embed(title="⏰ Reminder!", color=0xff0000)
#     embed.description = f"**{message}**"
#     embed.set_footer(text=f"Set {time} ago")
#
#     try:
#         await interaction.user.send(embed=embed)
#     except:
#         channel = bot.get_channel(interaction.channel_id)
#         if channel:
#             await channel.send(
#                 f"{interaction.user.mention} Reminder: **{message}**",
#                 embed=embed)
#
#     reminders[user_id] = [
#         r for r in reminders[user_id] if r["time"] != remind_time.timestamp()
#     ]


# Migrated to cogs/utility.py
# @tree.command(name="reminders", description="List your active reminders")
# async def reminders_list(interaction: discord.Interaction):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("reminders"):
#         await interaction.followup.send(
#             "The `reminders` command is currently disabled.")
#         return
#
#     user_id = interaction.user.id
#     if user_id not in reminders or not reminders[user_id]:
#         await interaction.followup.send("You have no active reminders.")
#         return
#
#     embed = discord.Embed(title="Your Active Reminders", color=0x9b59b6)
#     for i, r in enumerate(reminders[user_id], 1):
#         remind_time = datetime.fromtimestamp(r["time"])
#         embed.add_field(name=f"{i}. {r['message']}",
#                         value=f"<t:{int(r['time'])}:R>",
#                         inline=False)
#
#     await interaction.followup.send(embed=embed)


# Migrated to cogs/utility.py
# @tree.command(name="weather", description="get current weather for a location")
# @app_commands.describe(location="city name (e.g. London, New York)")
# async def weather(interaction: discord.Interaction, location: str):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("weather"):
#         await interaction.followup.send(
#             "The `weather` command is currently disabled.")
#         return
#
#     try:
#         async with aiohttp.ClientSession() as session:
#             # First, geocode the location to get coordinates
#             geocode_params = {
#                 "name": location,
#                 "count": 1,
#                 "language": "en",
#                 "format": "json"
#             }
#             async with session.get(
#                     "https://geocoding-api.open-meteo.com/v1/search",
#                     params=geocode_params) as geo_resp:
#                 if geo_resp.status != 200:
#                     await interaction.followup.send("Failed to find location.")
#                     await log_to_server(
#                         f"Weather geocoding error: {geo_resp.status}", "error",
#                         "command")
#                     return
#                 geo_data = await geo_resp.json()
#
#             if not geo_data.get("results"):
#                 await interaction.followup.send(
#                     f"Location '{location}' not found.")
#                 return
#
#             result = geo_data["results"][0]
#             lat = result["latitude"]
#             lon = result["longitude"]
#             city_name = result["name"]
#             country = result.get("country", "")
#
#             # Now get weather data
#             weather_params = {
#                 "latitude": lat,
#                 "longitude": lon,
#                 "current":
#                 "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m",
#                 "temperature_unit": "celsius",
#                 "wind_speed_unit": "kmh",
#                 "timezone": "auto"
#             }
#             async with session.get("https://api.open-meteo.com/v1/forecast",
#                                    params=weather_params) as weather_resp:
#                 if weather_resp.status != 200:
#                     await interaction.followup.send(
#                         "Failed to fetch weather data.")
#                     await log_to_server(
#                         f"Weather API error: {weather_resp.status}", "error",
#                         "command")
#                     return
#                 data = await weather_resp.json()
#
#         current = data["current"]
#         temp = current["temperature_2m"]
#         humidity = current["relative_humidity_2m"]
#         wind = current["wind_speed_10m"]
#         code = current["weather_code"]
#
#         weather_descriptions = {
#             0: "Clear sky ☀️",
#             1: "Mainly clear ☀️",
#             2: "Partly cloudy ⛅",
#             3: "Overcast ☁️",
#             45: "Fog 🌫️",
#             48: "Depositing rime fog 🌫️",
#             51: "Light drizzle 🌧️",
#             53: "Moderate drizzle 🌧️",
#             55: "Dense drizzle 🌧️",
#             61: "Slight rain 🌧️",
#             63: "Moderate rain 🌧️",
#             65: "Heavy rain 🌧️",
#             71: "Slight snow ❄️",
#             73: "Moderate snow ❄️",
#             75: "Heavy snow ❄️",
#             80: "Slight rain showers 🌦️",
#             81: "Moderate rain showers 🌦️",
#             82: "Violent rain showers 🌦️",
#             95: "Thunderstorm ⛈️"
#         }
#         description = weather_descriptions.get(code, "Unknown")
#
#         location_display = f"{city_name}, {country}" if country else city_name
#         embed = discord.Embed(title=f"Weather in {location_display}",
#                               color=0x9b59b6)
#         embed.add_field(name="Temperature", value=f"{temp}°C", inline=True)
#         embed.add_field(name="Condition", value=description, inline=True)
#         embed.add_field(name="Humidity", value=f"{humidity}%", inline=True)
#         embed.add_field(name="Wind Speed", value=f"{wind} km/h", inline=True)
#
#         await interaction.followup.send(embed=embed)
#         await log_to_server(
#             f"{interaction.user} used /weather for location: {location}",
#             "info", "output")
#
#     except Exception as e:
#         print(f"Error with /weather command: {e}")
#         await interaction.followup.send(
#             "Location not found or error fetching weather.")
#         await log_to_server(f"Error with /weather command: {e}", "error",
#                             "command")


# Migrated to cogs/memes.py
# @tree.command(
#     name="meme",
#     description="search a meme on google images and add (optional) text to it")
# @app_commands.describe(query="meme template to search for",
#                        top="text at the top (optional)",
#                        bottom="text at the bottom (optional)")
# async def meme(interaction: discord.Interaction,
#                query: str,
#                top: str = "",
#                bottom: str = ""):
#     await interaction.response.defer()
#
#     if config.is_command_disabled("meme"):
#         await interaction.followup.send(
#             "The `meme` command is currently disabled.")
#         return
#
#     try:
#         params = {
#             "key": GOOGLE_API_KEY,
#             "cx": CSE_ID,
#             "q": f"{query} meme template",
#             "searchType": "image",
#             "num": 10,
#             "fileType": "png,jpg"
#         }
#
#         async with aiohttp.ClientSession() as session:
#             async with session.get(
#                     "https://www.googleapis.com/customsearch/v1",
#                     params=params) as resp:
#                 if resp.status != 200:
#                     await interaction.followup.send(
#                         "Failed to search for meme template.")
#                     await log_to_server(
#                         f"Meme template search failed: {resp.status}", "error",
#                         "command")
#                     return
#                 data = await resp.json()
#
#             items = data.get("items", [])
#             if not items:
#                 await interaction.followup.send("No meme templates found.")
#                 return
#
#             template_url = items[0]["link"]
#
#             async with session.get(template_url) as img_resp:
#                 if img_resp.status != 200:
#                     await interaction.followup.send(
#                         "Failed to download template.")
#                     await log_to_server(
#                         f"Meme template download failed: {img_resp.status}",
#                         "error", "command")
#                     return
#                 template_data = await img_resp.read()
#
#         img = Image.open(io.BytesIO(template_data)).convert("RGB")
#         draw = ImageDraw.Draw(img)
#
#         width, height = img.size
#
#         # Scale font size based on image height (8% of height)
#         font_size = int(height * 0.08)
#
#         try:
#             font = ImageFont.truetype("impact.ttf", font_size)
#         except:
#             try:
#                 font = ImageFont.truetype(
#                     "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
#                     font_size)
#             except:
#                 font = ImageFont.load_default()
#
#         def draw_text(text, y_position):
#             if not text:
#                 return
#             # Scale wrap width based on image width
#             chars_per_line = max(15, int(width / (font_size * 0.6)))
#             wrapped = textwrap.fill(text, width=chars_per_line)
#             lines = wrapped.split("\n")
#             line_height = draw.textbbox((0, 0), "A", font=font)[3]
#             total_height = len(lines) * line_height
#             start_y = y_position - total_height // 2
#
#             for line in lines:
#                 bbox = draw.textbbox((0, 0), line, font=font)
#                 text_width = bbox[2] - bbox[0]
#                 x = (width - text_width) // 2
#                 draw.text((x + 2, start_y + 2),
#                           line,
#                           font=font,
#                           fill=(0, 0, 0))
#                 draw.text((x, start_y), line, font=font, fill=(255, 255, 255))
#                 start_y += line_height
#
#         draw_text(top, height * 0.15)
#         draw_text(bottom, height * 0.85)
#
#         buffer = io.BytesIO()
#         img.save(buffer, format="PNG")
#         buffer.seek(0)
#
#         embed = discord.Embed(color=0x9b59b6)
#         embed.set_image(url="attachment://meme.png")
#
#         await interaction.followup.send(embed=embed,
#                                         file=discord.File(buffer,
#                                                           filename="meme.png"))
#         await log_to_server(
#             f"{interaction.user} used /meme command with query='{query[:50]}' top='{top[:50]}' bottom='{bottom[:50]}'",
#             "info", "output")
#
#     except Exception as e:
#         print(f"Error with /meme command: {e}")
#         await interaction.followup.send(
#             "Something went wrong generating the meme.")
#         await log_to_server(f"Error with /meme command: {e}", "error",
#                             "command")


if __name__ == "__main__":
    if not TOKEN:
        print("Error: DISCORD_TOKEN not found in environment variables")
    else:
        bot.run(TOKEN)
