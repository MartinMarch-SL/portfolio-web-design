import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const origin = 'http://localhost:4321';
const paths = ['', 'ruido/', 'ruido/tienda/'].map((page) => '/portfolio-web-design/' + page);
const preview = spawn('npm', ['run', 'preview', '--', '--host', 'localhost', '--port', '4321'], {
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'inherit'],
  detached: true,
});
let browser;
try {
  for (let attempt = 0; ; attempt++) {
    if (await fetch(origin + paths[0]).then((response) => response.ok).catch(() => false)) break;
    if (attempt === 99 || preview.exitCode !== null) throw new Error('Astro preview did not start on port 4321');
    await delay(100);
  }
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  for (const path of paths) {
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(origin + path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready.then(() => {}));
    await page.mouse.move(2, 420);
    const distance = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
    await page.evaluate(() => {
      const frames = [];
      let previous;
      let frame;
      function sample(now) {
        if (previous !== undefined) frames.push(now - previous);
        previous = now;
        frame = requestAnimationFrame(sample);
      }
      frame = requestAnimationFrame(sample);
      window.finishScrollSample = () => {
        cancelAnimationFrame(frame);
        return frames;
      };
    });
    const steps = 120;
    const start = performance.now();
    for (let step = 1; step <= steps; step++) {
      const delta = Math.round(distance * step / steps) - Math.round(distance * (step - 1) / steps);
      await page.mouse.wheel(0, delta);
      await delay(Math.max(0, start + step * 50 - performance.now()));
    }
    const frames = await page.evaluate(() => window.finishScrollSample());
    const fps = frames.length * 1000 / frames.reduce((total, delta) => total + delta, 0);
    const slow = frames.filter((delta) => delta > 20).length * 100 / frames.length;
    console.log(`${path}  avg FPS ${fps.toFixed(2)}  >20ms ${slow.toFixed(2)}%  longest ${Math.max(...frames).toFixed(2)}ms`);
    await page.close();
  }
} finally {
  await browser?.close();
  if (preview.pid && preview.exitCode === null) process.kill(-preview.pid, 'SIGTERM');
}
