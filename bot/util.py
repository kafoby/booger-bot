import aiohttp

API_URL = 'http://127.0.0.1:5000/api/logs'

async def log_to_server(message, level="info"):
  """Send log to the web server API"""
  try:
      async with aiohttp.ClientSession() as session:
          payload = {"message": message, "level": level}
          async with session.post(API_URL, json=payload) as response:
              if response.status != 201:
                  print(f"Failed to log to server: {response.status}")
  except Exception as e:
      print(f"Error logging to server: {e}")
