"""
Last.fm Discord Cog
Handles Last.fm authentication, status checks, and settings management.
"""

import discord
from discord.ext import commands
from discord import app_commands
import aiohttp
from typing import Optional
from config.settings import config


class LastFm(commands.Cog):
    """Last.fm integration commands"""

    def __init__(self, bot):
        self.bot = bot
        self.api_base = "http://localhost:3000/api"

    async def _api_request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[dict] = None
    ) -> tuple[bool, any]:
        """Make API request to the backend"""
        try:
            headers = config.get_api_headers()
            url = f"{self.api_base}{endpoint}"

            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method,
                    url,
                    headers=headers,
                    json=json_data
                ) as response:
                    if response.status in [200, 201]:
                        data = await response.json()
                        return True, data
                    else:
                        error_text = await response.text()
                        return False, error_text
        except Exception as e:
            return False, str(e)

    @app_commands.command(name="lastfm-auth")
    async def lastfm_auth(self, interaction: discord.Interaction):
        """Start Last.fm authentication process"""
        await interaction.response.defer(ephemeral=True)

        # Call API to start auth flow
        success, result = await self._api_request(
            "GET",
            f"/lfm/auth/start?discordUserId={interaction.user.id}"
        )

        if not success:
            await interaction.followup.send(
                f"❌ Failed to start authentication: {result}",
                ephemeral=True
            )
            return

        auth_url = result.get("authUrl")
        if not auth_url:
            await interaction.followup.send(
                "❌ Failed to generate authentication URL",
                ephemeral=True
            )
            return

        # Create button/view for authentication
        embed = discord.Embed(
            title="🎵 Connect Last.fm",
            description=(
                "Click the button below to authenticate your Last.fm account.\n\n"
                "**What happens next:**\n"
                "1. You'll be taken to Last.fm to authorize the connection\n"
                "2. Grant permissions to allow scrobbling\n"
                "3. You'll see a confirmation page\n"
                "4. Return to Discord and use `/lastfm-status` to verify\n\n"
                "This link expires in 60 minutes."
            ),
            color=discord.Color.red()
        )

        view = discord.ui.View()
        view.add_item(
            discord.ui.Button(
                label="Connect to Last.fm",
                url=auth_url,
                style=discord.ButtonStyle.link,
                emoji="🎵"
            )
        )

        await interaction.followup.send(
            embed=embed,
            view=view,
            ephemeral=True
        )

    @app_commands.command(name="lastfm-status")
    async def lastfm_status(self, interaction: discord.Interaction):
        """Check your Last.fm connection status"""
        await interaction.response.defer(ephemeral=True)

        # Get connection status from API
        success, result = await self._api_request(
            "GET",
            f"/lfm/{interaction.user.id}"
        )

        if not success:
            embed = discord.Embed(
                title="🎵 Last.fm Status",
                description="❌ Not connected to Last.fm\n\nUse `/lastfm-auth` to connect your account.",
                color=discord.Color.greyple()
            )
            await interaction.followup.send(embed=embed, ephemeral=True)
            return

        username = result.get("lastfmUsername", "Unknown")
        scrobbling_enabled = result.get("scrobblingEnabled", False)

        status_emoji = "✅" if scrobbling_enabled else "⏸️"
        status_text = "Enabled" if scrobbling_enabled else "Disabled"

        embed = discord.Embed(
            title="🎵 Last.fm Status",
            color=discord.Color.green() if scrobbling_enabled else discord.Color.orange()
        )
        embed.add_field(
            name="Account",
            value=f"[{username}](https://www.last.fm/user/{username})",
            inline=False
        )
        embed.add_field(
            name="Auto-Scrobbling",
            value=f"{status_emoji} {status_text}",
            inline=False
        )
        embed.set_footer(
            text="Use /lastfm-toggle to enable/disable scrobbling"
        )

        await interaction.followup.send(embed=embed, ephemeral=True)

    @app_commands.command(name="lastfm-toggle")
    async def lastfm_toggle(self, interaction: discord.Interaction):
        """Toggle auto-scrobbling on/off"""
        await interaction.response.defer(ephemeral=True)

        # Toggle scrobbling via API
        success, result = await self._api_request(
            "PUT",
            f"/lfm/{interaction.user.id}/toggle"
        )

        if not success:
            await interaction.followup.send(
                f"❌ Failed to toggle scrobbling: {result}\n\n"
                "Make sure you're connected with `/lastfm-auth` first.",
                ephemeral=True
            )
            return

        scrobbling_enabled = result.get("scrobblingEnabled", False)
        status_emoji = "✅" if scrobbling_enabled else "⏸️"
        status_text = "enabled" if scrobbling_enabled else "disabled"

        embed = discord.Embed(
            title="🎵 Last.fm Scrobbling Updated",
            description=f"{status_emoji} Auto-scrobbling is now **{status_text}**",
            color=discord.Color.green() if scrobbling_enabled else discord.Color.orange()
        )

        if scrobbling_enabled:
            embed.set_footer(
                text="Tracks you listen to will be scrobbled to your Last.fm profile"
            )
        else:
            embed.set_footer(
                text="Tracks will not be scrobbled until you re-enable this"
            )

        await interaction.followup.send(embed=embed, ephemeral=True)

    @app_commands.command(name="lastfm-disconnect")
    async def lastfm_disconnect(self, interaction: discord.Interaction):
        """Disconnect your Last.fm account"""
        await interaction.response.defer(ephemeral=True)

        # Create confirmation view
        class ConfirmView(discord.ui.View):
            def __init__(self, cog, user_id):
                super().__init__(timeout=30)
                self.cog = cog
                self.user_id = user_id
                self.value = None

            @discord.ui.button(
                label="Yes, Disconnect",
                style=discord.ButtonStyle.danger,
                emoji="🗑️"
            )
            async def confirm(
                self,
                button_interaction: discord.Interaction,
                button: discord.ui.Button
            ):
                # Delete connection via API
                success, result = await self.cog._api_request(
                    "DELETE",
                    f"/lfm/{self.user_id}"
                )

                if not success:
                    await button_interaction.response.edit_message(
                        content=f"❌ Failed to disconnect: {result}",
                        embed=None,
                        view=None
                    )
                    return

                embed = discord.Embed(
                    title="🎵 Last.fm Disconnected",
                    description="✅ Your Last.fm account has been disconnected.\n\n"
                                "You can reconnect anytime with `/lastfm-auth`.",
                    color=discord.Color.green()
                )
                await button_interaction.response.edit_message(
                    content=None,
                    embed=embed,
                    view=None
                )

            @discord.ui.button(
                label="Cancel",
                style=discord.ButtonStyle.secondary,
                emoji="❌"
            )
            async def cancel(
                self,
                button_interaction: discord.Interaction,
                button: discord.ui.Button
            ):
                await button_interaction.response.edit_message(
                    content="Disconnection cancelled.",
                    embed=None,
                    view=None
                )

        # Show confirmation
        embed = discord.Embed(
            title="🎵 Disconnect Last.fm?",
            description=(
                "Are you sure you want to disconnect your Last.fm account?\n\n"
                "**This will:**\n"
                "• Stop all automatic scrobbling\n"
                "• Remove your saved Last.fm session\n"
                "• Require re-authentication to reconnect\n\n"
                "Your scrobble history on Last.fm will not be affected."
            ),
            color=discord.Color.orange()
        )

        view = ConfirmView(self, interaction.user.id)
        await interaction.followup.send(
            embed=embed,
            view=view,
            ephemeral=True
        )


async def setup(bot):
    await bot.add_cog(LastFm(bot))
