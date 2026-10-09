"""Keyframes et pistes d'animation.

Une ``Track`` contient une liste de keyframes ``(temps, valeur, easing)``.
Les valeurs peuvent être des nombres ou des tuples (couleurs, positions...),
interpolés composante par composante.
"""

from bisect import bisect_right

from . import easing


def lerp(a, b, p):
    if isinstance(a, (tuple, list)):
        return tuple(x + (y - x) * p for x, y in zip(a, b))
    return a + (b - a) * p


class Keyframe:
    __slots__ = ("time", "value", "ease")

    def __init__(self, time, value, ease="in_out_cubic"):
        self.time = float(time)
        self.value = value
        # L'easing d'un keyframe s'applique au segment qui MÈNE à ce keyframe.
        self.ease = easing.get(ease)


class Track:
    """Propriété animée dans le temps."""

    def __init__(self, keyframes=()):
        self.keyframes = []
        for kf in keyframes:
            self.add(*kf)

    def add(self, time, value, ease="in_out_cubic"):
        kf = Keyframe(time, value, ease)
        times = [k.time for k in self.keyframes]
        self.keyframes.insert(bisect_right(times, kf.time), kf)
        return self

    def value_at(self, t):
        kfs = self.keyframes
        if not kfs:
            raise ValueError("Piste sans keyframe")
        if t <= kfs[0].time:
            return kfs[0].value
        if t >= kfs[-1].time:
            return kfs[-1].value
        i = bisect_right([k.time for k in kfs], t)
        a, b = kfs[i - 1], kfs[i]
        p = (t - a.time) / (b.time - a.time)
        return lerp(a.value, b.value, b.ease(p))


def resolve(value, t):
    """Renvoie la valeur d'une propriété (constante ou ``Track``) au temps t."""
    return value.value_at(t) if isinstance(value, Track) else value
