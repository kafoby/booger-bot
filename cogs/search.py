import discord
from discord import app_commands
from discord.ext import commands
import os
from config.settings import config
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder
from services.api_client import APIClient

class Search(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="lumsearch", description="Search Google")
    @app_commands.describe(query="What do you want to search on Google?")
    async def lumsearch(self, interaction: discord.Interaction, query: str):
        await interaction.response.defer()

        if config.is_command_disabled("lumsearch"):
            await interaction.followup.send("The `lumsearch` command is currently disabled.")
            return

        try:
            params = {
                "key": config.GOOGLE_API_KEY,
                "cx": config.GOOGLE_CSE_ID,
                "q": query,
                "num": 5
            }
            data = await APIClient.get("https://www.googleapis.com/customsearch/v1", params=params)
            
            items = data.get("items", [])
            if not items:
                await interaction.followup.send("No results found for your query.")
                await BotLogger.log(f"{interaction.user} used /lumsearch with query '{query}' - no results", "info", "output")
                return

            embed = EmbedBuilder.create_embed(
                title="Google Results",
                description=f"Top 5 results for: **{query}**"
            )

            for i, item in enumerate(items[:5], 1):
                title = item.get("title", "No title")
                link = item.get("link", "")
                snippet = item.get("snippet", "No description available.")
                embed.add_field(name=f"{i}. {title}", value=f"[Link]({link})\n{snippet}", inline=False)

            await interaction.followup.send(embed=embed)
            await BotLogger.log(
                f"{interaction.user} used /lumsearch with query: {query[:100]}{'...' if len(query) > 100 else ''}", 
                "info", "output"
            )

        except Exception as e:
            await BotLogger.log_error("Error with /lumsearch command", e, "command")
            await interaction.followup.send("Something went wrong while searching.")

    @app_commands.command(name="github", description="search stuff up on github")
    @app_commands.describe(query="what do you want to search?", type="repo (default), code, or user")
    async def github(self, interaction: discord.Interaction, query: str, type: str = "repo"):
        await interaction.response.defer()

        if config.is_command_disabled("github"):
            await interaction.followup.send("The `github` command is currently disabled.")
            return

        if type not in ["repo", "code", "user"]:
            await interaction.followup.send("Type must be 'repo', 'code', or 'user'.")
            return

        search_type = "repositories" if type == "repo" else "code" if type == "code" else "users"

        try:
            url = f"https://api.github.com/search/{search_type}"
            params = {"q": query, "per_page": 5}
            headers = {
                "Accept": "application/vnd.github.v3+json",
                "Authorization": f"token {config.GITHUB_TOKEN}"
            }
            
            data = await APIClient.get(url, params=params, headers=headers)
            
            items = data.get("items", [])
            if not items:
                await interaction.followup.send("No results found.")
                return

            embed = EmbedBuilder.create_embed(
                title="GitHub Search Results",
                description=f"Top 5 {type} results for: **{query}**"
            )

            for i, item in enumerate(items[:5], 1):
                if type == "repo":
                    name = item["full_name"]
                    desc = item.get("description", "No description")
                    url = item["html_url"]
                    embed.add_field(name=f"{i}. {name}", value=f"{desc}\n[View on GitHub]({url})", inline=False)
                elif type == "code":
                    repo = item["repository"]["full_name"]
                    path = item["path"]
                    url = item["html_url"]
                    embed.add_field(name=f"{i}. {repo} → {path}", value=f"[View code]({url})", inline=False)
                elif type == "user":
                    login = item["login"]
                    url = item["html_url"]
                    embed.add_field(name=f"{i}. @{login}", value=f"[View profile]({url})", inline=False)

            await interaction.followup.send(embed=embed)
            await BotLogger.log(
                f"{interaction.user} used /github to search {type}: {query[:100]}{'...' if len(query) > 100 else ''}", 
                "info", "output"
            )

        except Exception as e:
            await interaction.followup.send("Something went wrong while searching GitHub.")
            await BotLogger.log_error("Error with /github command", e, "command")

    @app_commands.command(name="stackoverflow", description="search on stack overflow")
    @app_commands.describe(query="what do you want to search?")
    async def stackoverflow(self, interaction: discord.Interaction, query: str):
        await interaction.response.defer()

        if config.is_command_disabled("stackoverflow"):
            await interaction.followup.send("The `stackoverflow` command is currently disabled.")
            return

        try:
            url = "https://api.stackexchange.com/2.3/search/advanced"
            params = {
                "site": "stackoverflow",
                "order": "desc",
                "sort": "relevance",
                "q": query,
                "pagesize": 5
            }
            
            data = await APIClient.get(url, params=params)
            
            items = data.get("items", [])
            if not items:
                await interaction.followup.send("No results found.")
                return

            embed = EmbedBuilder.create_embed(
                title="Stack Overflow Results",
                description=f"Top 5 questions for: **{query}**"
            )

            for i, item in enumerate(items[:5], 1):
                title = item["title"]
                url = item["link"]
                votes = item["score"]
                answers = item["answer_count"]
                answered = "✅" if item["is_answered"] else "❌"
                embed.add_field(
                    name=f"{i}. {title} ({votes} votes, {answers} answers {answered})",
                    value=f"[View question]({url})",
                    inline=False
                )

            await interaction.followup.send(embed=embed)
            await BotLogger.log(
                f"{interaction.user} used /stackoverflow with query: {query[:100]}{'...' if len(query) > 100 else ''}", 
                "info", "output"
            )

        except Exception as e:
            await interaction.followup.send("Something went wrong while searching Stack Overflow.")
            await BotLogger.log_error("Error with /stackoverflow command", e, "command")

async def setup(bot):
    await bot.add_cog(Search(bot))