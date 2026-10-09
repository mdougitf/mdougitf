"""Interface en ligne de commande.

    python -m motion_design demo -o intro.mp4
    python -m motion_design render examples/titre.json -o titre.mp4
    python -m motion_design still examples/titre.json -t 1.5 -o apercu.png
    python -m motion_design easings
"""

import argparse
import sys

from . import demo, easing, loader


def main(argv=None):
    ap = argparse.ArgumentParser(prog="motion_design",
                                 description="Mini moteur de motion design vidéo.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    for name, help_ in [("render", "rend une vidéo depuis un fichier JSON"),
                        ("demo", "rend la vidéo de démonstration")]:
        p = sub.add_parser(name, help=help_)
        if name == "render":
            p.add_argument("source", help="fichier JSON de la composition")
        p.add_argument("-o", "--output", default="output.mp4",
                       help="fichier de sortie (.mp4, .webm, .gif, ou dossier/ pour des PNG)")
        p.add_argument("--fps", type=int, help="forcer la cadence d'images")
        p.add_argument("--draft", action="store_true", help="aperçu rapide sans anti-aliasing")
        p.add_argument("-j", "--workers", type=int, help="nombre de processus de rendu")

    p = sub.add_parser("still", help="exporte une image fixe à un instant donné")
    p.add_argument("source", help="fichier JSON, ou 'demo'")
    p.add_argument("-t", "--time", type=float, default=0.0, help="instant en secondes")
    p.add_argument("-o", "--output", default="still.png")

    sub.add_parser("easings", help="liste les courbes d'easing disponibles")

    args = ap.parse_args(argv)

    if args.cmd == "easings":
        print("\n".join(sorted(easing.EASINGS)))
        return 0

    if args.cmd == "demo":
        args.source = "demo"
    if args.cmd == "still":
        comp = demo.build() if args.source == "demo" else loader.load(args.source)
        comp.still(args.time, args.output)
        print(f"Image exportée : {args.output}")
        return 0

    comp = demo.build() if args.source == "demo" else loader.load(args.source)
    if args.fps:
        comp.fps = args.fps
    if args.draft:
        comp.ss = 1
    print(f"Rendu {comp.width}x{comp.height} · {comp.fps} img/s · {comp.duration:g} s "
          f"({comp.frame_count} images)", file=sys.stderr)
    out = comp.render(args.output, workers=args.workers)
    print(f"Vidéo exportée : {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
