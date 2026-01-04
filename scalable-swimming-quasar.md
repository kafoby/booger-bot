# Discord Bot Modularization Plan

## Overview

Refactor the monolithic 2376-line `bot.py` into a modular architecture using Discord.py Cogs. This plan focuses on quick improvement while maintaining backward compatibility with both prefix and slash commands.

## Current State

- **Main file**: `bot.py` (2376 lines)
- **Massive handler**: `on_message` (996 lines) with all prefix commands inline
- **42 total commands**: 19 prefix commands (`,cat`, `,warn`, etc.) + 23 slash commands (`/youtube`, `/askgpt`, etc.)
- **Major issues**:
  - No separation of concerns
  - Code duplication (Google API calls, embed creation, error handling)
  - 4 different config sources (env, hardcoded, API, global state)
  - Orphaned `bot/text.py` with unused refactored code

## Target Architecture

```
/home/runner/workspace/
├── bot.py                      # Entry point
├── config/
│   ├── settings.py             # Centralized config management
│   └── constants.py            # Channel IDs, user IDs, etc.
├── core/
│   ├── bot.py                  # Bot class with Cog loading
│   └── events.py               # Event handlers (on_ready, etc.)
├── cogs/
│   ├── admin.py                # Moderation commands
│   ├── fun.py                  # Interactive commands
│   ├── media.py                # YouTube/TikTok/Reel embeds
│   ├── search.py               # Google/GitHub/StackOverflow
│   ├── ai.py                   # GPT/Grok/Translate
│   ├── music.py                # Spotify/Last.fm
│   ├── images.py               # Cat/dog/animal images
│   ├── utility.py              # Info/weather/reminders
│   ├── memes.py                # Quote/meme generators
│   └── auto_responses.py       # Keyword triggers
├── services/
│   ├── api_client.py           # Generic HTTP wrapper
│   ├── google_search.py        # Google Custom Search
│   ├── image_processor.py      # PIL/Pillow operations
│   ├── lastfm.py               # Last.fm API
│   ├── music_player.py         # Voice/playback logic
│   └── ai_providers.py         # OpenAI/Grok/Translate
├── utils/
│   ├── embed_builder.py        # Standardized embeds
│   ├── logging.py              # Enhanced log_to_server
│   ├── validators.py           # Input validation
│   ├── permissions.py          # Permission checks
│   └── formatters.py           # Time/text formatting
└── models/
    └── reminder.py             # Reminder management
```

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Goal**: Create reusable modules without breaking existing bot

**Files to create**:
1. `config/settings.py` - `ConfigManager` class to centralize all configuration
2. `config/constants.py` - All hardcoded IDs (channel: `1452216636819112010`, admin users: `[934443300520345631, 954606816820613160, 395651363985555457]`)
3. `utils/embed_builder.py` - `EmbedBuilder.create_embed()`, `.create_error_embed()` (eliminates 20+ duplicate embed creations)
4. `utils/logging.py` - `BotLogger.log()` wrapper around `log_to_server()`
5. `utils/validators.py` - `Validators.validate_mentions()`, `.validate_youtube_url()`, etc.
6. `utils/formatters.py` - `Formatters.parse_time_string()` (from `bot.py:2007-2025`), `.format_uptime()` (from `bot.py:97-110`)
7. `utils/permissions.py` - `PermissionChecker.is_authorized()` (replaces hardcoded user ID checks at `bot.py:245-247`)
8. `services/api_client.py` - `APIClient.get()`, `.post()` with error handling (wraps aiohttp)
9. `services/google_search.py` - `GoogleImageSearch.search_images()`, `.random_image()` (eliminates 6+ duplicate Google API blocks)

**Testing**: Import modules in Python REPL, verify they work independently

**Risk**: Low - no changes to existing bot logic

---

### Phase 2: Core Bot Structure

**Goal**: Set up Cog system and event handlers

