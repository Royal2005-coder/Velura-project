import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER ERROR] ${err.toString()}`);
  });

  try {
    console.log("Navigating to signin page...");
    await page.goto('http://localhost:3000/src/pages/auth/signin.html');
    await page.waitForTimeout(1000);

    console.log("Clicking 'Test Phone' quick login...");
    await page.click('#js-dev-login-phone');

    console.log("Waiting for redirect to index.html...");
    await page.waitForURL('**/index.html', { timeout: 5000 });
    await page.waitForTimeout(2000);

    console.log("Checking header dropdown buttons on index.html:");
    const stylesIndex = await page.evaluate(() => {
      const getDisplay = sel => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).display : 'not found';
      };
      return {
        signin: getDisplay('.js-menu-signin-btn'),
        signup: getDisplay('.js-menu-signup-btn'),
        profile: getDisplay('.js-menu-profile-btn'),
        logout: getDisplay('.js-menu-logout-btn')
      };
    });
    console.log("Styles on index.html:", stylesIndex);
    await page.screenshot({ path: 'scratch_screenshot.png' });

    console.log("Navigating to profile.html...");
    await page.goto('http://localhost:3000/src/pages/account/profile.html');
    await page.waitForTimeout(2000);

    console.log("Checking localStorage on profile.html:");
    const localStorageVal = await page.evaluate(() => JSON.stringify(window.localStorage));
    console.log(localStorageVal);

    console.log("Checking header dropdown buttons on profile.html:");
    const stylesProfile = await page.evaluate(() => {
      const getDisplay = sel => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).display : 'not found';
      };
      return {
        signin: getDisplay('.js-menu-signin-btn'),
        signup: getDisplay('.js-menu-signup-btn'),
        profile: getDisplay('.js-menu-profile-btn'),
        logout: getDisplay('.js-menu-logout-btn')
      };
    });
    console.log("Styles on profile.html:", stylesProfile);

    await page.screenshot({ path: 'scratch_screenshot_profile.png' });
    console.log("Screenshots saved.");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
}

run();

