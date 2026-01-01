import discord
import aiohttp
import random
from petpetgif import petpet
import io

from .util import log_to_server
from .vars import GOOGLE_API_KEY, CSE_ID, WARNS_URL


async def rapeon(bot, message):
  if message.author.id not in [
      934443300520345631, 954606816820613160, 395651363985555457
  ]:
    await message.channel.send("You are not allowed to use this command.")
    return

  bot.rape_enabled = True
  await message.channel.send("Rape mode ON😈")


async def rapeoff(bot, message):
  if message.author.id not in [
      934443300520345631, 954606816820613160, 395651363985555457
  ]:
    await message.channel.send("You are not allowed to use this command.")
    return

  bot.rape_enabled = False
  await message.channel.send("Rape mode OFF <a:cr_asad:1166759175217487902>")


async def rape(bot, message):
  if message.author.id not in [
      934443300520345631, 954606816820613160, 395651363985555457
  ]:
    await message.channel.send("You are not allowed to use this command.")
    return

  if not getattr(bot, 'rape_enabled', False):
    await message.channel.send("The `rape` command is currently disabled.")
    return

  try:
    if not message.mentions:
      await message.channel.send('Please mention a user to rape')
      return

    target_user = message.mentions[0]
    author = message.author

    async with aiohttp.ClientSession() as session:
      search_queries = [
          "rape hentai gif", "rape hentai animated", "yuri rape gif",
          "femboy rape hentai", "cat girl rape hentai", "ebony rape hentai"
      ]
      search_query = random.choice(search_queries)

      search_params = {
          "key": GOOGLE_API_KEY,
          "cx": CSE_ID,
          "q": search_query,
          "searchType": "image",
          "num": random.randint(1, 10),
          "start": random.randint(1, 100)
      }
      async with session.get("https://www.googleapis.com/customsearch/v1",
                             params=search_params,
                             timeout=aiohttp.ClientTimeout(total=5)) as resp:
        if resp.status != 200:
          await message.channel.send('Error fetching rape image')
          await log_to_server(f"Google API error: {resp.status}", "error")
          return

        data = await resp.json()

        if 'items' not in data or not data['items']:
          await message.channel.send('Could not find rape images')
          return

        random_result = random.choice(data['items'])
        image_url = random_result.get('link')

        if not image_url:
          await message.channel.send('Could not get image URL')
          return

        embed = discord.Embed(title=f"{author.name} raped {target_user.name}",
                              color=discord.Color.from_rgb(255, 192, 203))
        embed.set_image(url=image_url)

        await message.channel.send(embed=embed)
        await log_to_server(f"{author} raped {target_user} via ,rape command",
                            "info")
        return
  except Exception as e:
    print(f"Error with ,rape command: {e}")
    await message.channel.send(f'Error: {str(e)}')
    await log_to_server(f"Error with ,rape command: {e}", "error")


async def warn(message):
  try:
    parts = message.content.split(maxsplit=2)
    if len(parts) < 3:
      await message.channel.send(
          'Usage: ,warn @user <reason>\nExample: ,warn @user spamming')
      return

    if not message.mentions:
      await message.channel.send('Please mention a user to warn')
      return

    target_user = message.mentions[0]
    reason = parts[2]

    async with aiohttp.ClientSession() as session:
      payload = {
          "userId": str(target_user.id),
          "userName": target_user.name,
          "reason": reason
      }
      async with session.post(WARNS_URL, json=payload) as response:
        if response.status == 201:
          await message.channel.send(
              f'{target_user.mention} has been warned for: {reason}')
          await log_to_server(f"Warned {target_user} for: {reason}", "info")
        else:
          await message.channel.send('Error: Failed to save warning')
  except Exception as e:
    print(f"Error warning user: {e}")
    await message.channel.send(f'Error: {str(e)}')
    await log_to_server(f"Error warning user: {e}", "error")


async def warns(message):
  try:
    async with aiohttp.ClientSession() as session:
      async with session.get(WARNS_URL) as response:
        if response.status == 200:
          warns = await response.json()

          if message.mentions:
            target_user = message.mentions[0]
            warns = [w for w in warns if w['userId'] == str(target_user.id)]
            if not warns:
              await message.channel.send(
                  f'No warns found for {target_user.mention}')
              return
            title = f'Warns for {target_user.name}'
          else:
            if not warns:
              await message.channel.send('No warns recorded')
              return
            title = 'All Warns'

          embed = discord.Embed(title=title, color=discord.Color.purple())

          for warn in warns:
            embed.add_field(
                name=f"{warn['userName']} (ID: {warn['userId']})",
                value=
                f"**Reason:** {warn['reason']}\n**Date:** {warn['timestamp'][:10]}",
                inline=False)

          await message.channel.send(embed=embed)
          await log_to_server(f"Viewed warns in {message.channel}", "info")
        else:
          await message.channel.send('Error: Could not fetch warns')
  except Exception as e:
    print(f"Error fetching warns: {e}")
    await message.channel.send(f'Error: {str(e)}')
    await log_to_server(f"Error fetching warns: {e}", "error")