**Files to create**:
1. `core/bot.py` - `DiscordBot` class extending `commands.Bot`:
   - `setup_hook()` to load all Cogs
   - Configuration integration
   - Background task management
2. `core/events.py` - `Events` Cog with:
   - `on_ready()` event (from `bot.py:180-213`)
   - Base `on_message()` for channel validation
   - Background tasks: `send_heartbeat()`, `fetch_config()`, `uptime_status_task()`

**Files to modify**:
1. `bot.py` - Refactor to use new `DiscordBot` class (~50-100 lines)

**Testing**: Bot starts, connects, background tasks run

**Risk**: Medium - changes entry point but keeps all commands in old code initially

---

### Phase 3: Migrate Commands to Cogs (Iterative)

**Process**: Migrate one Cog at a time, test thoroughly before next

#### 3.1 Simple Cogs First (Low Risk)

**`cogs/media.py`** - URL manipulation only, no complex logic
- `/youtube` (`bot.py:1213-1242`)
- `/reel` (`bot.py:1308-1322`)
- `/tiktok` (`bot.py:1325-1345`)

**`cogs/images.py`** - Simple API calls
- `,cat` (`bot.py:471-492`)
- `,dog` (`bot.py:493-514`)
- `,crocodile` (`bot.py:633-686`) - uses Google Search service
- `,seal` (`bot.py:688-739`) - uses Google Search service

**`cogs/utility.py`** - Miscellaneous helpers
- `,say` (`bot.py:445-469`)
- `,say2` (`bot.py:779-811`)
- `/info` (`bot.py:1842-1869`)

#### 3.2 Medium Complexity Cogs

**`cogs/search.py`** - External API searches
- `/lumsearch` (`bot.py:1245-1305`)
- `/github` (`bot.py:1351-1427`)
- `/stackoverflow` (`bot.py:1430-1486`)

**`cogs/fun.py`** - Interactive commands
- `,gay` (`bot.py:515-537`)
- `,kiss` (`bot.py:539-566`)
- `,slap` (`bot.py:568-631`) - uses Google Search service
- `/ship` (`bot.py:1911-2000`)
- `/nuke` (`bot.py:1872-1908`)
- `,diddle` (`bot.py:857-912`) - uses Google Search service

**`cogs/auto_responses.py`** - Keyword listeners
- "faggot" trigger (`bot.py:1179-1189`)
- "rape" trigger (`bot.py:1191-1200`)
- Greeting reactions (`bot.py:1202-1210`)

#### 3.3 Complex Cogs (Require Additional Services)

**`cogs/memes.py`** - Image manipulation
- **Prerequisites**: Create `services/image_processor.py` first
  - `create_quote_image()` (from `bot.py:965-1037`)
  - `add_meme_text()` (from `bot.py:2277-2338`)
- `,quote` (`bot.py:944-1042`)
- `/meme` (`bot.py:2220-2339`)

**`cogs/ai.py`** - AI integrations
- **Prerequisites**: Create `services/ai_providers.py` first
  - `OpenAIClient.chat_completion()` (from `bot.py:1505-1549`)
  - `GrokClient.chat_completion()` (from `bot.py:1574-1609`)
  - `TranslateClient.translate()` (from `bot.py:1630-1676`)
- `/askgpt` (`bot.py:1489-1555`)
- `/askgrok` (`bot.py:1558-1613`)
- `/translate` (`bot.py:1616-1681`)

**`cogs/music.py`** - Voice/music playback (HIGHEST COMPLEXITY)
- **Prerequisites**: Create services first
  - `services/music_player.py` - Voice connection & YouTube/Spotify playback (`bot.py:1713-1728`, `1749-1763`)
  - `services/lastfm.py` - Last.fm API client (`bot.py:1079-1143`)
- `/playspotify` (`bot.py:1731-1805`)
- `/stop` (`bot.py:1808-1839`)
- `,fm` (`bot.py:1044-1177`)
- `,fmset` (`bot.py:914-942`)

