"""
Last.fm Service for scrobbling and updating now playing status.
Uses the pylast library to interact with the Last.fm API.
"""

import pylast
from typing import List, Dict, Optional
from datetime import datetime
from config.settings import config


class LastFmService:
    """Service for interacting with Last.fm API"""

    def __init__(self):
        if not config.LASTFM_API_KEY or not config.LASTFM_API_SECRET:
            raise ValueError("Last.fm API credentials not configured")

        self.api_key = config.LASTFM_API_KEY
        self.api_secret = config.LASTFM_API_SECRET

        # Initialize network without user credentials (we'll use session keys per user)
        self.network = pylast.LastFMNetwork(
            api_key=self.api_key,
            api_secret=self.api_secret
        )

    def _get_user_network(self, session_key: str) -> pylast.LastFMNetwork:
        """Get a Last.fm network instance for a specific user"""
        return pylast.LastFMNetwork(
            api_key=self.api_key,
            api_secret=self.api_secret,
            session_key=session_key
        )

    async def update_now_playing(
        self,
        session_key: str,
        artist: str,
        track: str,
        album: Optional[str] = None,
        duration: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Update Now Playing status for a user.

        Args:
            session_key: User's Last.fm session key
            artist: Track artist name
            track: Track title
            album: Album name (optional)
            duration: Track duration in seconds (optional)

        Returns:
            Dict with success status and error message if any
        """
        try:
            network = self._get_user_network(session_key)

            # Update now playing
            network.update_now_playing(
                artist=artist,
                title=track,
                album=album,
                duration=duration
            )

            return {"success": True, "error": None}
        except pylast.WSError as e:
            return {"success": False, "error": f"Last.fm API error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Error: {str(e)}"}

    async def scrobble_track(
        self,
        session_key: str,
        artist: str,
        track: str,
        timestamp: int,
        album: Optional[str] = None,
        duration: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Scrobble a single track for a user.

        Args:
            session_key: User's Last.fm session key
            artist: Track artist name
            track: Track title
            timestamp: Unix timestamp when track was played
            album: Album name (optional)
            duration: Track duration in seconds (optional)

        Returns:
            Dict with success status and error message if any
        """
        try:
            network = self._get_user_network(session_key)

            # Scrobble the track
            network.scrobble(
                artist=artist,
                title=track,
                timestamp=timestamp,
                album=album,
                duration=duration
            )

            return {"success": True, "error": None}
        except pylast.WSError as e:
            return {"success": False, "error": f"Last.fm API error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Error: {str(e)}"}

    async def batch_scrobble(
        self,
        scrobbles: List[Dict]
    ) -> List[Dict]:
        """
        Batch scrobble for multiple users.

        Args:
            scrobbles: List of scrobble dicts with keys:
                - session_key: str
                - artist: str
                - track: str
                - timestamp: int
                - album: Optional[str]
                - duration: Optional[int]

        Returns:
            List of result dicts with success status for each scrobble
        """
        results = []

        # Group scrobbles by session key
        by_session = {}
        for scrobble in scrobbles:
            session_key = scrobble.get("session_key")
            if session_key not in by_session:
                by_session[session_key] = []
            by_session[session_key].append(scrobble)

        # Process each user's scrobbles
        for session_key, user_scrobbles in by_session.items():
            for scrobble in user_scrobbles:
                result = await self.scrobble_track(
                    session_key=session_key,
                    artist=scrobble["artist"],
                    track=scrobble["track"],
                    timestamp=scrobble["timestamp"],
                    album=scrobble.get("album"),
                    duration=scrobble.get("duration")
                )
                results.append({
                    "session_key": session_key,
                    "artist": scrobble["artist"],
                    "track": scrobble["track"],
                    **result
                })

        return results


# Global instance
lastfm_service = LastFmService()
