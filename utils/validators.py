from datetime import timedelta
import re

class Validators:
    @staticmethod
    def is_valid_youtube_url(url: str) -> bool:
        return "youtube.com" in url or "youtu.be" in url

    @staticmethod
    def parse_duration(duration_str: str):
        """Parse duration string like 10m, 30s, 1h into timedelta"""
        try:
            duration_value = int(''.join(c for c in duration_str if c.isdigit()))
            duration_unit = ''.join(c for c in duration_str if c.isalpha()).lower()

            if duration_unit == 'm':
                return timedelta(minutes=duration_value)
            elif duration_unit == 's':
                return timedelta(seconds=duration_value)
            elif duration_unit == 'h':
                return timedelta(hours=duration_value)
            return None
        except:
            return None
