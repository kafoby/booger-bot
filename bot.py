import discord
import os
import aiohttp
import asyncio
from datetime import datetime

# Get token from environment variables
TOKEN = os.getenv('DISCORD_TOKEN')
API_URL = 'http://0.0.0.0:5000/api/logs'

print(f"Token available: {bool(TOKEN)}")
print(f"Token value (first 20 chars): {TOKEN[:20] if TOKEN else 'None'}")

# Set up intents
intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)

print("Discord bot initialized")

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
    
    # Send "hi" to the specified channel
    channel = client.get_channel(971303412849332226)
    print(f"Channel object: {channel}")
    if channel:
        try:
            await channel.send('hi')
            print("Message sent successfully!")
            await log_to_server(f"Sent 'hi' to channel {channel}", "info")
        except Exception as e:
            print(f"Error sending message: {e}")
            await log_to_server(f"Error sending message: {e}", "error")
    else:
        print("Channel not found!")

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
    
    # Respond with "hi" when someone says "hi"
    if 'hi' in message.content.lower():
        await message.channel.send('Hi there!')
        await log_to_server(f"Responded to 'hi' in {message.channel}", "info")
    
    # Send cat gif when someone says "cat"
    if 'cat' in message.content.lower():
        try:
            # Use The Cat API to get a random cat gif
            async with aiohttp.ClientSession() as session:
                async with session.get('https://api.thecatapi.com/v1/images/search?mime_types=gif&limit=1') as response:
                    if response.status == 200:
                        data = await response.json()
                        if data and len(data) > 0:
                            cat_url = data[0]['url']
                            embed = discord.Embed(title="Here's a cat for you!", color=discord.Color.purple())
                            embed.set_image(url=cat_url)
                            await message.channel.send(embed=embed)
                            await log_to_server(f"Sent cat gif to {message.channel} in response to message: {message.content}", "info")
        except Exception as e:
            print(f"Error fetching cat gif: {e}")
            await log_to_server(f"Error fetching cat gif: {e}", "error")
    
    # Send gif when someone says the specific word
    if 'faggot' in message.content.lower():
        try:
            await message.channel.send('https://cdn.discordapp.com/attachments/1279123313519624212/1316546100617805904/attachment-3.gif')
            await log_to_server(f"Sent gif to {message.channel} in response to message: {message.content}", "info")
        except Exception as e:
            print(f"Error sending gif: {e}")
            await log_to_server(f"Error sending gif: {e}", "error")

if __name__ == "__main__":
    if not TOKEN:
        print("Error: DISCORD_TOKEN not found in environment variables")
    else:
        client.run(TOKEN)
