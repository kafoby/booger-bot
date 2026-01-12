# Starboard & AutoReact Setup Guide

This document outlines the requirements and configuration for the **Starboard** and **AutoReact** features.

---

## Features Overview

### Starboard
Automatically posts messages to a dedicated channel when they receive a certain number of reactions.

### AutoReact
Automatically adds specified emoji reactions to messages in a configured channel based on message type filters.

---

## Dashboard API Requirements

Both features are **dashboard-configurable**. The bot fetches configuration from your API endpoint every 5 minutes via the `fetch_config()` task in `core/events.py`.

### API Endpoint
`GET /api/bot/config`

### Required Response Format

```json
{
  "prefix": ",",
  "disabledCommands": [],
  "allowedChannels": [],
  "starboard": {
    "GUILD_ID_1": {
      "monitored_channel_id": 1234567890,
      "emoji": "⭐",
      "threshold": 5,
      "starboard_channel_id": 9876543210
    },
    "GUILD_ID_2": {
      "monitored_channel_id": 1111111111,
      "emoji": "🔥",
      "threshold": 3,
      "starboard_channel_id": 2222222222
    }
  },
  "autoreact": {
    "GUILD_ID_1": {
      "channel_id": 3333333333,
      "type": "all",
      "emojis": ["😎", "🔥", "👍"]
    },
    "GUILD_ID_2": {
      "channel_id": 4444444444,
      "type": "embed",
      "emojis": ["📰", "📢"]
    }
  }
}
```

---

## Configuration Details

### Starboard Configuration

Each guild (server) can have its own starboard configuration:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `monitored_channel_id` | integer | Channel ID to monitor for reactions | `1234567890` |
| `emoji` | string | Emoji that triggers the starboard | `"⭐"`, `"👍"`, `"🔥"` |
| `threshold` | integer | Number of reactions needed to post | `5` |
| `starboard_channel_id` | integer | Channel where starred messages are posted | `9876543210` |

**Notes:**
- Guild IDs must be strings in the JSON (JavaScript limitation with large integers)
- Channel IDs are integers
- Only one emoji per guild is supported currently
- Threshold must be at least 1

### AutoReact Configuration

Each guild can have its own autoreact configuration:

| Field | Type | Description | Valid Values |
|-------|------|-------------|--------------|
| `channel_id` | integer | Channel to auto-react in | Any valid channel ID |
| `type` | string | Type of messages to react to | `"all"`, `"embed"`, `"file"` |
| `emojis` | array of strings | List of emojis to add as reactions | `["😎", "🔥", "👍"]` |

**Message Types:**
- `"all"` - React to all messages in the channel
- `"embed"` - Only react to messages containing embeds
- `"file"` - Only react to messages with file attachments

**Notes:**
- Guild IDs must be strings in the JSON
- Multiple emojis are supported (will be added in order)
- Invalid/custom emojis will be skipped with a console warning
- Emojis can be standard Unicode or Discord custom emojis (format: `<:name:id>`)

---

## Bot Permissions Required

### For Starboard
- **Read Messages** - To fetch message content
- **Read Message History** - To retrieve messages by ID
- **View Channel** - For both monitored and starboard channels
- **Send Messages** - In the starboard channel
- **Embed Links** - To post rich embeds in starboard channel

### For AutoReact
- **Read Messages** - To detect new messages
- **View Channel** - For the monitored channel
- **Add Reactions** - To add emoji reactions to messages

### Discord Intents (Already Configured)
The bot already has the required intents enabled in `core/bot.py`:
- ✅ `message_content` - Read message text
- ✅ `messages` - Receive message events
- ✅ `guild_reactions` - Receive reaction events (part of default intents)
- ✅ `guilds` - Access guild information

---

## Local Data Storage

### Starboard
- **File:** `data/starred_messages.json`
- **Purpose:** Tracks which messages have already been posted to prevent duplicates
- **Format:**
```json
{
  "123456789": [987654321, 876543210, 765432109],
  "987654321": [111111111, 222222222]
}
```
- Keys are guild IDs (strings)
- Values are arrays of message IDs (integers) that have been starred

### AutoReact
- No local storage required (reads directly from ConfigManager)

---

## Testing Checklist

### Starboard Testing

