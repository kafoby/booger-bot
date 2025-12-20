import discord
import os
import aiohttp
import asyncio
from datetime import datetime

# Get token from environment variables
TOKEN = os.getenv('DISCORD_TOKEN')
API_URL = 'http://0.0.0.0:5000/api/logs'

# Set up intents
intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)

async def log_to_server(message, level="info"):
    """Send log to the web server API"""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "message": message,
                "level": level
            }
            async with session.post(API_URL, json=payload) as response:
                if response.status != 201:
                    print(f"Failed to log to server: {response.status}")
    except Exception as e:
        print(f"Error logging to server: {e}")

@client.event
async def on_ready():
    msg = f'{client.user} has connected to Discord!'
    print(msg)
    await log_to_server(msg, "info")

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    msg = f"Received message from {message.author}: {message.content}"
    print(msg)
    await log_to_server(msg, "info")

    if message.content.startswith('$hello'):
        await message.channel.send('Hello!')
        await log_to_server(f"Responded to $hello command in {message.channel}", "info")

if __name__ == "__main__":
    if not TOKEN:
        print("Error: DISCORD_TOKEN not found in environment variables")
    else:
        client.run(TOKEN)
