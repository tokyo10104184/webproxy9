const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:3000');

  try {
    await page.waitForSelector('div:has-text("準備完了を待機中...")', { timeout: 10000 });
    console.log('Detected log: "準備完了を待機中..."');
  } catch (e) {
    console.log('Log "準備完了を待機中..." not found or timed out');
  }

  // Evaluate SW state
  const swState = await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.map(r => ({
      scope: r.scope,
      active: !!r.active,
      installing: !!r.installing,
      waiting: !!r.waiting,
      state: r.active ? r.active.state : 'none'
    }));
  });
  console.log('SW State:', JSON.stringify(swState, null, 2));

  await browser.close();
})();
