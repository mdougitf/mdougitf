"""Calques (layers) animables : formes, texte, lignes, arcs, particules.

Toutes les coordonnées sont exprimées en pixels de la vidéo finale.
Chaque propriété peut être une constante ou être animée avec
``layer.animate("prop", (t0, v0), (t1, v1, "out_back"), ...)``.

Propriétés communes à tous les calques :
    x, y        position du point d'ancrage
    scale       échelle (1 = taille normale)
    rotation    rotation en degrés (sens horaire)
    opacity     opacité entre 0 et 1
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFont

from .animation import Track, resolve

# --------------------------------------------------------------------------- #
# Couleurs
# --------------------------------------------------------------------------- #


def color(value):
    """Convertit '#rrggbb', '#rrggbbaa', (r, g, b) ou (r, g, b, a) en RGBA."""
    if value is None:
        return None
    if isinstance(value, str):
        h = value.lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        if len(h) == 6:
            h += "ff"
        if len(h) != 8:
            raise ValueError(f"Couleur invalide : {value!r}")
        return tuple(int(h[i:i + 2], 16) for i in range(0, 8, 2))
    value = tuple(value)
    return value if len(value) == 4 else value + (255,)


def _rgba(value):
    return tuple(int(round(max(0, min(255, c)))) for c in value)


COLOR_PROPS = {"fill", "stroke", "color"}

# --------------------------------------------------------------------------- #
# Polices
# --------------------------------------------------------------------------- #

FONT_DIRS = [
    "/usr/share/fonts/truetype/dejavu",
    "/usr/share/fonts/truetype/liberation",
    "/Library/Fonts",
    "C:/Windows/Fonts",
]
FONT_ALIASES = {
    "regular": ["DejaVuSans.ttf", "LiberationSans-Regular.ttf", "Arial.ttf", "arial.ttf"],
    "bold": ["DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf", "Arial Bold.ttf", "arialbd.ttf"],
    "mono": ["DejaVuSansMono.ttf", "LiberationMono-Regular.ttf", "consola.ttf"],
    "serif": ["DejaVuSerif-Bold.ttf", "LiberationSerif-Bold.ttf", "georgiab.ttf"],
}
_font_cache = {}


def _font_path(name):
    if os.path.isfile(name):
        return name
    for candidate in FONT_ALIASES.get(name, [name]):
        for d in FONT_DIRS:
            path = os.path.join(d, candidate)
            if os.path.isfile(path):
                return path
    return None


def load_font(name, size):
    size = max(1, int(round(size)))
    key = (name, size)
    if key not in _font_cache:
        path = _font_path(name)
        _font_cache[key] = (
            ImageFont.truetype(path, size) if path else ImageFont.load_default(size)
        )
    return _font_cache[key]


# --------------------------------------------------------------------------- #
# Ancrages
# --------------------------------------------------------------------------- #

ANCHORS = {
    "center": (0.5, 0.5),
    "left": (0.0, 0.5),
    "right": (1.0, 0.5),
    "top": (0.5, 0.0),
    "bottom": (0.5, 1.0),
    "top-left": (0.0, 0.0),
    "top-right": (1.0, 0.0),
    "bottom-left": (0.0, 1.0),
    "bottom-right": (1.0, 1.0),
}


# --------------------------------------------------------------------------- #
# Calque de base
# --------------------------------------------------------------------------- #


class Layer:
    defaults = {}

    def __init__(self, x=0, y=0, *, start=0.0, end=None, anchor="center",
                 opacity=1.0, scale=1.0, rotation=0.0, **props):
        self.start = start
        self.end = end
        self.anchor = ANCHORS[anchor] if isinstance(anchor, str) else tuple(anchor)
        self.props = {k: self._norm(k, v) for k, v in self.defaults.items()}
        self.props.update(x=x, y=y, opacity=opacity, scale=scale, rotation=rotation)
        for k, v in props.items():
            self.set(k, v)

    # -- définition des propriétés -------------------------------------- #

    def _norm(self, name, value):
        return color(value) if name in COLOR_PROPS and value is not None else value

    def set(self, name, value):
        if name not in self.props:
            raise AttributeError(f"{type(self).__name__} n'a pas de propriété {name!r}")
        self.props[name] = self._norm(name, value)
        return self

    def animate(self, name, *keyframes, ease="in_out_cubic"):
        """Anime une propriété.

        Chaque keyframe est ``(temps, valeur)`` ou ``(temps, valeur, easing)``.
        Si la propriété est déjà animée, les keyframes sont ajoutés à la piste.
        """
        if name not in self.props:
            raise AttributeError(f"{type(self).__name__} n'a pas de propriété {name!r}")
        track = self.props[name]
        if not isinstance(track, Track):
            track = Track()
            self.props[name] = track
        for kf in keyframes:
            t, v = kf[0], self._norm(name, kf[1])
            track.add(t, v, kf[2] if len(kf) > 2 else ease)
        return self

    def at(self, t):
        return {k: resolve(v, t) for k, v in self.props.items()}

    def active(self, t):
        return t >= self.start and (self.end is None or t < self.end)

    # -- effets prêts à l'emploi --------------------------------------- #

    def fade_in(self, t, duration=0.5, ease="out_cubic"):
        return self.animate("opacity", (t, 0.0), (t + duration, 1.0, ease))

    def fade_out(self, t, duration=0.5, ease="in_cubic"):
        return self.animate("opacity", (t, 1.0), (t + duration, 0.0, ease))

    def slide_in(self, t, duration=0.7, dx=0, dy=60, ease="out_cubic", fade=True):
        x, y = resolve(self.props["x"], t + duration), resolve(self.props["y"], t + duration)
        self.animate("x", (t, x + dx), (t + duration, x, ease))
        self.animate("y", (t, y + dy), (t + duration, y, ease))
        return self.fade_in(t, duration * 0.7) if fade else self

    def slide_out(self, t, duration=0.6, dx=0, dy=-60, ease="in_cubic", fade=True):
        x, y = resolve(self.props["x"], t), resolve(self.props["y"], t)
        self.animate("x", (t, x), (t + duration, x + dx, ease))
        self.animate("y", (t, y), (t + duration, y + dy, ease))
        return self.fade_out(t, duration) if fade else self

    def pop_in(self, t, duration=0.6, ease="out_back"):
        s = resolve(self.props["scale"], t + duration)
        self.animate("scale", (t, 0.0), (t + duration, s, ease))
        return self.fade_in(t, duration * 0.4)

    def pop_out(self, t, duration=0.4, ease="in_back"):
        s = resolve(self.props["scale"], t)
        return self.animate("scale", (t, s), (t + duration, 0.0, ease))

    def spin(self, t0, t1, turns=1.0, ease="in_out_cubic"):
        r = resolve(self.props["rotation"], t0)
        return self.animate("rotation", (t0, r), (t1, r + 360 * turns, ease))

    # -- rendu ------------------------------------------------------------ #

    def draw(self, p, k):
        """Dessine le contenu du calque. ``k`` = facteur d'échelle de rendu.

        Doit renvoyer une image RGBA (ou None si rien à dessiner).
        """
        raise NotImplementedError

    def render_onto(self, canvas, t, ss):
        if not self.active(t):
            return
        p = self.at(t)
        opacity = max(0.0, min(1.0, p["opacity"]))
        k = p["scale"] * ss
        if opacity <= 0 or k <= 0:
            return
        img = self.draw(p, k)
        if img is None or img.width == 0 or img.height == 0:
            return

        w, h = img.size
        vx = self.anchor[0] * w - w / 2
        vy = self.anchor[1] * h - h / 2
        rot = p["rotation"] % 360
        if rot:
            img = img.rotate(-rot, resample=Image.BICUBIC, expand=True)
            a = math.radians(rot)
            vx, vy = vx * math.cos(a) - vy * math.sin(a), vx * math.sin(a) + vy * math.cos(a)
        if opacity < 1:
            alpha = img.getchannel("A").point(lambda v: int(v * opacity))
            img.putalpha(alpha)

        left = round(p["x"] * ss - (img.width / 2 + vx))
        top = round(p["y"] * ss - (img.height / 2 + vy))
        _composite(canvas, img, left, top)


def _composite(canvas, img, left, top):
    """alpha_composite avec découpage aux bords du canevas."""
    cx0, cy0 = max(0, left), max(0, top)
    cx1 = min(canvas.width, left + img.width)
    cy1 = min(canvas.height, top + img.height)
    if cx0 >= cx1 or cy0 >= cy1:
        return
    src = (cx0 - left, cy0 - top, cx1 - left, cy1 - top)
    canvas.alpha_composite(img, dest=(cx0, cy0), source=src)


def _blank(w, h):
    return Image.new("RGBA", (max(1, int(math.ceil(w))), max(1, int(math.ceil(h)))), (0, 0, 0, 0))


# --------------------------------------------------------------------------- #
# Formes
# --------------------------------------------------------------------------- #


class Rect(Layer):
    """Rectangle (éventuellement arrondi). Propriétés : w, h, radius, fill, stroke."""

    defaults = dict(w=100, h=100, radius=0, fill="#ffffff", stroke=None, stroke_width=0)

    def draw(self, p, k):
        w, h = p["w"] * k, p["h"] * k
        if w < 1 or h < 1:
            return None
        sw = p["stroke_width"] * k if p["stroke"] else 0
        img = _blank(w, h)
        r = min(p["radius"] * k, w / 2, h / 2)
        ImageDraw.Draw(img).rounded_rectangle(
            (0, 0, w - 1, h - 1), radius=r,
            fill=_rgba(p["fill"]) if p["fill"] else None,
            outline=_rgba(p["stroke"]) if sw else None, width=int(round(sw)),
        )
        return img


class Ellipse(Layer):
    """Ellipse / cercle. Propriétés : w, h, fill, stroke, stroke_width."""

    defaults = dict(w=100, h=100, fill="#ffffff", stroke=None, stroke_width=0)

    def __init__(self, x=0, y=0, *, r=None, **kw):
        if r is not None:
            kw.setdefault("w", 2 * r)
            kw.setdefault("h", 2 * r)
        super().__init__(x, y, **kw)

    def draw(self, p, k):
        w, h = p["w"] * k, p["h"] * k
        if w < 1 or h < 1:
            return None
        sw = p["stroke_width"] * k if p["stroke"] else 0
        img = _blank(w, h)
        ImageDraw.Draw(img).ellipse(
            (0, 0, w - 1, h - 1),
            fill=_rgba(p["fill"]) if p["fill"] else None,
            outline=_rgba(p["stroke"]) if sw else None, width=int(round(sw)),
        )
        return img


Circle = Ellipse


class Arc(Layer):
    """Arc de cercle animable (effet « trim path »).

    Propriétés : r (rayon), width (épaisseur), color,
    start_angle (degrés, 0 = en haut), sweep (0 à 360).
    """

    defaults = dict(r=100, width=10, color="#ffffff", start_angle=0, sweep=360)

    def draw(self, p, k):
        r, wd = p["r"] * k, max(1, p["width"] * k)
        size = 2 * r + wd
        sweep = max(0.0, min(360.0, p["sweep"]))
        if sweep <= 0 or size < 2:
            return None
        img = _blank(size, size)
        a0 = p["start_angle"] - 90
        box = (wd / 2, wd / 2, size - wd / 2, size - wd / 2)
        d = ImageDraw.Draw(img)
        col = _rgba(p["color"])
        d.arc(box, a0, a0 + sweep, fill=col, width=int(round(wd)))
        # Extrémités arrondies
        if sweep < 360:
            for ang in (a0, a0 + sweep):
                cx = size / 2 + r * math.cos(math.radians(ang))
                cy = size / 2 + r * math.sin(math.radians(ang))
                d.ellipse((cx - wd / 2, cy - wd / 2, cx + wd / 2, cy + wd / 2), fill=col)
        return img


class Line(Layer):
    """Ligne horizontale qui se dessine de gauche à droite (``progress`` 0 → 1).

    Utilisez ``rotation`` pour l'orienter. Propriétés : length, width, color, progress.
    """

    defaults = dict(length=200, width=6, color="#ffffff", progress=1.0)

    def __init__(self, x=0, y=0, *, anchor="left", **kw):
        super().__init__(x, y, anchor=anchor, **kw)

    def draw(self, p, k):
        L, wd = p["length"] * k, max(1, p["width"] * k)
        drawn = L * max(0.0, min(1.0, p["progress"]))
        img = _blank(L + wd, wd)
        if drawn <= 0:
            return img
        ImageDraw.Draw(img).rounded_rectangle(
            (0, 0, drawn + wd - 1, wd - 1), radius=wd / 2, fill=_rgba(p["color"]))
        return img


class Polygon(Layer):
    """Polygone régulier ou étoile. Propriétés : r, sides, inner (ratio étoile), fill."""

    defaults = dict(r=60, sides=6, inner=1.0, fill="#ffffff")

    def draw(self, p, k):
        r = p["r"] * k
        n = max(3, int(round(p["sides"])))
        img = _blank(2 * r + 2, 2 * r + 2)
        c = r + 1
        pts = []
        star = p["inner"] < 1
        for i in range(n * (2 if star else 1)):
            rad = r * (p["inner"] if star and i % 2 else 1)
            a = math.pi * 2 * i / (n * (2 if star else 1)) - math.pi / 2
            pts.append((c + rad * math.cos(a), c + rad * math.sin(a)))
        ImageDraw.Draw(img).polygon(pts, fill=_rgba(p["fill"]))
        return img


# --------------------------------------------------------------------------- #
# Texte
# --------------------------------------------------------------------------- #


class Text(Layer):
    """Texte animable.

    Propriétés : text, size, font ('regular', 'bold', 'mono', 'serif' ou un
    chemin .ttf), fill, tracking (espacement des lettres en px),
    reveal (0 → 1 : apparition lettre par lettre, effet machine à écrire).
    """

    defaults = dict(text="", size=48, font="bold", fill="#ffffff", tracking=0, reveal=1.0)

    def draw(self, p, k):
        text = str(p["text"])
        n = len(text)
        shown = text[: int(math.floor(n * max(0.0, min(1.0, p["reveal"])) + 1e-6))]
        font = load_font(p["font"], p["size"] * k)
        # La boîte est calculée sur le texte COMPLET pour éviter que
        # l'ancrage ne bouge pendant l'effet machine à écrire.
        ascent, descent = font.getmetrics()
        tracking = p["tracking"] * k
        widths = [font.getlength(c) + tracking for c in text]
        total_w = max(1.0, sum(widths) - (tracking if text else 0))
        img = _blank(total_w + 2, ascent + descent + 2)
        if not shown:
            return img
        d = ImageDraw.Draw(img)
        fill = _rgba(p["fill"])
        if tracking == 0:
            d.text((1, 1), shown, font=font, fill=fill)
        else:
            x = 1.0
            for c, w in zip(shown, widths):
                d.text((x, 1), c, font=font, fill=fill)
                x += w
        return img


# --------------------------------------------------------------------------- #
# Particules
# --------------------------------------------------------------------------- #


class Particles(Layer):
    """Champ de particules qui dérivent (couvre une zone width × height).

    Propriétés : width, height, count, size, color, speed, seed.
    """

    defaults = dict(width=1280, height=720, count=60, size=4, color="#ffffff",
                    speed=30, seed=1, time=0.0)

    def __init__(self, x=None, y=None, **kw):
        w = kw.get("width", self.defaults["width"])
        h = kw.get("height", self.defaults["height"])
        super().__init__(w / 2 if x is None else x, h / 2 if y is None else y, **kw)
        self._seeds = {}

    def _points(self, count, seed):
        key = (count, seed)
        if key not in self._seeds:
            rnd = random.Random(seed)
            self._seeds[key] = [
                (rnd.random(), rnd.random(), rnd.uniform(0.3, 1.0),
                 rnd.uniform(0, math.tau), rnd.uniform(0.4, 1.0))
                for _ in range(count)
            ]
        return self._seeds[key]

    def render_onto(self, canvas, t, ss):
        # Le temps est injecté pour que les particules bougent en continu.
        self.props["time"] = t
        super().render_onto(canvas, t, ss)

    def draw(self, p, k):
        W, H = p["width"] * k, p["height"] * k
        img = _blank(W, H)
        d = ImageDraw.Draw(img)
        col = _rgba(p["color"])
        t = p["time"]
        for fx, fy, depth, phase, alpha in self._points(int(p["count"]), int(p["seed"])):
            x = (fx * W + math.sin(t * 0.7 + phase) * 20 * k) % W
            y = (fy * H - t * p["speed"] * depth * k) % H
            r = p["size"] * depth * k / 2
            a = int(col[3] * alpha * (0.6 + 0.4 * math.sin(t * 2 + phase)))
            d.ellipse((x - r, y - r, x + r, y + r), fill=col[:3] + (a,))
        return img


LAYER_TYPES = {
    "rect": Rect, "ellipse": Ellipse, "circle": Ellipse, "arc": Arc,
    "line": Line, "polygon": Polygon, "text": Text, "particles": Particles,
}
