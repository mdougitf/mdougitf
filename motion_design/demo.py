"""Vidéo de démonstration : intro animée « Sir Modou » (≈ 15 s).

Scène 1  0.0 – 4.0 s   Logo : anneau qui se dessine, titre machine à écrire
Scène 2  4.0 – 9.0 s   « Mes passions » : 4 cartes qui arrivent en cascade
Scène 3  9.0 – 12.5 s  Graphique en barres animé
Scène 4 12.5 – 15.0 s  Outro : cercle qui envahit l'écran, « Merci ! »
"""

from .composition import Composition
from .layers import Arc, Ellipse, Line, Particles, Polygon, Rect, Text

W, H = 1280, 720
CX, CY = W / 2, H / 2

BG = ["#0b1020", "#1b1442"]
WHITE = "#f8fafc"
MUTED = "#94a3b8"
ACCENT = "#22d3ee"
PALETTE = ["#22d3ee", "#a78bfa", "#f472b6", "#facc15"]


def scene_logo(comp):
    end = 4.0
    ring = comp.add(Arc(CX, CY - 40, r=150, width=10, color=ACCENT, sweep=0, end=end))
    ring.animate("sweep", (0.2, 0), (1.4, 360, "in_out_cubic"))
    ring.animate("rotation", (0.2, -90), (1.4, 0, "out_cubic"))
    ring.animate("r", (3.3, 150), (3.9, 900, "in_expo"))
    ring.animate("width", (3.3, 10), (3.9, 2, "in_expo"))

    inner = comp.add(Ellipse(CX, CY - 40, r=118, fill="#22d3ee22", end=end))
    inner.pop_in(0.9, 0.7).pop_out(3.2, 0.4)

    hexa = comp.add(Polygon(CX, CY - 40, r=56, sides=6, fill=ACCENT, end=end))
    hexa.pop_in(1.1, 0.7).spin(1.1, 2.2, turns=1 / 6).pop_out(3.1, 0.4)

    initials = comp.add(Text(CX, CY - 42, text="M", size=64, fill="#0b1020", end=end))
    initials.pop_in(1.3, 0.6).pop_out(3.05, 0.4)

    title = comp.add(Text(CX, CY + 160, text="SIR MODOU", size=72, tracking=10,
                          fill=WHITE, reveal=0, end=end))
    title.animate("reveal", (1.5, 0), (2.3, 1, "linear"))
    title.slide_out(3.2, 0.5, dy=-30)

    line = comp.add(Line(CX - 160, CY + 215, length=320, width=4, color=ACCENT,
                         progress=0, end=end))
    line.animate("progress", (2.2, 0), (2.9, 1, "out_expo"))
    line.fade_out(3.2, 0.4)

    sub = comp.add(Text(CX, CY + 250, text="Python · Web · Robotique · Data",
                        size=24, font="regular", fill=MUTED, end=end))
    sub.slide_in(2.4, 0.6, dy=20).fade_out(3.2, 0.4)


def scene_passions(comp):
    t0, end = 4.0, 9.0
    head = comp.add(Text(CX, 110, text="Mes passions", size=56, fill=WHITE,
                         start=t0, end=end))
    head.slide_in(t0 + 0.1, 0.6, dy=-40).slide_out(end - 0.6, 0.5, dy=-40)

    underline = comp.add(Line(CX - 90, 152, length=180, width=4, color=ACCENT,
                              progress=0, start=t0, end=end))
    underline.animate("progress", (t0 + 0.5, 0), (t0 + 1.0, 1, "out_cubic"))
    underline.fade_out(end - 0.6, 0.4)

    items = [("Python", "Code & automatisation"), ("Web", "Sites & apps"),
             ("Robotique", "Capteurs & moteurs"), ("Data science", "Graphiques & stats")]
    card_w, card_h, gap = 260, 300, 30
    x0 = CX - (4 * card_w + 3 * gap) / 2 + card_w / 2
    for i, ((name, desc), col) in enumerate(zip(items, PALETTE)):
        x, y = x0 + i * (card_w + gap), CY + 50
        delay = t0 + 0.6 + i * 0.18
        out = end - 0.9 + i * 0.08

        card = comp.add(Rect(x, y, w=card_w, h=card_h, radius=28, fill="#ffffff10",
                             stroke=col, stroke_width=2, start=t0, end=end))
        card.slide_in(delay, 0.8, dy=120, ease="out_back").slide_out(out, 0.5, dy=80)

        icon = comp.add(Ellipse(x, y - 60, r=46, fill=col, start=t0, end=end))
        icon.pop_in(delay + 0.35, 0.6).pop_out(out, 0.4)

        glyph = comp.add(Text(x, y - 62, text=name[0], size=48, fill="#0b1020",
                              start=t0, end=end))
        glyph.pop_in(delay + 0.45, 0.6).pop_out(out, 0.35)

        label = comp.add(Text(x, y + 30, text=name, size=30, fill=WHITE, start=t0, end=end))
        label.slide_in(delay + 0.5, 0.5, dy=20).slide_out(out, 0.4, dy=40)

        info = comp.add(Text(x, y + 75, text=desc, size=18, font="regular", fill=MUTED,
                             start=t0, end=end))
        info.slide_in(delay + 0.6, 0.5, dy=20).slide_out(out, 0.4, dy=40)


