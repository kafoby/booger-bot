import discord
from datetime import datetime
from typing import Dict, Union

class VariableContext:
    """Build variable context dictionaries for template substitution"""

    @staticmethod
    def from_user(user: Union[discord.User, discord.Member]) -> Dict[str, str]:
        """
        Build context from user object

        Args:
            user: Discord user or member object

        Returns:
            Dictionary of user-related variables
        """
        return {
            "user.name": user.name,
            "user.mention": user.mention,
            "user.id": str(user.id),
            "user.display_avatar.url": str(user.display_avatar.url)
        }

    @staticmethod
    def from_level_data(user: Union[discord.User, discord.Member], level: int, xp: int, xp_needed: int) -> Dict[str, str]:
        """
        Build context for leveling embeds

        Args:
            user: Discord user or member object
            level: Current level
            xp: Current XP
            xp_needed: XP needed for next level

        Returns:
            Dictionary with user and leveling variables
        """
        return {
            **VariableContext.from_user(user),
            "level": str(level),
            "xp": str(xp),
            "xp_needed": str(xp_needed)
        }

    @staticmethod
    def add_timestamp(context: Dict[str, str]) -> Dict[str, str]:
        """
        Add timestamp variables to existing context

        Args:
            context: Existing context dictionary

        Returns:
            Context with timestamp variables added
        """
        now = datetime.now()
        return {
            **context,
            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S")
        }

    @staticmethod
    def from_moderation(user: Union[discord.User, discord.Member], moderator: Union[discord.User, discord.Member], reason: str, duration: str = None) -> Dict[str, str]:
        """
        Build context for moderation embeds

        Args:
            user: User being moderated
            moderator: Moderator performing action
            reason: Reason for moderation
            duration: Optional duration string

        Returns:
            Dictionary with moderation-related variables
        """
        context = {
            **VariableContext.from_user(user),
            "moderator.name": moderator.name,
            "moderator.mention": moderator.mention,
            "moderator.id": str(moderator.id),
            "reason": reason
        }
        if duration:
            context["duration"] = duration
        return context
