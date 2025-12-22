import discord
import os
import aiohttp
import random
import urllib.parse
import requests
from keep_alive import keep_alive
keep_alive()
from discord import app_commands
from datetime import timedelta
from discord.ext import commands

TOKEN = os.getenv('DISCORD_TOKEN')
GOOGLE_API_KEY = "***REMOVED***"
CSE_ID = "e44706575588a42a2"
LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')
API_URL = 'http://127.0.0.1:5000/api/logs'
WARNS_URL = 'http://127.0.0.1:5000/api/warns'
LFM_URL = 'http://127.0.0.1:5000/api/lfm'
ALLOWED_CHANNELS = [
    # Channel IDs not names dumbass
    1452216636819112010,
    1068562196390490222,
]

print(f"Token available: {bool(TOKEN)}")
print(f"Token value (first 20 chars): {TOKEN[:20] if TOKEN else 'None'}")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(
    command_prefix = ",",
    intents = intents
)
tree = bot.tree

print("Discord bot initialized")

async def log_to_server(message, level="info"):
    """Send log to the web server API"""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "message": message,
                "level": level
            }
            async with session.post(API_URL, json=payload) as response:
                if response.status != 201:
                    print(f"Failed to log to server: {response.status}")
    except Exception as e:
        print(f"Error logging to server: {e}")

@bot.event
async def setup_hook():
    await tree.sync()
    await log_to_server("Slash commands synced")