def scene_chart(comp):
    t0, end = 9.0, 12.5
    head = comp.add(Text(CX, 100, text="Progression 2026", size=52, fill=WHITE,
                         start=t0, end=end))
    head.slide_in(t0 + 0.1, 0.6, dy=-40).fade_out(end - 0.5, 0.4)

    base_y, chart_w = 590, 820
    axis = comp.add(Line(CX - chart_w / 2, base_y, length=chart_w, width=3, color=MUTED,
                         progress=0, start=t0, end=end))
    axis.animate("progress", (t0 + 0.2, 0), (t0 + 0.8, 1, "out_expo")).fade_out(end - 0.5, 0.4)

    data = [("Python", 92), ("Web", 70), ("Robotique", 55), ("Data", 78), ("Photo", 64)]
    bar_w = 110
    step = chart_w / len(data)
    for i, (name, value) in enumerate(data):
        x = CX - chart_w / 2 + step * (i + 0.5)
        col = PALETTE[i % len(PALETTE)]
        h = value * 3.6
        d = t0 + 0.6 + i * 0.15

        bar = comp.add(Rect(x, base_y - 3, w=bar_w, h=0, radius=14, fill=col,
                            anchor="bottom", start=t0, end=end))
        bar.animate("h", (d, 0), (d + 0.9, h, "out_back"))
        bar.animate("h", (end - 0.7, h), (end - 0.2, 0, "in_cubic"))

        pct = comp.add(Text(x, base_y - h - 30, text=f"{value}%", size=28, fill=WHITE,
                            start=t0, end=end))
        pct.pop_in(d + 0.7, 0.5).fade_out(end - 0.7, 0.3)

        lbl = comp.add(Text(x, base_y + 30, text=name, size=22, font="regular",
                            fill=MUTED, start=t0, end=end))
        lbl.slide_in(d, 0.5, dy=20).fade_out(end - 0.5, 0.4)


def scene_outro(comp):
    t0, end = 12.5, 15.0
    wipe = comp.add(Ellipse(CX, CY, r=10, fill=ACCENT, start=t0))
    wipe.animate("w", (t0, 0), (t0 + 0.8, 1600, "in_out_expo"))
    wipe.animate("h", (t0, 0), (t0 + 0.8, 1600, "in_out_expo"))

    for i, col in enumerate(["#a78bfa", "#f472b6"]):
        ring = comp.add(Arc(CX, CY - 30, r=230 + 36 * i, width=6, color=col, sweep=0,
                            start=t0))
        ring.animate("sweep", (t0 + 0.6 + 0.15 * i, 0), (t0 + 1.4 + 0.15 * i, 360, "out_cubic"))
        ring.spin(t0 + 0.6, end, turns=0.25 * (1 if i else -1))

    merci = comp.add(Text(CX, CY - 30, text="Merci !", size=96, fill="#0b1020", start=t0))
    merci.pop_in(t0 + 0.7, 0.7)

    handle = comp.add(Text(CX, CY + 130, text="@mdouspe", size=30, font="mono",
                           fill="#0b1020", start=t0))
    handle.slide_in(t0 + 1.1, 0.6, dy=30)

    fade = comp.add(Rect(CX, CY, w=W, h=H, fill="#000000", opacity=0, start=end - 0.5))
    fade.animate("opacity", (end - 0.5, 0), (end, 1, "in_quad"))


def build(ss=2):
    comp = Composition(W, H, fps=30, duration=15.0, background=BG, ss=ss)
    comp.add(Particles(width=W, height=H, count=70, size=5, color="#ffffff55", speed=25))
    scene_logo(comp)
    scene_passions(comp)
    scene_chart(comp)
    scene_outro(comp)
    return comp
