// Usage : node render_motion.js <dossier_images_capture> <sortie.mp4>
//         node render_motion.js <dossier_images_capture> --stills 1.2,5,9.5 <dossier_sortie>
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
(async () => {
  const [, , frames, a, b, c] = process.argv;
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => { console.error('PAGE', e.message); });
  await pg.goto('file://' + path.join(__dirname, 'motion.html') + '?fr=' + encodeURIComponent('file://' + path.resolve(frames)));
  await pg.evaluate(() => window.ready);
  if (a === '--stills') {
    for (const t of b.split(',')) { await pg.evaluate(n => renderFrame(n), Math.round(t * 30)); await pg.screenshot({ path: path.join(c, `f_${t}.jpg`), type: 'jpeg', quality: 80 }); }
  } else {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', '30', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', a], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let n = 0; n < 42 * 30; n++) {
      await pg.evaluate(n => renderFrame(n), n);
      const buf = await pg.screenshot({ type: 'jpeg', quality: 96 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    fs.writeFileSync(path.join(path.dirname(path.resolve(a)), 'sfx_events.json'), JSON.stringify(await pg.evaluate(() => [...SFX.values()])));
  }
  await br.close();
})();
