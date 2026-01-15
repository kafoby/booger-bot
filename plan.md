     ╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
     │ Last.fm Authentication & Auto-Scrobbling Implementation Plan                                                         │
     │                                                                                                                      │
     │ Overview                                                                                                             │
     │                                                                                                                      │
     │ Implement Last.fm authentication via Discord command with web callback, and auto-scrobble tracks to all              │
     │ authenticated users in voice channels when the bot plays music.                                                      │
     │                                                                                                                      │
     │ Database Schema Updates                                                                                              │
     │                                                                                                                      │
     │ File: /home/kfb/Projects/booger-bot/shared/schema.ts                                                                 │
     │                                                                                                                      │
     │ Update lfmConnections table to include:                                                                              │
     │ export const lfmConnections = pgTable("lfm_connections", {                                                           │
     │   id: serial("id").primaryKey(),                                                                                     │
     │   discordUserId: text("discord_user_id").notNull().unique(),                                                         │
     │   lastfmUsername: text("lastfm_username").notNull(),                                                                 │
     │   sessionKey: text("session_key").notNull(), // NEW: Last.fm session key for API calls                               │
     │   scrobblingEnabled: boolean("scrobbling_enabled").default(true), // NEW: Toggle for auto-scrobbling                 │
     │   timestamp: timestamp("timestamp").defaultNow(),                                                                    │
     │ });                                                                                                                  │
     │                                                                                                                      │
     │ Create new scrobbleHistory table for tracking:                                                                       │
     │ export const scrobbleHistory = pgTable("scrobble_history", {                                                         │
     │   id: serial("id").primaryKey(),                                                                                     │
     │   discordUserId: text("discord_user_id").notNull(),                                                                  │
     │   artist: text("artist").notNull(),                                                                                  │
     │   track: text("track").notNull(),                                                                                    │
     │   album: text("album"),                                                                                              │
     │   timestamp: timestamp("timestamp").notNull(), // When the track was scrobbled                                       │
     │   scrobbledAt: timestamp("scrobbled_at").defaultNow(), // When we sent it to Last.fm                                 │
     │   success: boolean("success").default(true),                                                                         │
     │   errorMessage: text("error_message"),                                                                               │
     │ });                                                                                                                  │
     │                                                                                                                      │
     │ Migration needed: Run npm run db:generate and npm run db:migrate after schema changes.                               │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Backend API Implementation                                                                                           │
     │                                                                                                                      │
     │ 1. Last.fm Authentication Flow                                                                                       │
     │                                                                                                                      │
     │ File: /home/kfb/Projects/booger-bot/server/routes.ts                                                                 │
     │                                                                                                                      │
     │ Add new endpoints:                                                                                                   │
     │                                                                                                                      │
     │ GET /api/lfm/auth/start (requireAuth or requireBotApiKey):                                                           │
     │ - Accepts discordUserId as query param                                                                               │
     │ - Generates unique auth token, stores in temporary cache/database with 60min TTL                                     │
     │ - Returns callback URL: https://booger.bot/lastfm-callback?token={token}                                             │
     │ - User visits: https://www.last.fm/api/auth?api_key={API_KEY}&cb=https://booger.bot/lastfm-callback?token={token}    │
     │                                                                                                                      │
     │ GET /api/lfm/auth/callback:                                                                                          │
     │ - Receives token and Last.fm's token param                                                                           │
     │ - Retrieves discordUserId from temporary storage                                                                     │
     │ - Calls Last.fm auth.getSession to get session key                                                                   │
     │ - Calls Last.fm user.getInfo with session key to get username                                                        │
     │ - Stores discordUserId, lastfmUsername, sessionKey in database                                                       │
     │ - Redirects to success page or sends success message                                                                 │
     │                                                                                                                      │
     │ PUT /api/lfm/:discordUserId/toggle (requireBotApiKey):                                                               │
     │ - Toggle scrobblingEnabled field                                                                                     │
     │ - Returns updated connection                                                                                         │
     │                                                                                                                      │
     │ DELETE /api/lfm/:discordUserId (requireBotApiKey):                                                                   │
     │ - Delete Last.fm connection for user                                                                                 │
     │ - Returns success status                                                                                             │
     │                                                                                                                      │
     │ GET /api/lfm/scrobbles/:discordUserId (requireAuth):                                                                 │
     │ - Get scrobble history for user (with pagination)                                                                    │
     │ - Query params: limit, offset, startDate, endDate                                                                    │
     │ - Returns scrobble records and stats                                                                                 │
     │                                                                                                                      │
     │ POST /api/lfm/scrobble (requireBotApiKey):                                                                           │
     │ - Batch scrobble endpoint for bot to call                                                                            │
     │ - Accepts array of: {discordUserId, artist, track, album, timestamp, duration}                                       │
     │ - For each user: check if connected and scrobblingEnabled                                                            │
     │ - Call Last.fm API to scrobble                                                                                       │
     │ - Store in scrobbleHistory with success/error status                                                                 │
     │ - Return results array                                                                                               │
     │                                                                                                                      │
     │ POST /api/lfm/now-playing (requireBotApiKey):                                                                        │
     │ - Update Now Playing for multiple users                                                                              │
     │ - Accepts array of: {discordUserId, artist, track, album, duration}                                                  │
     │ - Call Last.fm API track.updateNowPlaying for each user                                                              │
     │ - Return results array                                                                                               │
     │                                                                                                                      │
     │ File: /home/kfb/Projects/booger-bot/server/storage.ts                                                                │
     │                                                                                                                      │
     │ Add new methods:                                                                                                     │
     │ - toggleLfmScrobbling(discordUserId: string): Promise<LfmConnection>                                                 │
     │ - deleteLfmConnection(discordUserId: string): Promise<void>                                                          │
     │ - createScrobbleRecord(data: InsertScrobbleHistory): Promise<ScrobbleHistory>                                        │
     │ - getScrobbleHistory(discordUserId: string, filters): Promise<ScrobbleHistory[]>                                     │
     │ - getScrobbleStats(discordUserId: string): Promise<{total: number, failed: number}>                                  │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Python Bot Implementation                                                                                            │
     │                                                                                                                      │
     │ 1. Last.fm Service Layer                                                                                             │
     │                                                                                                                      │
     │ New File: /home/kfb/Projects/booger-bot/services/lastfm_service.py                                                   │
     │                                                                                                                      │
     │ Create service using pylast library:                                                                                 │
     │ import pylast                                                                                                        │
     │ from typing import List, Dict, Optional                                                                              │
     │ from datetime import datetime                                                                                        │
     │                                                                                                                      │
     │ class LastFmService:                                                                                                 │
     │     def __init__(self, api_key: str, api_secret: str):                                                               │
     │         self.api_key = api_key                                                                                       │
     │         self.api_secret = api_secret                                                                                 │
     │                                                                                                                      │
     │     async def update_now_playing(self, session_key: str, artist: str, track: str,                                    │
     │                                   album: Optional[str] = None, duration: Optional[int] = None):                      │
     │         """Update Now Playing status for a user"""                                                                   │
     │         # Use pylast to call track.updateNowPlaying                                                                  │
     │         pass                                                                                                         │
     │                                                                                                                      │
     │     async def scrobble_track(self, session_key: str, artist: str, track: str,                                        │
     │                             timestamp: int, album: Optional[str] = None, duration: Optional[int] = None):            │
     │         """Scrobble a single track for a user"""                                                                     │
     │         # Use pylast to call track.scrobble                                                                          │
     │         pass                                                                                                         │
     │                                                                                                                      │
     │     async def batch_scrobble(self, scrobbles: List[Dict]):                                                           │
     │         """Batch scrobble for multiple users"""                                                                      │
     │         # Group by session_key, call API for each user                                                               │
     │         pass                                                                                                         │
     │                                                                                                                      │
     │ Dependencies: Add to pyproject.toml:                                                                                 │
     │ pylast = "^5.3.0"                                                                                                    │
     │                                                                                                                      │
     │ 2. Discord Commands                                                                                                  │
     │                                                                                                                      │
     │ File: /home/kfb/Projects/booger-bot/cogs/music.py                                                                    │
     │                                                                                                                      │
     │ Modify existing music cog to track scrobbling:                                                                       │
     │                                                                                                                      │
     │ On on_wavelink_track_start event:                                                                                    │
     │ 1. Get all users in voice channel (exclude bots)                                                                     │
     │ 2. For each user, check if they have Last.fm connected (call /api/lfm/{userId})                                      │
     │ 3. Filter to only those with scrobblingEnabled: true                                                                 │
     │ 4. Call /api/lfm/now-playing with batch of users                                                                     │
     │ 5. Store track info + start time in memory for later scrobbling                                                      │
     │                                                                                                                      │
     │ On track progress (after 30 seconds OR 50% duration):                                                                │
     │ 1. Get stored track info + users who were in channel                                                                 │
     │ 2. Check which users are still in voice channel                                                                      │
     │ 3. Call /api/lfm/scrobble with batch scrobble data                                                                   │
     │ 4. Log success/errors                                                                                                │
     │                                                                                                                      │
     │ On on_voice_state_update event:                                                                                      │
     │ - Track when users join/leave voice channels while music is playing                                                  │
     │ - Don't scrobble for users who left before 30s/50% threshold                                                         │
     │                                                                                                                      │
     │ New File: /home/kfb/Projects/booger-bot/cogs/lastfm.py                                                               │
     │                                                                                                                      │
     │ Create new cog for Last.fm commands:                                                                                 │
     │                                                                                                                      │
     │ class LastFm(commands.Cog):                                                                                          │
     │     def __init__(self, bot):                                                                                         │
     │         self.bot = bot                                                                                               │
     │                                                                                                                      │
     │     @app_commands.command(name="lastfm")                                                                             │
     │     async def lastfm(self, interaction: discord.Interaction, action: str):                                           │
     │         """Last.fm commands: auth, status, disconnect, toggle"""                                                     │
     │         pass                                                                                                         │
     │                                                                                                                      │
     │     @app_commands.command(name="lastfm-auth")                                                                        │
     │     async def lastfm_auth(self, interaction: discord.Interaction):                                                   │
     │         """Start Last.fm authentication process"""                                                                   │
     │         # 1. Call /api/lfm/auth/start with user's Discord ID                                                         │
     │         # 2. Get callback URL                                                                                        │
     │         # 3. Send ephemeral message with button/link to Last.fm auth                                                 │
     │         # 4. Instructions: "Click below to authenticate, then return here"                                           │
     │         pass                                                                                                         │
     │                                                                                                                      │
     │     @app_commands.command(name="lastfm-status")                                                                      │
     │     async def lastfm_status(self, interaction: discord.Interaction):                                                 │
     │         """Check Last.fm connection status"""                                                                        │
     │         # Call /api/lfm/{userId}                                                                                     │
     │         # Show username, scrobbling enabled/disabled                                                                 │
     │         pass                                                                                                         │
     │                                                                                                                      │
     │     @app_commands.command(name="lastfm-disconnect")                                                                  │
     │     async def lastfm_disconnect(self, interaction: discord.Interaction):                                             │
     │         """Disconnect Last.fm account"""                                                                             │
     │         # Call DELETE /api/lfm/{userId}                                                                              │
     │         # Confirm disconnection                                                                                      │
     │         pass                                                                                                         │
     │                                                                                                                      │
     │     @app_commands.command(name="lastfm-toggle")                                                                      │
     │     async def lastfm_toggle(self, interaction: discord.Interaction):                                                 │
     │         """Toggle auto-scrobbling on/off"""                                                                          │
     │         # Call PUT /api/lfm/{userId}/toggle                                                                          │
     │         # Show new status                                                                                            │
     │         pass                                                                                                         │
     │                                                                                                                      │
     │ Alternative: Single command with subcommands:                                                                        │
     │ @app_commands.command(name="lastfm")                                                                                 │
     │ @app_commands.describe(action="auth | status | disconnect | toggle")                                                 │
     │ async def lastfm(self, interaction: discord.Interaction, action: str):                                               │
     │     """Manage Last.fm integration"""                                                                                 │
     │     pass                                                                                                             │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Frontend Dashboard Implementation                                                                                    │
     │                                                                                                                      │
     │ File: /home/kfb/Projects/booger-bot/client/src/pages/LastFm.tsx                                                      │
     │                                                                                                                      │
     │ Create new dashboard page:                                                                                           │
     │ - Show connection status (connected username or "Not connected")                                                     │
     │ - "Authenticate with Last.fm" button (opens Last.fm auth flow)                                                       │
     │ - "Disconnect" button                                                                                                │
     │ - Toggle for auto-scrobbling                                                                                         │
     │ - Scrobble history table:                                                                                            │
     │   - Columns: Track, Artist, Album, Timestamp, Status (success/failed)                                                │
     │   - Pagination (50 per page)                                                                                         │
     │   - Date range filter                                                                                                │
     │   - Show stats: Total scrobbles, Failed scrobbles                                                                    │
     │ - Charts:                                                                                                            │
     │   - Scrobbles per day (last 30 days)                                                                                 │
     │   - Top artists/tracks scrobbled through bot                                                                         │
     │                                                                                                                      │
     │ File: /home/kfb/Projects/booger-bot/client/src/components/Header.tsx                                                 │
     │                                                                                                                      │
     │ Add "Last.fm" navigation link to header.                                                                             │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Environment Configuration                                                                                            │
     │                                                                                                                      │
     │ Files: .env and /home/kfb/Projects/booger-bot/config/settings.py                                                     │
     │                                                                                                                      │
     │ Required environment variables:                                                                                      │
     │ LASTFM_API_KEY=your_api_key_here                                                                                     │
     │ LASTFM_API_SECRET=your_api_secret_here                                                                               │
     │ LASTFM_CALLBACK_URL=https://booger.bot/lastfm-callback                                                               │
     │                                                                                                                      │
     │ Update Python config to load LASTFM_API_SECRET:                                                                      │
     │ self.LASTFM_API_SECRET = os.getenv('LASTFM_API_SECRET')                                                              │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Critical Implementation Details                                                                                      │
     │                                                                                                                      │
     │ Scrobbling Rules                                                                                                     │
     │                                                                                                                      │
     │ 1. When to scrobble: After 30 seconds OR 50% of track duration (whichever comes first)                               │
     │ 2. Now Playing: Update immediately when track starts                                                                 │
     │ 3. User tracking: Only scrobble for users who were in voice channel when track started AND still there at scrobble   │
     │ time                                                                                                                 │
     │ 4. Batch processing: Send all scrobbles for a track in one batch API call (up to 50 users)                           │
     │                                                                                                                      │
     │ Error Handling                                                                                                       │
     │                                                                                                                      │
     │ 1. If Last.fm API fails for a user, log error but continue for other users                                           │
     │ 2. Store failed scrobbles in database with error message                                                             │
     │ 3. Don't retry automatically (user can see failures in dashboard)                                                    │
     │ 4. If session key is invalid (expired/revoked), mark connection as inactive                                          │
     │ 5. Send bot log entry for scrobbling errors                                                                          │
     │                                                                                                                      │
     │ Security                                                                                                             │
     │                                                                                                                      │
     │ 1. Never expose session keys to frontend (only via bot API key)                                                      │
     │ 2. Validate all discordUserId inputs                                                                                 │
     │ 3. Rate limit authentication endpoints                                                                               │
     │ 4. Use HTTPS for callback URLs                                                                                       │
     │ 5. Validate Last.fm API signatures                                                                                   │
     │                                                                                                                      │
     │ Performance                                                                                                          │
     │                                                                                                                      │
     │ 1. Cache Last.fm connection status in memory (refresh every 5 min)                                                   │
     │ 2. Batch Now Playing updates (don't call API for each user individually)                                             │
     │ 3. Use background tasks for scrobbling (don't block music playback)                                                  │
     │ 4. Limit scrobble history queries to 1000 records max                                                                │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Testing & Verification                                                                                               │
     │                                                                                                                      │
     │ Manual Testing Steps                                                                                                 │
     │                                                                                                                      │
     │ 1. Authentication Flow:                                                                                              │
     │   - Run /lastfm-auth in Discord                                                                                      │
     │   - Click authentication link                                                                                        │
     │   - Grant permissions on Last.fm                                                                                     │
     │   - Verify callback redirects successfully                                                                           │
     │   - Verify Discord bot confirms authentication                                                                       │
     │   - Check database has session key stored                                                                            │
     │ 2. Scrobbling:                                                                                                       │
     │   - Join voice channel with bot                                                                                      │
     │   - Play a song with /playspotify                                                                                    │
     │   - Wait 30+ seconds                                                                                                 │
     │   - Check Last.fm profile for scrobble                                                                               │
     │   - Check dashboard scrobble history                                                                                 │
     │ 3. Now Playing:                                                                                                      │
     │   - Play a song                                                                                                      │
     │   - Immediately check Last.fm profile                                                                                │
     │   - Verify "Now Playing" shows current track                                                                         │
     │ 4. Multiple Users:                                                                                                   │
     │   - Have 2-3 authenticated users in voice channel                                                                    │
     │   - Play a song                                                                                                      │
     │   - Verify all users get scrobbled                                                                                   │
     │ 5. Toggle Scrobbling:                                                                                                │
     │   - Run /lastfm-toggle to disable                                                                                    │
     │   - Play a song                                                                                                      │
     │   - Verify no scrobble occurs                                                                                        │
     │   - Toggle back on, verify scrobbling resumes                                                                        │
     │ 6. Disconnect:                                                                                                       │
     │   - Run /lastfm-disconnect                                                                                           │
     │   - Verify database record deleted                                                                                   │
     │   - Verify no more scrobbles occur                                                                                   │
     │ 7. Dashboard:                                                                                                        │
     │   - Login to dashboard                                                                                               │
     │   - Navigate to Last.fm page                                                                                         │
     │   - Verify scrobble history displays                                                                                 │
     │   - Test filters and pagination                                                                                      │
     │   - Verify stats are accurate                                                                                        │
     │                                                                                                                      │
     │ Edge Cases to Test                                                                                                   │
     │                                                                                                                      │
     │ - User leaves voice channel before 30s (should NOT scrobble)                                                         │
     │ - Bot disconnects mid-song (should NOT scrobble)                                                                     │
     │ - Track is < 30 seconds (should scrobble at 50% duration)                                                            │
     │ - User connects Last.fm while song is already playing (should NOT scrobble that song)                                │
     │ - Session key expires (should log error, don't crash)                                                                │
     │ - Last.fm API is down (should log error, continue for other users)                                                   │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Files to Create/Modify                                                                                               │
     │                                                                                                                      │
     │ New Files                                                                                                            │
     │                                                                                                                      │
     │ - /home/kfb/Projects/booger-bot/services/lastfm_service.py - Last.fm API service                                     │
     │ - /home/kfb/Projects/booger-bot/cogs/lastfm.py - Discord commands cog                                                │
     │ - /home/kfb/Projects/booger-bot/client/src/pages/LastFm.tsx - Dashboard page                                         │
     │                                                                                                                      │
     │ Modified Files                                                                                                       │
     │                                                                                                                      │
     │ - /home/kfb/Projects/booger-bot/shared/schema.ts - Database schema updates                                           │
     │ - /home/kfb/Projects/booger-bot/server/routes.ts - API endpoints                                                     │
     │ - /home/kfb/Projects/booger-bot/server/storage.ts - Storage methods                                                  │
     │ - /home/kfb/Projects/booger-bot/cogs/music.py - Scrobbling logic on playback                                         │
     │ - /home/kfb/Projects/booger-bot/config/settings.py - Add LASTFM_API_SECRET                                           │
     │ - /home/kfb/Projects/booger-bot/pyproject.toml - Add pylast dependency                                               │
     │ - /home/kfb/Projects/booger-bot/client/src/components/Header.tsx - Add nav link                                      │
     │ - /home/kfb/Projects/booger-bot/.env - Add Last.fm credentials                                                       │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Implementation Order                                                                                                 │
     │                                                                                                                      │
     │ 1. Database & API (Foundation):                                                                                      │
     │   - Update schema, run migrations                                                                                    │
     │   - Add API endpoints for auth/scrobbling                                                                            │
     │   - Add storage methods                                                                                              │
     │ 2. Last.fm Service (Core Logic):                                                                                     │
     │   - Create LastFmService with pylast                                                                                 │
     │   - Implement Now Playing and scrobble methods                                                                       │
     │   - Test standalone                                                                                                  │
     │ 3. Discord Commands (User Interface):                                                                                │
     │   - Create lastfm.py cog with commands                                                                               │
     │   - Test authentication flow end-to-end                                                                              │
     │   - Test status/disconnect/toggle commands                                                                           │
     │ 4. Music Integration (Auto-Scrobbling):                                                                              │
     │   - Modify music.py to track users in voice                                                                          │
     │   - Add Now Playing on track start                                                                                   │
     │   - Add scrobbling after threshold                                                                                   │
     │   - Test with multiple users                                                                                         │
     │ 5. Dashboard (Optional UI):                                                                                          │
     │   - Create LastFm.tsx page                                                                                           │
     │   - Add to navigation                                                                                                │
     │   - Test scrobble history display                                                                                    │
     │                                                                                                                      │
     │ ---                                                                                                                  │
     │ Dependencies & Prerequisites                                                                                         │
     │                                                                                                                      │
     │ - Last.fm API credentials (API key + secret) from https://www.last.fm/api/account/create                             │
     │ - pylast Python library (version 5.3.0+)                                                                             │
     │ - Database migration capability                                                                                      │
     │ - Access to booger.bot domain for callback URL
