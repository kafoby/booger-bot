import discord
from discord import app_commands
from discord.ext import commands
from PIL import Image, ImageDraw, ImageFont
import io
import random
import string
import json
import os
import asyncio
from typing import Optional, Dict

from utils.logging import BotLogger
from utils.permissions import PermissionChecker

# Constants
VERIFICATION_EMBED_COLOR = 0x9b59b6
CAPTCHA_TIMEOUT = 120.0
CAPTCHA_LENGTH = 6
CAPTCHA_WIDTH = 300
CAPTCHA_HEIGHT = 100
CAPTCHA_FONT_SIZE = 50
VERIFICATION_FILE = "data/verification.json"

class VerificationConfig:
    def __init__(self):
        self._load()

    def _load(self):
        if not os.path.exists("data"):
            os.makedirs("data")
        
        if os.path.exists(VERIFICATION_FILE):
            try:
                with open(VERIFICATION_FILE, "r") as f:
                    self.data = json.load(f)
            except Exception as e:
                print(f"Error loading verification config: {e}")
                self.data = {}
        else:
            self.data = {}

    def save(self):
        try:
            with open(VERIFICATION_FILE, "w") as f:
                json.dump(self.data, f, indent=4)
        except Exception as e:
            print(f"Error saving verification config: {e}")

    def get_guild_config(self, guild_id: int) -> Optional[Dict]:
        return self.data.get(str(guild_id))

    def set_guild_config(self, guild_id: int, channel_id: int, role_id: int):
        self.data[str(guild_id)] = {
            "channel_id": channel_id,
            "role_id": role_id
        }
        self.save()

# Global config instance
verification_config = VerificationConfig()

def generate_captcha_image(text: str) -> io.BytesIO:
    try:
        # Create image
        img = Image.new("RGB", (CAPTCHA_WIDTH, CAPTCHA_HEIGHT), (30, 30, 46))
        draw = ImageDraw.Draw(img)

        # Try to load a font, fall back to default
        try:
            # Try common system fonts or project fonts if available
            font = ImageFont.truetype("fonts/Roboto-Bold.ttf", CAPTCHA_FONT_SIZE)
        except:
            try:
                font = ImageFont.truetype("arial.ttf", CAPTCHA_FONT_SIZE)
            except:
                font = ImageFont.load_default()

        # Add noise (lines/dots) to make it harder for OCR but readable for humans
        for _ in range(30):
            x1 = random.randint(0, CAPTCHA_WIDTH)
            y1 = random.randint(0, CAPTCHA_HEIGHT)
            x2 = random.randint(0, CAPTCHA_WIDTH)
            y2 = random.randint(0, CAPTCHA_HEIGHT)
            draw.line([(x1, y1), (x2, y2)], fill=(50, 50, 70), width=1)

        # Draw text
        # Center the text roughly
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        x = (CAPTCHA_WIDTH - text_width) / 2
        y = (CAPTCHA_HEIGHT - text_height) / 2
        
        draw.text((x, y), text, font=font, fill=(255, 255, 255))

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer
    except Exception as e:
        print(f"Error generating captcha: {e}")
        # Return empty buffer or fallback
        return io.BytesIO()

class CaptchaModal(discord.ui.Modal):
    def __init__(self, answer: str, role_id: int):
        super().__init__(title="Captcha Verification")
        self.answer = answer
        self.role_id = role_id
        
        self.input = discord.ui.TextInput(
            label="Enter the code from the image",
            placeholder="Type the code here...",
            min_length=CAPTCHA_LENGTH,
            max_length=CAPTCHA_LENGTH,
            required=True
        )
        self.add_item(self.input)

    async def on_submit(self, interaction: discord.Interaction):
        if self.input.value.strip().upper() == self.answer:
            role = interaction.guild.get_role(self.role_id)
            if role:
                try:
                    await interaction.user.add_roles(role, reason="Verification successful")
                    await interaction.response.send_message("✅ Verification successful! You have been granted access.", ephemeral=True)
                    await BotLogger.log(
                        f"User {interaction.user} ({interaction.user.id}) verified in guild {interaction.guild.name}",
                        "info",
                        "security"
                    )
                except discord.Forbidden:
                    await interaction.response.send_message("❌ I do not have permission to assign the role. Please contact an admin.", ephemeral=True)
                    await BotLogger.log(
                        f"Failed to assign verification role in {interaction.guild.name} - Missing Permissions",
                        "error",
                        "security"
                    )
            else:
                await interaction.response.send_message("❌ Verification role not found. Please contact an admin.", ephemeral=True)
        else:
            await interaction.response.send_message("❌ Incorrect captcha. Please try again.", ephemeral=True)

