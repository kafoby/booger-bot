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

            # Constants
            W, H = 800, 250
            AVATAR_SIZE = 160
            AVATAR_PADDING = 45
            
            # Create base image with gradient
            img = Image.new("RGB", (W, H))
            draw = ImageDraw.Draw(img)
            
            # Draw gradient background (Dark purple/slate theme)
            for y in range(H):
                # Interpolate between a deep dark purple and a slightly lighter violet-slate
                r = int(25 + (45 - 25) * y / H)
                g = int(20 + (30 - 20) * y / H)
                b = int(45 + (85 - 45) * y / H)
                draw.line([(0, y), (W, y)], fill=(r, g, b))

            # Process avatar - make it circular with border
            avatar = Image.open(io.BytesIO(avatar_data)).convert("RGBA").resize((AVATAR_SIZE, AVATAR_SIZE))
            
            # Create mask for circular crop
            mask = Image.new("L", (AVATAR_SIZE, AVATAR_SIZE), 0)
            draw_mask = ImageDraw.Draw(mask)
            draw_mask.ellipse((0, 0, AVATAR_SIZE, AVATAR_SIZE), fill=255)
            
            # Create a circular border
            border_size = 4
            border_img = Image.new("RGBA", (AVATAR_SIZE + border_size*2, AVATAR_SIZE + border_size*2), (0, 0, 0, 0))
            draw_border = ImageDraw.Draw(border_img)
            draw_border.ellipse((0, 0, AVATAR_SIZE + border_size*2 - 1, AVATAR_SIZE + border_size*2 - 1), fill=(255, 255, 255, 255))
            
            # Composite avatar onto transparent background
            avatar_comp = Image.new("RGBA", (AVATAR_SIZE, AVATAR_SIZE), (0, 0, 0, 0))
            avatar_comp.paste(avatar, (0, 0), mask)
            
            # Paste avatar onto border
            final_avatar = border_img.copy()
            final_avatar.paste(avatar_comp, (border_size, border_size), avatar_comp)

            # Paste avatar onto main image
            img.paste(final_avatar, (AVATAR_PADDING, (H - final_avatar.height) // 2), final_avatar)

            # Load fonts
            try:
                name_font = ImageFont.truetype("fonts/Roboto-Bold.ttf", 55)
                text_font = ImageFont.truetype("fonts/Roboto-Regular.ttf", 35)
            except Exception as e:
                # Log warning if fonts are missing, though they should be there now
                print(f"Warning: Could not load local fonts: {e}") 
                name_font = ImageFont.load_default()
                text_font = ImageFont.load_default()

            # Text content
            name_text = member.name
            ordinal = self._get_ordinal_suffix(member_count)
            count_text = f"You are the {ordinal} member!"

            # Text positioning
            text_x = AVATAR_PADDING + final_avatar.width + 40
            
            # Calculate text height for vertical centering
            # Using getbbox if available (Pillow >= 9.2.0), fallback to getsize
            def get_text_size(font, text):
                if hasattr(font, 'getbbox'):
                    bbox = font.getbbox(text)
                    return bbox[2] - bbox[0], bbox[3] - bbox[1]
                else:
                    return font.getsize(text)

            _, name_h = get_text_size(name_font, name_text)
            _, count_h = get_text_size(text_font, count_text)
            
            TEXT_SPACING = 25
            total_text_height = name_h + count_h + TEXT_SPACING
            start_y = (H - total_text_height) // 2

            # Draw member name
            draw.text((text_x, start_y), name_text, font=name_font, fill=(255, 255, 255))

            # Draw member count (lilac color)
            draw.text((text_x, start_y + name_h + TEXT_SPACING), count_text, font=text_font, fill=(180, 160, 255))

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
