#!/usr/bin/env python3
"""AccountStoreOne — branded product covers for the migrated products.

The live products used generic picsum stock photos. Each gets a designed
cover instead: brand-navy gradient, orange accent, product title and
category, store mark. The original stock URL is preserved in the
product's original_image field by the migration script — nothing is
destroyed. Output: public/covers/<product-id>.jpg (1200x675).
"""

import json
import os
import textwrap

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT_DIR = os.path.join(ROOT, "public", "covers")
os.makedirs(OUT_DIR, exist_ok=True)

NAVY = (12, 34, 84)       # #0C2254
NAVY_DARK = (7, 20, 50)
ORANGE = (244, 117, 31)   # #F4751F
WHITE = (255, 255, 255)
SOFT = (200, 212, 235)

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

PRODUCTS = [
    {
        "id": "f88d7c6b-fe26-4c1c-8e59-14152c4a749b",
        "title": "[RADIANT] Valorant Personal Account",
        "display": "Valorant Personal Account",
        "tag": "RADIANT RANK",
        "category": "Valorant",
    },
    {
        "id": "83915756-8832-4d75-8dc9-adc700981894",
        "title": "Netflix Premium 1 Month (UHD)",
        "display": "Netflix Premium 1 Month",
        "tag": "ULTRA HD 4K",
        "category": "Streaming",
    },
    {
        "id": "b1b48b33-9891-4b45-a6cb-7eb3f23c72a6",
        "title": "GTA V Modded Account (PC)",
        "display": "GTA V Modded Account",
        "tag": "PC · BEST SELLER",
        "category": "GTA V",
    },
]

W, H = 1200, 675


def gradient(w, h):
    img = Image.new("RGB", (w, h), NAVY)
    px = img.load()
    for y in range(h):
        for x in range(0, w, 4):
            t = (x / w) * 0.55 + (y / h) * 0.45
            r = int(NAVY_DARK[0] + (NAVY[0] - NAVY_DARK[0]) * t)
            g = int(NAVY_DARK[1] + (NAVY[1] - NAVY_DARK[1]) * t)
            b = int(NAVY_DARK[2] + (NAVY[2] - NAVY_DARK[2]) * t)
            for dx in range(4):
                if x + dx < w:
                    px[x + dx, y] = (r, g, b)
    return img


def fit_font(text, max_width, start_size):
    size = start_size
    while size > 20:
        f = ImageFont.truetype(FONT_BOLD, size)
        if f.getlength(text) <= max_width:
            return f
        size -= 4
    return ImageFont.truetype(FONT_BOLD, size)


def make_cover(p):
    img = gradient(W, H)
    d = ImageDraw.Draw(img, "RGBA")

    # Orange glow blob top-right + ring bottom-left (brand accents)
    d.ellipse([W - 340, -180, W + 160, 320], fill=ORANGE + (46,))
    d.ellipse([W - 300, -140, W + 120, 280], outline=ORANGE + (110,), width=3)
    d.ellipse([-190, H - 260, 190, H + 120], outline=SOFT + (50,), width=3)

    # Category chip
    cat_font = ImageFont.truetype(FONT_BOLD, 26)
    cat = p["category"].upper()
    cw = cat_font.getlength(cat) + 44
    d.rounded_rectangle([64, 64, 64 + cw, 116], radius=26, fill=ORANGE)
    d.text((64 + 22, 76), cat, font=cat_font, fill=WHITE)

    # Tag line
    tag_font = ImageFont.truetype(FONT_BOLD, 30)
    d.text((66, 150), p["tag"], font=tag_font, fill=ORANGE)

    # Title (wrapped, fitted)
    title_font = fit_font(p["display"], W - 140, 76)
    lines = textwrap.wrap(p["display"], width=22)
    y = 210
    for line in lines[:3]:
        d.text((64, y), line, font=title_font, fill=WHITE)
        y += int(title_font.size * 1.18)

    # Divider
    d.rounded_rectangle([66, y + 14, 66 + 120, y + 22], radius=4, fill=ORANGE)

    # Store mark bottom-left
    mark_font = ImageFont.truetype(FONT_BOLD, 30)
    sub_font = ImageFont.truetype(FONT_REG, 24)
    d.rounded_rectangle([64, H - 108, 116, H - 56], radius=14, fill=ORANGE)
    zap_font = ImageFont.truetype(FONT_BOLD, 34)
    d.text((79, H - 100), "A", font=zap_font, fill=WHITE)
    d.text((132, H - 102), "Account Store One", font=mark_font, fill=WHITE)
    d.text((132, H - 66), "Escrow-protected delivery", font=sub_font, fill=SOFT)

    out = os.path.join(OUT_DIR, f"{p['id']}.jpg")
    img.save(out, "JPEG", quality=88)
    print(f"cover: {out}")


if __name__ == "__main__":
    for p in PRODUCTS:
        make_cover(p)
    print(json.dumps({"covers": [p["id"] for p in PRODUCTS]}))
