// tests/e2e/demo.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('E2E: Interactive Demo Showcase (demo/index.html)', () => {
  test('Halaman demo dapat dibuka, me-load iframe WebApp, dan merender simulasi realtime', async ({ page }) => {
    const demoPath = 'file://' + path.resolve(__dirname, '../../demo/index.html').replace(/\\/g, '/');
    await page.goto(demoPath);

    // 1. Cek Header & Selling Points
    await expect(page.locator('h1')).toContainText('Finance Tracker');
    await expect(page.locator('#deviceContainer')).toBeVisible();

    // 2. Cek Tabel Simulasi Spreadsheet Awal
    await expect(page.locator('#simulatedTxTableBody')).toBeVisible();
    await expect(page.locator('#simulatedTxTableBody tr')).toHaveCount(2);

    // 3. Switch Tab ke DOMPET
    await page.click('#btnTabSheetWallets');
    await expect(page.locator('#simulatedWalletsTableWrapper')).toBeVisible();
    await expect(page.locator('#simulatedWalletsTableBody tr')).toHaveCount(3);

    // 4. Toggle Viewport ke Desktop View
    await page.click('#btnViewDesktop');
    await expect(page.locator('#deviceContainer')).toHaveClass(/device-desktop/);

    // 5. Toggle kembali ke Mobile
    await page.click('#btnViewMobile');
    await expect(page.locator('#deviceContainer')).toHaveClass(/device-mobile/);
  });
});
