#!/usr/bin/env python3
"""Mesure de l'écho : énergie 60–300 ms après chaque fin de mot, relative à la voix juste avant (dB, plus bas = moins d'écho)."""
import sys, wave, numpy as np
def load(p):
    w = wave.open(p); return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype("float64") / 32768, w.getframerate()
for p in sys.argv[1:]:
    x, sr = load(p); hop = sr // 100
    db = 20 * np.log10(np.array([np.sqrt(np.mean(x[i:i + 2 * hop] ** 2) + 1e-12) for i in range(0, len(x) - 2 * hop, hop)]) + 1e-12)
    thr = np.percentile(db, 75) - 12; sp = db > thr; r = []
    for i in range(20, len(sp) - 32):
        if sp[i - 1] and not sp[i] and not sp[i + 6:i + 30].any() and sp[i - 15:i].all():
            r.append(np.mean(db[i + 6:i + 30]) - np.mean(db[i - 15:i]))
    print(f"{p.split('/')[-1]:28s} écho après les mots : {np.mean(r):6.1f} dB  ({len(r)} fins de phrase mesurées)")
