import aiohttp
import sys
from config.settings import config

class BotLogger:
    @staticmethod
    async def log(message: str, level: str = "info", category: str = "system"):
        """
        Send log to the web server API
        
        Categories:
        - message: Regular user messages
        - command: Bot command executions
        - output: Bot generated outputs (images, gifs, API responses)
        - moderation: Warns, timeouts, bans
        - system: Bot startup, config, slash sync
        - error: Error events (use with level="error")
        """
        # Print to console as well
        print(f"[{level.upper()}] [{category}] {message}")
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "message": message,
                    "level": level,
                    "category": category
                }
                async with session.post(
                    config.LOGS_URL,
                    json=payload,
                    headers=config.get_api_headers()
                ) as response:
                    if response.status != 201:
                        print(f"Failed to log to server: {response.status}", file=sys.stderr)
        except Exception as e:
            print(f"Error logging to server: {e}", file=sys.stderr)

    @staticmethod
    async def log_error(message: str, error: Exception, category: str = "error"):
        error_msg = f"{message}: {str(error)}"
        await BotLogger.log(error_msg, level="error", category=category)
