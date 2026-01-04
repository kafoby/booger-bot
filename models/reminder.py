from datetime import datetime, timedelta
from typing import Dict, List

class ReminderManager:
    """Simple in-memory reminder storage"""

    def __init__(self):
        # Format: {user_id: [{"time": timestamp, "message": text, "channel_id": id}, ...]}
        self._reminders: Dict[int, List[dict]] = {}

    def add_reminder(self, user_id: int, message: str, channel_id: int, remind_time: datetime):
        """Add a new reminder for a user"""
        if user_id not in self._reminders:
            self._reminders[user_id] = []

        self._reminders[user_id].append({
            "time": remind_time.timestamp(),
            "message": message,
            "channel_id": channel_id
        })

    def get_reminders(self, user_id: int) -> List[dict]:
        """Get all reminders for a user"""
        return self._reminders.get(user_id, [])

    def remove_reminder(self, user_id: int, timestamp: float):
        """Remove a specific reminder by timestamp"""
        if user_id in self._reminders:
            self._reminders[user_id] = [
                r for r in self._reminders[user_id] if r["time"] != timestamp
            ]

    def has_reminders(self, user_id: int) -> bool:
        """Check if user has any active reminders"""
        return user_id in self._reminders and len(self._reminders[user_id]) > 0

# Global instance
reminder_manager = ReminderManager()
