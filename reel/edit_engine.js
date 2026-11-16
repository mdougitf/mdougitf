/* Moteur de montage « face plein écran + éléments par-dessus » (style Reel face caméra à forte rétention).
   - ton visage occupe tout l'écran (ou, pour une prise horizontale, descend sous une bande floutée) ;
   - recadrages francs à chaque coupe, légère poussée continue, coups de zoom sur les mots forts ;
   - sous-titres à trois étages calés mot à mot : petite ligne / MOT FORT / petite ligne ;
   - autocollants, cartes floutées, chrono… qui surgissent au-dessus de la tête ;
   - rien dans les zones couvertes par l'interface Instagram (haut 230 px, bas 420 px, colonne de droite).
   Assemblé par build_edit.py avec les données du montage (CLIPS, SEGS, CAPS) et un plan propre à la vidéo. */
const ACCENT = Q.get('accent') || '#FFE14D';                  // couleur du mot fort
const GRADE = 'contrast(1.08) saturate(1.1) brightness(1.02)';
const CAP_Y = typeof CAPY !== 'undefined' ? CAPY : 1300;        // ligne du mot fort (réglable par montage)
const PUNCH = [];                                             // instants des coups de zoom (remplis par le plan)

// ---------- image ----------
const vcache = new Map(); let vmiss = [];
const segIdx = t => { let i = 0; SEGS.forEach((g, k) => { if (t >= g.out[0]) i = k; }); return i; };
function vframe(clip, st) {
  const c = CLIPS[clip], i = clamp(Math.round(Math.min(st, c.max ?? 1e9) * c.fps) + 1, 1, c.n), k = clip + ':' + i;
  if (vcache.has(k)) return vcache.get(k); vmiss.push([clip, i]); return null;
}
async function loadV() {
  await Promise.all(vmiss.map(async ([clip, i]) => {
    const k = clip + ':' + i; if (vcache.has(k)) return;
    const im = new Image(); im.src = `${FR}/${CLIPS[clip].dir}/f_${String(i).padStart(5, '0')}.jpg`; await im.decode(); vcache.set(k, im);
  }));
  while (vcache.size > 24) vcache.delete(vcache.keys().next().value);
}
const offc = document.createElement('canvas');
function drawSeg(si, t, xoff = 0) {
  const seg = SEGS[si], c = CLIPS[seg.clip], img = vframe(seg.clip, seg.src[0] + (t - seg.out[0])); if (!img) return;
  let z = (seg.z || 1) * (1 + .012 * Math.max(0, t - seg.out[0]));
  PUNCH.forEach(pt => { if (T >= pt && T < pt + .5) z *= 1 + .05 * (1 - eo(p(pt, .45))); });
  const [fx, fy] = c.focus || [.5, .4];
  ctx.save(); ctx.translate(xoff, 0);
  if (c.layout === 'drop') {
    ctx.filter = 'blur(38px) brightness(.36) saturate(1.25)'; ctx.drawImage(img, -220, -120, W + 440, H + 240); ctx.filter = 'none';
    const sc = c.scale || 1, w = Math.round(W * sc), h = Math.round(w * img.height / img.width); offc.width = w; offc.height = h; const oc = offc.getContext('2d');
    const dw = w * z, dh = h * z; oc.filter = GRADE; oc.drawImage(img, -(dw - w) * fx, -(dh - h) * fy, dw, dh); oc.filter = 'none';
    oc.globalCompositeOperation = 'destination-in'; const g = oc.createLinearGradient(0, 0, 0, 170); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    oc.fillStyle = g; oc.fillRect(0, 0, w, h);
    if (sc < 1) { const gg = oc.createLinearGradient(0, 0, w, 0); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(.06, 'rgba(0,0,0,1)'); gg.addColorStop(.94, 'rgba(0,0,0,1)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); oc.fillStyle = gg; oc.fillRect(0, 0, w, h); }
    ctx.drawImage(offc, (W - w) / 2, c.y ?? 560);
  } else {
    const k = Math.max(W / img.width, H / img.height) * z, dw = img.width * k, dh = img.height * k;
    ctx.filter = GRADE; ctx.drawImage(img, -(dw - W) * fx, -(dh - H) * fy, dw, dh); ctx.filter = 'none';
  }
  ctx.restore();
}
function faceLayer() {
  ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0, 0, W, H);
  const si = segIdx(T), seg = SEGS[si], prev = SEGS[si - 1], dt = T - seg.out[0];
  if (prev && prev.clip !== seg.clip && dt < .22) {            // changement de prise : balayage latéral
    const e = ex(dt / .22); drawSeg(si - 1, T, -W * e); drawSeg(si, T, W * (1 - e)); sfx('whoosh', seg.out[0]);
  } else drawSeg(si, T);
  let g = ctx.createLinearGradient(0, 980, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(0,0,0,.42)'); g.addColorStop(1, 'rgba(0,0,0,.8)');
  ctx.fillStyle = g; ctx.fillRect(0, 980, W, H - 980);         // assise sombre pour les sous-titres
  g = ctx.createLinearGradient(0, 0, 0, 620); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 620);
  g = ctx.createRadialGradient(W / 2, H * .5, 500, W / 2, H * .5, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.4)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---------- sous-titres à trois étages ----------
function capLine(words, y, size, weight, color, key) {
  if (!words.length) return;
  ctx.font = `${weight} ${size}px ${FF}`; const txt = words.map(w => w[0]).join(' '), full = ctx.measureText(txt).width, max = key ? 960 : 900;
  if (full > max) { size *= max / full; ctx.font = `${weight} ${size}px ${FF}`; }
  const sp = ctx.measureText(' ').width; let x = 540 - ctx.measureText(txt).width / 2;
  ctx.lineJoin = 'round'; ctx.textBaseline = 'alphabetic';
  for (const [w, t] of words) {
    const ww = ctx.measureText(w).width;
    if (T >= t) {
      const e = eo(p(t, .16)), s = key ? lerp(1.14, 1, e) : 1;
      ctx.save(); ctx.globalAlpha = p(t, .06); ctx.translate(x + ww / 2, y); ctx.scale(s, s);
      ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
      ctx.lineWidth = size * .14; ctx.strokeStyle = 'rgba(0,0,0,.88)'; ctx.strokeText(w, -ww / 2, 0);
      ctx.shadowColor = 'transparent'; ctx.fillStyle = color; ctx.fillText(w, -ww / 2, 0); ctx.restore();
    }
    x += ww + sp;
  }
}
function captions3() {
  const c = CAPS.find(c => T >= c.t0 && T < c.t1); if (!c) return;
  if (c.key.length) {
    capLine(c.top, CAP_Y - 112, 56, 800, WHITE); capLine(c.key, CAP_Y, 124, 900, ACCENT, true); capLine(c.bot, CAP_Y + 78, 56, 800, WHITE);
  } else capLine(c.top, CAP_Y - 20, 76, 800, WHITE);
}

// ---------- éléments par-dessus l'image ----------
function sticker(ic, x, y, size, o = {}) {                    // icône pixel sur pastille sombre bordée de blanc
  const s = o.scale ?? 1; if (s <= .01 || (o.alpha ?? 1) <= 0) return;
  const g = Array.isArray(ic) ? ic : ICONS[ic], gw = Math.max(...g.map(r => r.length)), px = Math.max(3, Math.floor(size * .6 / Math.max(gw, g.length)));
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 12; ctx.fillStyle = o.bg || '#0d1017'; rr(-size / 2, -size / 2, size, size, size * .26); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.lineWidth = 5; ctx.strokeStyle = o.border || WHITE; rr(-size / 2, -size / 2, size, size, size * .26); ctx.stroke();
  icon(ic, -px * .4, -px * .4, px); ctx.restore();
}
// items : [icône, x, y, instant, rotation, taille] ; à clearT tout est éjecté vers l'extérieur
function pile(items, clearT = 1e9, cx = 540, cy = 400) {
  items.forEach(([ic, x, y, t, rot = 0, size = 150], i) => {
    if (T < t) return; sfx('pop', t);
    let s = lerp(.25, 1, ex(p(t, .28))), a = p(t, .07), dx = 0, dy = 0;
    if (T >= clearT) { const u = eo(p(clearT, .4)), ang = Math.atan2(y - cy, x - cx) + (i % 2 ? .3 : -.3); dx = Math.cos(ang) * 900 * u; dy = Math.sin(ang) * 700 * u; s *= 1 - u * .6; a *= 1 - u; }
    sticker(ic, x + dx + 5 * Math.sin(T * 1.7 + i), y + dy + 6 * Math.cos(T * 1.4 + i * 2), size, { scale: s, alpha: a, rot: rot + .03 * Math.sin(T * 1.2 + i) });
  });
  if (clearT < 1e9) sfx('whoosh', clearT + .35);
}
const cardCache = new Map();
function cardImg(num, label, w, h) {
  const k = num + label + w + h; if (cardCache.has(k)) return cardCache.get(k);
  const c = document.createElement('canvas'); c.width = w + 80; c.height = h + 80; const x = c.getContext('2d'); x.translate(40, 40);
  x.fillStyle = '#0d1017'; x.beginPath(); x.roundRect(0, 0, w, h, 30); x.fill(); x.lineWidth = 5; x.strokeStyle = WHITE; x.stroke();
  x.fillStyle = BLUE; x.font = `700 34px ${FM}`; x.textBaseline = 'alphabetic'; x.fillText(num, 30, 56); x.fillRect(30 + x.measureText(num).width + 14, 42, 60, 4);
  const lines = label.split('\n'); let size = 92; x.font = `900 ${size}px ${FF}`;
  const mw = Math.max(...lines.map(l => x.measureText(l).width)); if (mw > w - 60) { size *= (w - 60) / mw; x.font = `900 ${size}px ${FF}`; }
  x.fillStyle = WHITE; lines.forEach((l, i) => x.fillText(l, 30, h - 34 - (lines.length - 1 - i) * size * 1.05));
  cardCache.set(k, c); return c;
}
// carte numérotée ; floutée jusqu'à revealT (la réponse se fait attendre), mise en avant quand active
function cardW(num, label, x, y, w, h, o = {}) {
  const t0 = o.t0 ?? 0; if (T < t0) return; sfx('pop', t0); if (o.revealT !== undefined) sfx('chime', o.revealT);
  const img = cardImg(num, label, w, h), blur = o.revealT === undefined ? 0 : 20 * (1 - eo(p(o.revealT, .45)));
  const s = lerp(.5, 1, ex(p(t0, .3))) * (o.scale ?? 1) * (o.revealT !== undefined && T >= o.revealT ? 1 + .1 * (1 - eo(p(o.revealT, .4))) : 1);
  ctx.save(); ctx.globalAlpha *= p(t0, .08) * (o.alpha ?? 1); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  ctx.shadowColor = o.active ? `rgba(${PAL.Br},.9)` : 'rgba(0,0,0,.6)'; ctx.shadowBlur = o.active ? 50 : 34; ctx.shadowOffsetY = o.active ? 0 : 12;
  if (blur > .3) ctx.filter = `blur(${blur}px)`; ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
}
function chronoW(x, y, r, frac, txt, o = {}) {                 // chrono sur disque sombre
  const t0 = o.t0 ?? 0; if (T < t0) return; const s = lerp(.4, 1, ex(p(t0, .3))) * (o.scale ?? 1);
  ctx.save(); ctx.globalAlpha *= p(t0, .08); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 12; ctx.fillStyle = '#0d1017'; ctx.beginPath(); ctx.arc(0, 0, r + 46, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.restore(); ctx.save(); ctx.globalAlpha *= p(t0, .08);
  ring(x, y, r, frac, txt, { scale: s, size: r * .5, txtColor: o.color || WHITE }); ctx.restore();
}
function pillW(txt, x, y, t0, size = 54) { if (T < t0) return; sfx('pop', t0); ctx.save(); ctx.translate(x, y); const s = lerp(.5, 1, ex(p(t0, .3))); ctx.scale(s, s); pill(0, 0, txt, true, p(t0, .1), size); ctx.restore(); }
// instant où un mot est prononcé (n-ième occurrence) : les éléments du plan s'accrochent à la voix, pas à des temps fixes
const at = (word, n = 1, fallback = 1e9) => { const k = word.normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, ''); const hit = WORDS.filter(w => w[1].startsWith(k))[n - 1]; return hit ? hit[0] : fallback; };
const punch = (...ts) => ts.forEach(t => { if (!PUNCH.includes(t)) PUNCH.push(t); });

// ---------- boucle ----------
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.filter = 'none';
  faceLayer(); plan(); ctx.globalAlpha = 1; ctx.textAlign = 'left'; captions3();
}
window.renderFrame = async n => { N = n; T = n / FPS + 1e-6; vmiss = []; draw(); if (vmiss.length) { await loadV(); vmiss = []; draw(); } };
window.ready = (async () => { await Promise.all([...[700, 800, 900].map(w => document.fonts.load(`${w} 40px "Inter Display"`)), document.fonts.load('700 40px "JetBrains Mono"')]); makeNoise(); })();
