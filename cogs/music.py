import discord
from discord import app_commands, ui
from discord.ext import commands, tasks
import aiohttp
import asyncio
import wavelink
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import urllib.parse
import os
import yt_dlp
import time
from datetime import datetime
from config.settings import config
from config.constants import LAVALINK_URI
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder

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

# Lavalink config
LAVALINK_PASSWORD = os.getenv('LAVALINK_SERVER_PASSWORD', '')

# yt-dlp config
ytdl_options = {
    'format': 'bestaudio/best',
    'noplaylist': True,
    'quiet': True,
    'no_warnings': True,
    'default_search': 'ytsearch',
}
ytdl = yt_dlp.YoutubeDL(ytdl_options)


class QueueView(ui.View):
    """Interactive buttons for queue management"""
    def __init__(self, music_cog, guild_id):
        super().__init__(timeout=None)
        self.music_cog = music_cog
        self.guild_id = guild_id

    @ui.button(label="⏯ Play/Pause", style=discord.ButtonStyle.primary)
    async def pause_resume(self, interaction: discord.Interaction, button: ui.Button):
        player: wavelink.Player = interaction.guild.voice_client
        if not player:
            await interaction.response.send_message("Not connected to voice.", ephemeral=True)
            return

        if player.paused:
            await player.pause(False)
            await interaction.response.send_message("▶ Resumed", ephemeral=True)
        else:
            await player.pause(True)
            await interaction.response.send_message("⏸ Paused", ephemeral=True)

    @ui.button(label="⏭ Skip", style=discord.ButtonStyle.primary)
    async def skip(self, interaction: discord.Interaction, button: ui.Button):
        player: wavelink.Player = interaction.guild.voice_client
        if not player:
            await interaction.response.send_message("Not connected to voice.", ephemeral=True)
            return

        queue = self.music_cog.guild_queues.get(self.guild_id, [])
        if queue:
            next_track = queue.pop(0)
            await player.play(next_track)
            await interaction.response.send_message(f"⏭ Skipped. Now playing: **{next_track.title}**", ephemeral=True)
        else:
            await player.stop()
            await interaction.response.send_message("⏭ Skipped. Queue empty.", ephemeral=True)

    @ui.button(label="🔀 Shuffle", style=discord.ButtonStyle.secondary)
    async def shuffle(self, interaction: discord.Interaction, button: ui.Button):
        import random
        queue = self.music_cog.guild_queues.get(self.guild_id, [])
        if not queue:
            await interaction.response.send_message("Queue is empty.", ephemeral=True)
            return

        random.shuffle(queue)
        await interaction.response.send_message(f"🔀 Shuffled {len(queue)} tracks", ephemeral=True)

    @ui.button(label="🔁 Loop", style=discord.ButtonStyle.secondary)
    async def toggle_loop(self, interaction: discord.Interaction, button: ui.Button):
        current = self.music_cog.loop_mode.get(self.guild_id, "off")
        modes = ["off", "one", "all"]
        next_mode = modes[(modes.index(current) + 1) % len(modes)]
        self.music_cog.loop_mode[self.guild_id] = next_mode

        mode_names = {"off": "🔁 Loop: OFF", "one": "🔂 Loop: ONE", "all": "🔁 Loop: ALL"}
        await interaction.response.send_message(mode_names[next_mode], ephemeral=True)

    @ui.button(label="🗑 Clear Queue", style=discord.ButtonStyle.danger)
    async def clear(self, interaction: discord.Interaction, button: ui.Button):
        self.music_cog.guild_queues[self.guild_id] = []
        await interaction.response.send_message("🗑 Queue cleared", ephemeral=True)


class QueueListView(ui.View):
    """View for showing queue with remove buttons"""
    def __init__(self, music_cog, guild_id, queue: list):
        super().__init__(timeout=60)
        self.music_cog = music_cog
        self.guild_id = guild_id
        self.queue = queue

        # Add remove buttons for each track
        for i, track in enumerate(queue[:10]):  # Only show first 10
            self.add_item(QueueRemoveButton(music_cog, guild_id, i, track.title))

    async def on_timeout(self):
        # Remove buttons after timeout
        for item in self.children:
            item.disabled = True


