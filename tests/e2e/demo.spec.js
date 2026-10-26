// tests/e2e/demo.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('E2E: Showcase Preview & Standalone Mode', () => {
  test('Root preview.html memuat showcase interaktif dan tombol Mode Aplikasi Layar Penuh', async ({ page }) => {
    const previewPath = 'file://' + path.resolve(__dirname, '../../preview.html').replace(/\\/g, '/');
    await page.goto(previewPath);

    // 1. Cek Header Showcase
    await expect(page.locator('h1')).toContainText('Finance Tracker');
    await expect(page.locator('#deviceContainer')).toBeVisible();

    // 2. Cek Tombol Buka Demo Layar Penuh / Mode Aplikasi
    const btnFullscreen = page.locator('a:has-text("Buka Demo Layar Penuh / Mode Aplikasi")');
    await expect(btnFullscreen).toBeVisible();
    await expect(btnFullscreen).toHaveAttribute('href', 'WebApp.html');
    await expect(btnFullscreen).toHaveAttribute('target', '_blank');

    // 3. Cek Simulasi Spreadsheet Realtime
    await expect(page.locator('#simulatedTxTableBody')).toBeVisible();
    await expect(page.locator('#simulatedTxTableBody tr')).toHaveCount(2);

    // 4. Toggle Viewport ke Desktop View
    await page.click('#btnViewDesktop');
    await expect(page.locator('#deviceContainer')).toHaveClass(/device-desktop/);

    // 5. Toggle kembali ke Mobile
    await page.click('#btnViewMobile');
    await expect(page.locator('#deviceContainer')).toHaveClass(/device-mobile/);
  });

  test('Root WebApp.html dapat dibuka langsung secara mandiri tanpa simulator', async ({ page }) => {
    const webAppPath = 'file://' + path.resolve(__dirname, '../../WebApp.html').replace(/\\/g, '/');
    await page.goto(webAppPath);

    // Pastikan shell aplikasi Finance Tracker terbuka langsung
    await expect(page.locator('.brand-name').first()).toContainText('Finance Tracker');
    await expect(page.locator('#app-root')).toBeVisible();
  });
});
