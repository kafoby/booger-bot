import discord
from discord.ext import commands
from config.settings import config


class AutoReact(commands.Cog):
    """Auto-react feature - automatically add reactions to messages in specific channels

    Configuration is managed via the dashboard and fetched from the API.
    """

    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        """Handle auto-reactions for configured channels"""
        # Ignore bot messages
        if message.author.bot:
            return

        # Check if message is in a guild
        if not message.guild:
            print(f"[AUTOREACT DEBUG] Message {message.id} not in a guild (DM?)")
            return

        # Get autoreact config from ConfigManager (fetched from dashboard)
        guild_id = str(message.guild.id)
        print(f"[AUTOREACT DEBUG] Processing message {message.id} in guild {guild_id}")
        
        # Log the entire config map to see what we have
        # print(f"[AUTOREACT DEBUG] Full Autoreact Config: {config.autoreact_config}")

        autoreact_config = config.autoreact_config.get(guild_id)

        # Check if autoreact is configured for this guild
        if not autoreact_config:
            print(f"[AUTOREACT DEBUG] No config found for guild {guild_id}")
            return
        
        print(f"[AUTOREACT DEBUG] Config found for guild {guild_id}: {autoreact_config}")

        # Check if message is in the configured channel
        raw_channel_id = autoreact_config.get("channel_id")
        try:
            config_channel_id = int(raw_channel_id) if raw_channel_id is not None else 0
        except (ValueError, TypeError) as e:
            print(f"[AUTOREACT DEBUG] Failed to parse channel_id '{raw_channel_id}': {e}")
            return

        print(f"[AUTOREACT DEBUG] Channel Check: Msg Channel: {message.channel.id} (int), Config Channel: {config_channel_id} (int) [Raw: {raw_channel_id}]")

        if not config_channel_id or message.channel.id != config_channel_id:
            print(f"[AUTOREACT DEBUG] Channel mismatch. Skipping.")
            return

        # Determine if we should react based on the type
        react_type = autoreact_config.get("type", "all")
        should_react = False
        
        print(f"[AUTOREACT DEBUG] Checking react conditions. Type: {react_type}, Embeds: {len(message.embeds)}, Attachments: {len(message.attachments)}")

        if react_type == "all":
            should_react = True
        elif react_type == "embed" and message.embeds:
            should_react = True
        elif react_type == "file" and message.attachments:
            should_react = True
            
        print(f"[AUTOREACT DEBUG] Should React: {should_react}")

        # Add reactions if conditions are met
        if should_react:
            emojis = autoreact_config.get("emojis", [])
            print(f"[AUTOREACT DEBUG] Adding emojis: {emojis}")
            for emoji in emojis:
                try:
                    print(f"[AUTOREACT DEBUG] Attempting to add reaction: {emoji}")
                    await message.add_reaction(emoji)
                    print(f"[AUTOREACT DEBUG] Successfully added reaction: {emoji}")
                except discord.HTTPException as e:
                    # Handle invalid emoji or rate limits
                    print(f"[AUTOREACT DEBUG] Failed to add reaction {emoji} in {message.guild.name}: {e}")
                except discord.Forbidden:
                    print(f"[AUTOREACT DEBUG] Missing permissions to add reactions in {message.channel.name}")
                    break  # Stop trying if we don't have permissions
                except Exception as e:
                    print(f"[AUTOREACT DEBUG] Unexpected error adding reaction: {e}")


async def setup(bot):
    await bot.add_cog(AutoReact(bot))