@bot.event
async def on_ready():
    msg = f'{bot.user} has connected to Discord!'
    print(msg)
    await log_to_server(msg, "info")

    channel = bot.get_channel(1452216636819112010)
    print(f"Channel object: {channel}")
    if channel:
        try:
            if isinstance(channel, discord.TextChannel):
                await channel.send(f"i'm soo turned up rn {'<a:tasty:1166810347966058557>' * 3}")
                print("Message sent successfully!")
                await log_to_server(f"Sent boot message to channel {channel}", "info")
            else:
                print("Failed to send boot message")
        except Exception as e:
            print(f"Error sending message: {e}")
            await log_to_server(f"Error sending message: {e}", "error")
    else:
        print("Channel not found!")

    try:
        synced = await tree.sync()
        print(f"Synced {len(synced)} slash commands")
        await log_to_server(f"Synced {len(synced)} slash commands", "info")
    except Exception as e:
        print(f"Slash command sync failed: {e}")
        await log_to_server(f"Slash command sync failed: {e}", "error")

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    if message.channel.id not in ALLOWED_CHANNELS:
        print(f"Ignored message in non-allowed channel: {message.content}")
        return

    msg = f"Received message from {message.author}: {message.content}"
    print(msg)
    await log_to_server(msg, "info")

    if message.content.startswith(',warn '):
        try:
            parts = message.content.split(maxsplit=2)
            if len(parts) < 3:
                await message.channel.send('Usage: ,warn @user <reason>\nExample: ,warn @user spamming')
                return

            if not message.mentions:
                await message.channel.send('Please mention a user to warn')
                return

            target_user = message.mentions[0]
            reason = parts[2]

            async with aiohttp.ClientSession() as session:
                payload = {
                    "userId": str(target_user.id),
                    "userName": target_user.name,
                    "reason": reason
                }
                async with session.post(WARNS_URL, json=payload) as response:
                    if response.status == 201:
                        await message.channel.send(f'{target_user.mention} has been warned for: {reason}')
                        await log_to_server(f"Warned {target_user} for: {reason}", "info")
                    else:
                        await message.channel.send('Error: Failed to save warning')
        except Exception as e:
            print(f"Error warning user: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error warning user: {e}", "error")

    if message.content.startswith(',warns'):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(WARNS_URL) as response:
                    if response.status == 200:
                        warns = await response.json()

                        if message.mentions:
                            target_user = message.mentions[0]
                            warns = [w for w in warns if w['userId'] == str(target_user.id)]
                            if not warns:
                                await message.channel.send(f'No warns found for {target_user.mention}')
                                return
                            title = f'Warns for {target_user.name}'
                        else:
                            if not warns:
                                await message.channel.send('No warns recorded')
                                return
                            title = 'All Warns'

                        embed = discord.Embed(title=title, color=discord.Color.orange())

                        for warn in warns:
                            embed.add_field(
                                name=f"{warn['userName']} (ID: {warn['userId']})",
                                value=f"**Reason:** {warn['reason']}\n**Date:** {warn['timestamp'][:10]}",
                                inline=False
                            )

                        await message.channel.send(embed=embed)
                        await log_to_server(f"Viewed warns in {message.channel}", "info")
                    else:
                        await message.channel.send('Error: Could not fetch warns')
        except Exception as e:
            print(f"Error fetching warns: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error fetching warns: {e}", "error")

    if message.content.startswith(',say '):
        try:
            text_to_say = message.content[5:].strip()
            if not text_to_say:
                await message.channel.send('Usage: ,say <text>')
                return

            text_to_say = text_to_say.replace('<#', '').replace('>', '')
            text_to_say = text_to_say.replace('<@', '').replace('!', '').replace('>', '')

            try:
                await message.delete()
            except Exception as e:
                await log_to_server(f"Failed to delete message: {e}")
                pass

            await message.channel.send(text_to_say)
            await log_to_server(f"Bot said: {text_to_say} (via ,say command)", "info")
        except Exception as e:
            print(f"Error with ,say command: {e}")
            await log_to_server(f"Error with ,say command: {e}", "error")

    if message.content.startswith(',cat'):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('https://api.thecatapi.com/v1/images/search?mime_types=gif&limit=1') as response:
                    if response.status == 200:
                        data = await response.json()
                        if data and len(data) > 0:
                            cat_url = data[0]['url']
                            embed = discord.Embed(title="Here's a cat for you!", color=discord.Color.purple())
                            embed.set_image(url=cat_url)
                            await message.channel.send(embed=embed)
                            await log_to_server(f"Sent cat gif to {message.channel} via ,cat command", "info")
        except Exception as e:
            print(f"Error fetching cat gif: {e}")
            await log_to_server(f"Error fetching cat gif: {e}", "error")

    if message.content.startswith(',dog'):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('https://random.dog/woof.json?include=gif', timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        dog_url = data.get('url')
                        if dog_url:
                            embed = discord.Embed(title="Here's a dog for you!", color=discord.Color.orange())
                            embed.set_image(url=dog_url)
                            await message.channel.send(embed=embed)
                            await log_to_server(f"Sent dog gif to {message.channel} via ,dog command", "info")
        except asyncio.TimeoutError:
            await message.channel.send('Error: Request timed out fetching dog gif')
            await log_to_server(f"Timeout fetching dog gif", "error")
        except Exception as e:
            print(f"Error fetching dog gif: {e}")
            await log_to_server(f"Error fetching dog gif: {e}", "error")

    if message.content.startswith(',gay '):
        try:
            if not message.mentions:
                await message.channel.send('Please mention a user')
                return

            target_user = message.mentions[0]
            gay_percentage = random.randint(0, 100)

            embed = discord.Embed(
                title=f"{target_user.name} Gay Meter",
                description=f"{gay_percentage}% gay",
                color=discord.Color.from_rgb(255, 20, 147)
            )

            if target_user.avatar:
                embed.set_thumbnail(url=target_user.avatar.url)

            await message.channel.send(embed=embed)
            await log_to_server(f"Sent gay meter for {target_user} ({gay_percentage}%) via ,gay command", "info")
        except Exception as e:
            print(f"Error with ,gay command: {e}")
            await log_to_server(f"Error with ,gay command: {e}", "error")

    if message.content.startswith(',kiss '):
        try:
            if not message.mentions:
                await message.channel.send('Please mention a user to kiss')
                return

            target_user = message.mentions[0]
            author = message.author

            # Curated list of lesbian anime kiss gifs
            kiss_gifs = [
                'https://media.tenor.com/1jJ-07Y5gBcAAAAd/kiss.gif',
                'https://media.tenor.com/mCTCy9sDdEYAAAAd/kiss-anime.gif',
                'https://media.tenor.com/kLlgfvfQNZEAAAAd/anime-kiss.gif',
                'https://media.tenor.com/5EY5h2O1iyEAAAAd/yuri-kiss.gif',
                'https://media.tenor.com/Fv4fQPfk3XMAAAAd/kiss-anime-girls.gif',
                'https://media.tenor.com/3KTRxZ0YnO4AAAAd/anime-kiss-cute.gif',
                'https://media.tenor.com/4pKTLqoANDgAAAAd/anime-girls-kiss.gif',
                'https://media.tenor.com/WuZmVNFcsgoAAAAd/lesbian-anime-kiss.gif',
                'https://media.tenor.com/fBCOlE1mH7wAAAAd/kiss-girl.gif',
                'https://media.tenor.com/xDgI4X2SqB0AAAAd/anime-yuri-kiss.gif',
                'https://media.tenor.com/HNWmZvVaWWMAAAAd/kiss-lips.gif',
                'https://media.tenor.com/sjZfwvKbC6UAAAAd/anime-kiss-girls.gif',
                'https://media.tenor.com/L-dQXrLTQIAAAAAd/kiss.gif',
                'https://media.tenor.com/QGfTLjBt2YcAAAAd/anime-kiss.gif',
                'https://media.tenor.com/1qFTi1gq6joAAAAd/kiss-romantic.gif'
            ]

            # Pick a random gif
            gif_url = random.choice(kiss_gifs)

            embed = discord.Embed(
                title=f"{author.name} kissed {target_user.name}",
                color=discord.Color.from_rgb(255, 255, 255)
            )
            embed.set_image(url=gif_url)

            await message.channel.send(embed=embed)
            await log_to_server(f"{author} kissed {target_user} via ,kiss command", "info")
        except Exception as e:
            print(f"Error with ,kiss command: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error with ,kiss command: {e}", "error")

    if message.content.startswith(',say2 '):
        try:
            parts = message.content.split(maxsplit=2)
            if len(parts) < 3:
                await message.channel.send('Usage: ,say2 @user <message>')
                return

            if not message.mentions:
                await message.channel.send('Please mention a user to send a DM to')
                return

            target_user = message.mentions[0]
            text_to_send = parts[2]

            try:
                await message.delete()
            except Exception as e:
                await log_to_server(f"Failed to delete message: {e}")
                pass

            try:
                await target_user.send(text_to_send)
                await log_to_server(f"Sent DM to {target_user}: {text_to_send}", "info")
            except discord.Forbidden:
                await log_to_server(f"Failed to send DM to {target_user} - DMs disabled", "error")
        except Exception as e:
            print(f"Error with ,say2 command: {e}")
            await log_to_server(f"Error with ,say2 command: {e}", "error")

    if message.content.startswith(',timeout'):
        try:
            parts = message.content.split()
            if len(parts) < 3:
                await message.channel.send('Usage: ,timeout @user <duration>\nExample: ,timeout @user 10m (or 30s, 1h)')
                return

            if not message.mentions:
                await message.channel.send('Please mention a user to timeout')
                return

            target_user = message.mentions[0]
            duration_str = parts[2]

            duration_value = int(''.join(c for c in duration_str if c.isdigit()))
            duration_unit = ''.join(c for c in duration_str if c.isalpha()).lower()

            if duration_unit == 'm':
                timeout_duration = timedelta(minutes=duration_value)
            elif duration_unit == 's':
                timeout_duration = timedelta(seconds=duration_value)
            elif duration_unit == 'h':
                timeout_duration = timedelta(hours=duration_value)
            else:
                await message.channel.send('Invalid duration. Use format: 10m, 30s, or 1h')
                return

            await target_user.timeout(timeout_duration, reason="Timed out by bot command")
            await message.channel.send(f'{target_user.mention} has been timed out for {duration_str}')
            await log_to_server(f"Timed out {target_user} for {duration_str}", "info")
        except Exception as e:
            print(f"Error timing out user: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error timing out user: {e}", "error")

    if message.content.startswith(',fmset '):
        try:
            lfm_username = message.content[7:].strip()
            if not lfm_username:
                await message.channel.send('Usage: ,fmset <lastfm_username>')
                return

            async with aiohttp.ClientSession() as session:
                payload = {
                    "discordUserId": str(message.author.id),
                    "lastfmUsername": lfm_username
                }
                async with session.post(LFM_URL, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status in [200, 201]:
                        await message.channel.send(f'Last.fm account set to `{lfm_username}`')
                        await log_to_server(f"Set Last.fm account for {message.author} to {lfm_username}", "info")
                    else:
                        await message.channel.send('Error setting Last.fm account')
        except asyncio.TimeoutError:
            await message.channel.send('Error: Request timed out')
            await log_to_server(f"Timeout setting Last.fm account", "error")
        except Exception as e:
            print(f"Error with ,fmset command: {e}")
            await log_to_server(f"Error with ,fmset command: {e}", "error")

    if message.content.startswith(',fm'):
        try:
            if not LASTFM_API_KEY:
                await message.channel.send('Last.fm API key not configured')
                return

            target_user = message.mentions[0] if message.mentions else message.author

            async with aiohttp.ClientSession() as session:
                async with session.get(f'{LFM_URL}/{target_user.id}') as response:
                    if response.status != 200:
                        await message.channel.send(f'{target_user.mention} has not set their Last.fm account. Use `,fmset <username>`')
                        return

                    connection = await response.json()
                    lfm_username = connection['lastfmUsername']

                lfm_params = {
                    'method': 'user.getRecentTracks',
                    'user': lfm_username,
                    'api_key': LASTFM_API_KEY,
                    'format': 'json',
                    'limit': '1'
                }
                async with session.get('https://ws.audioscrobbler.com/2.0/', params=lfm_params, timeout=aiohttp.ClientTimeout(total=10)) as lfm_response:
                    if lfm_response.status != 200:
                        await message.channel.send('Error fetching Last.fm data')
                        return

                    lfm_data = await lfm_response.json()

                    if 'recenttracks' not in lfm_data or not lfm_data['recenttracks']['track']:
                        await message.channel.send(f'{target_user.mention} has no recent tracks')
                        return

                    track = lfm_data['recenttracks']['track']
                    if isinstance(track, list):
                        track = track[0]

                    track_name = track.get('name', 'Unknown')
                    artist_name = track['artist']['#text'] if isinstance(track['artist'], dict) else track['artist']
                    cover_url = None
                    if 'image' in track:
                        for img in track['image']:
                            if img['size'] == 'large':
                                cover_url = img['#text']
                                break

                    user_params = {
                        'method': 'user.getInfo',
                        'user': lfm_username,
                        'api_key': LASTFM_API_KEY,
                        'format': 'json'
                    }
                    scrobbles = "Unknown"
                    try:
                        async with session.get('https://ws.audioscrobbler.com/2.0/', params=user_params, timeout=aiohttp.ClientTimeout(total=10)) as user_response:
                            if user_response.status == 200:
                                user_data = await user_response.json()
                                if 'user' in user_data:
                                    scrobbles = user_data['user'].get('playcount', 'Unknown')
                    except Exception as e:
                        await log_to_server(f"Failed to fetch scrobble count: {e}", "warn")

                    album_name = "Unknown"
                    if 'album' in track:
                        album_name = track['album']['#text'] if isinstance(track['album'], dict) else track['album']

                    track_url = f"https://www.last.fm/music/{urllib.parse.quote(artist_name)}/+{urllib.parse.quote(track_name)}"

                    embed = discord.Embed(
                        description=f"[**{track_name}**]({track_url})\n{artist_name} • {album_name}\n\n{scrobbles} total scrobbles",
                        color=discord.Color.from_rgb(220, 20, 60)
                    )

                    if target_user.avatar:
                        embed.set_author(name=f"Now playing - {target_user.display_name}", icon_url=target_user.avatar.url)
                    else:
                        embed.set_author(name=f"Now playing - {target_user.display_name}")

                    if cover_url:
                        embed.set_thumbnail(url=cover_url)

                    msg = await message.channel.send(embed=embed)

                    try:
                        await msg.add_reaction('👍')
                        await msg.add_reaction('👎')
                    except Exception as e:
                        await log_to_server(f"Failed to add reactions: {e}")
                        pass

                    await log_to_server(f"Fetched Last.fm now playing for {target_user}: {track_name} by {artist_name}", "info")
        except Exception as e:
            print(f"Error with ,fm command: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error with ,fm command: {e}", "error")

    if 'faggot' in message.content.lower():
        try:
            await message.channel.send('https://cdn.discordapp.com/attachments/1279123313519624212/1316546100617805904/attachment-3.gif')
            await log_to_server(f"Sent gif to {message.channel} in response to message: {message.content}", "info")
        except Exception as e:
            print(f"Error sending gif: {e}")
            await log_to_server(f"Error sending gif: {e}", "error")

    if any(word in message.content.lower() for word in ("hi", "hello", "hey", "wave")):
        try:
            await message.add_reaction('<a:wave:1166754943785500722>')
            await log_to_server(f"Reacted to {message.author} with wave")
        except Exception as e:
            print(f"Error reacting to message: {e}")
            await log_to_server(f"Error reacting to message: {e}", "error")

@tree.command(name="lumsearch", description="Search Google")
@app_commands.describe(query="The search query")
async def search(interaction: discord.Interaction, query: str):
    try:
        async with aiohttp.ClientSession() as session:
            params = {
                "key": GOOGLE_API_KEY,
                "cx": CSE_ID,
                "q": query,
                "num": 1
            }
            async with session.get("https://www.googleapis.com/customsearch/v1", params=params) as resp:
                if resp.status != 200:
                    raise Exception(f"Google API returned {resp.status}")
                data = await resp.json()

        items = data.get("items")
        if not items:
            await interaction.response.send_message("No results found")
            return

        first_result = items[0]
        title = first_result.get("title")
        link = first_result.get("link")
        snippet = first_result.get("snippet")

        embed = discord.Embed(
            title=title,
            url=link,
            description=snippet,
            color=discord.Color.blue()
        )

        await interaction.response.send_message(embed=embed)

    except Exception as e:
        print(f"/search error: {e}")
        if interaction.response.is_done():
            await interaction.followup.send("Something went wrong")
        else:
            await interaction.response.send_message("Something went wrong")

@tree.command(name="diddy", description="Diddle someone!")
async def didddy(interaction: discord.Interaction):
    await interaction.response.defer()
    try:
        params = {
            "key": GOOGLE_API_KEY,
            "cx": CSE_ID,
            "searchType": "image",
            "q": "diddy gif",
            "fileType": "gif",  
            "num": 10
        }

        response = requests.get("https://www.googleapis.com/customsearch/v1", params=params)
        print("Google API Status Code:", response.status_code)
        print("Google API Response:", response.text[:500])  

        data = response.json()

        gif_items = [item["link"] for item in data.get("items", []) if item.get("mime") == "image/gif"]

        if gif_items:
            gif_url = random.choice(gif_items)

            embed = discord.Embed(
                title="Diddy blud",
                color=discord.Color.blue()
            )
            embed.set_image(url=gif_url)

            await interaction.followup.send(embed=embed)
        else:
            await interaction.followup.send("Couldn't find any Diddy GIFs")
    except Exception as e:
        print("Error fetching GIFs:", e)
        await interaction.followup.send(f"Something went wrong: {e}")

if __name__ == "__main__":
    if not TOKEN:
        print("Error: DISCORD_TOKEN not found in environment variables")
    else:
        bot.run(TOKEN)
