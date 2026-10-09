import unittest

from motion_design import Composition, Rect, Text, easing, from_dict
from motion_design.animation import Track


class TestAnimation(unittest.TestCase):
    def test_easings_bornes(self):
        for name, fn in easing.EASINGS.items():
            self.assertAlmostEqual(fn(0), 0, places=6, msg=name)
            self.assertAlmostEqual(fn(1), 1, places=6, msg=name)

    def test_track_interpolation(self):
        tr = Track([(0, 0, "linear"), (2, 10, "linear")])
        self.assertEqual(tr.value_at(-1), 0)
        self.assertEqual(tr.value_at(1), 5)
        self.assertEqual(tr.value_at(5), 10)

    def test_couleur_interpolee(self):
        r = Rect(fill="#000000").animate("fill", (0, "#000000"), (1, "#ffffff", "linear"))
        self.assertEqual(r.at(0.5)["fill"], (127.5, 127.5, 127.5, 255))


class TestRendu(unittest.TestCase):
    def test_frame(self):
        comp = Composition(160, 90, duration=1, background=["#000", "#fff"], ss=1)
        comp.add(Rect(80, 45, w=40, h=40, fill="#ff0000"))
        img = comp.render_frame(0.5)
        self.assertEqual(img.size, (160, 90))
        self.assertEqual(img.getpixel((80, 45)), (255, 0, 0))

    def test_calque_hors_ecran_et_ancrage(self):
        comp = Composition(100, 100, duration=1, background="#000", ss=1)
        comp.add(Rect(-500, -500, w=50, h=50), Rect(0, 100, w=20, h=20, anchor="bottom-left"))
        img = comp.render_frame(0)
        self.assertEqual(img.getpixel((5, 95)), (255, 255, 255))
        self.assertEqual(img.getpixel((50, 50)), (0, 0, 0))

    def test_json(self):
        comp = from_dict({"width": 64, "height": 64, "duration": 1, "ss": 1, "layers": [
            {"type": "text", "text": "A", "x": 32, "y": 32, "effects": [["pop_in", 0, 0.5]]}]})
        self.assertIsInstance(comp.layers[0], Text)
        comp.render_frame(0.7)


if __name__ == "__main__":
    unittest.main()
