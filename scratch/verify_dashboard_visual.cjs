// Local Chrome/CDP verification. Reads real data; never writes to Google Sheets.
//
// Configuration via environment variables:
//   CHROME_PATH   – absolute path to Chrome binary (auto-detected if omitted)
//   APP_URL       – base URL of the running app (default: http://127.0.0.1:3000)
//   TEST_EMAIL    – login email  (REQUIRED)
//   TEST_PASSWORD – login password (REQUIRED)
//
// Credentials are NEVER echoed to stdout/stderr.
// Usage:
//   TEST_EMAIL=user@example.com TEST_PASSWORD=secret node scratch/verify_dashboard_visual.cjs
//   TEST_EMAIL=user@example.com TEST_PASSWORD=secret node scratch/verify_dashboard_visual.cjs --baseline

const { spawn, execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const baseline = process.argv.includes('--baseline');
const mode = baseline ? 'baseline' : 'after';
const output = join('.local-run', 'dashboard-visual', mode);
mkdirSync(output, { recursive: true });

// ---------------------------------------------------------------------------
// Resolve Chrome binary (never hardcoded)
// ---------------------------------------------------------------------------
function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium']) {
    try { return execFileSync('which', [bin], { encoding: 'utf8' }).trim(); } catch { /* not found */ }
  }
  throw new Error(
    'Chrome binary not found. Set CHROME_PATH env variable to the absolute path of your Chrome/Chromium executable.'
  );
}

// ---------------------------------------------------------------------------
// Resolve credentials — never logged
// ---------------------------------------------------------------------------
function resolveCredentials() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Missing credentials.\n' +
      'Set TEST_EMAIL and TEST_PASSWORD environment variables before running this script.\n' +
      'Example: TEST_EMAIL=you@example.com TEST_PASSWORD=secret node scratch/verify_dashboard_visual.cjs'
    );
  }
  return { email, password };
}

