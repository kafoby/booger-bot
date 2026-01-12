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
            return

        # Get autoreact config from ConfigManager (fetched from dashboard)
        guild_id = str(message.guild.id)
        autoreact_config = config.autoreact_config.get(guild_id)

        # Check if autoreact is configured for this guild
        if not autoreact_config:
            # print(f"No autoreact config for guild {guild_id}")
            return

        # Check if message is in the configured channel
        try:
            config_channel_id = int(autoreact_config.get("channel_id", 0))
        except (ValueError, TypeError):
            return

        if not config_channel_id or message.channel.id != config_channel_id:
            return

        # Determine if we should react based on the type
        react_type = autoreact_config.get("type", "all")
        should_react = False

        if react_type == "all":
            should_react = True
        elif react_type == "embed" and message.embeds:
            should_react = True
        elif react_type == "file" and message.attachments:
            should_react = True

        # Add reactions if conditions are met
        if should_react:
            emojis = autoreact_config.get("emojis", [])
            for emoji in emojis:
                try:
                    await message.add_reaction(emoji)
                except discord.HTTPException as e:
                    # Handle invalid emoji or rate limits
                    print(f"Failed to add reaction {emoji} in {message.guild.name}: {e}")
                except discord.Forbidden:
                    print(f"Missing permissions to add reactions in {message.channel.name}")
                    break  # Stop trying if we don't have permissions
                except Exception as e:
                    print(f"Unexpected error adding reaction: {e}")


async def setup(bot):
    await bot.add_cog(AutoReact(bot))
