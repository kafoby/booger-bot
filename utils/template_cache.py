import aiohttp
import asyncio
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from config.settings import config

class TemplateCache:
    """In-memory cache for embed templates with TTL"""

    def __init__(self, ttl_minutes: int = 5):
        self.cache: Dict[str, dict] = {}
        self.cache_times: Dict[str, datetime] = {}
        self.ttl = timedelta(minutes=ttl_minutes)

    async def get_template(self, command_name: str, context: str = "default") -> Optional[dict]:
        """
        Get template from cache or API

        Args:
            command_name: Command identifier (e.g., "levels.level_up")
            context: Context for the command (default: "default")

        Returns:
            Template data dict or None if not found
        """
        cache_key = f"{command_name}:{context}"

        # Check cache
        if cache_key in self.cache:
            if datetime.now() - self.cache_times[cache_key] < self.ttl:
                return self.cache[cache_key]

        # Fetch from API
        template = await self._fetch_from_api(command_name, context)
        if template:
            self.cache[cache_key] = template
            self.cache_times[cache_key] = datetime.now()

        return template

    async def _fetch_from_api(self, command_name: str, context: str) -> Optional[dict]:
        """
        Fetch template from API endpoint

        Args:
            command_name: Command identifier
            context: Context for the command

        Returns:
            Template data dict or None if not found
        """
        try:
            headers = config.get_api_headers()

            # config.API_BASE_URL is like "http://localhost:5000/api"
            url = f"{config.API_BASE_URL}/bot/template/{command_name}"
            if context:
                url += f"?context={context}"

            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    elif resp.status == 404:
                        # Template not found - this is expected for unmapped commands
                        return None
                    else:
                        print(f"[TemplateCache] Error fetching template for {command_name}: HTTP {resp.status}")
                        return None

        except asyncio.TimeoutError:
            print(f"[TemplateCache] Timeout fetching template for {command_name}")
            return None
        except aiohttp.ClientError as e:
            print(f"[TemplateCache] Client error fetching template for {command_name}: {e}")
            return None
        except Exception as e:
            print(f"[TemplateCache] Unexpected error fetching template for {command_name}: {e}")
            return None

    def invalidate(self, command_name: str = None):
        """
        Invalidate cache for specific command or all

        Args:
            command_name: Command to invalidate, or None to clear all
        """
        if command_name:
            keys_to_remove = [k for k in self.cache.keys() if k.startswith(command_name)]
            for key in keys_to_remove:
                del self.cache[key]
                del self.cache_times[key]
        else:
            self.cache.clear()
            self.cache_times.clear()

# Global instance
template_cache = TemplateCache()