async def say(message):
  try:
    text_to_say = message.content[5:].strip()
    if not text_to_say:
      await message.channel.send('Usage: ,say <text>')
      return

    text_to_say = text_to_say.replace('<#', '').replace('>', '')
    text_to_say = text_to_say.replace('<@', '').replace('!',
                                                        '').replace('>', '')

    try:
      await message.delete()
    except Exception as e:
      await log_to_server(f"Failed to delete message: {e}")
      pass

    await message.channel.send(text_to_say)
    await log_to_server(f"Bot said: {text_to_say} (via ,say command)", "info")
  except Exception as e:
    print(f"Error with ,say command: {e}")
    await log_to_server(f"Error with ,say command: {e}", "error")

async def cat(message):
  try:
    async with aiohttp.ClientSession() as session:
        async with session.get(
                'https://api.thecatapi.com/v1/images/search?mime_types=gif&limit=1'
        ) as response:
            if response.status == 200:
                data = await response.json()
                if data and len(data) > 0:
                    cat_url = data[0]['url']
                    embed = discord.Embed(
                        title="Here's a cat for you!",
                        color=discord.Color.purple())
                    embed.set_image(url=cat_url)
                    await message.channel.send(embed=embed)
                    await log_to_server(
                        f"Sent cat gif to {message.channel} via ,cat command",
                        "info")
  except Exception as e:
    print(f"Error fetching cat gif: {e}")
    await log_to_server(f"Error fetching cat gif: {e}", "error")

async def dog(message):
  try:
    async with aiohttp.ClientSession() as session:
        async with session.get(
                'https://random.dog/woof.json?include=gif',
                timeout=aiohttp.ClientTimeout(total=5)) as response:
            if response.status == 200:
                data = await response.json()
                dog_url = data.get('url')
                if dog_url:
                    embed = discord.Embed(
                        title="Here's a dog for you!",
                        color=discord.Color.purple())
                    embed.set_image(url=dog_url)
                    await message.channel.send(embed=embed)
                    await log_to_server(
                        f"Sent dog gif to {message.channel} via ,dog command",
                        "info")
  except Exception as e:
    print(f"Error fetching dog gif: {e}")
    await log_to_server(f"Error fetching dog gif: {e}", "error")

async def gay(message):
  try:
    if not message.mentions:
        await message.channel.send('Please mention a user')
        return

    target_user = message.mentions[0]
    gay_percentage = random.randint(0, 100)

    embed = discord.Embed(title=f"{target_user.name} Gay Meter",
                          description=f"{gay_percentage}% gay",
                          color=discord.Color.purple())

    if target_user.avatar:
        embed.set_thumbnail(url=target_user.avatar.url)

    await message.channel.send(embed=embed)
    await log_to_server(
        f"Sent gay meter for {target_user} ({gay_percentage}%) via ,gay command",
        "info")
  except Exception as e:
    print(f"Error with ,gay command: {e}")
    await log_to_server(f"Error with ,gay command: {e}", "error")

async def kiss(message):
  try:
    if not message.mentions:
        await message.channel.send('Please mention a user to kiss')
        return

    target_user = message.mentions[0]
    author = message.author

    kiss_gifs = [
        'https://cdn.nekotina.com/images/AQL8dPyM.gif',
    ]

    gif_url = random.choice(kiss_gifs)

    embed = discord.Embed(
        title=f"{author.name} kissed {target_user.name}",
        color=discord.Color.purple())
    embed.set_image(url=gif_url)

    await message.channel.send(embed=embed)
    await log_to_server(
        f"{author} kissed {target_user} via ,kiss command", "info")
  except Exception as e:
    print(f"Error with ,kiss command: {e}")
    await message.channel.send(f'Error: {str(e)}')
    await log_to_server(f"Error with ,kiss command: {e}", "error")

