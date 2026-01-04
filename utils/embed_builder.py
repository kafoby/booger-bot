import discord

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
