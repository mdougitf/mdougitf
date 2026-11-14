/* Reel 2 « Pourquoi tu procrastines » — mini-personnages + emplacements face caméra.
   Ce fichier est assemblé avec les outils de motion.html par build_procrast.py -> procrast.html.
   Chaque image est une fonction pure du temps T : pour recaler sur la voix, changer les temps ci-dessous. */

// ---------- icônes pixel en plus ----------
Object.assign(ICONS, {
  brain: ['..kkk.kkk...', '.kbbbkbbbk..', 'kbbwbbbwbbk.', 'kbbbbkbbbbk.', 'kbwbbbbbwbbk', 'kbbbkbbkbbbk', 'kbbwbbbbbwbk', '.kbbbkbbbbk.', '..kkkkkkkk..', '....kbbk....', '....kkkk....'],
  stop: ['..kkkkkk..', '.kbbbbbbk.', 'kbbbbbbbbk', 'kbbbbbbbbk', 'kbwwwwwwbk', 'kbwwwwwwbk', 'kbbbbbbbbk', 'kbbbbbbbbk', '.kbbbbbbk.', '..kkkkkk..'],
  alert: ['....kk....', '...kbbk...', '...kbbk...', '..kbwwbk..', '..kbwwbk..', '.kbbwwbbk.', '.kbbwwbbk.', 'kbbbbbbbbk', 'kbbbwwbbbk', 'kkkkkkkkkk'],
  pad: ['.kkkkkkkkkkkk.', 'kwwwwwwwwwwwwk', 'kwwkwwwwwwbwwk', 'kwkkkwwwwbwbwk', 'kwwkwwwwwwbwwk', 'kwwwwwkkwwwwwk', 'kwwwwk..kwwwwk', '.kkkk....kkkk.'],
  shield: ['kkkkkkkkkk', 'kbbbbbbbbk', 'kbbbbbbwbk', 'kbbbbbwwbk', 'kbwbbwwbbk', 'kbwwwwbbbk', '.kbwwbbbk.', '..kbbbbk..', '...kbbk...', '....kk....'],
  bookmark: ['kkkkkkkk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', 'kbbkkbbk', 'kbk..kbk', 'kk....kk'],
  camera: ['....kkkk......', '.kkkkbbkkkkkk.', 'kwwwwwwwwwwwwk', 'kwwwwkkkkwwwwk', 'kwwwkbbbbkwwwk', 'kwwwkbwbbkwwwk', 'kwwwkbbbbkwwwk', 'kwwwwkkkkwwwwk', 'kwwwwwwwwwwwwk', '.kkkkkkkkkkkk.'],
});