class QueueRemoveButton(ui.Button):
    """Button to remove a specific track from queue"""
    def __init__(self, music_cog, guild_id, index, title):
        super().__init__(label=f"Remove #{index+1}", style=discord.ButtonStyle.danger)
        self.music_cog = music_cog
        self.guild_id = guild_id
        self.index = index
        self.title = title

    async def callback(self, interaction: discord.Interaction):
        queue = self.music_cog.guild_queues.get(self.guild_id, [])
        if self.index < len(queue):
            removed = queue.pop(self.index)
            await interaction.response.send_message(f"❌ Removed: **{removed.title}**", ephemeral=True)
        else:
            await interaction.response.send_message("Track already removed.", ephemeral=True)


class Music(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.guild_queues = {}  # {guild_id: [tracks]}
        self.loop_mode = {}  # {guild_id: "off"|"one"|"all"}
        self.now_playing_messages = {}  # {guild_id: (channel_id, message_id)}
        self.scrobble_tasks = {}  # {guild_id: asyncio.Task}
        self.track_listeners = {}  # {guild_id: {user_id: start_time}}
        self.empty_channel_timers = {} # {guild_id: start_time}
        self.api_base = config.API_BASE_URL
        self.auto_disconnect.start()

    def cog_unload(self):
        self.auto_disconnect.cancel()

    async def cog_load(self):
        """Called when the cog is loaded. Set up Lavalink connection."""
        print("[Music] Cog loading, setting up Lavalink...")
        try:
            node = wavelink.Node(
                uri=LAVALINK_URI,
                password=LAVALINK_PASSWORD,
            )
            await wavelink.Pool.connect(nodes=[node], client=self.bot, cache_capacity=100)
            print(f"[Music] Connected to Lavalink at {LAVALINK_URI}")
        except Exception as e:
            print(f"[Music] Failed to connect to Lavalink: {e}")

    async def _api_request(self, method: str, endpoint: str, json_data: dict = None) -> tuple[bool, any]:
        """Make API request to the backend"""
        try:
            headers = config.get_api_headers()
            url = f"{self.api_base}{endpoint}"

            async with aiohttp.ClientSession() as session:
                async with session.request(method, url, headers=headers, json=json_data) as response:
                    if response.status in [200, 201]:
                        data = await response.json()
                        return True, data
                    else:
                        return False, await response.text()
        except Exception as e:
            print(f"[Music] API request error: {e}")
            return False, str(e)

    async def _get_voice_channel_users(self, guild: discord.Guild) -> list[int]:
        """Get list of user IDs in the bot's voice channel (excluding bots)"""
        player: wavelink.Player = guild.voice_client
        if not player or not player.channel:
            return []

        return [member.id for member in player.channel.members if not member.bot]

    async def _update_now_playing_for_users(self, guild_id: int, track: wavelink.Playable):
        """Update Now Playing status on Last.fm for all users in voice channel"""
        guild = self.bot.get_guild(guild_id)
        if not guild:
            return

        user_ids = await self._get_voice_channel_users(guild)
        if not user_ids:
            return

        # Prepare data for API
        now_playing_data = {
            "nowPlaying": [
                {
                    "discordUserId": str(user_id),
                    "artist": track.author or "Unknown Artist",
                    "track": track.title,
                    "album": None,  # Not available from wavelink
                    "duration": track.length // 1000 if track.length else None  # Convert ms to seconds
                }
                for user_id in user_ids
            ]
        }

        success, result = await self._api_request("POST", "/lfm/now-playing", now_playing_data)
        if success:
            print(f"[Music] Updated Now Playing for {len(user_ids)} users")
        else:
            print(f"[Music] Failed to update Now Playing: {result}")

    async def _schedule_scrobble(self, guild_id: int, track: wavelink.Playable, start_time: float):
        """Schedule scrobbling after 30 seconds or 50% duration"""
        # Calculate scrobble threshold
        duration_ms = track.length if track.length else 60000  # Default 60s if unknown
        duration_seconds = duration_ms / 1000
        threshold = min(30, duration_seconds * 0.5)  # 30 seconds OR 50% duration

        print(f"[Music] Scheduling scrobble for '{track.title}' in {threshold}s")

        try:
            await asyncio.sleep(threshold)

            # Get users who are still in voice channel
            guild = self.bot.get_guild(guild_id)
            if not guild:
                return

            current_users = set(await self._get_voice_channel_users(guild))
            initial_users = set(self.track_listeners.get(guild_id, {}).keys())

            # Only scrobble for users who were there at start AND are still there
            users_to_scrobble = current_users.intersection(initial_users)

            if not users_to_scrobble:
                print(f"[Music] No users to scrobble for '{track.title}'")
                return

            # Prepare scrobble data
            timestamp = int(start_time * 1000)  # Convert to milliseconds
            scrobble_data = {
                "scrobbles": [
                    {
                        "discordUserId": str(user_id),
                        "artist": track.author or "Unknown Artist",
                        "track": track.title,
                        "album": None,
                        "timestamp": timestamp,
                        "duration": int(duration_seconds)
                    }
                    for user_id in users_to_scrobble
                ]
            }

            success, result = await self._api_request("POST", "/lfm/scrobble", scrobble_data)
            if success:
                successful = sum(1 for r in result.get("results", []) if r.get("success"))
                print(f"[Music] Scrobbled '{track.title}' for {successful}/{len(users_to_scrobble)} users")
            else:
                print(f"[Music] Failed to scrobble: {result}")

        except asyncio.CancelledError:
            print(f"[Music] Scrobble task cancelled for '{track.title}'")
        except Exception as e:
            print(f"[Music] Error in scrobble task: {e}")

    @tasks.loop(seconds=5)
    async def auto_disconnect(self):
        """Check for empty voice channels and disconnect"""
        for guild in self.bot.guilds:
            player: wavelink.Player = guild.voice_client
            if not player or not player.channel:
                self.empty_channel_timers.pop(guild.id, None)
                continue

            # Check for non-bot members
            members = [m for m in player.channel.members if not m.bot]
            
            if members:
                # Channel is active, clear timer
                self.empty_channel_timers.pop(guild.id, None)
            else:
                # Channel is empty
                if guild.id not in self.empty_channel_timers:
                    print(f"[Music] Channel empty in {guild.name}, starting 10s timer")
                    self.empty_channel_timers[guild.id] = time.time()
                
                # Check if timer exceeded 10 seconds
                elif time.time() - self.empty_channel_timers[guild.id] >= 10:
                    print(f"[Music] Auto-disconnecting from {guild.name} due to inactivity")
                    
                    # Clear queue and state
                    self.guild_queues[guild.id] = []
                    if guild.id in self.now_playing_messages:
                        del self.now_playing_messages[guild.id]
                    self.empty_channel_timers.pop(guild.id, None)
                    
                    try:
                        await player.disconnect()
                    except Exception as e:
                        print(f"[Music] Error disconnecting: {e}")

    @auto_disconnect.before_loop
    async def before_auto_disconnect(self):
        await self.bot.wait_until_ready()

    @commands.Cog.listener()
    async def on_wavelink_node_ready(self, payload: wavelink.NodeReadyEventPayload):
        print(f"[Music] Wavelink node ready: {payload.node.identifier}")

    @commands.Cog.listener()
    async def on_wavelink_track_start(self, payload: wavelink.TrackStartEventPayload):
        print(f"[Music] Track started: {payload.track.title} (duration: {payload.track.length}ms)")

        guild_id = payload.player.guild.id
        start_time = time.time()

        # Cancel any existing scrobble task for this guild
        if guild_id in self.scrobble_tasks:
            self.scrobble_tasks[guild_id].cancel()

        # Track users currently in voice channel
        guild = self.bot.get_guild(guild_id)
        if guild:
            user_ids = await self._get_voice_channel_users(guild)
            self.track_listeners[guild_id] = {user_id: start_time for user_id in user_ids}

            # Update Now Playing on Last.fm
            await self._update_now_playing_for_users(guild_id, payload.track)

            # Schedule scrobble
            task = asyncio.create_task(
                self._schedule_scrobble(guild_id, payload.track, start_time)
            )
            self.scrobble_tasks[guild_id] = task

    @commands.Cog.listener()
    async def on_wavelink_track_end(self, payload: wavelink.TrackEndEventPayload):
        print(f"[Music] Track ended: {payload.track.title} (reason: {payload.reason})")

        # Clean up scrobble tracking
        guild_id = payload.player.guild.id
        if guild_id in self.track_listeners:
            del self.track_listeners[guild_id]

        # Auto-play next track from queue
        queue = self.guild_queues.get(guild_id, [])
        loop_mode = self.loop_mode.get(guild_id, "off")

        if loop_mode == "one":
            # Loop current track
            await payload.player.play(payload.track)
        elif loop_mode == "all" and queue:
            # Add back to queue
            queue.append(payload.track)

        if queue:
            next_track = queue.pop(0)
            await payload.player.play(next_track)
            print(f"[Music] Auto-playing next: {next_track.title}")

    @commands.Cog.listener()
    async def on_wavelink_track_exception(self, payload: wavelink.TrackExceptionEventPayload):
        print(f"[Music] Track exception: {payload.track.title} - {payload.exception}")

    @commands.Cog.listener()
    async def on_wavelink_track_stuck(self, payload: wavelink.TrackStuckEventPayload):
        print(f"[Music] Track stuck: {payload.track.title} (threshold: {payload.threshold_ms}ms)")

    async def _update_now_playing_message(self, interaction: discord.Interaction, player: wavelink.Player, guild_id: int):
        """Update or create the now playing message for a guild"""
        embed = await self._create_now_playing_embed(player, guild_id)
        view = QueueView(self, guild_id)

        # Try to edit existing message
        if guild_id in self.now_playing_messages:
            try:
                channel_id, message_id = self.now_playing_messages[guild_id]
                channel = self.bot.get_channel(channel_id)
                if channel:
                    message = await channel.fetch_message(message_id)
                    await message.edit(embed=embed, view=view)
                    return
            except Exception as e:
                print(f"[Music] Failed to edit now playing message: {e}")
                # Fall through to create new message

        # Create new message if edit failed or doesn't exist
        message = await interaction.followup.send(embed=embed, view=view)
        self.now_playing_messages[guild_id] = (interaction.channel_id, message.id)

    async def _create_now_playing_embed(self, player: wavelink.Player, guild_id: int) -> discord.Embed:
        """Create a now playing embed with queue info"""
        current = player.current
        queue = self.guild_queues.get(guild_id, [])
        loop_mode = self.loop_mode.get(guild_id, "off")

        if not current:
            return EmbedBuilder.create_embed(title="Not playing anything")

        # Duration bar
        duration_secs = current.length // 1000
        position_secs = player.position // 1000
        bar_length = 20
        filled = int((position_secs / duration_secs) * bar_length) if duration_secs > 0 else 0
        bar = "█" * filled + "░" * (bar_length - filled)

        duration_str = f"{position_secs//60}:{position_secs%60:02d} / {duration_secs//60}:{duration_secs%60:02d}"

        embed = EmbedBuilder.create_embed(
            title="🎵  Now Playing",
            description=f"**{current.title}**\nBy {current.author}"
        )
        embed.add_field(name="Duration", value=f"```{bar}```{duration_str}", inline=False)
        embed.add_field(name="Queue Length", value=f"{len(queue)} tracks", inline=True)
        embed.add_field(name="Loop Mode", value=f"🔁 {loop_mode.upper()}", inline=True)
        embed.add_field(name="Status", value="⏸ Paused" if player.paused else "▶ Playing", inline=True)

        if queue:
            next_tracks = "\n".join([f"{i+1}. {t.title}" for i, t in enumerate(queue[:5])])
            embed.add_field(name="Next in Queue", value=next_tracks, inline=False)

        return embed

    @app_commands.command(name="playspotify", description="Play a song from Spotify or YouTube")
    @app_commands.describe(query="Spotify track link or song name")
    async def playspotify(self, interaction: discord.Interaction, query: str):
        await interaction.response.defer()
        print(f"[playspotify] Command invoked by {interaction.user} with query: {query}")

        if config.is_command_disabled("playspotify"):
            await interaction.followup.send("The `playspotify` command is currently disabled.")
            return

        if not interaction.user.voice:
            await interaction.followup.send("You must be in a voice channel.")
            return

        channel = interaction.user.voice.channel
        print(f"[playspotify] Target channel: {channel}")

        # Get or create player
        player: wavelink.Player = interaction.guild.voice_client

        if player is None:
            try:
                print(f"[playspotify] Connecting to {channel}...")
                player = await channel.connect(cls=wavelink.Player)
                print(f"[playspotify] Connected successfully")
            except Exception as e:
                print(f"[playspotify] Failed to connect: {type(e).__name__}: {e}")
                await interaction.followup.send(f"Failed to connect to voice channel: {e}")
                return
        elif player.channel != channel:
            print(f"[playspotify] Moving to {channel}...")
            await player.move_to(channel)

        # Parse Spotify URL if needed
        search = query
        if "spotify" in query:
            print(f"[playspotify] Detected Spotify link, parsing...")
            if not sp:
                print("[playspotify] Spotify client not configured")
                await interaction.followup.send("Spotify is not configured.")
                return
            try:
                track_id = None
                if "spotify:track:" in query:
                    track_id = query.split("spotify:track:")[1].split("?")[0]
                elif "open.spotify.com/track/" in query:
                    track_id = query.split("open.spotify.com/track/")[1].split("?")[0]

                if not track_id:
                    print("[playspotify] Could not extract track ID from URL")
                    await interaction.followup.send("Invalid Spotify track link format.")
                    return

                print(f"[playspotify] Fetching Spotify track: {track_id}")
                track = sp.track(track_id)
                search = f"{track['name']} {track['artists'][0]['name']}"
                print(f"[playspotify] Spotify track resolved to search: {search}")
            except Exception as e:
                print(f"[playspotify] Spotify parsing error: {type(e).__name__}: {e}")
                await interaction.followup.send("Invalid Spotify track link.")
                return

        # Search and play via Lavalink (YouTube with fixed plugin)
        try:
            print(f"[playspotify] Searching for: {search}")

            # Search YouTube via Lavalink's ytsearch
            print(f"[playspotify] Searching YouTube via Lavalink...")
            tracks = await wavelink.Playable.search(search, source="ytsearch")

            if not tracks:
                print("[playspotify] No tracks found")
                await interaction.followup.send("No results found.")
                return

            track = tracks[0]
            print(f"[playspotify] Found track: {track.title}")
            print(f"[playspotify] Track details - Duration: {track.length}ms, Author: {track.author}, Source: {track.source}")
            print(f"[playspotify] Player connected: {player.connected}, Channel: {player.channel}")

            # If nothing is playing, play immediately. Otherwise, add to queue
            if not player.current:
                await player.play(track)
                print(f"[playspotify] Playback started: {track.title}")
            else:
                if interaction.guild.id not in self.guild_queues:
                    self.guild_queues[interaction.guild.id] = []
                self.guild_queues[interaction.guild.id].append(track)
                print(f"[playspotify] Added to queue: {track.title}")

            # Update the now playing message (edits existing or creates new)
            await self._update_now_playing_message(interaction, player, interaction.guild.id)

            await BotLogger.log(
                f"{interaction.user} used /playspotify to play: {track.title}",
                "info", "output"
            )
        except Exception as e:
            print(f"[playspotify] Playback error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            await interaction.followup.send(f"Playback error: {e}")
            await BotLogger.log_error("Error with /playspotify command", e, "command")

    @app_commands.command(name="queue", description="Show the music queue")
    async def show_queue(self, interaction: discord.Interaction):
        await interaction.response.defer()

        guild_id = interaction.guild.id
        queue = self.guild_queues.get(guild_id, [])
        player = interaction.guild.voice_client

        if not player or not player.current:
            await interaction.followup.send("Nothing is playing.")
            return

        await self._update_now_playing_message(interaction, player, guild_id)

    @app_commands.command(name="skip", description="Skip the current track")
    async def skip_track(self, interaction: discord.Interaction):
        await interaction.response.defer()

        player = interaction.guild.voice_client
        if not player:
            await interaction.followup.send("Not connected to voice.")
            return

        guild_id = interaction.guild.id
        queue = self.guild_queues.get(guild_id, [])

        current = player.current
        if queue:
            next_track = queue.pop(0)
            await player.play(next_track)
            await interaction.followup.send(f"⏭ Skipped. Now playing: **{next_track.title}**")
            await self._update_now_playing_message(interaction, player, guild_id)
        else:
            await player.stop()
            await interaction.followup.send(f"⏭ Skipped **{current.title}**\nQueue is empty.")

    @app_commands.command(name="stop", description="Stop music and disconnect")
    async def stop_music(self, interaction: discord.Interaction):
        await interaction.response.defer()

        if config.is_command_disabled("stop"):
            await interaction.followup.send("The `stop` command is currently disabled.")
            return

        player: wavelink.Player = interaction.guild.voice_client
        if not player:
            await interaction.followup.send("Not connected.")
            return

        try:
            guild_id = interaction.guild.id
            if guild_id in self.guild_queues:
                self.guild_queues[guild_id] = []
            if guild_id in self.now_playing_messages:
                del self.now_playing_messages[guild_id]
            await player.disconnect()
            await interaction.followup.send("Disconnected.")
            await BotLogger.log(
                f"{interaction.user} used /stop to disconnect from voice", "info", "command"
            )
        except Exception as e:
            await interaction.followup.send(f"Disconnect error: {e}")
            await BotLogger.log_error("Error with /stop command", e, "command")

async def setup(bot):
    await bot.add_cog(Music(bot))
