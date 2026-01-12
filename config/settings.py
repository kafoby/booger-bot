import os
from typing import Dict, List, Any
from .constants import DEFAULT_PREFIX, DEFAULT_ALLOWED_CHANNELS

class ConfigManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConfigManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        
        # Environment Variables
        self.DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
        self.GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
        self.GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
        self.GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')
        self.LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')
        self.BOT_API_KEY = os.getenv('BOT_API_KEY')
        self.OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
        self.GROK_API_KEY = os.getenv('GROK_API_KEY')
        self.SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
        self.SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

        # Dynamic Config
        self.prefix = DEFAULT_PREFIX
        self.disabled_commands: List[str] = []
        self.allowed_channels: List[int] = DEFAULT_ALLOWED_CHANNELS
        self.starboard_config: Dict[str, Dict[str, Any]] = {}  # {guild_id: {config}}

        # Runtime Flags
        self.rape_enabled = False
        self.start_time = None

    def update_config(self, config_data: Dict[str, Any]):
        """Update dynamic configuration from API response"""
        self.prefix = config_data.get("prefix", DEFAULT_PREFIX)
        self.disabled_commands = config_data.get("disabledCommands") or []

        channels = config_data.get("allowedChannels")
        if channels:
            self.allowed_channels = [int(c) for c in channels]
        else:
            self.allowed_channels = []

        # Update starboard configuration
        starboard_data = config_data.get("starboard")
        if starboard_data:
            self.starboard_config = starboard_data
        else:
            self.starboard_config = {}

    def is_command_disabled(self, command_name: str) -> bool:
        return command_name in self.disabled_commands

    def get_api_headers(self) -> Dict[str, str]:
        """Get headers for API requests including authentication"""
        headers = {"Content-Type": "application/json"}
        if self.BOT_API_KEY:
            headers["x-bot-api-key"] = self.BOT_API_KEY
        return headers

# Global instance
config = ConfigManager()
