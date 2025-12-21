import discord
import os
import aiohttp
import asyncio
from datetime import datetime, timedelta

# Get token from environment variables
TOKEN = os.getenv('DISCORD_TOKEN')
API_URL = 'http://0.0.0.0:5000/api/logs'
WARNS_URL = 'http://0.0.0.0:5000/api/warns'

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

    # Warn command: ,warn @user reason
    if message.content.startswith(',warn '):
        try:
            parts = message.content.split(maxsplit=2)
            if len(parts) < 3:
                await message.channel.send('Usage: ,warn @user <reason>\nExample: ,warn @user spamming')
                return
            
            # Get mentioned user
            if not message.mentions:
                await message.channel.send('Please mention a user to warn')
                return
            
            target_user = message.mentions[0]
            reason = parts[2]
            
            # Send warn to database via API
            async with aiohttp.ClientSession() as session:
                payload = {
                    "userId": str(target_user.id),
                    "userName": target_user.name,
                    "reason": reason
                }
                async with session.post(WARNS_URL, json=payload) as response:
                    if response.status == 201:
                        await message.channel.send(f'{target_user.mention} has been warned for: {reason}')
                        await log_to_server(f"Warned {target_user} for: {reason}", "info")
                    else:
                        await message.channel.send('Error: Failed to save warning')
        except Exception as e:
            print(f"Error warning user: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error warning user: {e}", "error")
    
    # View warns command: ,warns or ,warns @user
    if message.content.startswith(',warns'):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(WARNS_URL) as response:
                    if response.status == 200:
                        warns = await response.json()
                        
                        # Filter by user if mentioned
                        if message.mentions:
                            target_user = message.mentions[0]
                            warns = [w for w in warns if w['userId'] == str(target_user.id)]
                            if not warns:
                                await message.channel.send(f'No warns found for {target_user.mention}')
                                return
                            title = f'Warns for {target_user.name}'
                        else:
                            if not warns:
                                await message.channel.send('No warns recorded')
                                return
                            title = 'All Warns'
                        
                        # Create embed
                        embed = discord.Embed(title=title, color=discord.Color.orange())
                        
                        for warn in warns:
                            embed.add_field(
                                name=f"{warn['userName']} (ID: {warn['userId']})",
                                value=f"**Reason:** {warn['reason']}\n**Date:** {warn['timestamp'][:10]}",
                                inline=False
                            )
                        
                        await message.channel.send(embed=embed)
                        await log_to_server(f"Viewed warns in {message.channel}", "info")
                    else:
                        await message.channel.send('Error: Could not fetch warns')
        except Exception as e:
            print(f"Error fetching warns: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error fetching warns: {e}", "error")
    
    # Say command: ,say text
    if message.content.startswith(',say '):
        try:
            text_to_say = message.content[5:].strip()
            if not text_to_say:
                await message.channel.send('Usage: ,say <text>')
                return
            
            # Remove channel mentions and user mentions from the text
            text_to_say = text_to_say.replace('<#', '').replace('>', '')
            text_to_say = text_to_say.replace('<@', '').replace('!', '').replace('>', '')
            
            # Delete the command message
            try:
                await message.delete()
            except:
                pass
            
            # Send the message
            await message.channel.send(text_to_say)
            await log_to_server(f"Bot said: {text_to_say} (via ,say command)", "info")
        except Exception as e:
            print(f"Error with ,say command: {e}")
            await log_to_server(f"Error with ,say command: {e}", "error")
    
    # Cat command: ,cat
    if message.content.startswith(',cat'):
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
                            await log_to_server(f"Sent cat gif to {message.channel} via ,cat command", "info")
        except Exception as e:
            print(f"Error fetching cat gif: {e}")
            await log_to_server(f"Error fetching cat gif: {e}", "error")
    
    # Dog command: ,dog
    if message.content.startswith(',dog'):
        try:
            # Use Dog API to get a random dog gif
            async with aiohttp.ClientSession() as session:
                async with session.get('https://dog.ceo/api/breeds/image/random') as response:
                    if response.status == 200:
                        data = await response.json()
                        if data['status'] == 'success':
                            dog_url = data['message']
                            embed = discord.Embed(title="Here's a dog for you!", color=discord.Color.orange())
                            embed.set_image(url=dog_url)
                            await message.channel.send(embed=embed)
                            await log_to_server(f"Sent dog image to {message.channel} via ,dog command", "info")
        except Exception as e:
            print(f"Error fetching dog image: {e}")
            await log_to_server(f"Error fetching dog image: {e}", "error")
    
    # Say2 command: ,say2 @user <message>
    if message.content.startswith(',say2 '):
        try:
            parts = message.content.split(maxsplit=2)
            if len(parts) < 3:
                await message.channel.send('Usage: ,say2 @user <message>')
                return
            
            # Get mentioned user
            if not message.mentions:
                await message.channel.send('Please mention a user to send a DM to')
                return
            
            target_user = message.mentions[0]
            text_to_send = parts[2]
            
            # Send DM to user
            try:
                await target_user.send(text_to_send)
                await message.channel.send(f'Sent DM to {target_user.mention}')
                await log_to_server(f"Sent DM to {target_user}: {text_to_send}", "info")
            except discord.Forbidden:
                await message.channel.send(f'Cannot send DM to {target_user.mention} - they may have DMs disabled')
                await log_to_server(f"Failed to send DM to {target_user} - DMs disabled", "error")
        except Exception as e:
            print(f"Error with ,say2 command: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error with ,say2 command: {e}", "error")
    
    # Timeout command: ,timeout @user 10m
    if message.content.startswith(',timeout'):
        try:
            parts = message.content.split()
            if len(parts) < 3:
                await message.channel.send('Usage: ,timeout @user <duration>\nExample: ,timeout @user 10m (or 30s, 1h)')
                return
            
            # Get mentioned user
            if not message.mentions:
                await message.channel.send('Please mention a user to timeout')
                return
            
            target_user = message.mentions[0]
            duration_str = parts[2]
            
            # Parse duration (supports m for minutes, s for seconds, h for hours)
            duration_value = int(''.join(c for c in duration_str if c.isdigit()))
            duration_unit = ''.join(c for c in duration_str if c.isalpha()).lower()
            
            if duration_unit == 'm':
                timeout_duration = timedelta(minutes=duration_value)
            elif duration_unit == 's':
                timeout_duration = timedelta(seconds=duration_value)
            elif duration_unit == 'h':
                timeout_duration = timedelta(hours=duration_value)
            else:
                await message.channel.send('Invalid duration. Use format: 10m, 30s, or 1h')
                return
            
            # Apply timeout
            await target_user.timeout(timeout_duration, reason="Timed out by bot command")
            await message.channel.send(f'{target_user.mention} has been timed out for {duration_str}')
            await log_to_server(f"Timed out {target_user} for {duration_str}", "info")
        except Exception as e:
            print(f"Error timing out user: {e}")
            await message.channel.send(f'Error: {str(e)}')
            await log_to_server(f"Error timing out user: {e}", "error")
    
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
