/* Plan de la maquette (ancienne prise horizontale) : ce qui surgit au-dessus de la tête, et quand. */
function plan() {
  punch(1.2, 2.4, 3.3, 6.2, 10.7, 12.1, 15.0, 16.3, 18.55, 19.7);
  // 0–5,8 s : le cerveau, puis tout ce qui lui demande un effort s'empile… et se fait éjecter
  pile([['brain', 540, 400, 1.15, 0, 190], ['book', 300, 330, 3.1, -.12], ['laptop', 790, 340, 3.35, .1], ['cal', 180, 480, 3.6, .08, 130], ['clock', 900, 500, 3.85, -.1, 130], ['alert', 400, 520, 4.1, .06, 120], ['pad', 690, 520, 4.3, -.08, 120]].filter(i => i[0] !== 'brain' || T < 6), 4.6);
  // 6–9,5 s : la réponse existe, mais floutée
  const rev = 10.55;
  if (T >= 6.25 && T < 12.5) cardW('la règle', '5 MINUTES', lerp(540, 330, eo(p(rev + .5, .4))), 400, 520, 210, { t0: 6.25, revealT: rev, active: T >= rev, scale: lerp(1, .8, eo(p(rev + .5, .4))) });
  // 10,7 s → : le chrono à côté de la carte, puis il descend
  if (T >= 11.0 && T < 12.5) chronoW(800, 400, 110, eo(p(11.0, .5)), '05:00', { t0: 11.0 });
  if (T >= 12.5 && T < 17.9) {
    const left = 300 - (T - 12.5) * 22; chronoW(540, 390, 130, left / 300, mmss(left), { t0: 12.5 });
    for (let t = 12.6; t < 14.5; t += .5) sfx('tick', t);
    if (T >= 14.9) { sticker(battery(lerp(.1, 1, eo(p(15.0, 1.0)))), 860, 400, 150, { scale: lerp(.3, 1, ex(p(14.9, .28))) }); sfx('pop', 14.9); }
    if (T >= 16.3) { sticker('check', 220, 400, 150, { scale: lerp(.3, 1, ex(p(16.3, .28))) }); sfx('chime', 16.3); }
  }
  // 17,9 s → : les 5 minutes filent, boum, ça continue
  if (T >= 17.9 && T < 18.55) { const left = lerp(190, 0, (T - 17.9) / .62); chronoW(540, 390, 130, left / 300, mmss(left)); for (let t = 17.9; t < 18.5; t += .08) sfx('tick', t); }
  if (T >= 18.55 && T < 20.3) {
    sfx('boom', 18.55); chronoW(540, 390, 130, ((T - 18.55) * .7) % 1, '+' + mmss((T - 18.55) * 400), { color: ACCENT, scale: 1 + .16 * (1 - eo(p(18.55, .4))) });
    pile([['check', 250, 330, 18.85, -.1, 130], ['check', 830, 330, 19.1, .1, 130], ['bolt', 200, 500, 19.35, .08, 120], ['check', 880, 500, 19.55, -.06, 120]]);
  }
  // fin : enregistrer + s'abonner
  if (T >= 20.3) { sticker('bookmark', 330, 400, 170, { scale: lerp(.3, 1, ex(p(20.4, .28))) * (1 + .05 * Math.sin(T * 6)) }); sfx('chime', 20.4); pillW('+ abonne-toi', 700, 400, 20.75, 50); }
}
