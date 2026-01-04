import discord
from discord import app_commands
from discord.ext import commands
import aiohttp
import asyncio
import yt_dlp
from yt_dlp import utils as yt_dlp_utils
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import urllib.parse
import os
from config.settings import config
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder

# YouTube DL setup
ytdl_format_options = {
    'format': 'bestaudio/best',
    'restrictfilenames': True,
    'noplaylist': True,
    'nocheckcertificate': True,
    'ignoreerrors': False,
    'quiet': True,
    'no_warnings': True,
    'default_search': 'ytsearch',
    'source_address': '0.0.0.0'
}

ffmpeg_options = {
    'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
    'options': '-vn'
}

ytdl = yt_dlp.YoutubeDL(ytdl_format_options)
yt_dlp_utils.bug_reports_message = lambda: ''

# Spotify setup
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

sp = None
if SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET:
    try:
        sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET))
    except Exception as e:
        print(f"Failed to initialize Spotify: {e}")

class YTDLSource(discord.PCMVolumeTransformer):
    def __init__(self, source, *, data, volume=0.5):
        super().__init__(source, volume)
        self.data = data
        self.title = data.get('title')
        self.url = data.get('url')

    @classmethod
    async def from_url(cls, url, *, loop, stream=True):
        data = await loop.run_in_executor(
            None, lambda: ytdl.extract_info(url, download=not stream))
        if 'entries' in data:
            data = data['entries'][0]
        source = discord.FFmpegPCMAudio(data['url'], **ffmpeg_options)
        return cls(source, data=data)

