const { spawn } = require('child_process');
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const chromePort = 9242;
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

    const versionRes = await (await fetch(`http://127.0.0.1:${chromePort}/json/version`)).json();
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
    const pages = await (await fetch(`http://127.0.0.1:${chromePort}/json`)).json();
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

    // Set auth cookies
    await sendPage('Network.setCookie', { name: 'auth-token', value: 'true', domain: 'localhost', path: '/' });
    await sendPage('Network.setCookie', { name: 'user-name', value: 'FREDY REYES BASURTO', domain: 'localhost', path: '/' });

    // Navigate to dashboard
    await sendPage('Page.navigate', { url: 'http://127.0.0.1:3004/' });
    await sleep(3000);

    // Wait for charts to render
    for (let i = 0; i < 30; i++) {
      const chartsReady = await sendPage('Runtime.evaluate', {
        expression: `document.querySelectorAll('.recharts-wrapper').length >= 9`,
        returnByValue: true
      });
      if (chartsReady.result.value) break;
      await sleep(500);
    }

    // Switch all charts to LINE view
    await sendPage('Runtime.evaluate', {
      expression: `document.querySelectorAll('button[aria-label^="Cambiar tipo"]').forEach(b => { if (b.title?.includes("linea") || b.textContent?.includes("linea") || b.textContent?.includes("Línea")) b.click(); })`,
      returnByValue: true
    });
    await sleep(1000);

    // Cycle through views to find LINE
    for (let cycle = 0; cycle < 4; cycle++) {
      const viewTypes = await sendPage('Runtime.evaluate', {
        expression: `Array.from(document.querySelectorAll('[data-universal-chart-card]')).map(c => c.dataset.chartType)`,
        returnByValue: true
      });
      console.log('View types:', viewTypes.result.value);
      if (viewTypes.result.value.every(v => v === 'line')) break;
      
      await sendPage('Runtime.evaluate', {
        expression: `document.querySelectorAll('button[aria-label^="Cambiar tipo"]').forEach(b => b.click())`,
        returnByValue: true
      });
      await sleep(800);
    }

    // Now inspect each chart's SVG for LINE view
    const results = await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const charts = document.querySelectorAll('[data-universal-chart-card]');
        const results = [];
        
        charts.forEach((card, idx) => {
          const title = card.querySelector('h2')?.textContent || \`Chart \${idx}\`;
          
          // Find all line paths in the chart
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
              d: line.getAttribute('d')?.substring(0, 100) || 'none',
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
    console.log('\n\nSaved to /tmp/line-inspection.json');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

main();