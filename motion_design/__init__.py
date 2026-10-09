"""motion_design — un mini moteur de motion design en Python.

Exemple ::

    from motion_design import Composition, Text

    comp = Composition(1280, 720, fps=30, duration=3, background="#111827")
    titre = comp.add(Text(640, 360, text="Bonjour", size=96))
    titre.pop_in(0.2).fade_out(2.4)
    comp.render("bonjour.mp4")
"""

from .animation import Track
from .composition import Composition
from .layers import (Arc, Circle, Ellipse, Layer, Line, Particles, Polygon,
                     Rect, Text, color)
from .loader import build as from_dict
from .loader import load as from_json

__all__ = [
    "Arc", "Circle", "Composition", "Ellipse", "Layer", "Line", "Particles",
    "Polygon", "Rect", "Text", "Track", "color", "from_dict", "from_json",
]
