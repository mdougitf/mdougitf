"""Fonctions d'easing (courbes d'accélération) utilisées par les keyframes.

Chaque fonction prend une progression ``p`` entre 0 et 1 et renvoie une
valeur (généralement entre 0 et 1, sauf pour ``back`` et ``elastic`` qui
dépassent volontairement pour donner du rebond).
"""

import math


def linear(p):
    return p


def in_quad(p):
    return p * p


def out_quad(p):
    return 1 - (1 - p) ** 2


def in_out_quad(p):
    return 2 * p * p if p < 0.5 else 1 - (-2 * p + 2) ** 2 / 2


def in_cubic(p):
    return p ** 3


def out_cubic(p):
    return 1 - (1 - p) ** 3


def in_out_cubic(p):
    return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def out_quart(p):
    return 1 - (1 - p) ** 4


def in_out_quart(p):
    return 8 * p ** 4 if p < 0.5 else 1 - (-2 * p + 2) ** 4 / 2


def out_expo(p):
    return 1.0 if p >= 1 else 1 - 2 ** (-10 * p)


def in_expo(p):
    return 0.0 if p <= 0 else 2 ** (10 * p - 10)


def in_out_expo(p):
    if p <= 0 or p >= 1:
        return float(p >= 1)
    return 2 ** (20 * p - 10) / 2 if p < 0.5 else (2 - 2 ** (-20 * p + 10)) / 2


def in_out_sine(p):
    return -(math.cos(math.pi * p) - 1) / 2


def out_back(p, s=1.70158):
    c3 = s + 1
    return 1 + c3 * (p - 1) ** 3 + s * (p - 1) ** 2


def in_back(p, s=1.70158):
    return (s + 1) * p ** 3 - s * p ** 2


def out_elastic(p):
    if p <= 0 or p >= 1:
        return float(p >= 1)
    c4 = (2 * math.pi) / 3
    return 2 ** (-10 * p) * math.sin((p * 10 - 0.75) * c4) + 1


def out_bounce(p):
    n1, d1 = 7.5625, 2.75
    if p < 1 / d1:
        return n1 * p * p
    if p < 2 / d1:
        p -= 1.5 / d1
        return n1 * p * p + 0.75
    if p < 2.5 / d1:
        p -= 2.25 / d1
        return n1 * p * p + 0.9375
    p -= 2.625 / d1
    return n1 * p * p + 0.984375


def step(p):
    """Maintient la valeur jusqu'au keyframe suivant (animation « hold »)."""
    return 1.0 if p >= 1 else 0.0


EASINGS = {
    name: fn
    for name, fn in globals().items()
    if callable(fn) and not name.startswith("_") and name not in ("get",)
    and fn.__module__ == __name__
}


def get(ease):
    """Renvoie une fonction d'easing à partir d'un nom ou d'un callable."""
    if ease is None:
        return linear
    if callable(ease):
        return ease
    try:
        return EASINGS[ease]
    except KeyError:
        raise ValueError(
            f"Easing inconnu : {ease!r}. Disponibles : {', '.join(sorted(EASINGS))}"
        ) from None
