from config.constants import ADMIN_USER_IDS, DEFAULT_ALLOWED_CHANNELS
from config.settings import config

class PermissionChecker:
    @staticmethod
    def is_admin(user_id: int) -> bool:
        return user_id in ADMIN_USER_IDS

    @staticmethod
    def is_in_allowed_channel(channel_id: int) -> bool:
        """
        Check if the channel is allowed.
        If the allowed list is empty (both dynamic and default), all channels are allowed.
        """
        allowed = config.allowed_channels or DEFAULT_ALLOWED_CHANNELS
        
        if not allowed:
            return True
            
        return channel_id in allowed
