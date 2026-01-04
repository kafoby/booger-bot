import os
import aiohttp
from config.settings import config

class OpenAIProvider:
    """Service for OpenAI API interactions"""

    @staticmethod
    async def chat_completion(question: str, system_prompt: str = None) -> dict:
        """
        Send a chat completion request to OpenAI

        Args:
            question: The user's question
            system_prompt: Optional system prompt (defaults to standard prompt)

        Returns:
            dict: The full API response

        Raises:
            Exception: If API key is missing or request fails
        """
        openai_key = os.getenv('OPENAI_API_KEY')
        if not openai_key:
            raise ValueError("OpenAI API key not configured")

        if system_prompt is None:
            system_prompt = "You are ChatGPT, a helpful AI assistant that was made by lumiin."

        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ],
                "temperature": 0.7
            }

            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    raise Exception(f"OpenAI API error {resp.status}: {error_text}")
                return await resp.json()

    @staticmethod
    def get_answer(response_data: dict) -> str:
        """Extract answer from OpenAI response and truncate if needed"""
        answer = response_data["choices"][0]["message"]["content"]
        if len(answer) > 2000:
            answer = answer[:1997] + "..."
        return answer


class GrokProvider:
    """Service for Grok API interactions"""

    @staticmethod
    async def chat_completion(question: str) -> dict:
        """
        Send a chat completion request to Grok

        Args:
            question: The user's question

        Returns:
            dict: The full API response

        Raises:
            Exception: If API key is missing or request fails
        """
        grok_key = os.getenv('GROK_API_KEY')
        if not grok_key:
            raise ValueError("Grok API key not configured")

        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {grok_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "grok-4-1-fast",
                "messages": [
                    {"role": "user", "content": question}
                ],
                "temperature": 0.8
            }

            async with session.post(
                "https://api.x.ai/v1/chat/completions",
                json=payload,
                headers=headers
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    raise Exception(f"Grok API error {resp.status}: {error_text}")
                return await resp.json()

    @staticmethod
    def get_answer(response_data: dict) -> str:
        """Extract answer from Grok response and truncate if needed"""
        answer = response_data["choices"][0]["message"]["content"]
        if len(answer) > 2000:
            answer = answer[:1997] + "..."
        return answer


class TranslateProvider:
    """Service for Google Translate API interactions"""

    @staticmethod
    async def translate(text: str, target_lang: str = "en") -> tuple:
        """
        Translate text to target language

        Args:
            text: Text to translate
            target_lang: Target language code (default: "en")

        Returns:
            tuple: (translated_text, target_language_code)

        Raises:
            Exception: If translation fails
        """
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": target_lang.lower(),
            "dt": "t",
            "q": text
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://translate.googleapis.com/translate_a/single",
                params=params
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    raise Exception(f"Translation API error {resp.status}: {error_text}")
                data = await resp.json()

        # Extract translated text from response
        translated = "".join([sentence[0] for sentence in data[0] if sentence[0]])
        return (translated, target_lang.lower())

    @staticmethod
    def get_flag_emoji(lang_code: str) -> str:
        """Get flag emoji for language code"""
        flags = {
            "en": "🇬🇧",
            "es": "🇪🇸",
            "fr": "🇫🇷",
            "de": "🇩🇪",
            "ja": "🇯🇵",
            "ru": "🇷🇺",
            "zh": "🇨🇳",
            "ar": "🇸🇦"
        }
        return flags.get(lang_code.lower(), "🌐")
