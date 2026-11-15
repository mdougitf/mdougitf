/* Reel 3 « face caméra + illustrations » — ta vidéo dans une carte, coupée des tics de langage,
   et une illustration plein écran toutes les ~3-4 s pendant que ta voix continue.
   Assemblé par build_talk.py (outils de motion.html + mini-personnages de procrast_scenes.js + données talk_cuts.json). */

// ---------- ta vidéo ----------
const fcache = new Map(); let fmiss = [];
const segIndex = t => { let i = 0; SEGS.forEach((g, k) => { if (t >= g.out[0]) i = k; }); return i; };
const SRC_MAX = 23.85;                                       // après, tu te penches pour couper : on fige sur le dernier sourire net
const srcTime = t => { const g = SEGS[segIndex(t)]; return Math.min(SRC_MAX, g.src[0] + (t - g.out[0])); };       // temps de sortie -> temps dans la vidéo d'origine
function faceImg(t) { const i = clamp(Math.round(srcTime(t) * 30) + 1, 1, NFACE); if (fcache.has(i)) return fcache.get(i); fmiss.push(i); return null; }
async function loadFaces() {
  await Promise.all([...new Set(fmiss)].map(async i => { const im = new Image(); im.src = `${FR}/f_${String(i).padStart(5, '0')}.jpg`; await im.decode(); fcache.set(i, im); }));
  while (fcache.size > 20) fcache.delete(fcache.keys().next().value);
}
function faceCard(t0) {
  const x = 90, y = 540, w = 900, h = 675, e = eo(p(t0, .3)), img = faceImg(T);
  ctx.save(); ctx.globalAlpha *= Math.min(1, e * 1.6); ctx.translate(x + w / 2, y + h / 2 + (1 - e) * 60); const sc = lerp(.96, 1, e); ctx.scale(sc, sc);
  ctx.shadowColor = `rgba(${PAL.Br},.45)`; ctx.shadowBlur = 70; ctx.fillStyle = DARK; rr(-w / 2, -h / 2, w, h, 28); ctx.fill(); ctx.shadowBlur = 0;
  ctx.save(); rr(-w / 2, -h / 2, w, h, 28); ctx.clip();
  if (img) { const z = (segIndex(T) % 2 ? 1.09 : 1) * (1 + .012 * (T - t0)), dw = w * z, dh = h * z; ctx.drawImage(img, -w / 2 - (dw - w) * .54, -h / 2 - (dh - h) * .42, dw, dh); }
  ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = WHITE; rr(-w / 2, -h / 2, w, h, 28); ctx.stroke();
  sparkle(w / 2 - 6, -h / 2 + 4, 46 * (1 + .18 * Math.sin(T * 5)), T * .4, .95);
  ctx.restore();
}

// ---------- sous-titres calés sur la voix ----------
function captions() {
  ctx.save(); ctx.font = `700 30px ${FM}`; ctx.textAlign = 'center'; ctx.fillStyle = BLUE; ctx.fillText('pourquoi tu procrastines ?', 540, 286);
  ctx.fillRect(540 - 40, 304, 80, 3); ctx.restore();
  const c = CAPS.find(c => T >= c[0] && T < c[1]); if (!c) return;
  let size = 100; ctx.font = `800 ${size}px ${FF}`;
  const full = ctx.measureText(c[2].map(w => w[0]).join(' ')).width; if (full > 930) size *= 930 / full;
  ctx.font = `800 ${size}px ${FF}`; ctx.textBaseline = 'alphabetic';
  const tot = ctx.measureText(c[2].map(w => w[0]).join(' ')).width, sp = ctx.measureText(' ').width; let x = 540 - tot / 2, bx0 = null, bx1 = null;
  for (const [txt, blue, t] of c[2]) {
    const ww = ctx.measureText(txt).width;
    if (T >= t) { ctx.save(); ctx.globalAlpha = p(t, .07); ctx.fillStyle = blue ? BLUE : WHITE; ctx.fillText(txt, x, 430 + (1 - eo(p(t, .2))) * size * .14); ctx.restore(); if (blue) { bx0 = bx0 ?? x; bx1 = x + ww; } }
    x += ww + sp;
  }
  const bt = c[2].filter(w => w[1]).map(w => w[2]); if (bx0 !== null) brush(bx0, 430 + size * .2, bx1, 14, p(bt[bt.length - 1] + .12, .2), WHITE, 2);
}

