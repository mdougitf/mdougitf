#!/usr/bin/env python3
"""Réduction d'écho de pièce sur une voix (mono) : WPE (prédiction linéaire de la réverbération)
puis suppression spectrale de la queue tardive (modèle de décroissance exponentielle, RT60 estimé).
  python3 dereverb.py entree.wav sortie.wav [rt60=0.5] [plancher_dB=-14] [surestimation=1.2]"""
import sys, wave
import numpy as np
from nara_wpe.wpe import wpe
from nara_wpe.utils import stft, istft

src, dst = sys.argv[1], sys.argv[2]
RT60 = float(sys.argv[3]) if len(sys.argv) > 3 else .5
FLOOR = 10 ** ((float(sys.argv[4]) if len(sys.argv) > 4 else -14) / 20)
OVER = float(sys.argv[5]) if len(sys.argv) > 5 else 1.2
w = wave.open(src); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype("float64") / 32768
SIZE, SHIFT = 1024, 256                                    # 21 ms / 5,3 ms à 48 kHz

# 1) WPE : enlève la réverbération prédite de 21 à ~180 ms après chaque son
Y = stft(x[None], size=SIZE, shift=SHIFT).transpose(2, 0, 1)   # (fréquences, canaux, trames)
Z = wpe(Y, taps=40, delay=3, iterations=3, statistics_mode="full").transpose(1, 2, 0)
y = istft(Z, size=SIZE, shift=SHIFT)[0][: len(x)]

# 2) queue tardive : PSD de réverbération = PSD passée (Td) × décroissance, gain de Wiener lissé, plancher
S = stft(y, size=SIZE, shift=SHIFT)                        # (trames, fréquences)
P = np.abs(S) ** 2
Ps = P.copy()
for t in range(1, len(P)): Ps[t] = .6 * Ps[t - 1] + .4 * P[t]          # lissage temporel
Td = int(round(.05 * sr / SHIFT)); delta = 3 * np.log(10) / RT60
late = np.zeros_like(P); late[Td:] = np.exp(-2 * delta * Td * SHIFT / sr) * Ps[:-Td]
G = np.maximum(1 - OVER * late / (Ps + 1e-12), FLOOR ** 2) ** .5
G = (np.pad(G, ((0, 0), (1, 1)), mode='edge')[:, :-2] + G + np.pad(G, ((0, 0), (1, 1)), mode='edge')[:, 2:]) / 3   # lissage en fréquence : moins d'artefacts
for t in range(1, len(G)): G[t] = np.maximum(G[t], .7 * G[t - 1] + .3 * G[t])    # pas de pompage brutal
out = istft(S * G, size=SIZE, shift=SHIFT)[: len(x)]
out = out / max(np.abs(out).max(), 1e-9) * .89
o = wave.open(dst, "wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes((out * 32767).astype("<i2").tobytes())
print("écrit", dst)
