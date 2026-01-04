import io
import aiohttp
import textwrap
from PIL import Image, ImageDraw, ImageFont

class ImageProcessor:
    """Service for image manipulation operations"""

    @staticmethod
    async def create_quote_image(avatar_url: str, quote_text: str, author_name: str) -> io.BytesIO:
        """
        Create an inspirational quote image with avatar

        Args:
            avatar_url: URL to the user's avatar
            quote_text: The quote text
            author_name: Name of the quote author

        Returns:
            BytesIO: Image buffer containing the quote image
        """
        # Fetch avatar
        async with aiohttp.ClientSession() as session:
            async with session.get(avatar_url) as resp:
                if resp.status != 200:
                    raise Exception("Failed to fetch avatar")
                avatar_data = await resp.read()

        avatar = Image.open(io.BytesIO(avatar_data)).resize((240, 240)).convert("RGBA")

        # Create wider rectangular image for inspirational quote aesthetic
        img = Image.new("RGB", (1200, 500), color=(20, 20, 20))
        draw = ImageDraw.Draw(img)

        # Draw rounded rectangle background
        draw.rounded_rectangle((20, 20, 1180, 480), radius=30, fill=(40, 40, 40))

        # Position avatar on the left side
        avatar_x = 50
        avatar_y = (500 - 240) // 2
        img.paste(avatar, (avatar_x, avatar_y), avatar if avatar.mode == 'RGBA' else None)

        # Load fonts - try serif for fancy inspirational feel
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 56)
            attr_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 32)
        except:
            try:
                font = ImageFont.truetype("arial.ttf", 56)
                attr_font = ImageFont.truetype("arial.ttf", 32)
            except:
                font = ImageFont.load_default()
                attr_font = ImageFont.load_default()

        # Format quote with quotation marks
        quoted_text = f'"{quote_text}"'
        wrapped_text = textwrap.fill(quoted_text, width=20)

        # Center the quote text both horizontally and vertically
        bbox = draw.multiline_textbbox((0, 0), wrapped_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = 310 + (1200 - 310 - text_width) // 2
        text_y = (500 - text_height) // 2

        draw.multiline_text((text_x, text_y), wrapped_text, font=font, fill=(255, 255, 255), align="center")

        # Add attribution with em dash
        attribution = f"— {author_name}"
        attr_bbox = draw.textbbox((0, 0), attribution, font=attr_font)
        attr_width = attr_bbox[2] - attr_bbox[0]
        attr_x = 310 + (1200 - 310 - attr_width) // 2

        draw.text((attr_x, text_y + text_height + 15), attribution, font=attr_font, fill=(200, 200, 200))

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer

    @staticmethod
    async def create_meme(template_url: str, top_text: str = "", bottom_text: str = "") -> io.BytesIO:
        """
        Create a meme from a template with text overlay

        Args:
            template_url: URL to the meme template image
            top_text: Text to add at the top
            bottom_text: Text to add at the bottom

        Returns:
            BytesIO: Image buffer containing the meme
        """
        # Download template
        async with aiohttp.ClientSession() as session:
            async with session.get(template_url) as resp:
                if resp.status != 200:
                    raise Exception("Failed to download meme template")
                template_data = await resp.read()

        img = Image.open(io.BytesIO(template_data)).convert("RGB")
        draw = ImageDraw.Draw(img)

        width, height = img.size

        # Scale font size based on image height (8% of height)
        font_size = int(height * 0.08)

        try:
            font = ImageFont.truetype("impact.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except:
                font = ImageFont.load_default()

        def draw_text(text, y_position):
            if not text:
                return
            # Scale wrap width based on image width
            chars_per_line = max(15, int(width / (font_size * 0.6)))
            wrapped = textwrap.fill(text, width=chars_per_line)
            lines = wrapped.split("\n")
            line_height = draw.textbbox((0, 0), "A", font=font)[3]
            total_height = len(lines) * line_height
            start_y = y_position - total_height // 2

            for line in lines:
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
                x = (width - text_width) // 2
                # Draw black outline
                draw.text((x + 2, start_y + 2), line, font=font, fill=(0, 0, 0))
                # Draw white text
                draw.text((x, start_y), line, font=font, fill=(255, 255, 255))
                start_y += line_height

        draw_text(top_text, height * 0.15)
        draw_text(bottom_text, height * 0.85)

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer
