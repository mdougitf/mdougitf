#!/usr/bin/env python3
"""Reel « Le système de l'étudiant-athlète » — typo cinétique 1080x1920, 30 i/s, 42 s.

Usage :  python3 render.py            -> reel_preview.mp4 (complet, fonds provisoires plans 4-5)
                                         reel_overlay_plans4-5.mov (16-36 s, fond transparent + voile)
Pour recaler sur la voix : modifier uniquement les temps (en secondes) dans SCREENS.
"""
import subprocess, sys
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, DUR = 1080, 1920, 30, 42.0
NAVY, WHITE, BLUE = (13, 36, 64), (231, 240, 250), (123, 164, 208)
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
MAXW = 900          # largeur utile (zone sûre Instagram)
CY = 900            # centre vertical du bloc de texte

W_, B_ = WHITE, BLUE
# Un écran = (début, fin, taille max, lignes) ; une ligne = [(mot, couleur, t d'apparition), ...]
# "bg" : None = navy plein ; "dash"/"p1".."p4" = capture à poser dessous (plans 4-5).
SCREENS = [
 # Plan 1 · hook
 dict(t0=0.0,  t1=0.75, size=230, lines=[[("TU",W_,0.0),("NE",W_,0.2)],[("MANQUES",W_,0.4)]]),
 dict(t0=0.75, t1=1.9,  size=230, lines=[[("PAS",B_,0.75),("DE",W_,0.95)],[("TEMPS.",W_,1.1)]]),
 dict(t0=1.9,  t1=3.0,  size=420, lines=[[("TES",W_,1.95),("2",B_,2.15)],[("MEILLEURES",W_,2.35)],[("HEURES",W_,2.7)]]),
 # Plan 2 · douleur
 dict(t0=3.0,  t1=8.6,  size=120, gap=1.7, lines=[
     [("8 H",B_,3.0),("·",W_,3.0),("COURS",W_,3.0)],
     [("18 H",B_,4.4),("·",W_,4.4),("ENTRAÎNEMENT",W_,4.4)],
     [("22 H",B_,6.2),("·",W_,6.2),("MATHS",W_,6.2)]]),
 dict(t0=9.0,  t1=10.0, size=900, lines=[[("×4",B_,9.0)]]),
 # Plan 3 · retournement
 dict(t0=10.6, t1=14.6, size=200, strike=(11.6, 11.9), lines=[[("DISCIPLINE",W_,10.6)]]),
 dict(t0=14.6, t1=16.0, size=260, lines=[[("LE",W_,14.6),("PIRE",B_,14.85)],[("MOMENT",W_,15.2)]]),
 # Plan 4 · solution (capture dashboard dessous)
 dict(t0=16.0, t1=28.0, bg="dash", lines=[]),
 dict(t0=19.7, t1=21.6, bg="dash", size=300, lines=[[("HAUTE",B_,19.7)]]),
 dict(t0=21.6, t1=23.0, bg="dash", size=300, lines=[[("MOYENNE",W_,21.6)]]),
 dict(t0=23.0, t1=24.6, bg="dash", size=300, lines=[[("BASSE",W_,23.0)]]),
 dict(t0=26.0, t1=27.1, bg="dash", size=260, lines=[[("3",B_,26.0),("TÂCHES.",W_,26.0)]]),
 dict(t0=27.1, t1=28.0, bg="dash", size=320, lines=[[("PAS",W_,27.1),("12.",B_,27.1)]]),
 # Plan 5 · contenu (4 coupes sur les vraies pages)
 dict(t0=28.0, t1=29.8, bg="p1", size=220, lines=[[("ROUTINES",W_,28.0)]]),
 dict(t0=29.8, t1=31.4, bg="p2", size=220, lines=[[("HABITUDES",W_,29.8)]]),
 dict(t0=31.4, t1=33.8, bg="p3", size=220, lines=[[("DIMANCHE",W_,31.4)],[("15 MIN",B_,31.9)]]),
 dict(t0=33.8, t1=36.0, bg="p4", size=200, gap=1.25, lines=[[("TÉL.",W_,33.8)],[("TABLETTE",W_,34.3)],[("PC",B_,35.0)]]),
 # Plan 6 · appel à l'action
 dict(t0=36.0, t1=38.2, size=170, lines=[[("LE",W_,36.0),("SYSTÈME",W_,36.2)],[("DE",W_,36.6),("L'ÉTUDIANT-",W_,36.75)],[("ATHLÈTE",B_,37.2)]]),
 dict(t0=38.2, t1=40.0, size=330, lines=[[("14,99 €",B_,38.2)]]),
 dict(t0=40.0, t1=42.0, size=240, lines=[[("LIEN",W_,40.0),("EN",W_,40.2)],[("BIO",B_,40.4)]]),
]
BG_LABEL = {"dash": "CAPTURE DASHBOARD", "p1": "PAGE ROUTINES", "p2": "PAGE HABITUDES",
            "p3": "PAGE REVUE DU DIMANCHE", "p4": "TÉLÉPHONE / TABLETTE / PC"}

_fonts = {}
def font(sz):
    if sz not in _fonts: _fonts[sz] = ImageFont.truetype(FONT, sz)
    return _fonts[sz]

def layout(scr):
    """Positions finales fixes : les mots apparaissent sans faire bouger les autres."""
    if "_lay" in scr: return scr["_lay"]
    lines = scr["lines"]; sz = scr.get("size", 200)
    def width(line, f):
        sp = f.getlength(" ") * 0.9
        return sum(f.getlength(w) for w, _, _ in line) + sp * (len(line) - 1)
    while sz > 40 and max((width(l, font(sz)) for l in lines), default=0) > MAXW: sz -= 4
    f = font(sz); lh = sz * scr.get("gap", 1.02); sp = f.getlength(" ") * 0.9
    y = CY - lh * len(lines) / 2; out = []
    for l in lines:
        x = (W - width(l, f)) / 2
        for w, c, t in l:
            out.append((w, c, t, x, y + lh / 2)); x += f.getlength(w) + sp
        y += lh
    scr["_lay"] = (f, sz, out); return scr["_lay"]

def active(t):
    return [s for s in SCREENS if s["t0"] <= t < s["t1"]]

def frame(t, alpha_mode=False):
    scrs = active(t)
    bg = next((s["bg"] for s in scrs if s.get("bg")), None)
    if alpha_mode:
        img = Image.new("RGBA", (W, H), NAVY + (115,))          # voile navy 45 % : assombrit la capture
    elif bg:
        img = Image.new("RGBA", (W, H), (9, 25, 45, 255))
        d = ImageDraw.Draw(img)
        for i in range(-H, W, 90): d.line([(i, 0), (i + H, H)], fill=(13, 33, 58, 255), width=30)
        d.text((W / 2, 250), "↳ " + BG_LABEL[bg] + " ICI", font=ImageFont.truetype(FONT.replace("Display-Black", "-SemiBold"), 30),
               fill=(70, 100, 135, 255), anchor="mm")
    else:
        img = Image.new("RGBA", (W, H), NAVY + (255,))
    d = ImageDraw.Draw(img)
    for s in scrs:
        if not s["lines"]: continue
        f, sz, words = layout(s)
        for w, c, tw, x, y in words:
            if t >= tw: d.text((x, y), w, font=f, fill=c + (255,), anchor="lm")
        if "strike" in s and t >= s["strike"][0]:
            a, b = s["strike"]; p = min(1.0, (t - a) / (b - a))  # trait linéaire, sans rebond
            x0 = words[0][3] - 30; x1 = x0 + (f.getlength(words[0][0]) + 60) * p
            y = words[0][4] + sz * 0.03; th = max(8, sz // 9)
            d.rectangle([x0, y - th / 2, x1, y + th / 2], fill=BLUE + (255,))
    return img

def encode(path, t0, t1, alpha):
    if alpha:
        codec = ["-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le", "-q:v", "11"]
    else:
        codec = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "medium", "-movflags", "+faststart"]
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba",
                          "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", *codec, path], stdin=subprocess.PIPE)
    last_key, last = None, None
    for n in range(round(t0 * FPS), round(t1 * FPS)):
        t = n / FPS + 1e-6
        key = tuple((id(s), sum(t >= w[2] for l in s["lines"] for w in l),
                     round(min(1, max(0, (t - s["strike"][0]) / 0.3)), 3) if "strike" in s else 0) for s in active(t))
        if key != last_key: last, last_key = frame(t, alpha).tobytes(), key
        p.stdin.write(last)
    p.stdin.close(); p.wait()

if __name__ == "__main__":
    if len(sys.argv) > 1:                       # python3 render.py 2.5 -> image de contrôle
        frame(float(sys.argv[1])).convert("RGB").save(f"frame_{sys.argv[1]}.png"); sys.exit()
    encode("reel_preview.mp4", 0, DUR, False)
    encode("reel_overlay_plans4-5.mov", 16, 36, True)
