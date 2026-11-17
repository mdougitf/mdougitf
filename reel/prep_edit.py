#!/usr/bin/env python3
"""Préparation d'un montage « face plein écran » à partir de prises brutes.

  python3 prep_edit.py propose  <travail> <modele> prise1.mp4 [prise2.mp4 ...]
      -> transcrit chaque prise mot à mot et propose une liste de coupes (blancs resserrés, tics signalés)
  python3 prep_edit.py finalize <travail> <modele>
      -> à partir de <travail>/cuts.json validé : voix montée (voice.wav), repères des segments, mots recalés
  python3 prep_edit.py frames   <travail> prise1.mp4:full|drop[:x_recadrage] ...
      -> images de chaque prise, prêtes pour le rendu (full = plein écran vertical, drop = prise horizontale)
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

FILLERS = {"euh", "heu", "hum", "bah", "ben", "hein", "genre", "voilà", "bref"}
FILLER_PAIRS = {("du", "coup"), ("en", "fait"), ("tu", "vois")}
norm = lambda w: "".join(c for c in w.lower() if c.isalnum() or c in "'-").strip("'-")

def wav16(src, dst, sr=16000):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", str(sr), str(dst)], check=True)
def read(p):
    w = wave.open(str(p)); return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype("float32") / 32768, w.getframerate()
def words_of(model, audio):
    segs, _ = model.transcribe(audio, language="fr", word_timestamps=True, beam_size=5, condition_on_previous_text=False,
                               initial_prompt="Euh, ben, du coup, en fait, voilà, genre, hum.")
    return [[round(w.start, 2), round(w.end, 2), w.word.strip()] for s in segs for w in s.words]
def islands(a, sr):
    hop = sr // 100; rms = np.array([np.sqrt(np.mean(a[i:i + 2 * hop] ** 2) + 1e-12) for i in range(0, len(a) - 2 * hop, hop)])
    db = 20 * np.log10(rms + 1e-9); thr = max(np.percentile(db, 5) + 20, np.percentile(db, 90) - 20)
    out, i = [], 0
    while i < len(db):
        if db[i] > thr:
            j = i
            while j < len(db) and db[j] > thr: j += 1
            if out and i / 100 - out[-1][1] < .06: out[-1][1] = j / 100
            else: out.append([i / 100, j / 100])
            i = j
        else: i += 1
    return [o for o in out if o[1] - o[0] > .07]

def propose(work, model_dir, clips):
    from faster_whisper import WhisperModel
    m = WhisperModel(model_dir, device="cpu", compute_type="int8"); work.mkdir(parents=True, exist_ok=True); cuts = []
    for ci, clip in enumerate(clips):
        wav16(clip, work / f"c{ci}.wav"); a, sr = read(work / f"c{ci}.wav"); ws = words_of(m, a)
        json.dump(ws, open(work / f"words_c{ci}.json", "w"), ensure_ascii=False)
        for s, e in islands(a, sr):
            inside = [w for w in ws if s - .15 <= (w[0] + w[1]) / 2 <= e + .15]; toks = [norm(w[2]) for w in inside]
            tic = any(t in FILLERS for t in toks) or any((x, y) in FILLER_PAIRS for x, y in zip(toks, toks[1:]))
            cuts.append({"clip": ci, "s": round(s, 2), "e": round(e, 2), "gap": .14, "keep": True, "tic": tic, "text": " ".join(w[2] for w in inside)})
    json.dump({"clips": [str(c) for c in clips], "cuts": cuts}, open(work / "cuts.json", "w"), ensure_ascii=False, indent=1)
    for c in cuts: print(("TIC " if c["tic"] else "    ") + f"[{c['clip']}] {c['s']:6.2f}-{c['e']:6.2f}  {c['text']}")

def finalize(work, model_dir):
    from faster_whisper import WhisperModel
    job = json.load(open(work / "cuts.json")); SR = 48000; audio = {}
    for ci, clip in enumerate(job["clips"]):
        wav16(clip, work / f"c{ci}_48.wav", SR); audio[ci] = read(work / f"c{ci}_48.wav")[0]
    out, t, segs = [np.zeros(int(.2 * SR), "float32")], .2, []
    for c in [c for c in job["cuts"] if c.get("keep", True)]:
        s0, e0 = max(0, c["s"] - c.get("pre", .035)), c["e"] + c.get("post", .07); x = audio[c["clip"]][int(s0 * SR):int(e0 * SR)].copy(); f = int(.012 * SR)
        if c.get("fadeIn", True): x[:f] *= np.linspace(0, 1, f)          # raccord continu entre deux tranches : pas de fondu
        if c.get("fadeOut", True): x[-f:] *= np.linspace(1, 0, f)
        segs.append({"clip": c["clip"], "src": [round(s0, 3), round(e0, 3)], "out": [round(t, 3), round(t + len(x) / SR, 3)], **({"z": c["z"]} if "z" in c else {})})
        out += [x, np.zeros(int(c.get("gap", .14) * SR), "float32")]; t += len(x) / SR + c.get("gap", .14)
    y = np.concatenate(out + [np.zeros(int(1.2 * SR), "float32")]); y = y / np.abs(y).max() * .89
    w = wave.open(str(work / "voice.wav"), "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype("<i2").tobytes())
    wav16(work / "voice.wav", work / "voice16.wav"); m = WhisperModel(model_dir, device="cpu", compute_type="int8")
    ws = words_of(m, read(work / "voice16.wav")[0])
    json.dump({"dur": round(len(y) / SR, 3), "segs": segs, "words": ws}, open(work / "timeline.json", "w"), ensure_ascii=False, indent=1)
    print("durée", round(len(y) / SR, 2), "s —", " ".join(w[2] for w in ws))

def frames(work, specs):
    for ci, spec in enumerate(specs):
        parts = spec.split(":"); clip, layout = parts[0], parts[1] if len(parts) > 1 else "full"; d = work / f"clip{ci}"; d.mkdir(parents=True, exist_ok=True)
        if layout == "drop":   # prise horizontale : on garde une bande 3:4 autour du visage
            x = parts[2] if len(parts) > 2 else "(iw-ih*3/4)/2"; vf = f"fps=30,crop=ih*3/4:ih:{x}:0,scale=1080:1440:flags=lanczos,unsharp=5:5:0.5"
        else: vf = "fps=30,scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip, "-vf", vf, "-q:v", "3", str(d / "f_%05d.jpg")], check=True)
        print(d, len(list(d.glob("*.jpg"))), "images")

if __name__ == "__main__":
    cmd, work = sys.argv[1], Path(sys.argv[2])
    if cmd == "propose": propose(work, sys.argv[3], sys.argv[4:])
    elif cmd == "finalize": finalize(work, sys.argv[3])
    elif cmd == "frames": frames(work, sys.argv[3:])
