#!/usr/bin/env python3
"""Assemble une page de montage « face plein écran ».

  python3 build_edit.py <travail>/timeline.json <montage.json> <plan.js> <sortie.html>

montage.json : {"clips":[{"dir":"clip0","n":742,"fps":30,"layout":"full|drop","focus":[.5,.4],"max":23.85}],
                "zooms":[1,1.14,...],            # recadrage de chaque segment (cycle)
                "captions":["petite ligne|MOT FORT|petite ligne", ...]}   # texte exact, dans l'ordre de la voix
Les mots des sous-titres sont alignés sur la transcription mot à mot de la voix montée."""
import difflib, json, sys, unicodedata
from pathlib import Path
here = Path(__file__).parent
tl = json.loads(Path(sys.argv[1]).read_text()); job = json.loads(Path(sys.argv[2]).read_text()); plan = Path(sys.argv[3]).read_text()

def norm(w):
    w = unicodedata.normalize("NFD", w.lower()); return "".join(c for c in w if c.isalnum())
# 1) mots du script -> instants (alignement sur la transcription, interpolation pour les mots non reconnus)
script = []                                                   # [mot, groupe, étage]
for gi, g in enumerate(job["captions"]):
    for li, part in enumerate((g.split("|") + ["", ""])[:3]):
        script += [[w, gi, li] for w in part.split()]
heard = [(norm(p), w[0], w[1]) for w in tl["words"] for p in w[2].replace("'", "' ").replace("-", "- ").split() if norm(p)]
a = [norm(p) for w, _, _ in script for p in [w]]
# les mots composés du script sont comparés sur leur début
sm = difflib.SequenceMatcher(None, [x[:5] for x in a], [h[0][:5] for h in heard], autojunk=False)
times = [None] * len(script)
for blk in sm.get_matching_blocks():
    for k in range(blk.size): times[blk.a + k] = heard[blk.b + k][1]
known = [(i, t) for i, t in enumerate(times) if t is not None]
for i in range(len(times)):
    if times[i] is None:
        prev = max([k for k in known if k[0] < i], default=(-1, 0.0), key=lambda k: k[0]); nxt = min([k for k in known if k[0] > i], default=(len(times), tl["dur"]), key=lambda k: k[0])
        times[i] = round(prev[1] + (nxt[1] - prev[1]) * (i - prev[0]) / (nxt[0] - prev[0]), 3)
for i in range(1, len(times)): times[i] = max(times[i], times[i - 1])
caps = []
for gi in range(len(job["captions"])):
    ws = [(s, t) for s, t in zip(script, times) if s[1] == gi]
    if not ws: continue
    caps.append({"t0": ws[0][1], "t1": None, **{k: [[s[0].upper(), t] for s, t in ws if s[2] == li] for li, k in enumerate(("top", "key", "bot"))}})
for i, c in enumerate(caps): c["t1"] = caps[i + 1]["t0"] if i + 1 < len(caps) else tl["dur"]
ends = [w[1] for w in tl["words"]]
for c in caps:                                                # un groupe ne traîne pas plus de 0,5 s après son dernier mot
    last = max(t for k in ("top", "key", "bot") for _, t in c[k]); end = min([e for e in ends if e > last], default=last + .4); c["t1"] = min(c["t1"], end + .5)
zooms = job.get("zooms", [1, 1.14, 1, 1.22, 1.07])
segs = [{**s, "z": zooms[i % len(zooms)]} for i, s in enumerate(tl["segs"])]

src = (here / "motion.html").read_text()
lib = src[src.index("const Q = new URLSearchParams"):src.index("// ---------- maquettes du dashboard")].replace("DUR = 42;", f"DUR = {tl['dur']};")
pro = (here / "procrast_scenes.js").read_text(); pro = pro[:pro.index("// ---------- scènes ----------")]
data = (f"const CAPY = {job['capY']};\n" if 'capY' in job else "") + f"const WORDS = {json.dumps([[w[0], norm(w[2])] for w in tl['words']], ensure_ascii=False)};\n" + f"const CLIPS = {json.dumps(job['clips'])};\nconst SEGS = {json.dumps(segs)};\nconst CAPS = {json.dumps(caps, ensure_ascii=False)};\n"
Path(sys.argv[4]).write_text(f"""<!doctype html>
<meta charset="utf-8">
<title>Montage face plein écran</title>
<style>html,body{{margin:0;background:#000}}canvas{{display:block}}</style>
<canvas id="c" width="1080" height="1920"></canvas>
<script>
/* Fichier généré par build_edit.py — ne pas modifier à la main. */
{lib}
{pro}
{data}
{plan}
{(here / "edit_engine.js").read_text()}
</script>
""")
print(len(caps), "groupes de sous-titres ;", sum(t is not None for t in times), "mots calés /", len(times))
for c in caps: print(f"{c['t0']:6.2f}-{c['t1']:6.2f}", " ".join(w for w, _ in c['top']), "|", " ".join(w for w, _ in c['key']), "|", " ".join(w for w, _ in c['bot']))
