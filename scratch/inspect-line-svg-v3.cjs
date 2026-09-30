const { spawn } = require('child_process');
const { writeFileSync } = require('fs');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const chromePort = 9244;
  const chrome = spawn('/usr/bin/google-chrome-stable', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${chromePort}`,
    '--hide-scrollbars',
    'about:blank'
  ]);

  try {
    await sleep(2000);

    const versionRes = await (await fetch(`http://127.0.1:${chromePort}/json/version`)).json();
    const ws = new WebSocket(versionRes.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const pending = new Map();
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    function send(method, params = {}) {
      return new Promise((res) => {
        const reqId = id++;
        pending.set(reqId, res);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    const newTarget = await send('Target.createTarget', { url: 'about:blank' });
    const pages = await (await fetch(`http://127.0.1:${chromePort}/json`)).json();
    const targetPage = pages.find(p => p.id === newTarget.targetId);

    const pageWs = new WebSocket(targetPage.webSocketDebuggerUrl);
    await new Promise(r => pageWs.onopen = r);

    let pageId = 1;
    const pagePending = new Map();
    pageWs.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pagePending.has(msg.id)) {
        pagePending.get(msg.id)(msg.result);
        pagePending.delete(msg.id);
      }
    };

    function sendPage(method, params = {}) {
      return new Promise((res) => {
        const reqId = pageId++;
        pagePending.set(reqId, res);
        pageWs.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await sendPage('Page.enable');
    await sendPage('Runtime.enable');
    await sendPage('Network.enable');

    // Set auth cookies from the working auth
    await sendPage('Network.setCookie', { 
      name: 'auth-token', 
      value: 'true', 
      domain: '127.0.0.1', 
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax'
    });
    await sendPage('Network.setCookie', { 
      name: 'user-name', 
      value: 'FREDY REYES BASURTO', 
      domain: '127.0.0.1', 
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax'
    });

    await sendPage('Page.navigate', { url: 'http://127.0.0.1:3005/' });
    await sleep(3000);

    // Debug
    const debug = await sendPage('Runtime.evaluate', {
      expression: `({
        rechartsCount: document.querySelectorAll('.recharts-wrapper').length,
        chartCards: document.querySelectorAll('[data-universal-chart-card]').length,
        h2s: Array.from(document.querySelectorAll('h2')).map(h => h.textContent),
        viewTypes: Array.from(document.querySelectorAll('[data-universal-chart-card]')).map(c => c.dataset.chartType),
      })`,
      returnByValue: true
    });

    console.log('DEBUG:', JSON.stringify(debug.result.value, null, 2));

    // Cycle to LINE view
    for (let i = 0; i < 5; i++) {
      await sendPage('Runtime.evaluate', {
        expression: `document.querySelectorAll('button[aria-label^="Cambiar tipo"]').forEach(b => b.click())`,
        returnByValue: true
      });
      await sleep(800);
      
      const viewTypes = await sendPage('Runtime.evaluate', {
        expression: `Array.from(document.querySelectorAll('[data-universal-chart-card]')).map(c => c.dataset.chartType)`,
        returnByValue: true
      });
      console.log('View types after cycle', i, ':', viewTypes.result.value);
      if (viewTypes.result.value.every(v => v === 'line')) break;
    }

    // Inspect
    const results = await sendPage('Runtime.evaluate', {
      expression: `(() => {
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
      })()`,
      returnByValue: true
    });

    console.log('\n=== LINE VIEW SVG INSPECTION ===\n');
    results.result.value.forEach((r, i) => {
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

    writeFileSync('/tmp/line-inspection.json', JSON.stringify(results.result.value, null, 2));
    console.log('\nSaved to /tmp/line-inspection.json');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

main();