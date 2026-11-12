const { test, expect } = require('@playwright/test');
const path = require('path');

const fixturePath = path.resolve(__dirname, '../fixtures/app-test.html');
const fixtureUrl = 'file://' + fixturePath.replace(/\\/g, '/');

test.describe('E2E: Navigasi 5 slot, tab Kelola & Akun', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixtureUrl);
    await expect(page.locator('.hero-balance')).toBeVisible();
  });

  test('1. Sidebar desktop hanya 4 tab: Ringkasan, Buku Kas, Kelola, Akun', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const labels = await page.locator('.nav-item span').allTextContents();
    expect(labels).toEqual(['Ringkasan', 'Buku Kas', 'Kelola', 'Akun']);
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.mobile-nav')).toBeHidden();
  });

  test('2. Navigasi mobile 5 slot dengan Catat sebagai FAB tengah', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.locator('.mobile-nav-item')).toHaveCount(5);
    const labels = await page.locator('.mobile-nav-item span').allTextContents();
    expect(labels).toEqual(['Ringkasan', 'Buku Kas', 'Catat', 'Kelola', 'Akun']);

    const center = page.locator('.mobile-nav-item.action.center');
    await expect(center).toHaveCount(1);
    const fabBox = await center.locator('.action-fab').boundingBox();
    expect(Math.round(fabBox.width)).toBe(48);
    expect(Math.round(fabBox.height)).toBe(48);

    // Tidak ada overflow horizontal pada layar sempit.
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(noOverflow).toBe(true);
  });

  test('3. Tab Kelola menampilkan data master dan tombol aksinya', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('.mobile-nav-item[data-tab="manage"]');

    await expect(page.locator('.mobile-nav-item[data-tab="manage"]')).toHaveClass(/active/);
    await expect(page.locator('.mobile-nav-item[data-tab="dashboard"]')).not.toHaveClass(/active/);
    await expect(page.locator('.nav-item[data-tab="manage"]')).toHaveClass(/active/);

    await expect(page.locator('.section-title', { hasText: 'Kantong Saldo' })).toBeVisible();
    await expect(page.locator('.section-title', { hasText: 'Kategori Pemasukan' })).toBeVisible();
    await expect(page.locator('.section-title', { hasText: 'Kategori Pengeluaran' })).toBeVisible();
    await expect(page.locator('.section-title', { hasText: 'Batas Anggaran Bulanan' })).toBeVisible();

    await expect(page.locator('#app-root button', { hasText: '+ Tambah Dompet' })).toBeVisible();
    await expect(page.locator('#app-root button', { hasText: '+ Tambah Kategori' }).first()).toBeVisible();
    await expect(page.locator('#app-root button', { hasText: '+ Atur Anggaran' })).toBeVisible();
    await expect(page.locator('[data-action="delete-wallet"]')).toHaveCount(3);
    await expect(page.locator('[data-action="delete-budget"]')).toHaveCount(1);

    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(noOverflow).toBe(true);
  });

  test('4. Tab Akun menampilkan identitas demo, pintasan, dan muat ulang data', async ({ page }) => {
    await page.click('.nav-item[data-tab="settings"]');

    await expect(page.locator('.nav-item[data-tab="settings"]')).toHaveClass(/active/);
    await expect(page.locator('.section-title', { hasText: 'Akun & Akses' })).toBeVisible();
    await expect(page.locator('#app-root')).toContainText('Pengguna Demo');
    await expect(page.locator('.section-title', { hasText: 'Pintasan Layar Utama' })).toBeVisible();
    await expect(page.locator('.section-title', { hasText: 'Data & Pemeliharaan' })).toBeVisible();
    await expect(page.locator('.section-title', { hasText: 'Tentang Aplikasi' })).toBeVisible();

    // Tombol muat ulang memanggil ulang loadDashboardData().
    await page.evaluate(() => {
      const original = window.loadDashboardData;
      window.__reloadCalls = 0;
      window.loadDashboardData = function () {
        window.__reloadCalls += 1;
        return original();
      };
    });
    await page.click('button:has-text("Muat Ulang Data")');
    await expect.poll(() => page.evaluate(() => window.__reloadCalls)).toBe(1);
    await expect(page.locator('.section-title', { hasText: 'Akun & Akses' })).toBeVisible();
  });

  test('5. Modal transaksi: fokus awal, focus trap, dan Escape menutup', async ({ page }) => {
    await page.click('button:has-text("+ Catat Transaksi")');
    const modal = page.locator('#transaction-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#form-amount')).toBeFocused();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(() =>
        document.getElementById('transaction-modal').contains(document.activeElement)
      );
      expect(stillInside).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
