const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const chromePort = 9226;
  const chrome = spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${chromePort}`,
    '--blink-settings=primaryPointerType=4',
    '--hide-scrollbars',
    'about:blank'
  ]);

  const results = {
    checks: [],
    errors: [],
  };

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      results.errors.push(message);
      results.checks.push({ status: 'FAIL', message });
    } else {
      console.log(`✅ PASSED: ${message}`);
      results.checks.push({ status: 'PASS', message });
    }
  }

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

    function pageSend(method, params = {}) {
      return new Promise((res) => {
        const reqId = pageId++;
        pagePending.set(reqId, res);
        pageWs.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await pageSend('Page.enable');
    await pageSend('DOM.enable');
    await pageSend('Runtime.enable');
    await pageSend('Network.enable');

    // Set viewport to 1440x900
    await pageSend('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Set authentication cookies for localhost
    await pageSend('Network.setCookie', {
      name: 'auth-token',
      value: 'true',
      domain: 'localhost',
      path: '/',
    });
    await pageSend('Network.setCookie', {
      name: 'user-name',
      value: 'FREDY REYES BASURTO',
      domain: 'localhost',
      path: '/',
    });

    const routesToTest = [
      { path: '/modulos', isDashboard: false },
      { path: '/', isDashboard: true },
      { path: '/jefes-de-ventas', isDashboard: true },
      { path: '/jefes-de-ventas/1', isDashboard: true },
      { path: '/promotores', isDashboard: true },
      { path: '/colaboradores', isDashboard: true },
      { path: '/periodos', isDashboard: true },
    ];

    const screenshotsDir = '/home/fredy/.gemini/antigravity-ide/brain/1da7b9f2-7a91-4167-87cc-7234ed31e86e';

    async function waitForSplash() {
      for (let i = 0; i < 40; i++) {
        const hasSplash = await pageSend('Runtime.evaluate', {
          expression: `!!document.querySelector('.fixed.inset-0.z-50')`,
          returnByValue: true,
        });
        if (!hasSplash.result.value) {
          return;
        }
        await sleep(300);
      }
    }

    for (const route of routesToTest) {
      console.log(`\n--- Testing route: ${route.path} ---`);
      await pageSend('Page.navigate', { url: `http://localhost:3000${route.path}` });
      await sleep(1000);
      if (route.isDashboard) {
        await waitForSplash();
        await sleep(500);
      }

      // Audit headers and elements
      const auditResult = await pageSend('Runtime.evaluate', {
        expression: `(() => {
          const headers = Array.from(document.querySelectorAll('header'));
          const headerDetails = headers.map(h => {
            const rect = h.getBoundingClientRect();
            const cs = window.getComputedStyle(h);
            return {
              ariaLabel: h.getAttribute('aria-label'),
              className: h.className,
              height: Math.round(rect.height),
              bgColor: cs.backgroundColor,
              text: h.innerText.replace(/\\s+/g, ' ').trim()
            };
          });

          // Check institutional headers (bg #833177 / height 60px)
          const purple60Headers = headerDetails.filter(h => 
            (h.height === 60 || h.height === 59 || h.height === 61) && 
            (h.bgColor === 'rgb(131, 49, 119)' || h.bgColor.includes('131, 49, 119'))
          );

          // Logos: svgs that contain Liverpool logo paths (or aria-label="Liverpool")
          const logos = Array.from(document.querySelectorAll('svg[aria-label="Liverpool"]'));

          // Logout buttons: buttons with aria-label="Cerrar sesión"
          const logoutBtns = Array.from(document.querySelectorAll('button[aria-label="Cerrar sesión"]'));

          // Avatar: elements with initial "F" inside rounded-none border border-white/20
          const avatars = Array.from(document.querySelectorAll('*')).filter(el => {
            const cs = window.getComputedStyle(el);
            return el.innerText === 'F' && el.classList.contains('w-8') && el.classList.contains('h-8');
          });

          // Sidebar check
          const aside = document.querySelector('aside');
          let asideDetails = null;
          if (aside) {
            const asideLogos = aside.querySelectorAll('svg[aria-label="Liverpool"]');
            const asideLogout = aside.querySelectorAll('button[aria-label="Cerrar sesión"]');
            const asideText = aside.innerText;
            asideDetails = {
              hasLogo: asideLogos.length > 0,
              hasLogout: asideLogout.length > 0,
              hasProfile: asideText.includes('FREDY') || asideText.includes('Cerrar sesión')
            };
          }

          // MainContent check: any secondary greeting or secondary purple bar
          const secondaryGreeting = Array.from(document.querySelectorAll('h1, p')).some(el => 
            el.innerText.includes('Hola,') || el.innerText.includes('¡A darle con todo!')
          );

          return {
            totalHeaders: headers.length,
            headerDetails,
            purple60HeaderCount: purple60Headers.length,
            logoCount: logos.length,
            logoutBtnCount: logoutBtns.length,
            avatarCount: avatars.length,
            hasAside: !!aside,
            asideDetails,
            secondaryGreeting
          };
        })()`,
        returnByValue: true,
      });

      const data = auditResult.result.value;
      console.log('Audit data:', JSON.stringify(data, null, 2));

      assert(data.purple60HeaderCount === 1, `${route.path}: Exactly one 60px institutional purple header`);
      assert(data.logoCount === 1, `${route.path}: Exactly one Liverpool logo`);
      assert(data.avatarCount === 1, `${route.path}: Exactly one avatar with initial`);
      assert(data.logoutBtnCount === 1, `${route.path}: Exactly one logout button`);
      assert(!data.secondaryGreeting, `${route.path}: No secondary 'Hola, [nombre]' greeting or purple bar`);

      if (route.isDashboard) {
        assert(data.hasAside === true, `${route.path}: Sidebar is present`);
        assert(data.asideDetails && !data.asideDetails.hasLogo, `${route.path}: Sidebar has NO duplicate logo`);
        assert(data.asideDetails && !data.asideDetails.hasLogout, `${route.path}: Sidebar has NO logout button`);
        assert(data.asideDetails && !data.asideDetails.hasProfile, `${route.path}: Sidebar has NO profile block`);
      } else {
        assert(data.hasAside === false, `${route.path}: No sidebar present`);
      }

      // Save screenshot for /modulos and /
      if (route.path === '/modulos' || route.path === '/') {
        const screenshot = await pageSend('Page.captureScreenshot', { format: 'png' });
        const filename = route.path === '/modulos' ? 'screenshot_modulos_desktop.png' : 'screenshot_dashboard_desktop.png';
        fs.writeFileSync(path.join(screenshotsDir, filename), Buffer.from(screenshot.data, 'base64'));
        console.log(`Saved screenshot: ${filename}`);
      }
    }

    // Now test CORRECTION 1: LOGOUT ERROR HANDLING (Simulated Failure)
    console.log('\n--- Testing CORRECTION 1: Simulated Logout Failure ---');
    await pageSend('Page.navigate', { url: 'http://localhost:3000/modulos' });
    await sleep(1500);

    // Mock fetch in the page to simulate failure (500)
    await pageSend('Runtime.evaluate', {
      expression: `(() => {
        window._originalFetch = window.fetch;
        window.fetch = async function(url, options) {
          if (typeof url === 'string' && url.includes('/api/auth/logout')) {
            console.log('Simulating logout failure: returning 500 error');
            return {
              ok: false,
              status: 500,
              statusText: 'Internal Server Error',
              json: async () => ({ error: 'Logout request failed simulated' })
            };
          }
          return window._originalFetch.apply(this, arguments);
        };
      })()`,
    });

    // Click logout button
    await pageSend('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Cerrar sesión"]');
        btn.click();
      })()`,
    });

    // Wait a brief moment for catch block to execute
    await sleep(800);

    // Check URL, disabled status, UI integrity
    const failedLogoutState = await pageSend('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Cerrar sesión"]');
        return {
          currentUrl: window.location.href,
          btnDisabled: btn ? btn.disabled : null,
          hasContent: !!document.querySelector('main'),
          pageTitle: document.title
        };
      })()`,
      returnByValue: true,
    });

    console.log('Failed logout state:', failedLogoutState.result.value);
    const fls = failedLogoutState.result.value;
    assert(fls.currentUrl.includes('/modulos'), 'User remains on /modulos after logout failure');
    assert(fls.btnDisabled === false, 'Logout button is NOT disabled after failure and allows retry');
    assert(fls.hasContent === true, 'UI remains completely visible and intact');

    // Now test CORRECTION 1: SUCCESSFUL LOGOUT
    console.log('\n--- Testing CORRECTION 1: Successful Logout ---');
    // Restore real fetch
    await pageSend('Runtime.evaluate', {
      expression: `(() => {
        window.fetch = window._originalFetch;
      })()`,
    });

    // Click logout button for real
    await pageSend('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Cerrar sesión"]');
        btn.click();
      })()`,
    });

    // Wait for redirect to /login
    await sleep(2500);

    const successfulLogoutState = await pageSend('Runtime.evaluate', {
      expression: `(() => {
        return {
          currentUrl: window.location.href,
          isLoginPage: window.location.pathname === '/login',
          hasInstitutionalHeader: !!document.querySelector('button[aria-label="Cerrar sesión"]'),
          hasSimplifiedHeader: !!document.querySelector('header')
        };
      })()`,
      returnByValue: true,
    });

    console.log('Successful logout state:', successfulLogoutState.result.value);
    const sls = successfulLogoutState.result.value;
    assert(sls.isLoginPage, 'Redirected to /login after successful logout');
    assert(!sls.hasInstitutionalHeader, 'Login page does NOT have institutional header (no logout button, no user)');
    assert(sls.hasSimplifiedHeader, 'Login page retains simplified header');

    // Try navigating to protected route /modulos and / to verify session rejection
    await pageSend('Page.navigate', { url: 'http://localhost:3000/modulos' });
    await sleep(1500);
    const protectedAttempt1 = await pageSend('Runtime.evaluate', {
      expression: `window.location.pathname`,
      returnByValue: true,
    });
    assert(protectedAttempt1.result.value === '/login', 'Navigating to /modulos without session redirects to /login');

    await pageSend('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(1500);
    const protectedAttempt2 = await pageSend('Runtime.evaluate', {
      expression: `window.location.pathname`,
      returnByValue: true,
    });
    assert(protectedAttempt2.result.value === '/login', 'Navigating to / without session redirects to /login');

    // Test mobile responsive view (375x667)
    console.log('\n--- Testing Mobile View (375x667) ---');
    // Re-login
    await pageSend('Network.setCookie', {
      name: 'auth-token',
      value: 'true',
      domain: 'localhost',
      path: '/',
    });
    await pageSend('Network.setCookie', {
      name: 'user-name',
      value: 'FREDY REYES BASURTO',
      domain: 'localhost',
      path: '/',
    });

    await pageSend('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await pageSend('Page.navigate', { url: 'http://localhost:3000/modulos' });
    await sleep(1500);

    const mobileModulosScreenshot = await pageSend('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'screenshot_modulos_mobile.png'), Buffer.from(mobileModulosScreenshot.data, 'base64'));
    console.log('Saved screenshot: screenshot_modulos_mobile.png');

    await pageSend('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(1000);
    await waitForSplash();
    await sleep(500);

    const mobileDashboardScreenshot = await pageSend('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'screenshot_dashboard_mobile.png'), Buffer.from(mobileDashboardScreenshot.data, 'base64'));
    console.log('Saved screenshot: screenshot_dashboard_mobile.png');

    console.log('\n=======================================');
    console.log(`TOTAL CHECKS: ${results.checks.length}`);
    console.log(`PASSED: ${results.checks.filter(c => c.status === 'PASS').length}`);
    console.log(`FAILED: ${results.errors.length}`);
    console.log('=======================================');

  } catch (err) {
    console.error('Fatal error during test:', err);
  } finally {
    chrome.kill();
    process.exit(results.errors.length > 0 ? 1 : 0);
  }
}

main();
