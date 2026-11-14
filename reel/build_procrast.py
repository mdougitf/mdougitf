#!/usr/bin/env python3
"""Assemble procrast.html : les outils communs de motion.html (palette, texte, icônes, décor)
+ les scènes du 2e Reel (procrast_scenes.js). À relancer après chaque modification de l'un des deux."""
from pathlib import Path

here = Path(__file__).parent
src = (here / "motion.html").read_text()
start = src.index("const Q = new URLSearchParams")
end = src.index("// ---------- maquettes du dashboard")
lib = src[start:end].replace("DUR = 42;", "DUR = 50;")
scenes = (here / "procrast_scenes.js").read_text()
html = f"""<!doctype html>
<meta charset="utf-8">
<title>Reel procrastination</title>
<style>html,body{{margin:0;background:#000}}canvas{{display:block}}</style>
<canvas id="c" width="1080" height="1920"></canvas>
<script>
/* Fichier généré par build_procrast.py — modifier motion.html ou procrast_scenes.js, pas ce fichier. */
{lib}
{scenes}
</script>
"""
(here / "procrast.html").write_text(html)
print("procrast.html écrit")
