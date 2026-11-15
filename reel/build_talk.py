#!/usr/bin/env python3
"""Assemble talk.html : outils de motion.html + mini-personnages de procrast_scenes.js
+ données de coupe (talk_cuts.json) + scènes (talk_scenes.js)."""
import json
from pathlib import Path
here = Path(__file__).parent
cuts = json.loads((here / "talk_cuts.json").read_text())
src = (here / "motion.html").read_text()
lib = src[src.index("const Q = new URLSearchParams"):src.index("// ---------- maquettes du dashboard")].replace("DUR = 42;", f"DUR = {cuts['dur']};")
pro = (here / "procrast_scenes.js").read_text(); pro = pro[:pro.index("// ---------- scènes ----------")]
pro = pro.replace("const SLOTS = [];", "const SLOTS = [];")
# sous-titres : découpage de chaque phrase en petits groupes ; * = mot fort (bleu)
CH = [["il faut savoir", "que le *cerveau"], ["adore le *confort."], ["tout ce qui est *effort,", "il n'aime pas."], ["il fait tout", "pour t'en *éloigner."],
      ["maintenant,", "*l'astuce, c'est quoi ?"], ["pour enlever cette", "*procrastination,", "il faut juste se dire :"],
      ["ok,", "je vais juste réviser", "*5 *minutes,", "je vais juste regarder ça", "*5 *minutes."], ["tu commences à réviser", "*5 *minutes"],
      ["et là,", "tu commences à sentir", "que la *motivation rentre."], ["c'est ça la *règle."], ["il faut se dire", "*5 *minutes"], ["et après,"],
      ["*boum,", "tu continues."], ["*easy-peasy."], ["*abonne-toi", "maintenant."]]
caps = []
for seg, chunks in zip(cuts["segs"], CH):
    t0, t1 = seg["out"]; words = [(w, ci) for ci, c in enumerate(chunks) for w in c.split()]
    total = sum(len(w.strip("*")) + 1 for w, _ in words); acc = 0; per = {}
    for w, ci in words:
        per.setdefault(ci, []).append([w.strip("*"), w.startswith("*"), round(t0 + (t1 - t0) * acc / total, 3)]); acc += len(w.strip("*")) + 1
    for ci in sorted(per): caps.append([per[ci][0][2], None, per[ci]])
for i, c in enumerate(caps): c[1] = caps[i + 1][0] if i + 1 < len(caps) else cuts["dur"]
for c, nxt in zip(caps, caps[1:] + [None]):
    pass
# un groupe ne reste pas affiché plus de 0,6 s après la fin de sa phrase
ends = {s["out"][0]: s["out"][1] for s in cuts["segs"]}
segs = cuts["segs"]
for c in caps:
    seg = max((s for s in segs if s["out"][0] <= c[0] + 1e-6), key=lambda s: s["out"][0]); c[1] = min(c[1], seg["out"][1] + .6)
data = f"const SEGS = {json.dumps([{'src': s['src'], 'out': s['out']} for s in segs])};\nconst CAPS = {json.dumps(caps, ensure_ascii=False)};\nconst NFACE = 742;\n"
html = f"""<!doctype html>
<meta charset="utf-8">
<title>Reel face caméra</title>
<style>html,body{{margin:0;background:#000}}canvas{{display:block}}</style>
<canvas id="c" width="1080" height="1920"></canvas>
<script>
/* Fichier généré par build_talk.py — modifier motion.html, procrast_scenes.js, talk_scenes.js ou talk_cuts.json. */
{lib}
{pro}
{data}
{(here / "talk_scenes.js").read_text()}
</script>
"""
(here / "talk.html").write_text(html); print("talk.html écrit,", len(caps), "groupes de sous-titres")
