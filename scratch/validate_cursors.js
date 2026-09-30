const { spawn } = require('child_process');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const chromePort = 9225;
  const chrome = spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${chromePort}`,
    '--blink-settings=primaryPointerType=4',
    '--hide-scrollbars',
    'about:blank'
  ]);

  try {
    await sleep(1500);

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

    // 1. Audit on /login
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('=== 1. AUDITORÍA EN /login ===');
    await sendPage('Page.navigate', { url: 'http://localhost:3000/login' });
    await sleep(2500);

    const loginAudit = await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const body = getComputedStyle(document.body).cursor;
        const emailInput = document.querySelector('input#username');
        const passInput = document.querySelector('input#password');
        const eyeBtn = document.querySelector('button[aria-label="Mostrar contraseña"], button[aria-label="Ocultar contraseña"]');
        const submitBtn = document.querySelector('button[type="submit"]');

        return {
          bodyCursor: body,
          emailCursor: emailInput ? getComputedStyle(emailInput).cursor : null,
          passCursor: passInput ? getComputedStyle(passInput).cursor : null,
          eyeBtnCursor: eyeBtn ? getComputedStyle(eyeBtn).cursor : null,
          submitBtnCursor: submitBtn ? getComputedStyle(submitBtn).cursor : null,
        };
      })()`,
      returnByValue: true
    });
    console.log('Login Audit Results:\n', JSON.stringify((loginAudit.result || loginAudit).value, null, 2));

    const loginShot = await sendPage('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/home/fredy/.gemini/antigravity-ide/brain/1da7b9f2-7a91-4167-87cc-7234ed31e86e/cursor_login_desktop.png', Buffer.from(loginShot.data, 'base64'));
    console.log('Screenshot guardado: cursor_login_desktop.png');

    // 2. Test Login & /modulos
    console.log('\n=== 2. AUDITORÍA EN /modulos ===');
    await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const emailInput = document.querySelector('input#username');
        const passInput = document.querySelector('input#password');
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(emailInput, 'freyesb02@gmail.com');
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        nativeInputValueSetter.call(passInput, 'admin');
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('button[type="submit"]').click();
      })()`
    });

    await sleep(2500);

    const modulosAudit = await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const body = getComputedStyle(document.body).cursor;
        const creditoCard = document.querySelector('a[aria-label="Abrir módulo Crédito"]');
        const clickCollect = document.querySelector('section[aria-labelledby="module-click-collect-heading"]');
        const inventarios = document.querySelector('section[aria-labelledby="module-inventarios-heading"]');
        const logoutBtn = document.querySelector('button[aria-label="Cerrar sesión"]');

        return {
          bodyCursor: body,
          creditoCardCursor: creditoCard ? getComputedStyle(creditoCard).cursor : null,
          clickCollectCursor: clickCollect ? getComputedStyle(clickCollect).cursor : null,
          inventariosCursor: inventarios ? getComputedStyle(inventarios).cursor : null,
          logoutBtnCursor: logoutBtn ? getComputedStyle(logoutBtn).cursor : null,
        };
      })()`,
      returnByValue: true
    });
    console.log('/modulos Audit Results:\n', JSON.stringify((modulosAudit.result || modulosAudit).value, null, 2));

    const modulosShot = await sendPage('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/home/fredy/.gemini/antigravity-ide/brain/1da7b9f2-7a91-4167-87cc-7234ed31e86e/cursor_modulos_desktop.png', Buffer.from(modulosShot.data, 'base64'));
    console.log('Screenshot guardado: cursor_modulos_desktop.png');

    // 3. Test Dashboard (/)
    console.log('\n=== 3. AUDITORÍA EN / (DASHBOARD) ===');
    await sendPage('Page.navigate', { url: 'http://localhost:3000/' });
    
    // Wait for splash screen to clear and dashboard to render
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      const hasRecharts = await sendPage('Runtime.evaluate', {
        expression: '!!document.querySelector(".recharts-wrapper")',
        returnByValue: true
      });
      if ((hasRecharts.result || hasRecharts).value) {
        console.log('Dashboard Recharts detectado tras', (i+1)*500, 'ms');
        break;
      }
    }

    const dashboardAudit = await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const rechartsWrapper = document.querySelector('.recharts-wrapper');
        const rechartsSurface = document.querySelector('.recharts-surface');
        const sidebarLink = document.querySelector('aside nav a');
        const chartButton = document.querySelector('header button[aria-label*="Cambiar tipo de gráfica"]');
        const creditoAccordion = document.querySelector('button[aria-controls="credito-menu"]');

        return {
          rechartsWrapperCursor: rechartsWrapper ? getComputedStyle(rechartsWrapper).cursor : 'NOT_FOUND',
          rechartsSurfaceCursor: rechartsSurface ? getComputedStyle(rechartsSurface).cursor : 'NOT_FOUND',
          rechartsContainsLiverpoolCursor: rechartsWrapper ? getComputedStyle(rechartsWrapper).cursor.includes('liverpool') : false,
          sidebarLinkCursor: sidebarLink ? getComputedStyle(sidebarLink).cursor : null,
          chartButtonCursor: chartButton ? getComputedStyle(chartButton).cursor : null,
          creditoAccordionCursor: creditoAccordion ? getComputedStyle(creditoAccordion).cursor : null,
        };
      })()`,
      returnByValue: true
    });
    console.log('Dashboard Audit Results:\n', JSON.stringify((dashboardAudit.result || dashboardAudit).value, null, 2));

    const dashboardShot = await sendPage('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/home/fredy/.gemini/antigravity-ide/brain/1da7b9f2-7a91-4167-87cc-7234ed31e86e/cursor_dashboard_desktop.png', Buffer.from(dashboardShot.data, 'base64'));
    console.log('Screenshot guardado: cursor_dashboard_desktop.png');

    // 4. Test Coarse Pointer (@media pointer: coarse)
    console.log('\n=== 4. AUDITORÍA EN POINTER: COARSE ===');
    await sendPage('Emulation.setEmulatedMedia', {
      features: [{ name: 'pointer', value: 'coarse' }]
    });
    await sleep(500);

    const coarseAudit = await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const body = getComputedStyle(document.body).cursor;
        const btn = document.querySelector('button[aria-controls="credito-menu"]');
        const btnCursor = btn ? getComputedStyle(btn).cursor : '';
        return {
          bodyCursorCoarse: body,
          buttonCursorCoarse: btnCursor,
          hasCustomCursorOnBody: body.includes('liverpool'),
          hasCustomCursorOnButton: btnCursor.includes('liverpool')
        };
      })()`,
      returnByValue: true
    });
    console.log('Coarse Pointer Audit Results:\n', JSON.stringify((coarseAudit.result || coarseAudit).value, null, 2));

    pageWs.close();
    ws.close();
  } catch (err) {
    console.error('Error during validation:', err);
  } finally {
    chrome.kill();
  }
}

main();
