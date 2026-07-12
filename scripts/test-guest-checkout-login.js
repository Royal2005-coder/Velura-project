import { chromium } from '@playwright/test';

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  page.on('request', request => console.log('>> Request:', request.method(), request.url()));
  page.on('response', response => console.log('<< Response:', response.status(), response.url()));

  try {
    // 1. Mock api routes
    await page.route('**/api/user/auth/check-exists*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: true })
      });
    });

    await page.route('**/api/user/auth/signin', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: "header.eyJleHAiOjk5OTk5OTk5OTl9.signature",
          user: {
            user_id: 999,
            full_name: "John Member",
            phone: "0987654321",
            email: "john@example.com",
            is_dev_mock: true
          }
        })
      });
    });

    await page.route('**/api/user/profile', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          full_name: "John Member",
          phone: "0987654321",
          saved_addresses: []
        })
      });
    });

    await page.route('**/api/user/addresses', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Mock cart and other dependencies to prevent errors
    await page.route('**/api/user/cart', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/user/categories', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/user/wishlist', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/user/style-quiz', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });
    await page.route('**/api/user/notifications', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // 2. Load the page with some items in checkout_items
    console.log("Navigating to checkout payment-guest page...");
    await page.goto('http://localhost:3001/src/pages/checkout/payment-guest.html');

    await page.evaluate(() => {
      localStorage.setItem("velura_cart", JSON.stringify([
        { product_id: 1, name: "Ao thun", unit_price: 150000, quantity: 2, variant: "M/Black" }
      ]));
      sessionStorage.setItem("checkout_items", JSON.stringify([
        { product_id: 1, name: "Ao thun", unit_price: 150000, quantity: 2, variant: "M/Black" }
      ]));
    });

    // Reload page so checkout items are parsed
    await page.reload();

    console.log("Checking if form elements are visible...");
    await page.waitForSelector('#fullname');
    
    // Fill form
    console.log("Filling checkout guest form...");
    await page.fill('#fullname', 'Nguyen Guest');
    await page.fill('#guest-phone', '0987654321');
    await page.fill('#guest-email', 'guest@example.com');
    await page.fill('#guest-address-detail', '123 Test Street');
    await page.fill('#guest-note', 'Deliver after 5 PM');

    // Trigger phone input blur to show password field
    console.log("Triggering blur on phone input to display password group...");
    await page.focus('#fullname'); // Move focus away to trigger blur
    
    // Wait for password group to display
    console.log("Waiting for password input to be visible...");
    const pwdGroup = page.locator('#guest-password-group');
    await page.waitForFunction(el => el.style.display === 'block', await pwdGroup.elementHandle());
    console.log("Password field displayed successfully!");

    // Enter password
    await page.fill('#guest-password', 'SecretPass123!');

    // Select Province, District, Ward dropdowns
    console.log("Selecting Province, District, Ward...");
    await page.click('#address-province-wrapper .search-dropdown__input');
    await page.click('#address-province-wrapper .search-dropdown__item[data-value="79"]');
    
    await page.click('#address-district-wrapper .search-dropdown__input');
    await page.click('#address-district-wrapper .search-dropdown__item[data-value="760"]');

    await page.click('#address-ward-wrapper .search-dropdown__input');
    await page.click('#address-ward-wrapper .search-dropdown__item[data-value="Phường Bến Nghé"]');

    // Click Continue to login and proceed to Step 2
    console.log("Clicking 'Tiếp tục' to trigger login and transition...");
    await page.click('.checkout-actions .btn--primary');

    // Verify it redirects to shipping-payment.html (Step 2)
    console.log("Waiting for redirection to shipping-payment.html...");
    await page.waitForURL('**/shipping-payment.html', { timeout: 5000 });
    console.log("Redirected to Step 2 successfully!");

    // Verify local storage values
    const localStorageData = await page.evaluate(() => {
      return {
        token: localStorage.getItem("velura_token"),
        shipping: JSON.parse(localStorage.getItem("checkout_shipping") || '{}')
      };
    });

    console.log("Checking storage results:", localStorageData);
    if (localStorageData.token !== "header.eyJleHAiOjk5OTk5OTk5OTl9.signature") {
      throw new Error("Token was not stored correctly!");
    }
    if (localStorageData.shipping.name !== "Nguyen Guest" || !localStorageData.shipping.address.includes("Bến Nghé")) {
      throw new Error("Shipping address was not preserved correctly!");
    }

    console.log("✅ E2E Test Passed Successfully!");
  } catch (err) {
    console.error("❌ E2E Test Failed!");
    console.error("Current URL when failed:", page.url());
    console.error("Error message:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