**`cogs/utility.py` (Part 2)** - Add reminder system
- **Prerequisites**: Create `models/reminder.py` for reminder management
- `/weather` (`bot.py:2108-2217`)
- `/remindme` (`bot.py:2028-2082`)
- `/reminders` (`bot.py:2084-2105`)

**`cogs/admin.py`** - Moderation (REQUIRES SECURITY REVIEW)
- `,rapeon` (`bot.py:244-259`)
- `,rapeoff` (`bot.py:261-277`)
- `,rape` (`bot.py:279-354`) - uses Google Search service, permission-gated
- `,warn` (`bot.py:356-394`) - permission-gated, database interaction
- `,warns` (`bot.py:396-443`) - permission-gated, database interaction
- `,timeout` (`bot.py:813-855`) - permission-gated

**Testing per Cog**:
1. Verify all commands in the Cog work identically to original
2. Test error handling
3. Verify permissions (for admin commands)
4. Monitor logs for 24 hours

**Migration Strategy**:
- Comment out original code in `bot.py` after migrating to Cog
- Keep commented code until full testing complete
- Delete commented code in final cleanup phase

**Risk**: Medium - each Cog tested independently before moving to next

---

### Phase 4: Cleanup

**Goal**: Remove old code and unused modules

**Tasks**:
1. Delete orphaned `bot/text.py` (498 lines of unused refactored code)
2. Delete `bot/util.py` (replaced by `utils/logging.py`)
3. Delete `bot/vars.py` (replaced by `config/settings.py`)
4. Remove all commented code from `bot.py`
5. Verify final `bot.py` is ~50-100 lines (just entry point)

**Risk**: Low - only deleting unused code

---

## Critical Files and Their Source Code

### Key Commands to Migrate

| Command | Type | Location | Complexity | Notes |
|---------|------|----------|------------|-------|
| `,cat` | Prefix | 471-492 | Low | Simple API call to `https://api.thecatapi.com` |
| `,dog` | Prefix | 493-514 | Low | Simple API call to `https://dog.ceo/api` |
| `,warn` | Prefix | 356-394 | Medium | Permission check + database via `/api/warns` |
| `,fm` | Prefix | 1044-1177 | High | Last.fm API, complex formatting, scrobble count |
| `/youtube` | Slash | 1213-1242 | Low | URL manipulation for embeds |
| `/askgpt` | Slash | 1489-1555 | Medium | OpenAI API, 2000 char truncation |
| `/playspotify` | Slash | 1731-1805 | High | Voice connection, YouTube-DL, retry logic |
| `/ship` | Slash | 1911-2000 | Medium | PIL image composition with avatars |
| `/meme` | Slash | 2220-2339 | High | Google image search + PIL text overlay |

### Code Duplication to Eliminate

**Google Custom Search API** (6 instances):
- `bot.py:302-349` (rape command)
- `bot.py:577-627` (slap command)
- `bot.py:635-681` (crocodile command)
- `bot.py:690-735` (seal command)
- `bot.py:867-902` (diddle command)
- `bot.py:2237-2275` (meme command)

**Embed Creation** (20+ instances):
- `discord.Embed(color=discord.Color.purple())` pattern repeated everywhere
- Consolidate into `EmbedBuilder.create_embed()`

**Error Handling** (30+ instances):
- `await ctx.send("An error occurred...")` scattered throughout
- `log_to_server()` calls with inconsistent categories
- Standardize with `BotLogger.log_error()`

**Permission Checks** (hardcoded user IDs):
- `bot.py:245-247` (rapeon check)
- `bot.py:262-264` (rapeoff check)
- `bot.py:280-282` (rape check)
- Consolidate into `PermissionChecker.is_authorized()`

### Configuration Sources to Consolidate

