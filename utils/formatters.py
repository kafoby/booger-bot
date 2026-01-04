import time
import re

class Formatters:
    @staticmethod
    def get_uptime(start_time: float) -> str:
        """Calculate bot uptime as a human-readable string"""
        if start_time is None:
            return "0s"
        elapsed = time.time() - start_time
        days = int(elapsed // 86400)
        hours = int((elapsed % 86400) // 3600)
        minutes = int((elapsed % 3600) // 60)
        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"

    @staticmethod
    def parse_time_string(input_str: str) -> int:
        """Parse time string like 1h 30m into seconds"""
        pattern = re.compile(r"(\d+)([smhdw])")
        matches = pattern.findall(input_str.lower())
        if not matches:
            return None
        total_seconds = 0
        for amount, unit in matches:
            amount = int(amount)
            if unit == "s":
                total_seconds += amount
            elif unit == "m":
                total_seconds += amount * 60
            elif unit == "h":
                total_seconds += amount * 3600
            elif unit == "d":
                total_seconds += amount * 86400
            elif unit == "w":
                total_seconds += amount * 604800
        return total_seconds
