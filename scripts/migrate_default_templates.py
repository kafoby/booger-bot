"""
Migration script to create default embed templates for existing commands.
Run this script once to populate the database with default templates.

Usage:
    python scripts/migrate_default_templates.py
"""

import asyncio
import aiohttp
import json
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000")
BOT_API_KEY = os.getenv("BOT_API_KEY")

# Default templates based on existing embed styles
DEFAULT_TEMPLATES = [
    {
        "name": "Level Up Notification",
        "description": "Default style for level up notifications",
        "isDefault": True,
        "category": "leveling",
        "templateData": {
            "title": "Level Up!",
            "description": "{user.mention} reached **Level {level}**",
            "color": 10181046,  # 0x9b59b6 in decimal
            "url": None,
            "footer": {
                "text": "Keep chatting to level up!",
                "icon_url": None
            },
            "thumbnail": {
                "url": "{user.display_avatar.url}"
            },
            "image": {
                "url": None
            },
            "author": {
                "name": None,
                "icon_url": None,
                "url": None
            },
            "fields": []
        }
    },
    {
        "name": "Rank Card",
        "description": "Default style for rank command",
        "isDefault": True,
        "category": "leveling",
        "templateData": {
            "title": "{user.name}'s Rank",
            "description": None,
            "color": 10181046,  # 0x9b59b6
            "url": None,
            "footer": {
                "text": None,
                "icon_url": None
            },
            "thumbnail": {
                "url": "{user.display_avatar.url}"
            },
            "image": {
                "url": None
            },
            "author": {
                "name": None,
                "icon_url": None,
                "url": None
            },
            "fields": [
                {"name": "Level", "value": "{level}", "inline": True},
                {"name": "Current XP", "value": "{xp}", "inline": True},
                {"name": "XP to Next Level", "value": "{xp_needed}", "inline": True}
            ]
        }
    },
    {
        "name": "Leaderboard",
        "description": "Default style for leaderboard (fields added dynamically)",
        "isDefault": True,
        "category": "leveling",
        "templateData": {
            "title": "Leaderboard - Top 10",
            "description": None,
            "color": 10181046,  # 0x9b59b6
            "url": None,
            "footer": {
                "text": None,
                "icon_url": None
            },
            "thumbnail": {
                "url": None
            },
            "image": {
                "url": None
            },
            "author": {
                "name": None,
                "icon_url": None,
                "url": None
            },
            "fields": []  # Dynamic fields added by bot
        }
    }
]

# Command to template mappings
DEFAULT_MAPPINGS = [
    {"commandName": "levels.level_up", "template_name": "Level Up Notification", "context": "notification"},
    {"commandName": "levels.rank", "template_name": "Rank Card", "context": "default"},
    {"commandName": "levels.leaderboard", "template_name": "Leaderboard", "context": "default"}
]


async def migrate():
    """Run the migration to create default templates and mappings"""
    if not BOT_API_KEY:
        print("❌ Error: BOT_API_KEY environment variable not set")
        sys.exit(1)

    print(f"🔗 Connecting to API at {API_BASE_URL}")
    print(f"🔑 Using API key: {BOT_API_KEY[:8]}...")
    print()

    async with aiohttp.ClientSession() as session:
        template_ids = {}

        print("📝 Creating templates...")
        print()

        # Create templates
        for template in DEFAULT_TEMPLATES:
            template_copy = template.copy()
            # Stringify template_data for API
            template_copy['templateData'] = json.dumps(template['templateData'])
            template_copy['createdBy'] = "migration_script"

            try:
                async with session.post(
                    f"{API_BASE_URL}/api/embed-templates",
                    json=template_copy,
                    headers={"X-Bot-API-Key": BOT_API_KEY}
                ) as resp:
                    if resp.status == 201:
                        result = await resp.json()
                        template_ids[template['name']] = result['id']
                        print(f"✅ Created template: {template['name']} (ID: {result['id']})")
                    else:
                        error_text = await resp.text()
                        print(f"❌ Failed to create template '{template['name']}': HTTP {resp.status}")
                        print(f"   Response: {error_text}")
            except Exception as e:
                print(f"❌ Error creating template '{template['name']}': {e}")

        print()
        print("🔗 Creating command mappings...")
        print()

        # Create mappings
        for mapping in DEFAULT_MAPPINGS:
            template_id = template_ids.get(mapping['template_name'])
            if not template_id:
                print(f"⚠️  Skipping mapping for '{mapping['commandName']}' - template not found")
                continue

            try:
                async with session.post(
                    f"{API_BASE_URL}/api/command-template-mappings",
                    json={
                        "commandName": mapping['commandName'],
                        "templateId": template_id,
                        "context": mapping['context'],
                        "createdBy": "migration_script"
                    },
                    headers={"X-Bot-API-Key": BOT_API_KEY}
                ) as resp:
                    if resp.status == 201:
                        result = await resp.json()
                        print(f"✅ Created mapping: {mapping['commandName']} → {mapping['template_name']}")
                    else:
                        error_text = await resp.text()
                        print(f"❌ Failed to create mapping for '{mapping['commandName']}': HTTP {resp.status}")
                        print(f"   Response: {error_text}")
            except Exception as e:
                print(f"❌ Error creating mapping for '{mapping['commandName']}': {e}")

        print()
        print("✨ Migration complete!")
        print()
        print(f"📊 Summary:")
        print(f"   Templates created: {len(template_ids)}/{len(DEFAULT_TEMPLATES)}")
        print(f"   Mappings created: Expected {len(DEFAULT_MAPPINGS)}")


if __name__ == "__main__":
    print("=" * 60)
    print("  Default Embed Templates Migration")
    print("=" * 60)
    print()
    asyncio.run(migrate())
