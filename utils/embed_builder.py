import discord
import json
import re
from typing import Optional, Dict, Any

class EmbedBuilder:
    DEFAULT_COLOR = 0x9b59b6
    ERROR_COLOR = 0xFF0000

    @staticmethod
    def create_embed(
        title: str = None,
        description: str = None,
        color: int = None,
        url: str = None,
        footer_text: str = None,
        image_url: str = None,
        thumbnail_url: str = None
    ) -> discord.Embed:

        if color is None:
            color = EmbedBuilder.DEFAULT_COLOR

        embed = discord.Embed(
            title=title,
            description=description,
            color=color,
            url=url
        )

        if footer_text:
            embed.set_footer(text=footer_text)

        if image_url:
            embed.set_image(url=image_url)

        if thumbnail_url:
            embed.set_thumbnail(url=thumbnail_url)

        return embed

    @staticmethod
    def create_error_embed(description: str) -> discord.Embed:
        return EmbedBuilder.create_embed(
            title="Error",
            description=description,
            color=EmbedBuilder.ERROR_COLOR
        )

    @staticmethod
    def substitute_variables(text: str, variables: Dict[str, str]) -> str:
        """
        Replace {variable} placeholders with actual values

        Args:
            text: Text containing {variable.path} placeholders
            variables: Dict of variable values (e.g., {"user.name": "John", "level": "5"})

        Returns:
            Text with all variables replaced
        """
        if not text or not variables:
            return text

        # Find all {variable.path} patterns
        pattern = r'\{([a-zA-Z0-9_.]+)\}'

        def replacer(match):
            var_name = match.group(1)
            return variables.get(var_name, match.group(0))  # Leave as-is if not found

        return re.sub(pattern, replacer, text)

    @staticmethod
    def create_from_template(template_data: Any, variables: Optional[Dict[str, str]] = None) -> discord.Embed:
        """
        Create embed from template with variable substitution

        Args:
            template_data: Template JSON structure (dict or JSON string)
            variables: Dict of variable values (e.g., {"user.name": "John", "level": "5"})

        Returns:
            discord.Embed with all variables replaced
        """
        # Parse template_data if it's a string
        if isinstance(template_data, str):
            template_data = json.loads(template_data)

        variables = variables or {}

        # Extract and substitute basic properties
        title = template_data.get("title")
        if title:
            title = EmbedBuilder.substitute_variables(title, variables)

        description = template_data.get("description")
        if description:
            description = EmbedBuilder.substitute_variables(description, variables)

        color = template_data.get("color", EmbedBuilder.DEFAULT_COLOR)

        url = template_data.get("url")
        if url:
            url = EmbedBuilder.substitute_variables(url, variables)

        # Create base embed
        embed = discord.Embed(
            title=title,
            description=description,
            color=color,
            url=url
        )

        # Add footer if present
        footer = template_data.get("footer")
        if footer and isinstance(footer, dict):
            footer_text = footer.get("text")
            footer_icon = footer.get("icon_url")

            if footer_text:
                footer_text = EmbedBuilder.substitute_variables(footer_text, variables)
            if footer_icon:
                footer_icon = EmbedBuilder.substitute_variables(footer_icon, variables)

            if footer_text:
                embed.set_footer(text=footer_text, icon_url=footer_icon)

        # Add thumbnail if present
        thumbnail = template_data.get("thumbnail")
        if thumbnail and isinstance(thumbnail, dict):
            thumbnail_url = thumbnail.get("url")
            if thumbnail_url:
                thumbnail_url = EmbedBuilder.substitute_variables(thumbnail_url, variables)
                embed.set_thumbnail(url=thumbnail_url)

        # Add image if present
        image = template_data.get("image")
        if image and isinstance(image, dict):
            image_url = image.get("url")
            if image_url:
                image_url = EmbedBuilder.substitute_variables(image_url, variables)
                embed.set_image(url=image_url)

        # Add author if present
        author = template_data.get("author")
        if author and isinstance(author, dict):
            author_name = author.get("name")
            author_icon = author.get("icon_url")
            author_url = author.get("url")

            if author_name:
                author_name = EmbedBuilder.substitute_variables(author_name, variables)
            if author_icon:
                author_icon = EmbedBuilder.substitute_variables(author_icon, variables)
            if author_url:
                author_url = EmbedBuilder.substitute_variables(author_url, variables)

            if author_name:
                embed.set_author(name=author_name, icon_url=author_icon, url=author_url)

        # Add fields if present
        fields = template_data.get("fields")
        if fields and isinstance(fields, list):
            for field in fields:
                if isinstance(field, dict):
                    field_name = field.get("name", "")
                    field_value = field.get("value", "")
                    field_inline = field.get("inline", False)

                    if field_name:
                        field_name = EmbedBuilder.substitute_variables(field_name, variables)
                    if field_value:
                        field_value = EmbedBuilder.substitute_variables(field_value, variables)

                    if field_name and field_value:
                        embed.add_field(name=field_name, value=field_value, inline=field_inline)

        return embed
