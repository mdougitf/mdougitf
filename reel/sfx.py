#!/usr/bin/env python3
"""Effets sonores synthétisés à partir des évènements du montage (sfx_events.json) -> sfx.wav"""
import json, sys, wave
import numpy as np
SR, DUR = 44100, float(sys.argv[3]) if len(sys.argv) > 3 else 42.0
rng = np.random.default_rng(3)
mix = np.zeros((int(SR * (DUR + 1)), 2))

def band(n, lo, hi):                       # bruit filtré passe-bande
    x = rng.standard_normal(n); f = np.fft.rfft(x); fr = np.fft.rfftfreq(n, 1 / SR)
    f[(fr < lo) | (fr > hi)] = 0; y = np.fft.irfft(f, n); return y / (np.abs(y).max() + 1e-9)
def add(t, y, amp=1.0, pan=0.0):
    i = int(max(t, 0) * SR); y = y[: len(mix) - i] * amp
    mix[i:i + len(y), 0] += y * (1 - max(pan, 0)); mix[i:i + len(y), 1] += y * (1 + min(pan, 0))
def tt(d): return np.arange(int(d * SR)) / SR
def sweep(f0, f1, d, k=1.0):               # sinus à fréquence glissante
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t / (d * .25 * k)); return np.sin(2 * np.pi * np.cumsum(f) / SR), t

def click(t, a=1):  y = band(int(.02 * SR), 1800, 7000) * np.exp(-tt(.02) / .0035); add(t, y, .09 * a * rng.uniform(.6, 1), rng.uniform(-.25, .25))
def pop(t):         y, x = sweep(620, 300, .09); add(t, y * np.exp(-x / .025), .16)
def word(t):        y, x = sweep(240, 120, .12); add(t, y * np.exp(-x / .03) + .4 * band(len(x), 1500, 5000) * np.exp(-x / .006), .22)
def thump(t):       y, x = sweep(110, 42, .35); add(t, y * np.exp(-x / .09), .5)
def whoosh(t, d=.4, a=.2):                  # se termine sur t
    x = tt(d); env = (x / d) ** 2.2; y = band(len(x), 250, 3500) * env
    tail = band(int(.1 * SR), 250, 2500) * np.exp(-tt(.1) / .03); add(t - d, np.concatenate([y, tail]), a, 0)
def boom(t):
    y, x = sweep(95, 34, .9); add(t, y * np.exp(-x / .22), .9)
    add(t, band(int(.25 * SR), 80, 1200) * np.exp(-tt(.25) / .04), .45); whoosh(t, .5, .28)
def swish(t):       x = tt(.2); add(t, band(len(x), 900, 6000) * np.hanning(len(x)), .1, rng.uniform(-.4, .4))
def chime(t, f=1318.5):
    x = tt(.7); y = (np.sin(2 * np.pi * f * x) + .45 * np.sin(2 * np.pi * f * 1.498 * x) + .2 * np.sin(2 * np.pi * f * 2 * x)) * np.exp(-x / .16); add(t, y, .1)
def scratch(t):     x = tt(.32); add(t, band(len(x), 1200, 8000) * np.hanning(len(x)) * (.6 + .4 * np.sin(2 * np.pi * 45 * x)), .2)
def tick(t):        y = band(int(.03 * SR), 3000, 9000) * np.exp(-tt(.03) / .004); add(t, y, .12)
def ding(t):
    x = tt(1.2); y = (np.sin(2 * np.pi * 1568 * x) + .6 * np.sin(2 * np.pi * 2093 * x) + .25 * np.sin(2 * np.pi * 3136 * x)) * np.exp(-x / .35); add(t, y, .14)
def step(t):        y, x = sweep(140, 70, .07); add(t, y * np.exp(-x / .02) + .3 * band(len(x), 200, 1200) * np.exp(-x / .01), .1, rng.uniform(-.3, .3))
def poof(t):        x = tt(.35); add(t, band(len(x), 300, 3500) * np.exp(-x / .08) * (1 - np.exp(-x / .01)), .3)
def beep(t):
    for k, f in enumerate((740, 587)):
        x = tt(.09); add(t + k * .16, np.sign(np.sin(2 * np.pi * f * x)) * np.hanning(len(x)), .035)

ev = json.load(open(sys.argv[1]))
for k, t, x in ev:
    if k == 'type':
        n, cps = x.split('|'); [click(t + i / float(cps)) for i in range(int(n))]
    elif k == 'cut': whoosh(t, .3, .16); thump(t)
    elif k == 'icon': swish(t); chime(t + .15, 1760)
    else: {'word': word, 'pop': pop, 'boom': boom, 'scratch': scratch, 'chime': chime, 'beep': beep, 'whoosh': whoosh,
     'tick': tick, 'ding': ding, 'step': step, 'poof': poof}[k](t)
mix = mix[: int(SR * DUR)]
mix = np.tanh(mix * 1.1) * .82              # limiteur doux
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print(len(ev), 'évènements, crête', float(np.abs(mix).max()))
