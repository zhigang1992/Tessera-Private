import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console logs
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.type(), msg.text());
  });

  // Listen to errors
  page.on('pageerror', error => {
    console.log('BROWSER ERROR:', error.message);
  });

  await page.goto('http://localhost:5173/referral');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Try to find and click the Sign Message button
  try {
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons`);

    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      console.log('Button text:', text);
      if (text.includes('Sign Message') || text.includes('Signing')) {
        console.log('Clicking Sign Message button');
        await button.click();
        console.log('Clicked!');
        break;
      }
    }

    // Wait to see what happens
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Keep browser open for inspection
  console.log('Browser will stay open. Close manually when done.');
})();