const APP_URL = (process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const chromePath = resolveChrome();
const { email, password } = resolveCredentials();

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9241',
    `--user-data-dir=${mkdtempSync('/tmp/liverpool-visual-')}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

let ws;
const errors = [];
const results = [];

function measurePage() {
  const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
  const plots = [...document.querySelectorAll('.recharts-wrapper')];
  return plots.map(el => {
    const card = el.closest('section');
    let fiber = el[Object.keys(el).find(k => k.startsWith('__reactFiber'))];
    while (fiber && !Array.isArray(fiber.memoizedProps?.data)) fiber = fiber.return;
    const title = card.querySelector('h2');
    const button = card.querySelector('button[aria-label^="Cambiar tipo"]');
    const value = card.querySelector('[data-chart-value]') || card.querySelector('p.font-mono');
    const ticks = [...el.querySelectorAll('.recharts-cartesian-axis-tick text, .recharts-polar-angle-axis-tick text')];
    const texts = ticks.map(t => ({ text: t.textContent, ...rect(t) }));
    const bounds = rect(card);
    const clipped = texts.filter(t =>
      t.x < bounds.x - 2 ||
      t.x + t.width > bounds.x + bounds.width + 2 ||
      t.y + t.height > bounds.y + bounds.height + 2
    );
    return {
      title: title?.textContent,
      value: value?.textContent,
      card: bounds,
      plot: rect(el),
      titleTop: rect(title).y - bounds.y,
      plotTop: rect(el).y - bounds.y,
      type: card.dataset.chartType || button?.title,
      data: fiber?.memoizedProps.data,
      font: getComputedStyle(title).fontSize,
      legend: !!card.querySelector('ul[aria-label="Leyenda"]'),
      clipped,
    };
  });
}

(async () => {
  // Wait for Chrome CDP
  let pages;
  for (let i = 0; i < 40; i++) {
    try { pages = await (await fetch('http://127.0.0.1:9241/json')).json(); break; } catch { await delay(250); }
  }
  assert(pages, 'Chrome did not start');

  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0;
  const pending = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) pending.get(m.id)?.(m);
    else if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    const t = setTimeout(() => { pending.delete(n); reject(new Error('CDP timeout ' + method)); }, 30000);
    pending.set(n, m => { clearTimeout(t); pending.delete(n); m.error ? reject(new Error(m.error.message)) : resolve(m.result); });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const navigate = async path => { await send('Page.navigate', { url: APP_URL + path }); await delay(1500); };
  const screenshot = async (name, clip) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? { clip } : {}) });
    writeFileSync(join(output, name + '.png'), Buffer.from(r.data, 'base64'));
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  await navigate('/login');

  // Credentials are passed through JSON serialization — never logged
  const authStatus = await evaluate(
    `fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:${JSON.stringify(email)},password:${JSON.stringify(password)}})}).then(r=>r.status)`
  );
  assert.equal(authStatus, 200, 'Authentication failed — verify TEST_EMAIL and TEST_PASSWORD');

  await navigate('/');
  for (let i = 0; i < 120; i++) {
    if (await evaluate('document.querySelectorAll(".recharts-wrapper").length===9')) break;
    await delay(1000);
  }
  assert.equal(await evaluate('document.querySelectorAll(".recharts-wrapper").length'), 9, 'Nine real-data plots must load');

  writeFileSync(join(output, 'loading-errors.json'), JSON.stringify(errors, null, 2));
  errors.length = 0;

  for (const width of [1920, 1440, 1024, 768, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 });
    for (const type of ['bar', 'line', 'area', 'radar']) {
      await delay(3000);
      const cards = await evaluate(`(${measurePage.toString()})()`);
      const overflow = await evaluate('({page:document.documentElement.scrollWidth>innerWidth,main:[...document.querySelectorAll("main")].some(e=>e.scrollWidth>e.clientWidth+1)})');
      const result = { width, type, cards, overflow };
      results.push(result);
      assert.equal(cards.length, 9);
      if (!baseline) {
        assert(cards.every(c => c.plot.height === 300), '300 px shared plot height');
        assert(cards.every(c => c.legend), 'Shared legends');
        assert(cards.every(c => c.font === '15px'), 'Shared title font');
        assert(!overflow.page && !overflow.main, `Overflow at ${width}/${type}`);
        const previous = results.find(r => r.width === width && r.type === 'bar');
        cards.forEach((card, i) => {
          assert.equal(card.card.height, previous.cards[i].card.height, `Stable card height ${i}`);
          assert.equal(card.plotTop, previous.cards[i].plotTop, `Stable plotTop ${i}`);
        });
      }
      // Only log non-sensitive metrics
      console.log(mode, width, type, JSON.stringify({
        heights: cards.map(c => c.card.height),
        plots: cards.map(c => c.plot.width),
        clipped: cards.map(c => c.clipped.length),
        overflow,
      }));
      result.tooltips = [];
      if (!baseline) for (let i = 0; i < 9; i++) {
        const position = await evaluate(
          `(()=>{const c=document.querySelectorAll('[data-universal-chart-card]')[${i}];c.scrollIntoView({block:'center'});const r=c.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`
        );
        await screenshot(`${width}-${type}-${i + 1}`, position);
        const plot = await evaluate(
          `(()=>{const r=document.querySelectorAll('.recharts-wrapper')[${i}].getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`
        );
        let tooltip = null;
        for (const factor of [0.5, 0.3, 0.7]) {
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: plot.x + plot.width * factor, y: plot.y + plot.height * 0.45 });
          await delay(100);
          tooltip = await evaluate(
            `(()=>{const el=document.querySelectorAll('[data-universal-chart-card]')[${i}].querySelector('[data-universal-tooltip]');if(!el||getComputedStyle(el.closest('.recharts-tooltip-wrapper')).visibility==='hidden')return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,text:el.innerText}})()`
          );
          if (tooltip) break;
        }
        result.tooltips.push(tooltip);
        if (tooltip) {
          assert(
            tooltip.x >= 0 && tooltip.x + tooltip.width <= width + 1 &&
            tooltip.y >= 0 && tooltip.y + tooltip.height <= 1001,
            `Tooltip outside viewport ${width}/${type}/${i}`
          );
        }
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
      }
      // Cycle chart type for next iteration
      await evaluate(`document.querySelectorAll('button[aria-label^="Cambiar tipo de gráfica de"]').forEach(b=>b.click())`);
    }
  }

  // Regression: shared components must not change /periodos
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate('/periodos');
  for (let i = 0; i < 90; i++) {
    if (await evaluate('document.querySelectorAll(".recharts-wrapper").length===6')) break;
    await delay(1000);
  }
  const periodos = await evaluate(`(${measurePage.toString()})()`);
  writeFileSync(join(output, 'periodos.json'), JSON.stringify(periodos, null, 2));

  if (!baseline) {
    const baseResultsPath = '.local-run/dashboard-visual/baseline/results.json';
    const basePeriodosPath = '.local-run/dashboard-visual/baseline/periodos.json';
    if (existsSync(baseResultsPath)) {
      const before = JSON.parse(readFileSync(baseResultsPath, 'utf8'));
      results.forEach((r, index) => r.cards.forEach((c, i) => {
        assert.equal(c.title, before[index].cards[i].title, 'Title preserved');
        assert.equal(c.value, before[index].cards[i].value, 'KPI preserved');
        assert.deepEqual(c.data, before[index].cards[i].data, 'Plot data preserved');
      }));
    }
    if (existsSync(basePeriodosPath)) {
      const old = JSON.parse(readFileSync(basePeriodosPath, 'utf8'));
      assert.deepEqual(
        periodos.map(c => [c.card.width, c.card.height, c.plot.width, c.plot.height, c.value, c.data]),
        old.map(c => [c.card.width, c.card.height, c.plot.width, c.plot.height, c.value, c.data]),
        'Periodos unchanged'
      );
    }
  }

  assert.deepEqual(errors, [], 'No browser exceptions');
  console.log('PASS', mode, '20 viewport/type combinations; all nine charts; Periodos regression');
})()
  .catch(e => { console.error(e.stack); process.exitCode = 1; })
  .finally(() => {
    writeFileSync(join(output, 'results.json'), JSON.stringify(results, null, 2));
    writeFileSync(join(output, 'errors.json'), JSON.stringify(errors, null, 2));
    ws?.close();
    chrome.kill();
  });
