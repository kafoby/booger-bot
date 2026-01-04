import discord
from discord import app_commands
from discord.ext import commands
from config.settings import config
from utils.logging import BotLogger
from utils.embed_builder import EmbedBuilder
from services.ai_providers import OpenAIProvider, GrokProvider, TranslateProvider

class AI(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="askgpt", description="ask chatgpt a question")
    @app_commands.describe(question="Your question:")
    async def askgpt(self, interaction: discord.Interaction, question: str):
        await interaction.response.defer()

        if config.is_command_disabled("askgpt"):
            await interaction.followup.send("The `askgpt` command is currently disabled.")
            return

        try:
            response_data = await OpenAIProvider.chat_completion(question)
            answer = OpenAIProvider.get_answer(response_data)

            embed = EmbedBuilder.create_embed(
                title="ChatGPT Answer",
                description=answer
            )
            embed.set_footer(text=f"Asked by {interaction.user.display_name}")

            await interaction.followup.send(embed=embed)
            await BotLogger.log(
                f"{interaction.user} used /askgpt with question: {question[:100]}{'...' if len(question) > 100 else ''}",
                "info",
                "output"
            )

        except ValueError as e:
            await interaction.followup.send(str(e))
        except Exception as e:
            await BotLogger.log_error("Error with /askgpt command", e, "command")
            await interaction.followup.send("Something went wrong while asking ChatGPT.")

    @app_commands.command(name="askgrok", description="ask grok something")
    @app_commands.describe(question="your question")
    async def askgrok(self, interaction: discord.Interaction, question: str):
        await interaction.response.defer()

        if config.is_command_disabled("askgrok"):
            await interaction.followup.send("The `askgrok` command is currently disabled.")
            return

        try:
            response_data = await GrokProvider.chat_completion(question)
            answer = GrokProvider.get_answer(response_data)

            embed = EmbedBuilder.create_embed(
                title="Grok",
                description=answer
            )
            embed.set_footer(text=f"Asked by {interaction.user.display_name}")

            await interaction.followup.send(embed=embed)
            await BotLogger.log(
                f"{interaction.user} used /askgrok with question: {question[:100]}{'...' if len(question) > 100 else ''}",
                "info",
                "output"
            )

        except ValueError as e:
            await interaction.followup.send(str(e))
        except Exception as e:
            await BotLogger.log_error("Error with /askgrok command", e, "command")
            await interaction.followup.send(f"Error: {str(e)}")

    @app_commands.command(name="translate", description="translate text of your choice")
    @app_commands.describe(
        text="text to translate",
        target="target language code (e.g. en, es, fr, ja) - default: en"
    )
    async def translate(self, interaction: discord.Interaction, text: str, target: str = "en"):
        await interaction.response.defer()

        if config.is_command_disabled("translate"):
            await interaction.followup.send("The `translate` command is currently disabled.")
            return

        try:
            translated, target_lang = await TranslateProvider.translate(text, target)
            flag = TranslateProvider.get_flag_emoji(target_lang)

            embed = EmbedBuilder.create_embed(
                title=f"Translation {flag}"
            )
            embed.add_field(name="Original", value=text, inline=False)
            embed.add_field(name=f"To {target_lang.upper()}", value=translated, inline=False)

            await interaction.followup.send(embed=embed)
            await BotLogger.log(
                f"{interaction.user} used /translate to translate text to {target}: '{text[:50]}{'...' if len(text) > 50 else ''}'",
                "info",
                "output"
            )

        except Exception as e:
            await BotLogger.log_error("Error with /translate command", e, "command")
            await interaction.followup.send("Something went wrong with translation.")

async def setup(bot):
    await bot.add_cog(AI(bot))