async def slap(message):
  try:
    if not message.mentions:
        await message.channel.send('Please mention a user to slap')
        return

    target_user = message.mentions[0]
    author = message.author

    async with aiohttp.ClientSession() as session:

        search_queries = [
            "anime girl slap gif", "anime girl slap animated",
            "yuri slap gif", "yuri slap animated",
            "anime cat girl slap gif", "anime cat girl slap animated"
        ]
        search_query = random.choice(search_queries)

        search_params = {
            "key": GOOGLE_API_KEY,
            "cx": CSE_ID,
            "q": search_query,
            "searchType": "image",
            "num": random.randint(1, 10),
            "start": random.randint(1, 100)
        }
        async with session.get(
                "https://www.googleapis.com/customsearch/v1",
                params=search_params,
                timeout=aiohttp.ClientTimeout(total=5)) as resp:
            if resp.status != 200:
                await message.channel.send('Error fetching slap images'
                                           )
                await log_to_server(f"Google API error: {resp.status}",
                                    "error")
                return

            data = await resp.json()

            if 'items' not in data or not data['items']:
                await message.channel.send('Could not find slap images'
                                           )
                return

            random_result = random.choice(data['items'])
            image_url = random_result.get('link')

            if not image_url:
                await message.channel.send('Could not get image URL')
                return

            embed = discord.Embed(
                title=f"{author.name} slapped {target_user.name}",
                color=discord.Color.purple())
            embed.set_image(url=image_url)

            await message.channel.send(embed=embed)
            await log_to_server(
                f"{author} slapped {target_user} via ,slap command",
                "info")
  except Exception as e:
    print(f"Error with ,slap command: {e}")
    await message.channel.send(f'Error: {str(e)}')
    await log_to_server(f"Error with ,slap command: {e}", "error")

async def crocodile(message):
  try:
    async with aiohttp.ClientSession() as session:
        search_queries = [
            "crocodile gif", "crocodile animated", "cute crocodile",
            "crocodile meme", "crocodile"
        ]
        search_query = random.choice(search_queries)

        search_params = {
            "key": GOOGLE_API_KEY,
            "cx": CSE_ID,
            "q": search_query,
            "searchType": "image",
            "num": random.randint(5, 10),
            "start": random.randint(1, 50)
        }

        async with session.get(
                "https://www.googleapis.com/customsearch/v1",
                params=search_params,
                timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status != 200:
                await message.channel.send(
                    "Error fetching crocodile image")
                return

            data = await resp.json()

            if 'items' not in data or not data['items']:
                await message.channel.send(
                    "Couldn't find any crocodiles right now")
                return

            random_result = random.choice(data['items'])
            image_url = random_result.get('link')

            if not image_url:
                await message.channel.send("Couldn't get image URL")
                return

            embed = discord.Embed(title="Here is a crocodile for you!",
                                  color=discord.Color.purple())
            embed.set_image(url=image_url)

            await message.channel.send(embed=embed)
  except Exception as e:
    print(f"Error with ,crocodile command: {e}")
    await message.channel.send(f"Error: {str(e)}")

async def seal(message):
  try:
    async with aiohttp.ClientSession() as session:
        search_queries = [
            "baby harp seal", "harp seal pup", "baby seal gif",
            "harp seal pup gif"
        ]
        search_query = random.choice(search_queries)

        search_params = {
            "key": GOOGLE_API_KEY,
            "cx": CSE_ID,
            "q": search_query,
            "searchType": "image",
            "num": random.randint(5, 10),
            "start": random.randint(1, 50)
        }

        async with session.get(
                "https://www.googleapis.com/customsearch/v1",
                params=search_params,
                timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status != 200:
                await message.channel.send("Error fetching seal image")
                return

            data = await resp.json()

            if 'items' not in data or not data['items']:
                await message.channel.send(
                    "Couldn't find any seals right now")
                return

            random_result = random.choice(data['items'])
            image_url = random_result.get('link')

            if not image_url:
                await message.channel.send("Couldn't get image URL")
                return

            embed = discord.Embed(
                title="Here is a baby harp seal for you!",
                color=discord.Color.purple())
            embed.set_image(url=image_url)

            await message.channel.send(embed=embed)
            await log_to_server(
                f"Sent seal image to {message.channel} via ,seal command",
                "info")
  except Exception as e:
    print(f"Error with ,seal command: {e}")
    await message.channel.send(f"Error: {str(e)}")
    await log_to_server(f"Error with ,seal command: {e}", "error")

async def pet(message):
  try:
    if not message.mentions:
        await message.channel.send("Mention a user to pet")
        return

    target = message.mentions[0]
    author = message.author

    avatar_url = target.display_avatar.with_format("png").with_size(
        512).url

    async with aiohttp.ClientSession() as session:
        async with session.get(avatar_url) as resp:
            avatar_bytes = await resp.read()

    source = io.BytesIO(avatar_bytes)
    dest = io.BytesIO()

    petpet.make(source, dest)
    dest.seek(0)

    embed = discord.Embed(title=f"{author.name} pets {target.name}",
                          color=0x9b59b6)
    embed.set_image(url="attachment://pet.gif")

    await message.channel.send(embed=embed,
                               file=discord.File(dest,
                                                 filename="pet.gif"))

  except Exception as e:
    await message.channel.send(str(e))


