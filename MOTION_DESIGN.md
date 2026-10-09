# 🎬 motion_design — programme de motion design vidéo en Python

Un mini moteur d'animation (façon After Effects, mais en code) qui génère des
vidéos **MP4 / WebM / GIF** à partir de calques animés par keyframes.

![Aperçu](examples/titre.gif)

## Installation

```bash
pip install -r requirements.txt   # Pillow + numpy
# ffmpeg est recommandé pour l'export MP4 (sinon export GIF automatique)
```

## Démarrage rapide

```bash
python -m motion_design demo -o intro.mp4                  # vidéo de démo (15 s)
python -m motion_design render examples/titre.json -o titre.mp4
python -m motion_design render examples/titre.json -o titre.gif --draft --fps 15
python -m motion_design still demo -t 6 -o apercu.png      # image fixe à t = 6 s
python -m motion_design easings                            # liste des courbes
```

| Option      | Rôle                                                  |
|-------------|-------------------------------------------------------|
| `-o`        | sortie : `.mp4`, `.webm`, `.gif` ou `dossier/` (PNG)  |
| `--draft`   | aperçu rapide sans anti-aliasing                      |
| `--fps`     | force la cadence d'images                             |
| `-j`        | nombre de processus de rendu (par défaut : tous les cœurs) |

## En Python

```python
from motion_design import Composition, Text, Arc, Rect

comp = Composition(1280, 720, fps=30, duration=4,
                   background=["#0f172a", "#312e81"])   # dégradé vertical

anneau = comp.add(Arc(640, 330, r=150, width=10, color="#22d3ee", sweep=0))
anneau.animate("sweep", (0.2, 0), (1.4, 360, "out_cubic"))   # effet « trim path »

titre = comp.add(Text(640, 560, text="BONJOUR", size=80, tracking=8, reveal=0))
titre.animate("reveal", (1.0, 0), (1.8, 1, "linear"))       # machine à écrire
titre.slide_out(3.4, 0.5)

carte = comp.add(Rect(640, 330, w=120, h=120, radius=24, fill="#f472b6"))
carte.pop_in(0.6).spin(0.6, 3.0, turns=1).pop_out(3.4)

comp.render("bonjour.mp4")
```

### Calques disponibles

| Calque      | Propriétés animables                                        |
|-------------|-------------------------------------------------------------|
| `Rect`      | `w`, `h`, `radius`, `fill`, `stroke`, `stroke_width`         |
| `Ellipse` / `Circle` | `w`, `h` (ou `r=`), `fill`, `stroke`, `stroke_width` |
| `Arc`       | `r`, `width`, `color`, `start_angle`, `sweep` (0 → 360)       |
| `Line`      | `length`, `width`, `color`, `progress` (0 → 1)               |
| `Polygon`   | `r`, `sides`, `inner` (< 1 = étoile), `fill`                 |
| `Text`      | `text`, `size`, `font`, `fill`, `tracking`, `reveal` (0 → 1) |
| `Particles` | `count`, `size`, `color`, `speed`, `seed`                    |

Propriétés communes : `x`, `y`, `scale`, `rotation` (degrés, sens horaire),
`opacity`, plus `start` / `end` (visibilité) et `anchor`
(`center`, `left`, `bottom`, `top-left`…).

Les couleurs s'écrivent `"#rrggbb"`, `"#rrggbbaa"` ou `(r, g, b[, a])` et
s'interpolent comme les autres valeurs.

### Animer

```python
calque.animate("propriété", (temps, valeur), (temps, valeur, "easing"), ...)
```

L'easing d'un keyframe s'applique au segment qui **mène** à ce keyframe.
Courbes : `linear`, `in/out/in_out_quad`, `cubic`, `quart`, `expo`, `sine`,
`out_back`, `in_back`, `out_elastic`, `out_bounce`, `step`.

Effets prêts à l'emploi (chaînables) : `fade_in`, `fade_out`, `slide_in`,
`slide_out`, `pop_in`, `pop_out`, `spin`.

## En JSON (sans coder)

Voir [`examples/titre.json`](examples/titre.json) :

```json
{
  "type": "text", "x": 640, "y": 560, "text": "MON TITRE", "size": 80, "reveal": 0,
  "animate": { "reveal": [[1.2, 0], [2.0, 1, "linear"]] },
  "effects": [["slide_out", 4.2, 0.5, { "dy": 40 }]]
}
```

## La vidéo de démo

[`motion_design/demo.py`](motion_design/demo.py) → [`examples/demo.mp4`](examples/demo.mp4)

1. **0–4 s** : logo, anneau qui se dessine, titre « SIR MODOU » en machine à écrire
2. **4–9 s** : « Mes passions », 4 cartes qui arrivent en cascade
3. **9–12,5 s** : graphique en barres animé
4. **12,5–15 s** : transition en cercle, « Merci ! »

## Tests

```bash
python -m unittest discover tests
```