// ---------- illustrations ----------
function illuA() {                                           // 2,97–5,9 s · l'effort cogne contre la zone de confort, le mini toi s'enfuit
  const cx = 540, cy = 1250, R = 330, menace = T >= 4.0 && T < 4.55;
  ctx.save(); ctx.setLineDash([16, 14]); ctx.lineDashOffset = T * 30; ctx.lineWidth = menace ? 6 : 4;
  ctx.strokeStyle = T >= 4.0 && Math.floor(T * 7) % 2 ? BLUE : `rgba(${PAL.Wr},.45)`;
  ctx.beginPath(); ctx.arc(cx, cy, R * lerp(.6, 1, eo(p(2.97, .4))), 0, 7); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.font = `700 32px ${FM}`; ctx.textAlign = 'center'; ctx.fillStyle = MUTED; ctx.fillText('zone de confort', cx, cy - R - 24); ctx.restore();
  floorLine(1452, .7); armchair(cx, 1360); floatIcon('brain', 540, 1050, 10, 3.0, 2);
  if (T < 4.55) person(cx - 6, 1352, { k: 1.25, pose: T < 4.0 ? 'sit' : 'sitScared', expr: T < 4.0 ? 'happy' : 'scared' });
  else { person(lerp(cx, -240, eo((T - 4.55) / 1.35) * .3 + (T - 4.55) / 1.35 * .7), 1452, { k: 1.25, pose: 'run', f: -1, expr: 'scared' }); sfx('pop', 4.55); steps(4.55, 5.8, .24); }
  [['réviser', -.75, 3.12], ['coder', -.05, 3.4], ['bosser', .65, 3.68]].forEach(([txt, ang, t0], i) => {
    if (T < t0) return; sfx('pop', t0);
    const tx = cx + Math.cos(ang) * (R + 40), ty = cy + Math.sin(ang) * (R + 40), e = ex(p(t0, .4)), sh = T >= 4.0 ? 5 * Math.sin(T * 50 + i) : 0;
    task(lerp(W + 260, tx, e) + sh, ty, txt, 1, .06 * Math.sin(T * 2 + i));
    if (T >= 4.0) icon('alert', tx + 90, ty - 52, 5, { scale: eo(p(4.0 + i * .1, .2)) });
  });
}
const DX = 330, DS = 1640, DK = 1.5;
function illuB() {                                           // 9,5–13,7 s · « juste 5 minutes » : il s'installe et lance le chrono
  const fl = deskScene(DX, DS, DK, T >= 10.5 ? 1 : .3);
  if (T < 10.5) { person(lerp(-180, DX, (T - 9.5) / 1.0), fl, { k: DK, pose: 'walk' }); steps(9.5, 10.5, .39); }
  else person(DX, DS, { k: DK, pose: T < 12.585 ? 'sit' : 'type', expr: T < 12.585 ? 'neutral' : 'focus' });
  const show = eo(p(9.7, .35)); sfx('tick', 9.7); sfx('chime', 10.7); sfx('chime', 12.1);
  const punch = 1 + .1 * (1 - eo(p(10.7, .35))) * (T >= 10.7) + .1 * (1 - eo(p(12.1, .35))) * (T >= 12.1);
  if (T < 12.585) ring(540, 900, 210, eo(p(9.7, .6)), '05:00', { scale: lerp(.7, 1, show) * punch, alpha: show, txtColor: T >= 10.7 ? BLUE : WHITE, sub: 'juste 5 minutes.' });
  else { const left = 300 - (T - 12.585) * 70; ring(540, 900, 210, left / 300, mmss(left), { sub: "c'est parti." }); for (let t = 12.6; t < 13.7; t += .25) sfx('tick', t); }
}
function illuC() {                                           // 16,95–20,35 s · 5 minutes… et après, boum, tu continues
  deskScene(DX, DS, DK, 1);
  const cheer = T >= 19.75;
  const hd = cheer ? person(DX - 120, DS + 44 * DK, { k: DK, pose: 'cheer', expr: 'happy' }) : person(DX, DS, { k: DK, pose: 'type', expr: T >= 18.68 ? 'happy' : 'focus' });
  sfx('chime', 17.35);
  if (T < 17.96) ring(540, 900, 210, 1, '05:00', { txtColor: BLUE, sub: 'juste 5 minutes.', scale: 1 + .1 * (1 - eo(p(17.35, .35))) * (T >= 17.35) });
  else if (T < 18.68) { const left = lerp(300, 0, (T - 17.96) / .66); ring(540, 900, 210, left / 300, mmss(left), { sub: 'et après…' }); for (let t = 17.96; t < 18.62; t += .08) sfx('tick', t); }
  else {
    flash(18.68, .22); sfx('boom', 18.68);
    ring(540, 900, 210, ((T - 18.68) * .7) % 1, '+' + mmss((T - 18.68) * 400), { txtColor: BLUE, sub: 'tu continues.', scale: 1 + .14 * (1 - eo(p(18.68, .4))) });
    [18.9, 19.15, 19.4].forEach((t, i) => { icon('check', 560 + i * 120, 1330 - 40 * eo(p(t, .4)), 9, { scale: eo(p(t, .25)) }); sfx('pop', t); });
    if (cheer) { sparkle(820, 1280, 60 * eo(p(19.75, .3)) * (1 + .15 * Math.sin(T * 7)), T * .6); sfx('chime', 19.75); }
  }
}
function faceExtras(t0) {                                    // sous la carte : une icône qui dit la même chose que toi
  if (t0 < 1) iconBlock('brain', 540, 1440, 16, .7, 1);
  else if (t0 < 7) iconBlock('pad', 540, 1440, 15, 6.5, -1);
  else if (t0 < 15) { iconBlock(battery(lerp(.1, 1, eo(p(14.3, 1.6)))), 540, 1440, 15, 13.95, 1); if (T >= 16.2) { icon('check', 800, 1440, 9, { scale: eo(p(16.2, .25)) }); sfx('pop', 16.2); } }
  else {                                                     // appel à l'action
    for (let k = 0; k < 3; k++) { const ph = ((T - 20.6) * 1.1 + k / 3) % 1; if (T < 20.6) break;
      ctx.save(); ctx.globalAlpha = (1 - ph) * .45; ctx.strokeStyle = BLUE; ctx.lineWidth = 4; const s = 1 + ph * .3; rr(540 - 330 * s, 1400 - 75 * s, 660 * s, 150 * s, 75 * s); ctx.stroke(); ctx.restore(); }
    pill(540, 1400, '+ abonne-toi', true, eo(p(20.6, .3)), 70); sfx('chime', 20.6);
    ctx.save(); ctx.globalAlpha = p(21.0, .3); ctx.font = `700 36px ${FM}`; ctx.textAlign = 'center'; ctx.fillStyle = MUTED; ctx.fillText(HANDLE, 540, 1530); ctx.restore();
    floorLine(1790);
    [[130, -1, 20.6, BLUE], [330, -1, 20.8, WHITE], [540, 1, 20.7, BLUE], [750, 1, 20.9, MID], [950, 1, 20.65, WHITE]].forEach(([x, side, a, col], i) => {
      if (T < a) return; const e = clamp((T - a) / .8), arrived = e >= 1;
      person(lerp(side < 0 ? -120 : W + 120, x, e), 1790, { k: .95, f: arrived ? (x < 540 ? 1 : -1) : (side < 0 ? 1 : -1), pose: arrived ? (i % 2 ? 'cheer' : 'wave') : 'walk', expr: 'happy', color: col, legs: col === WHITE ? MID : PAL.D1, ph: i * .7 });
      if (!arrived) steps(a, a + .8, .39);
    });
  }
}

// ---------- déroulé : alternance toi / illustration ----------
const MODES = [[0, 'face'], [2.97, 'A'], [5.9, 'face'], [9.5, 'B'], [13.7, 'face'], [16.95, 'C'], [20.35, 'face']];
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background();
  let m = MODES[0]; for (const x of MODES) if (T >= x[0]) m = x;
  if (m[0] > 0) flash(m[0], .14);
  if (m[1] === 'face') { faceCard(m[0]); faceExtras(m[0]); } else ({ A: illuA, B: illuB, C: illuC })[m[1]]();
  ctx.textAlign = 'left'; captions();
  ctx.globalAlpha = 1; grain();
}
MODES.slice(1).forEach(([t]) => sfx('whoosh', t));
window.renderFrame = async n => { N = n; T = n / FPS + 1e-6; fmiss = []; draw(); if (fmiss.length) { await loadFaces(); fmiss = []; draw(); } };
window.ready = (async () => { await Promise.all([...[700, 800, 900].map(w => document.fonts.load(`${w} 40px "Inter Display"`)), document.fonts.load('700 40px "JetBrains Mono"')]); makeNoise(); })();