class EnterCaptchaView(discord.ui.View):
    def __init__(self, answer: str, role_id: int):
        super().__init__(timeout=CAPTCHA_TIMEOUT)
        self.answer = answer
        self.role_id = role_id

    @discord.ui.button(label="Enter Captcha", style=discord.ButtonStyle.primary, emoji="⌨️")
    async def enter_captcha(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(CaptchaModal(self.answer, self.role_id))

class VerificationView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Verify", style=discord.ButtonStyle.green, custom_id="verification:verify_button", emoji="✅")
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Fetch config for this guild
        guild_config = verification_config.get_guild_config(interaction.guild_id)
        
        if not guild_config:
            await interaction.response.send_message("Verification is not set up for this server.", ephemeral=True)
            return

        role_id = guild_config.get("role_id")
        role = interaction.guild.get_role(role_id)
        
        if not role:
            await interaction.response.send_message("Configuration error: Verified role not found.", ephemeral=True)
            return

        if role in interaction.user.roles:
            await interaction.response.send_message("You are already verified!", ephemeral=True)
            return

        # Generate Captcha
        await interaction.response.defer(ephemeral=True)
        
        captcha_text = ''.join(random.choices(string.ascii_uppercase + string.digits, k=CAPTCHA_LENGTH))
        captcha_image = generate_captcha_image(captcha_text)
        
        if not captcha_image.getvalue():
             await interaction.followup.send("Error generating captcha. Please contact an admin.", ephemeral=True)
             return

        file = discord.File(captcha_image, filename="captcha.png")
        
        view = EnterCaptchaView(captcha_text, role_id)
        
        await interaction.followup.send(
            content="Please enter the code shown in the image below to verify.",
            file=file,
            view=view,
            ephemeral=True
        )

class Verification(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="verifysetup", description="Set up the verification system in a channel")
    @app_commands.describe(channel="Channel to send the verification embed to", role="Role to give after verification")
    async def verifysetup(self, interaction: discord.Interaction, channel: discord.TextChannel, role: discord.Role):
        # Check permissions
        if not interaction.user.guild_permissions.administrator:
            await interaction.response.send_message("You need Administrator permission to use this command.", ephemeral=True)
            return

        # Update config
        verification_config.set_guild_config(interaction.guild_id, channel.id, role.id)

        # Create Embed
        embed = discord.Embed(
            title="Verification Required",
            description="To access the server, you need to pass the verification check.\n\nClick the **Verify** button below to start.",
            color=VERIFICATION_EMBED_COLOR
        )
        embed.set_footer(text="Verification System")

        # Send to channel with Persistent View
        try:
            await channel.send(embed=embed, view=VerificationView())
            await interaction.response.send_message(f"Verification setup complete! Embed sent to {channel.mention} using role {role.mention}.", ephemeral=True)
            
            await BotLogger.log(
                f"Verification setup in {interaction.guild.name} by {interaction.user}",
                "info",
                "config"
            )
        except discord.Forbidden:
            await interaction.response.send_message(f"I don't have permission to send messages in {channel.mention}.", ephemeral=True)

async def setup(bot):
    await bot.add_cog(Verification(bot))
    # Register the persistent view
    # Note: We don't need to pass 'bot' to the view if it doesn't use it, 
    # but strictly speaking, add_view is global.
    # If this view is already added (e.g. from another reload), it might duplicate if not careful,
    # but bot.add_view handles checking if the custom_id is already registered usually? 
    # Actually, explicit re-adding is fine.
    bot.add_view(VerificationView())
