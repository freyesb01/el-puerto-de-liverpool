const { spawn, execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, writeFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function resolveChrome() {
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  for (const bin of ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium']) {
    try { return execFileSync('which', [bin], { encoding: 'utf8' }).trim(); } catch { }
  }
  throw new Error('Chrome binary not found');
}

const APP_URL = 'http://127.0.0.1:3005';
const chromePath = resolveChrome();

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9245',
    `--user-data-dir=${mkdtempSync('/tmp/liverpool-line-inspect-')}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

let ws;
const errors = [];

async function main() {
  // Wait for Chrome CDP
  let pages;
  for (let i = 0; i < 40; i++) {
    try { pages = await (await fetch('http://127.0.1:9245/json')).json(); break; } catch { await delay(250); }
  }
  if (!pages) throw new Error('Chrome did not start');

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

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  await navigate('/login');

  const authStatus = await evaluate(
    `fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:"freyesb02@gmail.com",password:"admin"})}).then(r=>r.status)`
  );
  if (authStatus !== 200) throw new Error('Authentication failed');

  await navigate('/');
  for (let i = 0; i < 120; i++) {
    if (await evaluate('document.querySelectorAll(".recharts-wrapper").length===9')) break;
    await delay(1000);
  }
  if (!(await evaluate('document.querySelectorAll(".recharts-wrapper").length===9'))) {
    throw new Error('Nine real-data plots must load');
  }

  // Cycle to LINE view
  for (let cycle = 0; cycle < 5; cycle++) {
    await evaluate(`document.querySelectorAll('button[aria-label^="Cambiar tipo"]').forEach(b=>b.click())`);
    await delay(800);
    const viewTypes = await evaluate(`Array.from(document.querySelectorAll('[data-universal-chart-card]')).map(c => c.dataset.chartType)`);
    console.log('View types after cycle', cycle, ':', viewTypes);
    if (viewTypes.every(v => v === 'line')) break;
  }

  // Inspect SVG
  const results = await evaluate(`(() => {
    const charts = document.querySelectorAll('[data-universal-chart-card]');
    const results = [];
    
    charts.forEach((card, idx) => {
      const title = card.querySelector('h2')?.textContent || \`Chart \${idx}\`;
      
      const lines = card.querySelectorAll('.recharts-line');
      const dots = card.querySelectorAll('.recharts-dot');
      
      const lineData = Array.from(lines).map((line, i) => {
        const style = window.getComputedStyle(line);
        const isTarget = line.getAttribute('data-name')?.includes('Plan') || 
                        line.getAttribute('data-name')?.includes('Meta') ||
                        line.getAttribute('data-name')?.includes('100%');
        return {
          index: i,
          isTarget,
          name: line.getAttribute('data-name') || 'unknown',
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeOpacity: style.strokeOpacity,
          opacity: style.opacity,
          fill: style.fill,
        };
      });
      
      const dotData = Array.from(dots).map((dot, i) => {
        const style = window.getComputedStyle(dot);
        return {
          index: i,
          fill: style.fill,
          fillOpacity: style.fillOpacity,
          opacity: style.opacity,
          r: dot.getAttribute('r'),
          cx: dot.getAttribute('cx'),
          cy: dot.getAttribute('cy'),
        };
      });
      
      results.push({ title, lines: lineData, dots: dotData });
    });
    
    return results;
  })()`);

  console.log('\n=== LINE VIEW SVG INSPECTION ===\n');
  results.forEach((r, i) => {
    console.log(`\n--- ${i+1}. ${r.title} ---`);
    console.log('LINES:');
    r.lines.forEach(l => {
      console.log(`  [${l.index}] ${l.name} (target: ${l.isTarget})`);
      console.log(`    stroke: ${l.stroke}`);
      console.log(`    strokeWidth: ${l.strokeWidth}`);
      console.log(`    strokeOpacity: ${l.strokeOpacity}`);
      console.log(`    opacity: ${l.opacity}`);
      console.log(`    fill: ${l.fill}`);
    });
    console.log('DOTS:');
    r.dots.forEach(d => {
      console.log(`  [${d.index}] r=${d.r} cx=${d.cx} cy=${d.cy} fill=${d.fill} fillOpacity=${d.fillOpacity} opacity=${d.opacity}`);
    });
  });

  writeFileSync('/tmp/line-inspection.json', JSON.stringify(results, null, 2));
  console.log('\nSaved to /tmp/line-inspection.json');

  assert.deepEqual(errors, [], 'No browser exceptions');
}

main()
  .catch(e => { console.error(e.stack); process.exitCode = 1; })
  .finally(() => { ws?.close(); chrome.kill(); });