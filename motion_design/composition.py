"""Composition : la « timeline » qui assemble les calques et produit la vidéo."""

import multiprocessing as mp
import os
import shutil
import subprocess
import sys
import time

import numpy as np
from PIL import Image

from .layers import color


class Composition:
    """Une vidéo : taille, cadence, durée, fond et pile de calques.

    ``background`` peut être une couleur ou une liste de 2 couleurs pour un
    dégradé vertical. ``ss`` est le facteur de suréchantillonnage
    (anti-aliasing) : 2 = rendu interne en double résolution.
    """

    def __init__(self, width=1280, height=720, fps=30, duration=5.0,
                 background="#000000", ss=2):
        self.width, self.height = int(width), int(height)
        self.fps = fps
        self.duration = float(duration)
        self.background = background
        self.ss = ss
        self.layers = []
        self._bg_cache = {}

    def add(self, *layers):
        self.layers.extend(layers)
        return layers[0] if len(layers) == 1 else layers

    @property
    def frame_count(self):
        return int(round(self.duration * self.fps))

    # ------------------------------------------------------------------ #

    def _background(self, ss):
        if ss not in self._bg_cache:
            W, H = self.width * ss, self.height * ss
            bg = self.background
            if isinstance(bg, (list, tuple)) and bg and not isinstance(bg[0], (int, float)):
                top, bottom = np.array(color(bg[0]), float), np.array(color(bg[-1]), float)
                ramp = np.linspace(0, 1, H)[:, None]
                rows = (top + (bottom - top) * ramp).astype(np.uint8)
                arr = np.repeat(rows[:, None, :], W, axis=1)
                img = Image.fromarray(arr, "RGBA")
            else:
                img = Image.new("RGBA", (W, H), color(bg))
            self._bg_cache[ss] = img
        return self._bg_cache[ss].copy()

    def render_frame(self, t, ss=None):
        """Renvoie l'image RGB de la vidéo au temps ``t`` (secondes)."""
        ss = self.ss if ss is None else ss
        canvas = self._background(ss)
        for layer in self.layers:
            layer.render_onto(canvas, t, ss)
        img = canvas.convert("RGB")
        if ss != 1:
            img = img.resize((self.width, self.height), Image.LANCZOS)
        return img

    def still(self, t, path):
        """Exporte une image fixe (PNG/JPG) au temps ``t``."""
        self.render_frame(t).save(path)
        return path

    # ------------------------------------------------------------------ #

    def _frames(self, workers):
        times = [i / self.fps for i in range(self.frame_count)]
        if workers > 1 and "fork" in mp.get_all_start_methods():
            global _WORKER_COMP
            _WORKER_COMP = self
            ctx = mp.get_context("fork")
            with ctx.Pool(workers) as pool:
                yield from pool.imap(_render_bytes, times, chunksize=4)
        else:
            for t in times:
                yield self.render_frame(t).tobytes()

    def render(self, path, workers=None, crf=18, quiet=False):
        """Rend la vidéo complète.

        Formats : ``.mp4`` / ``.mov`` / ``.webm`` (via ffmpeg), ``.gif``,
        ou un dossier (séquence PNG) si ``path`` se termine par ``/``.
        """
        workers = workers or max(1, (os.cpu_count() or 1))
        ext = os.path.splitext(path)[1].lower()
        n = self.frame_count
        start = time.time()

        tty = sys.stderr.isatty()

        def progress(i):
            # Hors terminal, on n'affiche que tous les 10 %.
            if quiet or (not tty and (i + 1) % max(1, n // 10) and i + 1 != n):
                return
            done = (i + 1) / n
            bar = "█" * int(done * 30)
            fps = (i + 1) / max(1e-6, time.time() - start)
            sys.stderr.write(f"{chr(13) if tty else ''}  [{bar:<30}] {i + 1}/{n} images · {fps:.1f} img/s")
            if i + 1 == n or not tty:
                sys.stderr.write("\n")
            sys.stderr.flush()

        if path.endswith(("/", os.sep)) or ext == "":
            os.makedirs(path, exist_ok=True)
            for i, raw in enumerate(self._frames(workers)):
                Image.frombytes("RGB", (self.width, self.height), raw).save(
                    os.path.join(path, f"frame_{i:05d}.png"))
                progress(i)
            return path

        if ext == ".gif" or not shutil.which("ffmpeg"):
            if ext != ".gif":
                gif = os.path.splitext(path)[0] + ".gif"
                print(f"ffmpeg introuvable : export en GIF -> {gif}", file=sys.stderr)
                path = gif
            frames = []
            for i, raw in enumerate(self._frames(workers)):
                frames.append(Image.frombytes("RGB", (self.width, self.height), raw))
                progress(i)
            frames[0].save(path, save_all=True, append_images=frames[1:],
                           duration=int(1000 / self.fps), loop=0, optimize=True)
            return path

        codec = ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", str(crf + 12)] if ext == ".webm" \
            else ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
                  "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
        cmd = ["ffmpeg", "-y", "-loglevel", "error",
               "-f", "rawvideo", "-pix_fmt", "rgb24",
               "-s", f"{self.width}x{self.height}", "-r", str(self.fps),
               "-i", "-", *codec, path]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        try:
            for i, raw in enumerate(self._frames(workers)):
                proc.stdin.write(raw)
                progress(i)
        finally:
            proc.stdin.close()
            proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg a échoué (code {proc.returncode})")
        return path


_WORKER_COMP = None


def _render_bytes(t):
    return _WORKER_COMP.render_frame(t).tobytes()
