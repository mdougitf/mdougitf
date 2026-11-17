// Usage : node render_motion.js <dossier_images_capture> <sortie.mp4> [navy|tech]
//         node render_motion.js <dossier_images_capture> --stills 1.2,5,9.5 <dossier_sortie> [navy|tech]
const PAGE = process.env.PAGE || 'motion.html';                  // PAGE=procrast.html pour le 2e Reel
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
(async () => {
  const [, , frames, a, b, c] = process.argv; const theme = (a === '--stills' ? process.argv[6] : b) || 'navy';
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => { console.error('PAGE', e.message); });
  await pg.goto('file://' + path.join(__dirname, PAGE) + '?theme=' + theme + '&fr=' + encodeURIComponent('file://' + path.resolve(frames)));
  await pg.evaluate(() => window.ready); const FPS = await pg.evaluate(() => FPS), DUR = await pg.evaluate(() => DUR);
  const [VW, VH] = await pg.evaluate(() => [W, H]); await pg.setViewportSize({ width: VW, height: VH });
  if (a === '--stills') {
    for (const t of b.split(',')) { await pg.evaluate(n => renderFrame(n), Math.round(t * FPS)); await pg.screenshot({ path: path.join(c, `f_${t}.jpg`), type: 'jpeg', quality: 80 }); }
  } else {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', a], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let n = 0; n < DUR * FPS; n++) {
      await pg.evaluate(n => renderFrame(n), n);
      const buf = await pg.screenshot({ type: 'jpeg', quality: 96 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    fs.writeFileSync(path.join(path.dirname(path.resolve(a)), 'sfx_events.json'), JSON.stringify(await pg.evaluate(() => [...SFX.values()])));
  }
  await br.close();
})();
