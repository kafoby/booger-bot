import aiohttp
from typing import Dict, Any, Optional
from config.settings import config

class APIClient:
    @staticmethod
    async def get(url: str, params: Dict[str, Any] = None, headers: Dict[str, str] = None, timeout: int = 10) -> Any:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, 
                    params=params, 
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    if response.status == 200:
                        try:
                            return await response.json()
                        except:
                            return await response.text()
                    else:
                        response.raise_for_status()
        except Exception as e:
            raise e

    @staticmethod
    async def post(url: str, json: Dict[str, Any] = None, headers: Dict[str, str] = None, timeout: int = 10) -> Any:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, 
                    json=json, 
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    if response.status in [200, 201]:
                        try:
                            return await response.json()
                        except:
                            return await response.text()
                    else:
                        response.raise_for_status()
        except Exception as e:
            raise e
