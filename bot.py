import discord
import os
import aiohttp
import random
import urllib.parse
import spotipy
import yt_dlp
from spotipy.oauth2 import SpotifyClientCredentials
import asyncio
from discord import app_commands
from datetime import timedelta, datetime
from discord.ext import commands, tasks
import re
from petpetgif import petpet
import io
import time
from PIL import Image, ImageDraw, ImageFont
import textwrap

from config.settings import config
from config.constants import *
from utils.logging import BotLogger
from utils.formatters import Formatters
from utils.permissions import PermissionChecker
from core.bot import DiscordBot

TOKEN = config.DISCORD_TOKEN
GITHUB_TOKEN = config.GITHUB_TOKEN
GOOGLE_API_KEY = config.GOOGLE_API_KEY
CSE_ID = config.GOOGLE_CSE_ID
LASTFM_API_KEY = config.LASTFM_API_KEY
BOT_API_KEY = config.BOT_API_KEY

def get_api_headers():
    return config.get_api_headers()

# Legacy bot_config map for compatibility (references config singleton)
class BotConfigProxy:
    def get(self, key, default=None):
        if key == "prefix": return config.prefix
        if key == "disabledCommands": return config.disabled_commands
        if key == "allowedChannels": return config.allowed_channels
        return default
bot_config = BotConfigProxy()

ALLOWED_CHANNELS = config.allowed_channels

bot = DiscordBot()
tree = bot.tree



if __name__ == "__main__":
    if not TOKEN:
        print("Error: DISCORD_TOKEN not found in environment variables")
    else:
        bot.run(TOKEN)