class Music(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="playspotify", description="Play a song from Spotify or YouTube")
    @app_commands.describe(query="Spotify track link or song name")
    async def playspotify(self, interaction: discord.Interaction, query: str):
        await interaction.response.defer()

        if config.is_command_disabled("playspotify"):
            await interaction.followup.send("The `playspotify` command is currently disabled.")
            return

        if not interaction.user.voice:
            await interaction.followup.send("You must be in a voice channel.")
            return

        channel = interaction.user.voice.channel
        vc = interaction.guild.voice_client

        for _ in range(3):
            try:
                if vc is None:
                    vc = await channel.connect(reconnect=True)
                elif vc.channel != channel:
                    await vc.move_to(channel)
                break
            except Exception:
                if vc:
                    vc.cleanup()
                    vc = None
                await asyncio.sleep(2)
        else:
            await interaction.followup.send("Failed to connect to voice.")
            return

        search = query
        if "spotify" in query:
            if not sp:
                await interaction.followup.send("Spotify is not configured.")
                return
            try:
                track_id = None
                if "spotify:track:" in query:
                    track_id = query.split("spotify:track:")[1].split("?")[0]
                elif "open.spotify.com/track/" in query:
                    track_id = query.split("open.spotify.com/track/")[1].split("?")[0]

                if not track_id:
                    await interaction.followup.send("Invalid Spotify track link format.")
                    return

                track = sp.track(track_id)
                search = f"{track['name']} {track['artists'][0]['name']}"
            except Exception as e:
                print(f"Spotify parsing error: {e}")
                await interaction.followup.send("Invalid Spotify track link.")
                return

        try:
            player = await YTDLSource.from_url(search, loop=self.bot.loop, stream=True)
            if vc.is_playing() or vc.is_paused():
                vc.stop()
            vc.play(player)
            await interaction.followup.send(f"Now playing: **{player.title}**")
            await BotLogger.log(
                f"{interaction.user} used /playspotify to play: {player.title}",
                "info", "output"
            )
        except Exception as e:
            await interaction.followup.send(f"Playback error: {e}")
            await BotLogger.log_error("Error with /playspotify command", e, "command")

    @app_commands.command(name="stop", description="Stop music and disconnect")
    async def stop_music(self, interaction: discord.Interaction):
        await interaction.response.defer()

        if config.is_command_disabled("stop"):
            await interaction.followup.send("The `stop` command is currently disabled.")
            return

        vc = interaction.guild.voice_client
        if not vc:
            await interaction.followup.send("Not connected.")
            return

        try:
            if vc.is_playing() or vc.is_paused():
                vc.stop()
            await asyncio.wait_for(vc.disconnect(force=True), timeout=10)
            await interaction.followup.send("Disconnected.")
            await BotLogger.log(
                f"{interaction.user} used /stop to disconnect from voice", "info", "command"
            )
        except asyncio.TimeoutError:
            vc.cleanup()
            await interaction.followup.send("Disconnected.")
            await BotLogger.log(
                f"{interaction.user} used /stop to disconnect from voice", "info", "command"
            )
        except Exception as e:
            await interaction.followup.send(f"Disconnect error: {e}")
            await BotLogger.log_error("Error with /stop command", e, "command")

    @commands.command(name="fmset")
    async def fmset(self, ctx):
        # content: ,fmset <username>
        try:
            lfm_username = ctx.message.content[7:].strip()
            if not lfm_username:
                await ctx.send('Usage: ,fmset <lastfm_username>')
                return

            async with aiohttp.ClientSession() as session:
                payload = {
                    "discordUserId": str(ctx.author.id),
                    "lastfmUsername": lfm_username
                }
                # LFM_URL logic needs to be verified. Assuming it's in constants or settings. 
                # Original bot.py imported LFM_URL from config.constants
                from config.constants import LFM_URL
                
                async with session.post(
                        LFM_URL,
                        json=payload,
                        headers=config.get_api_headers(),
                        timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status in [200, 201]:
                        await ctx.send(f'Last.fm account set to `{lfm_username}`')
                        await BotLogger.log(
                            f"{ctx.author} set Last.fm account to {lfm_username}",
                            "info", "command"
                        )
                    else:
                        await ctx.send('Error setting Last.fm account')
        except Exception as e:
            print(f"Error with ,fmset command: {e}")
            await BotLogger.log_error("Error with ,fmset command", e)

    @commands.command(name="fm")
    async def fm(self, ctx):
        if not config.LASTFM_API_KEY:
            await ctx.send('Last.fm API key not configured')
            return

        target_user = ctx.message.mentions[0] if ctx.message.mentions else ctx.author
        from config.constants import LFM_URL

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                        f'{LFM_URL}/{target_user.id}',
                        headers=config.get_api_headers(),
                        timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status != 200:
                        await ctx.send(
                            f'{target_user.mention} has not set their Last.fm account. Use `,fmset <username>`'
                        )
                        return

                    connection = await response.json()
                    lfm_username = connection.get('lastfmUsername')
                    if not lfm_username:
                        await ctx.send(
                            f'{target_user.mention} has not set their Last.fm account. Use `,fmset <username>`'
                        )
                        return

                lfm_params = {
                    'method': 'user.getRecentTracks',
                    'user': lfm_username,
                    'api_key': config.LASTFM_API_KEY,
                    'format': 'json',
                    'limit': '1'
                }
                async with session.get('https://ws.audioscrobbler.com/2.0/',
                                       params=lfm_params,
                                       timeout=aiohttp.ClientTimeout(total=10)) as lfm_response:
                    if lfm_response.status != 200:
                        await ctx.send('Error fetching Last.fm data')
                        return

                    lfm_data = await lfm_response.json()

                    if 'recenttracks' not in lfm_data or not lfm_data['recenttracks']['track']:
                        await ctx.send(f'{target_user.mention} has no recent tracks')
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

                    # Get user playcount
                    user_params = {
                        'method': 'user.getInfo',
                        'user': lfm_username,
                        'api_key': config.LASTFM_API_KEY,
                        'format': 'json'
                    }
                    scrobbles = "Unknown"
                    try:
                        async with session.get(
                                'https://ws.audioscrobbler.com/2.0/',
                                params=user_params,
                                timeout=aiohttp.ClientTimeout(total=10)) as user_response:
                            if user_response.status == 200:
                                user_data = await user_response.json()
                                if 'user' in user_data:
                                    scrobbles = user_data['user'].get('playcount', 'Unknown')
                    except Exception as e:
                        await BotLogger.log(f"Failed to fetch scrobble count: {e}", "warn")

                    album_name = "Unknown"
                    if 'album' in track:
                        album_name = track['album']['#text'] if isinstance(track['album'], dict) else track['album']

                    track_url = f"https://www.last.fm/music/{urllib.parse.quote(artist_name)}/+{urllib.parse.quote(track_name)}"

                    embed = EmbedBuilder.create_embed(
                        description=f"[**{track_name}**]({track_url})\n{artist_name} • {album_name}\n\n{scrobbles} total scrobbles"
                    )

                    if target_user.avatar:
                        embed.set_author(
                            name=f"Now playing - {target_user.display_name}",
                            icon_url=target_user.avatar.url
                        )
                    else:
                        embed.set_author(name=f"Now playing - {target_user.display_name}")

                    if cover_url:
                        embed.set_thumbnail(url=cover_url)

                    msg = await ctx.send(embed=embed)

                    try:
                        await msg.add_reaction('👍')
                        await msg.add_reaction('👎')
                    except Exception:
                        pass

                    await BotLogger.log(
                        f"{ctx.author} used ,fm command to view {target_user.name}'s now playing: {track_name} by {artist_name}",
                        "info", "output"
                    )

        except Exception as e:
            print(f"Error with ,fm command: {e}")
            await BotLogger.log_error("Error with ,fm command", e)

async def setup(bot):
    await bot.add_cog(Music(bot))