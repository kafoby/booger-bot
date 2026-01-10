import discord
from discord.ext import commands
from PIL import Image, ImageDraw, ImageFont
import io
import textwrap
import aiohttp
from config.constants import ALLOWED_GUILD_ID, WELCOME_CHANNEL_ID
from utils.logging import BotLogger

class Welcome(commands.Cog):
    """Handles welcome messages with custom images for new members"""

    def __init__(self, bot):
        self.bot = bot

    def _get_ordinal_suffix(self, number: int) -> str:
        """
        Get the ordinal suffix for a number (st, nd, rd, th)
        Examples: 1st, 2nd, 3rd, 4th, 11th, 21st, 22nd, 23rd, 24th
        """
        # Handle special cases: 11th, 12th, 13th
        if 10 <= number % 100 <= 13:
            return f"{number}th"

        # Handle regular cases based on last digit
        last_digit = number % 10
        if last_digit == 1:
            return f"{number}st"
        elif last_digit == 2:
            return f"{number}nd"
        elif last_digit == 3:
            return f"{number}rd"
        else:
            return f"{number}th"

    async def _create_welcome_image(self, member: discord.Member, member_count: int) -> io.BytesIO:
        """Create a custom welcome image with the member's avatar"""
        try:
            # Download avatar
            async with aiohttp.ClientSession() as session:
                async with session.get(str(member.display_avatar.url)) as resp:
                    if resp.status != 200:
                        return None
                    avatar_data = await resp.read()

            # Process avatar - make it circular
            avatar = Image.open(io.BytesIO(avatar_data)).convert("RGBA").resize((128, 128))
            mask = Image.new("L", (128, 128), 0)
            draw_mask = ImageDraw.Draw(mask)
            draw_mask.ellipse((0, 0, 128, 128), fill=255)
            avatar = Image.composite(avatar, Image.new("RGBA", (128, 128), (0, 0, 0, 0)), mask)

            # Create base image
            width, height = 600, 200
            img = Image.new("RGB", (width, height), (30, 30, 46))
            draw = ImageDraw.Draw(img)

            # Paste circular avatar
            img.paste(avatar, (40, height // 2 - 64), avatar)

            # Load fonts
            try:
                name_font = ImageFont.truetype("arialbd.ttf", 40)
                text_font = ImageFont.truetype("arial.ttf", 28)
            except Exception:
                # Fallback to default font if Arial not available
                name_font = ImageFont.load_default()
                text_font = ImageFont.load_default()

            # Draw member name
            draw.text((180, 50), member.name, font=name_font, fill=(255, 255, 255))

            # Draw member count with ordinal suffix
            member_text = f"{self._get_ordinal_suffix(member_count)} member to join"
            wrapped = textwrap.fill(member_text, width=30)
            draw.text((180, 100), wrapped, font=text_font, fill=(200, 200, 255))

            # Save to buffer
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            return buffer

        except Exception as e:
            await BotLogger.log_error("Error creating welcome image", e, "system")
            return None

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        """Send a welcome message when a member joins"""
        # Only process events from the allowed guild
        if member.guild.id != ALLOWED_GUILD_ID:
            return

        channel = self.bot.get_channel(WELCOME_CHANNEL_ID)
        if not channel:
            await BotLogger.log(
                f"Welcome channel {WELCOME_CHANNEL_ID} not found",
                "warning",
                "system"
            )
            return

        try:
            member_count = member.guild.member_count

            # Try to create welcome image
            image_buffer = await self._create_welcome_image(member, member_count)

            if image_buffer:
                # Send image welcome
                await channel.send(file=discord.File(image_buffer, filename="welcome.png"))
                await BotLogger.log(
                    f"Welcomed {member.name} (ID: {member.id}) as {self._get_ordinal_suffix(member_count)} member with image",
                    "info",
                    "system"
                )
            else:
                # Fallback to text-only welcome
                ordinal_count = self._get_ordinal_suffix(member_count)
                await channel.send(
                    f"Welcome {member.mention}! You are the **{ordinal_count}** member to join!"
                )
                await BotLogger.log(
                    f"Welcomed {member.name} (ID: {member.id}) as {ordinal_count} member (text fallback)",
                    "info",
                    "system"
                )

        except Exception as e:
            await BotLogger.log_error(
                f"Error sending welcome message for {member.name}",
                e,
                "system"
            )
            # Final fallback
            try:
                ordinal_count = self._get_ordinal_suffix(member.guild.member_count)
                await channel.send(
                    f"Welcome {member.mention}! You are the **{ordinal_count}** member to join!"
                )
            except Exception:
                pass

    @commands.command(name="testwelcome")
    @commands.has_permissions(administrator=True)
    async def test_welcome(self, ctx, member: discord.Member = None):
        """Test the welcome message functionality

        Usage:
            !testwelcome - Test with yourself
            !testwelcome @member - Test with a specific member
        """
        target_member = member or ctx.author

        # Get the welcome channel
        channel = self.bot.get_channel(WELCOME_CHANNEL_ID)
        if not channel:
            await ctx.send(f"⚠️ Welcome channel {WELCOME_CHANNEL_ID} not found!")
            return

        try:
            member_count = ctx.guild.member_count

            # Try to create welcome image
            image_buffer = await self._create_welcome_image(target_member, member_count)

            if image_buffer:
                # Send image welcome
                await channel.send(
                    f"**[TEST]** Testing welcome message for {target_member.mention}",
                    file=discord.File(image_buffer, filename="welcome.png")
                )
                await ctx.send(f"✅ Test welcome message sent to <#{WELCOME_CHANNEL_ID}> for {target_member.mention}")
            else:
                # Fallback to text-only welcome
                ordinal_count = self._get_ordinal_suffix(member_count)
                await channel.send(
                    f"**[TEST]** Welcome {target_member.mention}! You are the **{ordinal_count}** member to join!"
                )
                await ctx.send(f"✅ Test welcome message (text fallback) sent to <#{WELCOME_CHANNEL_ID}> for {target_member.mention}")

        except Exception as e:
            await ctx.send(f"❌ Error testing welcome: {str(e)}")
            await BotLogger.log_error(
                f"Error in test_welcome command for {target_member.name}",
                e,
                "system"
            )

async def setup(bot):
    await bot.add_cog(Welcome(bot))
