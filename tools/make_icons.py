from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "assets"
BG = (156, 43, 32, 255)
FG = (247, 241, 230, 255)
FONT = "/System/Library/Fonts/Supplemental/Georgia.ttf"

def icon(size, radius_ratio=0.22, pad_ratio=0.0):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = int(size * pad_ratio)
    r = int(size * radius_ratio)
    box = [pad, pad, size - 1 - pad, size - 1 - pad]
    draw.rounded_rectangle(box, radius=r, fill=BG)
    font = ImageFont.truetype(FONT, int(size * 0.52))
    text = "D"
    x0, y0, x1, y1 = draw.textbbox((0, 0), text, font=font)
    w, h = x1 - x0, y1 - y0
    draw.text(((size - w) / 2 - x0, (size - h) / 2 - y0 - size * 0.02), text, font=font, fill=FG)
    return img

def maskable(size):
    # Safe zone: 80% center for Android maskable icons
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(size * 0.42))
    text = "D"
    x0, y0, x1, y1 = draw.textbbox((0, 0), text, font=font)
    w, h = x1 - x0, y1 - y0
    draw.text(((size - w) / 2 - x0, (size - h) / 2 - y0 - size * 0.02), text, font=font, fill=FG)
    return img

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    icon(180).save(OUT / "icon-180.png")
    icon(192).save(OUT / "icon-192.png")
    icon(512).save(OUT / "icon-512.png")
    maskable(512).save(OUT / "icon-maskable.png")
    print("Wrote PWA icons in", OUT)
