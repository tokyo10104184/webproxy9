const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER:', msg.text()));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');

  console.log('Waiting for "Go" button to be enabled...');
  try {
    const goButton = page.locator('button:has-text("Go")');
    await goButton.waitFor({ state: 'visible', timeout: 15000 });

    // Check if it becomes enabled
    await page.waitForFunction(
      (btn) => !btn.disabled,
      await goButton.elementHandle(),
      { timeout: 15000 }
    );

    console.log('SUCCESS: "Go" button is enabled!');

    // Try typing a URL and clicking Go to see if it triggers proxy mode
    await page.fill('input[type="text"]', 'https://example.com');
    await goButton.click();

    console.log('Waiting for iframe to appear...');
    const iframe = page.locator('iframe');
    await iframe.waitFor({ state: 'visible', timeout: 10000 });
    const src = await iframe.getAttribute('src');
    console.log('Iframe SRC:', src);

    if (src && src.includes('/uv/service/')) {
      console.log('VERIFIED: Proxy iframe launched with UV prefix.');
    } else {
      console.log('FAILURE: Iframe src mismatch.', src);
      process.exit(1);
    }

    await page.screenshot({ path: 'verification/final_success.png' });
  } catch (e) {
    console.error('TIMED OUT or FAILED:', e.message);
    await page.screenshot({ path: 'verification/final_error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