**Environment Variables** (`.env`):
- `DISCORD_TOKEN`, `GOOGLE_API_KEY`, `LASTFM_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY`
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `GITHUB_TOKEN`, `BOT_API_KEY`

**Hardcoded in bot.py**:
- Line 53: `CHANNEL_ID = 1452216636819112010`
- Line 26-30: API URLs (`http://127.0.0.1:5000/api/...`)
- Line 245-247: Admin user IDs `[934443300520345631, 954606816820613160, 395651363985555457]`
- Line 58-61: `bot_config` dict (prefix, disabled commands, allowed channels)

**Dynamic from API** (fetched every 5 minutes):
- Line 139-167: `fetch_config()` task updates `bot_config` from `/api/bot/config`

**Global State**:
- Line 42: `bot_start_time = None`
- Line 255, 272, 287: `bot.rape_enabled` flag
- Line 2003: `reminders = {}`

**Consolidation Strategy**:
- Move all to `config/settings.py` with `ConfigManager` class
- Keep dynamic config fetch but integrate with `ConfigManager`
- Move runtime state to bot instance attributes

---

## Risk Assessment

### High Risk Commands (Test Extensively)

1. **Music commands** (`/playspotify`, `/stop`, `,fm`)
   - Voice connection management is complex
   - Retry logic critical (lines 1749-1763)
   - **Mitigation**: Keep voice logic isolated in `services/music_player.py`, test with multiple voice channels

2. **Admin commands** (`,rape`, `,warn`, `,timeout`)
   - Permission checks must be bulletproof
   - Unauthorized access is critical security issue
   - **Mitigation**: Unit tests for `PermissionChecker`, manual security audit before deployment

3. **Auto-responses** (keyword triggers)
   - Regex patterns need exact migration (`r'\brape\b'` vs `'rape' in content`)
   - **Mitigation**: Copy regex patterns exactly, test all trigger keywords

### Medium Risk

- **Config fetch task** - Runs every 5 minutes, must not break dynamic config system
- **Global state migration** - `bot.rape_enabled`, `reminders`, `bot_start_time` need careful handling
- **API authentication** - `get_api_headers()` must migrate correctly for logging/warns to work

### Low Risk

- Image commands (cat, dog) - Simple API calls
- Media embeds (youtube, reel, tiktok) - Just string manipulation
- Search commands (lumsearch, github) - Straightforward API wrappers

---

## Success Criteria

- ✅ All 42 commands work identically to original
- ✅ No regressions in functionality
- ✅ `bot.py` reduced from 2376 lines to <100 lines
- ✅ `on_message` handler <50 lines (validation only, commands in Cogs)
- ✅ All API integrations working (warns, logs, config, Last.fm, OpenAI, Grok, etc.)
- ✅ Voice commands connect/play/disconnect successfully
- ✅ Permission checks prevent unauthorized access
- ✅ Auto-responses trigger on correct keywords
- ✅ No duplicate code (Google API, embeds, error handling)
- ✅ Configuration centralized in `config/` module
- ✅ Orphaned `bot/` directory deleted

---

## Rollback Strategy

**Git Safety**:
- Create branch before each phase: `git checkout -b phase-1-foundation`
- Commit after each Cog migration
- Tag stable points: `git tag phase-1-complete`

**Quick Rollback**:
- Revert last commit: `git revert HEAD`
- Reset to previous phase: `git reset --hard phase-1-complete`

**Partial Rollback** (disable individual Cog):
```python
# In core/bot.py, comment out problematic Cog
# await self.load_extension('cogs.music')
```

**Emergency Backup**:
- Keep copy of original `bot.py` as `bot_legacy.py` before Phase 1
- Can swap back if catastrophic failure

---

## Notes

- Keep both prefix and slash commands (backward compatibility)
- Treat all commands equally (no prioritization)
- Focus on quick improvement, not comprehensive overhaul
- Maintain existing behavior exactly (no functional changes)
- Test incrementally to minimize risk