1. **Configure via Dashboard:**
   - Set monitored channel (e.g., #general)
   - Set emoji (e.g., ⭐)
   - Set threshold (e.g., 5)
   - Set starboard channel (e.g., #starboard)

2. **Verify Bot Permissions:**
   - Bot can read messages in monitored channel
   - Bot can send messages in starboard channel
   - Bot has "Embed Links" permission

3. **Test Functionality:**
   - Post a message in monitored channel
   - React with configured emoji
   - Add reactions until threshold is met
   - Verify message appears in starboard channel
   - Verify message includes author, content, jump link, reaction count
   - Verify images are displayed if present
   - Add more reactions - message should NOT duplicate

4. **Edge Cases:**
   - Test with missing starboard channel (should log error)
   - Test with bot lacking permissions (should log error)
   - Test with messages containing only images (should show "*No text content*")

### AutoReact Testing

1. **Configure via Dashboard:**
   - Set channel to monitor (e.g., #memes)
   - Set message type filter (all/embed/file)
   - Set emoji list (e.g., 😎, 🔥, 👍)

2. **Verify Bot Permissions:**
   - Bot can read messages in channel
   - Bot has "Add Reactions" permission

3. **Test Functionality:**
   - **If type = "all":** Post any message → Bot should react with all emojis
   - **If type = "embed":**
     - Post plain text → No reactions
     - Post embed (use `/embed` command) → Bot should react
   - **If type = "file":**
     - Post plain text → No reactions
     - Post message with attachment → Bot should react

4. **Edge Cases:**
   - Test with invalid emoji (should skip and log warning)
   - Test with bot lacking permissions (should log error and stop)
   - Test with rate limiting (bot should handle gracefully)

---

## Configuration Sync

Configuration is synchronized every **5 minutes** via the `fetch_config()` background task in `core/events.py` (line ~50).

To force immediate sync without restarting the bot:
- Wait up to 5 minutes for automatic sync, OR
- Restart the bot to load configuration immediately

---

## Troubleshooting

### Starboard Not Working

**Check:**
1. Is starboard configured for the correct guild ID?
2. Does the bot have permissions in both channels?
3. Is the emoji string exact (including Unicode representation)?
4. Check console logs for errors:
   - "Missing permissions to fetch message"
   - "Starboard channel not found"
   - "Missing permissions to send to starboard channel"

### AutoReact Not Working

**Check:**
1. Is autoreact configured for the correct guild ID?
2. Is the channel ID correct?
3. Does the bot have "Add Reactions" permission?
4. Are emojis valid Unicode or Discord format (`<:name:id>`)?
5. Check console logs for errors:
   - "Failed to add reaction X in [guild]: [error]"
   - "Missing permissions to add reactions"

### Config Not Updating

**Check:**
1. Verify API endpoint `/api/bot/config` returns correct JSON
2. Check API response includes `BOT_API_KEY` header for authentication
3. Verify config structure matches expected format (guild IDs as strings)
4. Wait 5 minutes for next sync, or restart bot
5. Check bot logs for config fetch errors

---

## Feature Compatibility

These features are **fully compatible** with each other and existing cogs:

- **Starboard** uses `on_raw_reaction_add` event
- **AutoReact** uses `on_message` event
- Both read from `ConfigManager` (fetched from dashboard API)
- Neither interferes with command processing or other cogs
- Both follow the same architectural patterns as existing cogs (levels, welcome, etc.)

---

## Implementation Files

### Starboard
- **Cog:** `/cogs/starboard.py`
- **Config:** `/config/settings.py` (lines 36, 54-59)
- **Loaded:** `/core/bot.py` (line 43)
- **Data Storage:** `/data/starred_messages.json`

### AutoReact
- **Cog:** `/cogs/autoreact.py`
- **Config:** `/config/settings.py` (lines 37, 61-66)
- **Loaded:** `/core/bot.py` (line 44)
- **Data Storage:** None (reads from config only)

---

## Dashboard UI Recommendations

### Starboard Setup Page
```
[ ] Enable Starboard

Monitored Channel: [Dropdown: #general ▼]
Starboard Channel: [Dropdown: #starboard ▼]
Reaction Emoji: [⭐] (emoji picker)
Threshold: [5] (number input, min: 1)

[Save Configuration]
```

### AutoReact Setup Page
```
[ ] Enable AutoReact

Channel: [Dropdown: #memes ▼]
React to: ( ) All messages (•) Only embeds ( ) Only files/attachments
Emojis: [😎] [🔥] [👍] [+ Add emoji]

[Save Configuration]
```

---

## Example API Response

Complete example of a working configuration:

```json
{
  "prefix": ",",
  "disabledCommands": ["purge", "ban"],
  "allowedChannels": [1234567890, 9876543210],
  "starboard": {
    "1234567890123456789": {
      "monitored_channel_id": 1111111111111111111,
      "emoji": "⭐",
      "threshold": 5,
      "starboard_channel_id": 2222222222222222222
    }
  },
  "autoreact": {
    "1234567890123456789": {
      "channel_id": 3333333333333333333,
      "type": "all",
      "emojis": ["😎", "🔥", "👍", "💯"]
    }
  }
}
```

**Important:** Guild IDs are very large numbers (18-19 digits) and must be strings in JSON to avoid precision loss in JavaScript.

---

## Support

Both features are now fully integrated and ready for production use. Configuration is managed entirely through your dashboard, synced every 5 minutes automatically.
