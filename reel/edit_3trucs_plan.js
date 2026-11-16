/* Plan du Reel « 3 trucs tout bêtes ». Chaque élément s'accroche à un mot prononcé (at('mot')) :
   si tu changes un peu le texte au tournage, il suffit d'ajuster les mots d'accroche ci-dessous. */
function plan() {
  const tFiches = at('fiches'), tApplis = at('applis'), tPlan = at('plannings'), tTrois = at('trois'), tPremier = at('premier'), tDeux = at('deuxieme'), tTrois2 = at('troisieme'), tFin = at('enregistre');
  punch(at('retenir'), at('probleme'), tTrois, at('cinq'), at('cuit'), at('energie'), at('fier'));
  // « j'ai tout essayé : les fiches, les applis, les plannings » → la pile, puis tout est éjecté sur « trois trucs »
  pile([['book', 300, 520, tFiches, -.1, 170], ['phone', 540, 420, tApplis, .06, 170], ['cal', 780, 520, tPlan, .1, 170],
        ['clock', 200, 760, tPlan + .25, .08, 140], ['pad', 880, 760, tPlan + .45, -.08, 140], ['laptop', 420, 700, tPlan + .65, -.05, 140], ['alert', 680, 690, tPlan + .85, .07, 130]], tTrois - .35, 540, 600);
  // les trois cartes : floutées, puis nettes une par une
  const cards = [['01', '5 MINUTES', tPremier, at('cinq')], ['02', 'LE PLUS DUR\nD\'ABORD', tDeux, at('dur')], ['03', '3 CHOSES', tTrois2, at('choses')]];
  if (T >= tTrois && T < tFin + 4) cards.forEach(([num, label, tAct, tRev], i) => {
    const next = cards[i + 1] ? cards[i + 1][2] : tFin, active = T >= tAct && T < next, done = T >= next, end = T >= tFin;
    const x = end ? 200 + i * 340 : active ? 540 : 200 + i * 340, y = active && !end ? 560 : 400, sc = active && !end ? 1.25 : .62;
    cardW(num, label, x, y, 520, 230, { t0: tTrois + .1 + i * .12, revealT: tRev, active, scale: sc, alpha: done && !end ? .55 : 1 });
  });
  // 1 : le chrono démarre ; 2 : la batterie se vide ; 3 : trois cases se cochent
  if (T >= at('cinq') && T < tDeux) { const left = 300 - (T - at('cinq')) * 9; chronoW(860, 760, 100, left / 300, mmss(left), { t0: at('cinq') + .3 }); }
  if (T >= at('cuit') - .4 && T < tTrois2) sticker(battery(lerp(1, .08, eo(p(at('cuit') - .4, 1.2)))), 860, 780, 170, { scale: lerp(.3, 1, ex(p(at('cuit') - .4, .28))) });
  if (T >= at('choses') && T < tFin) pile([0, 1, 2].map(i => ['check', 300 + i * 240, 800, at('choses') + .3 + i * .35, 0, 150]));
  // fin : enregistrer, sans bouton qui clignote
  if (T >= tFin) sticker('bookmark', 540, 780, 190, { scale: lerp(.3, 1, ex(p(tFin + .1, .3))) * (1 + .04 * Math.sin(T * 5)) });
}
