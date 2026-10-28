"""Prepara as fotos ilustrativas escolhidas em data/fotos.json.

Uso: python3 scripts/prepare-images.py <pasta com as candidatas .jpg e candidatas.json>

Gera public/img/<chave>.webp (peças: quadrado 900px; seções: na proporção pedida)
e data/creditos-fotos.json com a página de origem de cada foto no Unsplash.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

src = Path(sys.argv[1])
cfg = json.loads(Path("data/fotos.json").read_text())
cands = {c["key"]: c for c in json.loads((src / "candidatas.json").read_text())}
out = Path("public/img")
out.mkdir(parents=True, exist_ok=True)


def crop(im: Image.Image, ratio: float) -> Image.Image:
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = int(w / ratio)
    y = (h - nh) // 2
    return im.crop((0, y, w, y + nh))


def save(key: str, ratio: float, width: int, name: str):
    im = ImageOps.exif_transpose(Image.open(src / f"{key}.jpg")).convert("RGB")
    im = crop(im, ratio)
    im = im.resize((width, round(width / ratio)), Image.LANCZOS)
    im.save(out / f"{name}.webp", "WEBP", quality=78, method=6)


usadas = set(cfg["pecas"].values()) | set(cfg["porTipo"].values())
for key in sorted(usadas):
    save(key, 1.0, 900, key)

for nome, s in cfg["secoes"].items():
    a, b = (int(x) for x in s["proporcao"].split(":"))
    save(s["foto"], a / b, 1600 if a > b else 1100, f"secao-{nome}")
    usadas.add(s["foto"])

creditos = {k: {"pagina": cands[k]["page"], "descricao": cands[k]["alt"]} for k in sorted(usadas)}
Path("data/creditos-fotos.json").write_text(json.dumps(creditos, ensure_ascii=False, indent=1) + "\n")
total = sum(p.stat().st_size for p in out.glob("*.webp"))
print(f"{len(list(out.glob('*.webp')))} imagens, {total // 1024} KB no total")
