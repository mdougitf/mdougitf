"""Chargement d'une composition depuis un fichier JSON (sans écrire de Python).

Exemple minimal ::

    {
      "width": 1280, "height": 720, "fps": 30, "duration": 4,
      "background": ["#0f172a", "#1e1b4b"],
      "layers": [
        {
          "type": "text", "text": "Bonjour !", "x": 640, "y": 360, "size": 96,
          "effects": [["pop_in", 0.2, 0.6], ["fade_out", 3.4, 0.5]],
          "animate": {"rotation": [[0, -10], [1, 0, "out_back"]]}
        }
      ]
    }
"""

import json

from .composition import Composition
from .layers import LAYER_TYPES

EFFECTS = {"fade_in", "fade_out", "slide_in", "slide_out", "pop_in", "pop_out", "spin"}


def build(data):
    comp = Composition(
        width=data.get("width", 1280), height=data.get("height", 720),
        fps=data.get("fps", 30), duration=data.get("duration", 5),
        background=data.get("background", "#000000"), ss=data.get("ss", 2),
    )
    for i, spec in enumerate(data.get("layers", [])):
        spec = dict(spec)
        kind = spec.pop("type", None)
        if kind not in LAYER_TYPES:
            raise ValueError(f"Calque #{i} : type {kind!r} inconnu ({', '.join(LAYER_TYPES)})")
        animate = spec.pop("animate", {})
        effects = spec.pop("effects", [])
        layer = LAYER_TYPES[kind](**spec)
        for prop, kfs in animate.items():
            layer.animate(prop, *[tuple(kf) for kf in kfs])
        for eff in effects:
            name, *args = eff if isinstance(eff, list) else [eff]
            kwargs = args.pop() if args and isinstance(args[-1], dict) else {}
            if name not in EFFECTS:
                raise ValueError(f"Calque #{i} : effet {name!r} inconnu ({', '.join(sorted(EFFECTS))})")
            getattr(layer, name)(*args, **kwargs)
        comp.add(layer)
    return comp


def load(path):
    with open(path, encoding="utf-8") as f:
        return build(json.load(f))