// ---------- mini-personnage ----------
// Angles absolus en radians : 0 = vers le bas, + = vers l'avant (sens du regard), π = vers le haut.
const SEG = { torso: 62, neck: 6, head: 25, ua: 34, fa: 32, th: 40, sh: 42 };
function pose(name, t) {
  const s = Math.sin, c = Math.cos;
  const P = { lean: 0, head: 0, aB: [.14, .24], aF: [-.06, .04], lB: [-.05, -.05], lF: [.05, .05], bob: 1.5 * s(t * 2.4), sit: false, shake: 0 };
  const sit = () => { P.sit = true; P.lF = [1.5, 0]; P.lB = [1.42, -.04]; P.aF = [.3, 1.15]; P.aB = [.25, 1.1]; P.bob = 1 * s(t * 2.4); };
  switch (name) {
    case 'walk': case 'run': {
      const run = name === 'run', ph = t * (run ? 13 : 8), A = run ? .85 : .45, sw = s(ph), K = run ? 1.3 : .55;
      P.lean = run ? .3 : .05;
      P.lF = [A * sw, A * sw - K * (1 - sw) / 2]; P.lB = [-A * sw, -A * sw - K * (1 + sw) / 2];
      const B = run ? 1.5 : .35;
      P.aF = [-A * .8 * sw, -A * .8 * sw + B]; P.aB = [A * .8 * sw, A * .8 * sw + B];
      P.bob = -Math.abs(c(ph)) * (run ? 10 : 4); break;
    }
    case 'sit': sit(); break;
    case 'sitScared': sit(); P.lean = -.12; P.aF = [1.1, 2.7]; P.aB = [1.0, 2.6]; P.shake = 3 * s(t * 40); break;
    case 'type': sit(); P.lean = .2; P.head = -.08; P.aF = [.75, 1.62 + .14 * s(t * 22)]; P.aB = [.7, 1.55 + .14 * s(t * 22 + 2)]; break;
    case 'slump': sit(); P.lean = .95; P.head = .55; P.aF = [1.65, 2.25]; P.aB = [1.6, 2.2]; P.bob = 1.5 * s(t * 1.2); break;
    case 'wave': P.aF = [2.7, 2.95 + .45 * s(t * 9)]; break;
    case 'cheer': P.aF = [2.55, 2.8 + .2 * s(t * 9)]; P.aB = [2.45, 2.75 + .2 * s(t * 9 + 1)]; P.bob = -Math.abs(s(t * 7)) * 14; break;
  }
  return P;
}
function face(hc, r, f, expr) {
  const e1 = hc[0] + f * r * .18, e2 = hc[0] + f * r * .62, ey = hc[1] - r * .05, mx = hc[0] + f * r * .42, my = hc[1] + r * .42;
  const blink = (expr === 'happy' || expr === 'neutral' || expr === 'focus') && (T % 3.1) < .12;
  ctx.fillStyle = DARK; ctx.strokeStyle = DARK; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  const ln = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  if (expr === 'tired' || expr === 'sleep' || blink) { ln(e1 - 4, ey, e1 + 4, ey + 1); ln(e2 - 4, ey, e2 + 4, ey + 1); }
  else if (expr === 'scared') { ctx.lineWidth = 2.6; [e1, e2].forEach(x => { ctx.beginPath(); ctx.arc(x, ey, 5, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x, ey, 1.8, 0, 7); ctx.fill(); }); }
  else [e1, e2].forEach(x => { ctx.beginPath(); ctx.arc(x, ey, 3.6, 0, 7); ctx.fill(); });
  ctx.lineWidth = 3.4;
  if (expr === 'happy') { ctx.beginPath(); ctx.arc(mx, my - 4, 7, .2, Math.PI - .2); ctx.stroke(); }
  else if (expr === 'scared') { ctx.beginPath(); ctx.ellipse(mx, my, 4, 6, 0, 0, 7); ctx.stroke(); }
  else if (expr === 'tired' || expr === 'sleep') { ctx.beginPath(); ctx.arc(mx, my + 5, 6, Math.PI + .5, -.5); ctx.stroke(); }
  else ln(mx - 5, my, mx + 5, my);
  if (expr === 'focus') { ln(e1 - 5, ey - 9, e1 + 5, ey - 7); ln(e2 - 5, ey - 7, e2 + 5, ey - 9); }
}
// x, y : point au sol (debout) ou point d'assise (assis). Renvoie la position de la tête dans la scène.
function person(x, y, o = {}) {
  const k = o.k || 1.3, f = o.f || 1, P = pose(o.pose || 'stand', T + (o.ph || 0)), a = o.alpha ?? 1;
  if (a <= 0) return [x, y];
  const torsoC = o.color || BLUE, skin = WHITE, legC = o.legs || MID;
  const backA = `rgba(${PAL.Wr},.5)`, backL = `rgba(${PAL.Br},.38)`;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + P.shake, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(k, k);
  const at = (q, ang, L) => [q[0] + f * Math.sin(ang) * L, q[1] + Math.cos(ang) * L];
  const hip = [0, (P.sit ? 0 : -(SEG.th + SEG.sh + 6)) + P.bob];
  const sh = [hip[0] + f * Math.sin(P.lean) * SEG.torso, hip[1] - Math.cos(P.lean) * SEG.torso];
  const hA = P.lean + P.head, hc = [sh[0] + f * Math.sin(hA) * (SEG.neck + SEG.head), sh[1] - Math.cos(hA) * (SEG.neck + SEG.head)];
  const limb = (root, [a1, a2], L1, L2, w, col, foot) => {
    const j = at(root, a1, L1), e = at(j, a2, L2);
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...root); ctx.lineTo(...j); ctx.lineTo(...e); ctx.stroke();
    if (foot) { ctx.strokeStyle = foot; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(e[0] - f * 3, e[1] + 2); ctx.lineTo(e[0] + f * 11, e[1] + 2); ctx.stroke(); }
  };
  limb(hip, P.lB, SEG.th, SEG.sh, 16, backL, backA);
  limb(sh, P.aB, SEG.ua, SEG.fa, 12, backA);
  ctx.strokeStyle = torsoC; ctx.lineWidth = 38; ctx.lineCap = 'round';
  const s2 = [hip[0] + (sh[0] - hip[0]) * .9, hip[1] + (sh[1] - hip[1]) * .9];
  ctx.beginPath(); ctx.moveTo(...hip); ctx.lineTo(...s2); ctx.stroke();
  // tête + cheveux
  const r = SEG.head - 2;
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hc[0], hc[1], r, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(hc[0], hc[1], r + .5, 0, 7); ctx.clip(); ctx.translate(hc[0], hc[1]); ctx.rotate(f * hA); ctx.fillStyle = DARK;
  ctx.fillRect(-r - 2, -r - 2, 2 * r + 4, r * .62); ctx.fillRect(f > 0 ? -r - 2 : r * .35, -r, r * .7, r * 1.15); ctx.restore();
  face(hc, r, f, o.expr || 'neutral');
  limb(hip, P.lF, SEG.th, SEG.sh, 17, legC, skin);
  limb(sh, P.aF, SEG.ua, SEG.fa, 13, skin);
  ctx.restore();
  const c = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0);
  return [x + P.shake + (hc[0] * c - hc[1] * sn) * k, y + (hc[0] * sn + hc[1] * c) * k];
}
function zzz(x, y, t0) {
  if (T < t0) return;
  ctx.save(); ctx.textAlign = 'center';
  for (let i = 0; i < 3; i++) {
    const u = ((T - t0) * .7 + i / 3) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI) * .9; ctx.fillStyle = WHITE; ctx.font = `700 ${28 + 16 * u}px ${FM}`;
    ctx.fillText('z', x + 30 * u + 10 * Math.sin(u * 6), y - 110 * u);
  }
  ctx.restore();
}

