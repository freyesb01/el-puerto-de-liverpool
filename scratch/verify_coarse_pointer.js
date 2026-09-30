const { spawn } = require('child_process');

async function main() {
  const chromePort = 9230;
  // Launching Chromium with touch device emulation (primaryPointerType=2: coarse)
  const chrome = spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${chromePort}`,
    '--blink-settings=primaryPointerType=2',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
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

    const newTarget = await send('Target.createTarget', { url: 'http://localhost:3000/login' });
    await new Promise(r => setTimeout(r, 2000));
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

    await sendPage('Runtime.enable');
    const result = await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const matchesCoarse = window.matchMedia('(pointer: coarse)').matches;
        const matchesFine = window.matchMedia('(pointer: fine)').matches;
        const bodyCursor = getComputedStyle(document.body).cursor;
        const submitBtn = document.querySelector('button[type="submit"]');
        const submitCursor = submitBtn ? getComputedStyle(submitBtn).cursor : null;
        return {
          matchesCoarse,
          matchesFine,
          bodyCursor,
          submitCursor,
          hasCustomCursor: bodyCursor.includes('liverpool') || (submitCursor && submitCursor.includes('liverpool'))
        };
      })()`,
      returnByValue: true
    });

    console.log('Touch / Coarse Device Verification Result:');
    console.log(JSON.stringify((result.result || result).value, null, 2));

    pageWs.close();
    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

main();
