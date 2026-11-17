/* Plan du montage horizontal « 3 règles » (1920×1080).
   Le sujet est au centre : les éléments vivent à gauche (x ≈ 420) et à droite (colonne des 3 cartes, x ≈ 1500).
   Tout est accroché aux mots prononcés (atx = mot exact, n-ième occurrence). */
const atx = (word, n = 1) => { const hit = WORDS.filter(w => w[1] === word)[n - 1]; return hit ? hit[0] : 1e9; };
const LX = 430, LY = 400, RX = 1490;
function bigNum(txt, x, y, t0, strikeT) {                      // gros chiffre sur pastille, barré au besoin
  if (T < t0) return; sfx('pop', t0); const s = lerp(.3, 1, ex(p(t0, .28)));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#0d1017'; rr(-110, -95, 220, 190, 40); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 5; ctx.strokeStyle = WHITE; rr(-110, -95, 220, 190, 40); ctx.stroke();
  ctx.font = `900 130px ${FF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = WHITE; ctx.fillText(txt, 0, 8); ctx.restore();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (strikeT !== undefined && T >= strikeT) { brush(x - 120, y + 6, x + 120, 26, p(strikeT, .22), ACCENT, 3); sfx('scratch', strikeT); }
}
function plan() {
  const tTrois = atx('trois'), t5a = atx('5', 1), t5b = atx('5', 2), tArrete = atx('arrete', 1), tDeux = atx('deuxieme'), tSoir = atx('soir'),
        tFat = atx('fatigue', 1), tFac = atx('faciles'), tTroisieme = atx('3eme'), t3a = atx('3', 1), t12 = atx('12'), t3b = atx('3', 2), t3c = atx('3', 3),
        tFier = atx('fier'), tSi = atx('si'), tAbo = atx('abonner'), tEnr = atx('enregistrer'), tHave = atx('have');
  punch(atx('premier'), atx('envie'), t5a, tArrete, t5b, atx('attaque'), tDeux, atx('dures'), tFat, tFac, tTroisieme, t3a, t12, t3c, tFier, tAbo, tEnr);

  // accroche : titre à gauche dès la première image
  if (T < atx('premier') + .2) cardW('procrastination', "3 RÈGLES\nPOUR T'Y METTRE", LX, 420, 560, 300, { t0: .05, active: true, alpha: 1 - p(atx('premier'), .2) });
  // les 3 cartes à droite : floutées, puis nettes au moment où chaque règle est dite
  const cards = [['01', '5 MINUTES', atx('premier'), t5a], ['02', 'PAS LE SOIR', tDeux, tSoir], ['03', '3 TÂCHES', tTroisieme, t3a]];
  if (T >= tTrois && T < tSi + .5) cards.forEach(([num, label, tAct, tRev], i) => {
    const next = cards[i + 1] ? cards[i + 1][2] : tSi, active = T >= tAct && T < next, out = T >= tSi ? 1 - eo(p(tSi, .45)) : 1;
    cardW(num, label, RX + (1 - out) * 500, 270 + i * 215, 440, 160, { t0: tTrois + i * .12, revealT: tRev, active, scale: active ? 1.08 : .92, alpha: (T >= next ? .55 : 1) * out });
  });

  // règle 1 : pas envie → le cours → le chrono démarre… et ne s'arrête plus
  if (T >= atx('envie') && T < t5a) sticker(battery(.12), LX, LY, 170, { scale: lerp(.3, 1, ex(p(atx('envie'), .28))) });
  if (T >= atx('cours') && T < t5a) sticker('book', LX + 190, LY - 110, 130, { scale: lerp(.3, 1, ex(p(atx('cours'), .28))), rot: .1 });
  if (T >= t5a && T < tArrete) {
    const run = Math.max(0, T - atx('minutes', 1)), left = 300 - run * 25; chronoW(LX, LY, 120, left / 300, mmss(left), { t0: t5a });
    for (let t = atx('minutes', 1); t < tArrete; t += .5) sfx('tick', t);
  }
  if (T >= tArrete && T < t5b - .4) { sfx('boom', tArrete); chronoW(LX, LY, 120, ((T - tArrete) * .7) % 1, '+' + mmss((T - tArrete) * 180), { color: ACCENT, scale: 1 + .16 * (1 - eo(p(tArrete, .4))) }); }
  if (T >= t5b - .4 && T < tDeux) {
    chronoW(LX, LY, 120, 1, '05:00', { t0: t5b - .4, color: ACCENT });
    if (T >= atx('attaque')) sticker('bolt', LX + 210, LY - 120, 120, { scale: lerp(.3, 1, ex(p(atx('attaque'), .28))), rot: -.12 });
  }
  // règle 2 : le plus dur, pas le soir → cerveau fatigué → tâches faciles
  if (T >= atx('dures') && T < tFac) {
    sticker('alert', LX - 150, LY - 90, 120, { scale: lerp(.3, 1, ex(p(atx('dures'), .28))), rot: -.1 });
    if (T >= tSoir) sticker('moon', LX + 30, LY - 140, 140, { scale: lerp(.3, 1, ex(p(tSoir, .28))), rot: .08 });
    if (T >= tFat) sticker(battery(lerp(1, .08, eo(p(tFat, 1.2)))), LX + 60, LY + 70, 180, { scale: lerp(.3, 1, ex(p(tFat, .28))) });
    if (T >= atx('cerveau')) sticker('brain', LX - 170, LY + 110, 130, { scale: lerp(.3, 1, ex(p(atx('cerveau'), .28))), rot: .1 });
  }
  if (T >= tFac && T < tTroisieme) pile([['book', LX - 120, LY - 60, atx('flashcard'), -.1, 150], ['cal', LX + 110, LY - 90, atx('fiche'), .08, 150], ['check', LX, LY + 110, atx('importe'), 0, 150]], tTroisieme - .45, LX, LY);
  // règle 3 : le matin, 3 tâches, pas 12
  if (T >= tTroisieme && T < tSi) {
    if (T >= atx('matin') && T < t12) sticker('clock', LX, LY - 150, 130, { scale: lerp(.3, 1, ex(p(atx('matin'), .28))) });
    if (T >= t12 && T < t3b) bigNum('12', LX, LY - 60, t12, t12 + .35);
    if (T >= t3a) [0, 1, 2].forEach(i => {
      const t0 = t3a + .18 * i, pulse = T >= t3c ? 1 + .12 * (1 - eo(p(t3c + .08 * i, .35))) : 1;
      sticker('check', LX - 170 + i * 170, T >= t12 && T < t3b ? LY + 150 : LY + 60, 130, { scale: lerp(.3, 1, ex(p(t0, .28))) * pulse }); sfx('pop', t0);
    });
    if (T >= tFier) { for (let k = 0; k < 4; k++) sparkle(LX - 200 + k * 130, LY - 170 + (k % 2) * 60, 40 * eo(p(tFier + k * .08, .3)) * (1 + .15 * Math.sin(T * 7 + k)), T * .5 + k, 1, ACCENT); sfx('chime', tFier); }
  }
  // fin : s'abonner + enregistrer
  if (T >= tAbo) { pillW('+ abonne-toi', LX, LY, tAbo, 60); sfx('chime', tAbo); }
  if (T >= tEnr) sticker('bookmark', RX, LY, 190, { scale: lerp(.3, 1, ex(p(tEnr, .3))) * (1 + .04 * Math.sin(T * 5)) });
}