// ---------- décors ----------
const LINE = () => `rgba(${PAL.Wr},.82)`;
function floorLine(y, a = 1) {
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, `rgba(${PAL.Wr},0)`); g.addColorStop(.5, `rgba(${PAL.Wr},${.22 * a})`); g.addColorStop(1, `rgba(${PAL.Wr},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, y, W, 3);
}
function desk(x0, x1, top, floor) {
  ctx.fillStyle = LINE(); rr(Math.min(x0, x1), top, Math.abs(x1 - x0), 14, 6); ctx.fill();
  ctx.fillRect(Math.min(x0, x1) + 18, top + 10, 10, floor - top - 10); ctx.fillRect(Math.max(x0, x1) - 28, top + 10, 10, floor - top - 10);
}
function chair(x, seat, floor, f, k) {
  ctx.fillStyle = `rgba(${PAL.Wr},.55)`;
  rr(x - f * 34 * k - (f > 0 ? 0 : 0), seat + 6 * k, f * 66 * k, 9 * k, 4); ctx.fill();
  ctx.fillRect(x - f * 34 * k - 4, seat - 66 * k, 9 * k, 72 * k);
  ctx.fillRect(x - 4, seat + 12 * k, 8, floor - seat - 12 * k);
  ctx.fillRect(x - 30 * k, floor - 6, 60 * k, 6);
}
function laptop(x, top, f, glow = 1) {                        // vu de profil : base + écran incliné, lueur bleue
  ctx.fillStyle = LINE(); rr(x - 46, top - 8, 92, 8, 3); ctx.fill();
  ctx.save(); ctx.translate(x + f * 46, top - 6); ctx.rotate(f * -.35);
  ctx.fillStyle = `rgba(${PAL.Wr},.9)`; rr(-5, -78, 10, 80, 4); ctx.fill(); ctx.restore();
  if (glow > 0) {
    const g = ctx.createRadialGradient(x - f * 20, top - 50, 5, x - f * 20, top - 50, 170);
    g.addColorStop(0, `rgba(${PAL.Br},${.34 * glow})`); g.addColorStop(1, `rgba(${PAL.Br},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - 220, top - 220, 440, 300);
  }
}
function armchair(x, seat, k = 1.3) {
  ctx.fillStyle = PAL.D1; rr(x - 120, seat - 120, 70, 150, 26); ctx.fill();                // dossier
  ctx.fillStyle = MID; rr(x - 110, seat + 4, 210, 60, 22); ctx.fill();                      // assise
  ctx.fillStyle = PAL.D1; rr(x - 130, seat - 20, 46, 100, 20); ctx.fill(); rr(x + 72, seat - 20, 46, 100, 20); ctx.fill();
  ctx.fillStyle = `rgba(${PAL.Wr},.6)`; ctx.fillRect(x - 110, seat + 64, 8, 30); ctx.fillRect(x + 92, seat + 64, 8, 30);
}
function sofa(x, seat, w) {
  ctx.fillStyle = PAL.D1; rr(x - w / 2, seat - 110, w, 120, 30); ctx.fill();
  ctx.fillStyle = MID; rr(x - w / 2 + 20, seat - 6, w - 40, 64, 24); ctx.fill();
  ctx.fillStyle = PAL.D1; rr(x - w / 2 - 20, seat - 50, 60, 120, 26); ctx.fill(); rr(x + w / 2 - 40, seat - 50, 60, 120, 26); ctx.fill();
}
function deskScene(x, seat, K, glow = 1) {                   // chaise + bureau + ordi, à l'échelle du personnage
  const floor = seat + 44 * K, top = seat - 33 * K;
  floorLine(floor); desk(x + 45 * K, x + 45 * K + 300 * K / 1.3, top, floor); chair(x, seat, floor, 1, K * .85); laptop(x + 200 * K, top, 1, glow);
  return floor;
}
function ring(cx, cy, r, frac, txt, o = {}) {                  // chrono circulaire
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(cx, cy); const sc = o.scale ?? 1; ctx.scale(sc, sc);
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = r + 26, r1 = r + (big ? 44 : 34);
    ctx.strokeStyle = `rgba(${PAL.Wr},${big ? .35 : .15})`; ctx.lineWidth = big ? 4 : 2;
    ctx.beginPath(); ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); ctx.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1); ctx.stroke();
  }
  ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(${PAL.Wr},.1)`; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
  if (frac > .001) {
    ctx.shadowColor = BLUE; ctx.shadowBlur = 30; ctx.strokeStyle = o.color || BLUE;
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(frac)); ctx.stroke(); ctx.shadowBlur = 0;
    const ea = -Math.PI / 2 + Math.PI * 2 * clamp(frac); ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(Math.cos(ea) * r, Math.sin(ea) * r, 13, 0, 7); ctx.fill();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.txtColor || WHITE; ctx.font = `700 ${o.size || 104}px ${FM}`; ctx.fillText(txt, 0, 4);
  if (o.sub) { ctx.font = `700 30px ${FM}`; ctx.fillStyle = MUTED; ctx.fillText(o.sub, 0, 78); }
  ctx.restore(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
}
const mmss = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
function task(x, y, txt, a, rot = 0) {                          // bloc de tâche
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = `700 40px ${FM}`; const w = ctx.measureText(txt).width + 64;
  ctx.fillStyle = PAL.SCR; rr(-w / 2, -40, w, 80, 18); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = BLUE; rr(-w / 2, -40, w, 80, 18); ctx.stroke();
  ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 2);
  ctx.restore(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function fear(x, y, s) {                                        // la peur : petit nuage sombre aux yeux blancs
  if (s <= .02) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, R = 78 * (1 + .09 * Math.sin(a * 6 + T * 7)); i ? ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R * .86) : ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R * .86); }
  ctx.fillStyle = '#18181b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = `rgba(${PAL.Wr},.75)`; ctx.stroke();
  [-24, 22].forEach(ex2 => { ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(ex2, -12, 13, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(ex2 + 5, -8, 6, 0, 7); ctx.fill(); });
  ctx.strokeStyle = WHITE; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx[i ? 'lineTo' : 'moveTo'](-30 + i * 10, 28 + (i % 2 ? -8 : 0)); ctx.stroke();
  ctx.restore();
}
function poof(x, y, t0) {                                       // éclat de pixels
  if (T < t0 || T > t0 + .7) return;
  const u = eo(p(t0, .7)), r = rng(9);
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2, d = (60 + r() * 140) * u, s = 8 + r() * 10;
    ctx.globalAlpha = 1 - u; ctx.fillStyle = i % 3 ? WHITE : BLUE; ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s);
  }
  ctx.globalAlpha = 1;
}
function pill(cx, cy, txt, filled, a, size = 50) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = `800 ${size}px ${FF}`; const w = ctx.measureText(txt).width + 70, h = size * 1.7;
  ctx.translate(cx, cy); const sc = lerp(.85, 1, eo(a)); ctx.scale(sc, sc);
  if (filled) { ctx.shadowColor = BLUE; ctx.shadowBlur = 40; ctx.fillStyle = BLUE; rr(-w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.shadowBlur = 0; }
  else { ctx.lineWidth = 5; ctx.strokeStyle = WHITE; rr(-w / 2, -h / 2, w, h, h / 2); ctx.stroke(); }
  ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 3);
  ctx.restore(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; return w;
}

// ---------- emplacement face caméra ----------
// Carte en pointillés animés : c'est ici que tu poses ton plan filmé (mêmes position et taille, mêmes temps).
const SLOTS = [];
function slot(x, y, w, h, t0, t1, title, sub) {
  SLOTS.push([t0, t1, x, y, w, h, title, sub]);
  if (T < t0 || T >= t1) return;
  const e = eo(p(t0, .35)), out = 1 - eo(p(t1 - .2, .2));
  ctx.save(); ctx.globalAlpha *= Math.min(e * 1.4, 1) * out;
  ctx.translate(x + w / 2, y + h / 2); const sc = lerp(.94, 1, e); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = `rgba(${PAL.Br},.35)`; ctx.shadowBlur = 60; ctx.fillStyle = PAL.SCR; rr(0, 0, w, h, 30); ctx.fill(); ctx.shadowBlur = 0;
  ctx.setLineDash([22, 16]); ctx.lineDashOffset = -T * 60; ctx.lineWidth = 4; ctx.strokeStyle = WHITE; rr(0, 0, w, h, 30); ctx.stroke(); ctx.setLineDash([]);
  icon('camera', w / 2, h / 2 - 120, 12);
  ctx.textAlign = 'center'; ctx.fillStyle = WHITE; ctx.font = `800 76px ${FF}`; ctx.fillText(title, w / 2, h / 2 + 40);
  ctx.font = `700 30px ${FM}`; ctx.fillStyle = MUTED; ctx.fillText(sub, w / 2, h / 2 + 100);
  ctx.textAlign = 'left'; ctx.font = `700 28px ${FM}`;
  ctx.fillStyle = Math.floor(T * 2) % 2 ? BLUE : `rgba(${PAL.Br},.3)`; ctx.beginPath(); ctx.arc(46, 50, 10, 0, 7); ctx.fill();
  ctx.fillStyle = WHITE; ctx.fillText('REC', 66, 60);
  ctx.textAlign = 'right'; ctx.fillStyle = MUTED; ctx.fillText(`${mmss(t0)} → ${mmss(t1)}`, w - 36, 60); ctx.textAlign = 'left';
  ctx.restore();
  sparkle(x + w - 6, y + 4, 44 * (1 + .18 * Math.sin(T * 5)), T * .4, .95);
}

// ---------- titres ----------
function hdr(lab, segs, t0, o = {}) {                         // étiquette + titre tapé + trait de pinceau
  label(lab, 90, 330, t0);
  const size = o.size || 104, n = segs.reduce((a, s) => a + s[0].length, 0), cps = o.cps || 26;
  const t = typed(segs, 90, 440, size, { t0: t0 + .05, cps, hold: o.hold });
  if (o.line !== false) brush(90, 470, 90 + t.full, 16, p(t0 + .05 + n / cps, .22));
}
function caption(txt, y, t0, o = {}) { typed([[txt, o.color || MUTED]], 540, y, o.size || 50, { t0, cps: o.cps || 26, align: 'center', weight: 700, cursor: o.cursor }); }
const steps = (t0, t1, every) => { for (let t = t0; t < t1; t += every) sfx('step', t); };

// ---------- scènes ----------
function p1() {                                             // 0–3 s · l'accroche
  icon('stop', 120, 254, 6, { scale: eo(p(0, .25)) });
  typed([['arrête de scroller.', WHITE]], 170, 270, 46, { t0: 0, cps: 30, weight: 700, hold: .5 });
  slot(90, 330, 900, 760, 0, 3.05, 'ta tête ici', "face caméra · l'air fatigué · ordi ouvert");
  const r = words([{ size: 116, words: [['pourquoi', WHITE, .3], ['tu', WHITE, .55]] }, { size: 116, words: [['procrastines ?', BLUE, .8]] }], 540, 1290, 1.02);
  brush(r[2].x, r[2].y + 34, r[2].x + r[2].w, 22, p(1.25, .25));
  // mini toi, effondré sur son bureau
  deskScene(400, 1690, 1.25, .8);
  const hd = person(400, 1690, { k: 1.25, pose: 'slump', expr: 'sleep' }); zzz(hd[0] + 20, hd[1] - 30, .2);
}
function p2() {                                             // 3–7,2 s · pas de la flemme, de la biologie
  if (T < 5.3) {
    caption("ce n'est pas un problème de", 540, 3.0, { cps: 34 });
    ctx.save(); ctx.globalAlpha = lerp(1, .4, p(4.7, .3));
    const r = words([{ size: 200, words: [['flemme.', WHITE, 3.75]] }], 540, 740); ctx.restore();
    brush(r[0].x - 30, r[0].y - 66, r[0].x + r[0].w + 30, 34, p(4.55, .3), BLUE, 2); sfx('scratch', 4.55);
    floorLine(1560); sofa(540, 1420, 620);
    const hd = person(780, 1414, { k: 1.25, pose: 'stand', rot: -Math.PI / 2, expr: 'sleep' }); zzz(hd[0] - 10, hd[1] - 40, 3.2);
  } else {
    flash(5.3);
    caption("c'est juste de la", 540, 5.35, { cps: 30 });
    const r = words([{ size: 190, words: [['biologie.', BLUE, 5.85]] }], 540, 740);
    brush(r[0].x, r[0].y + 40, r[0].x + r[0].w, 24, p(6.2, .22), WHITE, 3);
    iconBlock('brain', 540, 1240, 24, 5.9, 1);
    floatIcon('alert', 200, 1500, 9, 6.2, 1); floatIcon('pad', 880, 1520, 9, 6.4, 2);
  }
}
function p3() {                                             // 7,2–19 s · ton cerveau veut du confort
  if (T < 10.4) hdr('ton cerveau', [['veut du ', WHITE], ['confort.', BLUE]], 7.2, { size: 100 });
  else if (T < 14.0) hdr('pour lui', [["l'", WHITE], ['inconfort', BLUE], [' total.', WHITE]], 10.4, { size: 100, cps: 9 });
  else if (T < 16.6) { hdr("c'est une", [['menace.', BLUE]], 14.0, { size: 120, cps: 22 }); flash(14.0, .1); }
  else hdr('alors', [["il t'en éloigne.", WHITE]], 16.6, { size: 100, cps: 24 });
  // zone de confort
  const cx = 540, cy = 1250, R = 330, menace = T >= 14.0 && T < 16.6;
  ctx.save(); ctx.setLineDash([16, 14]); ctx.lineDashOffset = T * 30; ctx.lineWidth = menace ? 6 : 4;
  ctx.strokeStyle = menace && Math.floor(T * 6) % 2 ? BLUE : `rgba(${PAL.Wr},.45)`;
  ctx.beginPath(); ctx.arc(cx, cy, R * lerp(.6, 1, eo(p(7.25, .5))), 0, 7); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.globalAlpha = p(7.6, .3); ctx.font = `700 32px ${FM}`; ctx.textAlign = 'center'; ctx.fillStyle = MUTED; ctx.fillText('zone de confort', cx, cy - R - 24); ctx.textAlign = 'left'; ctx.restore();
  floorLine(1452, .7); armchair(cx, 1360);
  floatIcon('brain', 540, 1050, 10, 7.5, 2);
  if (T < 16.6) person(cx - 6, 1352, { k: 1.25, pose: T < 13.0 ? 'sit' : 'sitScared', expr: T < 13.0 ? 'happy' : 'scared' });
  else { const x = lerp(cx, -220, (T - 16.6) / 1.6); person(x, 1452, { k: 1.25, pose: 'run', f: -1, expr: 'scared' }); sfx('pop', 16.6); steps(16.6, 18.2, .24); }
  // les tâches arrivent et cognent contre la zone
  [['bosser', -.75, 10.9], ['coder', -.05, 11.45], ['réviser', .65, 12.0]].forEach(([txt, ang, t0], i) => {
    if (T < t0) return; sfx('pop', t0);
    const tx = cx + Math.cos(ang) * (R + 40), ty = cy + Math.sin(ang) * (R + 40), e = ex(p(t0, .45));
    const sh = menace ? 6 * Math.sin(T * 50 + i) : 0;
    task(lerp(W + 260, tx, e) + sh, ty, txt, 1, .06 * Math.sin(T * 2 + i));
    if (menace) icon('alert', tx + 90, ty - 52, 5, { scale: eo(p(14.0 + i * .12, .2)) });
  });
}
function p4() {                                             // 19–28,2 s · la règle des 5 minutes
  if (T < 22.4) {
    hdr('la solution', [['un ', WHITE], ['cheat code.', BLUE]], 19.0, { size: 110, cps: 18 }); flash(19.0);
    iconBlock('pad', 540, 1000, 16, 19.4, 1);
    caption('infaillible.', 1260, 20.6, { size: 56 });
    floatIcon('brain', 210, 1500, 9, 20.0, 1); floatIcon('stop', 860, 1480, 8, 20.2, 2);
    return;
  }
  flash(22.4); hdr('la règle des', [['5 minutes.', BLUE]], 22.4, { size: 130, cps: 20 });
  // le chrono
  const show = eo(p(24.0, .35)); sfx('tick', 24.0);
  if (T >= 24.0) {
    let txt = '05:00', sub = 'chrono', col = WHITE;
    if (T >= 25.8 && T < 27.0) { txt = '60:00'; sub = 'pas une heure.'; }
    if (T >= 27.0) { col = BLUE; sub = 'juste 5 minutes.'; }
    const punch = T >= 27.0 ? 1 + .12 * (1 - eo(p(27.0, .35))) : 1;
    ring(540, 870, 220, T < 25.8 ? eo(p(24.0, .6)) : T < 27.0 ? 1 : eo(p(27.0, .5)), txt, { scale: lerp(.7, 1, show) * punch, alpha: show, txtColor: col, sub });
    if (T >= 25.8 && T < 27.0) brush(370, 870, 710, 22, p(26.1, .25), BLUE, 4);
    sfx('scratch', 26.1); sfx('boom', 27.0);
  }
  // mini toi arrive, s'assoit, lance le chrono
  const fl = deskScene(DX, DS, DK, T >= 24.0 ? 1 : .3);
  if (T < 23.6) { person(lerp(-180, DX, eo((T - 22.4) / 1.2) * .25 + (T - 22.4) / 1.2 * .75), fl, { k: DK, pose: 'walk', expr: 'neutral' }); steps(22.4, 23.6, .39); }
  else person(DX, DS, { k: DK, pose: T < 24.0 ? 'sit' : 'type', expr: T < 27.0 ? 'neutral' : 'focus' });
}
function p5() {                                             // 28,2–34,6 s · pourquoi ça marche
  if (T < 31.0) {
    slot(90, 330, 900, 760, 28.2, 31.0, 'tes mains ici', 'plan serré · tu tapes ou tu écris');
    const r = words([{ size: 120, words: [['pourquoi', WHITE, 28.3]] }, { size: 120, words: [['ça', WHITE, 28.55], ['marche ?', BLUE, 28.75]] }], 540, 1330);
    brush(r[2].x, r[2].y + 34, r[2].x + r[2].w, 20, p(29.1, .22));
    return;
  }
  flash(31.0);
  if (T < 32.6) hdr('au bout de 5 minutes', [['pas si ', WHITE], ['horrible.', BLUE]], 31.0, { size: 104, cps: 22 });
  else { hdr('ton cerveau comprend', [["c'est ", WHITE], ['safe.', BLUE]], 32.6, { size: 120, cps: 20 }); iconBlock('shield', 870, 610, 9, 32.7, -1); }
  desks(31.0);
  const left = lerp(300, 0, (T - 31.0) / 3.0);                 // 5 minutes qui filent
  for (let t = 31.0; t < 34.0; t += .25) sfx('tick', t);
  sfx('ding', 34.0);
  const done = T >= 34.0;
  ring(540, 870, 220, done ? 1 : left / 300, done ? '00:00' : mmss(left), { txtColor: done ? BLUE : WHITE, sub: done ? '5 minutes faites.' : 'chrono', scale: done ? 1 + .1 * (1 - eo(p(34.0, .4))) : 1 });
}
const DX = 330, DS = 1640, DK = 1.5;                          // position et taille du mini toi au bureau
function desks(t0) {                                          // bureau partagé par les plans 5 et 6
  deskScene(DX, DS, DK, 1);
  return person(DX, DS, { k: DK, pose: 'type', expr: T >= 36.4 ? 'happy' : 'focus' });
}
function p6() {                                             // 34,6–39,5 s · la peur part, la motivation arrive
  const hd = desks(34.6);
  if (T < 36.4) {
    hdr('la peur', [['disparaît.', BLUE]], 34.6, { size: 120, cps: 22 });
    const s = T < 35.5 ? 1 : 1 - eo(p(35.5, .5));
    fear(820, 1330 + 12 * Math.sin(T * 3), 1.5 * s * eo(p(34.6, .3))); poof(820, 1330, 36.0); sfx('poof', 36.0);
    ctx.save(); ctx.globalAlpha = s * p(34.7, .2); ctx.font = `700 32px ${FM}`; ctx.textAlign = 'center'; ctx.fillStyle = MUTED; ctx.fillText('la peur', 820, 1190); ctx.textAlign = 'left'; ctx.restore();
    ring(540, 870, 220, 1, '00:00', { txtColor: BLUE, sub: '5 minutes faites.' });
  } else if (T < 38.2) {
    flash(36.4, .1); hdr('la motivation arrive', [['après.', BLUE]], 36.4, { size: 120, cps: 18 });
    const a1 = eo(p(36.6, .3)), a2 = eo(p(37.3, .3));
    const w1 = pill(300, 880, 'action', true, a1, 54); sfx('pop', 36.6); sfx('pop', 37.3);
    pill(780, 880, 'motivation', false, a2, 54);
    const pr = eo(p(36.95, .35)), x0 = 300 + 140, x1 = lerp(x0, 600, pr);
    ctx.strokeStyle = WHITE; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, 880); ctx.lineTo(x1, 880); ctx.stroke();
    if (pr > .9) { ctx.beginPath(); ctx.moveTo(x1 - 18, 862); ctx.lineTo(x1, 880); ctx.lineTo(x1 - 18, 898); ctx.stroke(); }
    caption("d'abord l'action. ensuite l'envie.", 1080, 37.5, { size: 44, cps: 36 });
  } else {
    hdr('et tu continues', [['tout seul.', BLUE]], 38.2, { size: 120, cps: 22 });
    const up = 5 * 60 + (T - 38.2) * 260;
    ring(540, 870, 220, ((T - 38.2) * .6) % 1, '+' + mmss(up - 300), { sub: 'en plus, sans forcer' });
    [38.5, 38.85, 39.2].forEach((t, i) => { icon('check', hd[0] + 150 + i * 110, hd[1] - 110 - 40 * eo(p(t, .4)), 8, { scale: eo(p(t, .25)) }); sfx('pop', t); });
  }
  sfx('type', 31.0, '51|6');
}
function p7() {                                             // 39,5–50 s · l'appel à l'action
  if (T < 43.6) {
    slot(90, 330, 900, 760, 39.5, 43.6, 'ta tête ici', 'tu souris · geste « abonne-toi »');
    typed([["arrête d'attendre", WHITE]], 540, 1260, 80, { t0: 39.6, cps: 22, align: 'center', cursor: T < 40.4 });
    const r = words([{ size: 120, words: [['la', WHITE, 40.45], ['motivation.', BLUE, 40.65]] }], 540, 1370);
    brush(r[1].x, r[1].y + 34, r[1].x + r[1].w, 20, p(41.1, .22));
    caption('pour agir.', 1520, 41.5, { size: 50 });
    return;
  }
  flash(43.6);
  const r = words([{ size: 120, words: [['teste', WHITE, 43.65], ['ça', WHITE, 43.85]] }, { size: 120, words: [['ce', WHITE, 44.05], ['soir.', BLUE, 44.2]] }], 540, 520);
  brush(r[3].x, r[3].y + 34, r[3].x + r[3].w, 20, p(44.5, .22));
  // enregistre
  const bs = 1 + .08 * Math.sin(Math.max(0, T - 45.0) * 6) * (T > 45.0);
  ctx.save(); ctx.translate(540, 900); ctx.scale(bs, bs); iconBlock('bookmark', 0, 0, 14, 44.8, 1); ctx.restore();
  caption('enregistre pour ce soir.', 1080, 45.0, { size: 46, color: WHITE });
  // abonne-toi : bouton qui pulse
  if (T >= 46.2) {
    for (let k = 0; k < 3; k++) {
      const ph = ((T - 46.2) * 1.1 + k / 3) % 1;
      ctx.save(); ctx.globalAlpha = (1 - ph) * .45; ctx.strokeStyle = BLUE; ctx.lineWidth = 4; const s = 1 + ph * .3;
      rr(540 - 330 * s, 1300 - 75 * s, 660 * s, 150 * s, 75 * s); ctx.stroke(); ctx.restore();
    }
    pill(540, 1300, '+ abonne-toi', true, eo(p(46.2, .3)), 70); sfx('chime', 46.2);
    caption('pour plus de systèmes.', 1450, 46.6, { size: 44 });
    ctx.save(); ctx.globalAlpha = p(47.4, .3); ctx.font = `700 36px ${FM}`; ctx.textAlign = 'center'; ctx.fillStyle = MUTED; ctx.fillText(HANDLE, 540, 1530); ctx.textAlign = 'left'; ctx.restore();
  }
  // la petite foule qui arrive et fait coucou
  floorLine(1790);
  const crowd = [[130, -1, 46.3, BLUE], [330, -1, 46.5, WHITE], [540, 1, 46.4, BLUE], [750, 1, 46.6, MID], [950, 1, 46.35, WHITE]];
  crowd.forEach(([x, side, t0, col], i) => {
    if (T < t0) return;
    const from = side < 0 ? -120 : W + 120, e = clamp((T - t0) / 1.0), xx = lerp(from, x, e), arrived = e >= 1;
    person(xx, 1790, { k: 1.0, f: arrived ? (x < 540 ? 1 : -1) * (i === 2 ? 1 : 1) : (side < 0 ? 1 : -1), pose: arrived ? (i % 2 ? 'cheer' : 'wave') : 'walk', expr: 'happy', color: col, legs: col === WHITE ? MID : PAL.D1, ph: i * .7 });
    if (!arrived) steps(t0, t0 + 1.0, .39);
  });
}
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left'; SLOTS.length = 0;
  background();
  if (T < 3) p1(); else if (T < 7.2) p2(); else if (T < 19) p3(); else if (T < 28.2) p4(); else if (T < 34.6) p5(); else if (T < 39.5) p6(); else p7();
  ctx.globalAlpha = 1; grain();
}
[['whoosh', 3.0], ['whoosh', 7.2], ['whoosh', 28.2], ['whoosh', 39.5], ['boom', 5.85], ['chime', 32.6], ['chime', 44.8]].forEach(([k, t]) => sfx(k, t));
window.renderFrame = async n => { N = n; T = n / FPS + 1e-6; draw(); };
window.ready = (async () => { await Promise.all([...[700, 800, 900].map(w => document.fonts.load(`${w} 40px "Inter Display"`)), document.fonts.load('700 40px "JetBrains Mono"')]); makeNoise(); })();
