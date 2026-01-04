import random
from config.settings import config
from services.api_client import APIClient

class GoogleSearchService:
    BASE_URL = "https://www.googleapis.com/customsearch/v1"
    
    @staticmethod
    async def search_images(query: str, num: int = 10, start: int = 1) -> list:
        if not config.GOOGLE_API_KEY or not config.GOOGLE_CSE_ID:
            raise Exception("Google API Key or CSE ID not configured")
            
        params = {
            "key": config.GOOGLE_API_KEY,
            "cx": config.GOOGLE_CSE_ID,
            "q": query,
            "searchType": "image",
            "num": num,
            "start": start
        }
        
        try:
            data = await APIClient.get(GoogleSearchService.BASE_URL, params=params)
            return data.get('items', [])
        except Exception as e:
            # Handle 400 Bad Request (often due to start index too high)
            if "400" in str(e) and start > 1:
                 # Retry with start=1
                 params["start"] = 1
                 data = await APIClient.get(GoogleSearchService.BASE_URL, params=params)
                 return data.get('items', [])
            raise e

    @staticmethod
    async def get_random_image(queries: list) -> str:
        query = random.choice(queries)
        
        # Randomize search parameters to get variety
        num = random.randint(5, 10)
        start = random.randint(1, 50)
        
        items = await GoogleSearchService.search_images(query, num, start)
        
        if not items:
            return None
            
        random_result = random.choice(items)
        return random_result.get('link')
