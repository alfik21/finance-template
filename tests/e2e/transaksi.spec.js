const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('E2E: Finance Tracker (Google Apps Script Web App)', () => {
  test.beforeEach(async ({ page }) => {
    // Arahkan browser ke test fixture yang sudah diinjeksi mock google.script.run
    const fixturePath = path.resolve(__dirname, '../fixtures/app-test.html');
    await page.goto('file://' + fixturePath);
  });

  test('1. Menampilkan ringkasan saldo, dompet, dan transaksi awal', async ({ page }) => {
    // Pastikan judul aplikasi tampil
    await expect(page.locator('.brand-title')).toContainText('Finance Tracker');

    // Pastikan saldo utama termuat di hero card
    const heroBalance = page.locator('.hero-balance');
    await expect(heroBalance).toBeVisible();
    await expect(heroBalance).toContainText('Rp 12.500.000');

    // Pastikan dompet-dompet awal muncul di kartu dompet (.wallets-grid)
    const walletsGrid = page.locator('.wallets-grid');
    await expect(walletsGrid.locator('text=Dompet Tunai')).toBeVisible();
    await expect(walletsGrid.locator('text=BCA Tabungan')).toBeVisible();

    // Pastikan transaksi dummy awal terlihat di daftar mutasi
    await expect(page.locator('text=Makan Siang Nasi Padang').first()).toBeVisible();
  });

  test('2. Berhasil mencatat transaksi pengeluaran baru', async ({ page }) => {
    // 1. Klik tombol "+ Catat Transaksi"
    const btnCatat = page.locator('button:has-text("+ Catat Transaksi")').first();
    await btnCatat.click();

    // 2. Pastikan modal input transaksi terbuka
    const modal = page.locator('#transaction-modal');
    await expect(modal).toBeVisible();

    // 3. Isi formulir transaksi
    await page.fill('#form-amount', '75000');
    await page.fill('#form-notes', 'Kopi & Snack Rapat E2E');

    // 4. Submit formulir
    await page.click('#transaction-modal button[type="submit"]');

    // 5. Pastikan modal otomatis tertutup setelah disimpan
    await expect(modal).not.toBeVisible();

    // 6. Verifikasi mutasi baru langsung muncul di daftar transaksi
    await expect(page.locator('text=Kopi & Snack Rapat E2E').first()).toBeVisible();
  });

  test('3. Berhasil berpindah ke tab Buku Kas', async ({ page }) => {
    // Klik tab Buku Kas di navigasi sidebar
    await page.click('.nav-item[data-tab="transactions"]');

    // Pastikan tampilan buku kas aktif
    await expect(page.locator('.ticker-card')).toBeVisible();
    await expect(page.locator('text=Makan Siang Nasi Padang').first()).toBeVisible();
  });

  test('4. Berhasil mendaftarkan kantong dompet baru', async ({ page }) => {
    // Klik tombol "+ Tambah Dompet"
    const btnDompet = page.locator('button:has-text("+ Tambah Dompet")');
    await btnDompet.click();

    // Pastikan modal tambah dompet terbuka
    const walletModal = page.locator('#wallet-modal');
    await expect(walletModal).toBeVisible();

    // Isi formulir dompet baru
    await page.fill('#wallet-name', 'ShopeePay Darurat');
    await page.selectOption('#wallet-type', 'E-Wallet');

    // Simpan dompet
    await page.click('#wallet-modal button[type="submit"]');

    // Pastikan modal tertutup
    await expect(walletModal).not.toBeVisible();

    // Verifikasi dompet baru langsung tampil di kartu dompet
    const walletsGrid = page.locator('.wallets-grid');
    await expect(walletsGrid.locator('text=ShopeePay Darurat')).toBeVisible();
  });

  test('5. Berhasil memfilter transaksi lewat pencarian di Buku Kas', async ({ page }) => {
    // Pindah ke tab Buku Kas
    await page.click('.nav-item[data-tab="transactions"]');

    // Cari transaksi "Nasi Padang"
    const searchInput = page.locator('.filter-search');
    await searchInput.fill('Nasi Padang');

    // Pastikan "Makan Siang Nasi Padang" tetap terlihat
    await expect(page.locator('text=Makan Siang Nasi Padang').first()).toBeVisible();

    // Cari kata kunci yang tidak ada
    await searchInput.fill('Tiket Pesawat Liburan');

    // Pastikan transaksi tidak ditemukan / baris transaksi kosong
    await expect(page.locator('text=Makan Siang Nasi Padang')).not.toBeVisible();
  });

  test('6. Berhasil berpindah ke tab Bulanan di Buku Kas', async ({ page }) => {
    // Pindah ke tab Buku Kas
    await page.click('.nav-item[data-tab="transactions"]');

    // Klik tombol tab "Bulanan"
    const btnBulanan = page.locator('.view-btn:has-text("Bulanan")');
    await btnBulanan.click();

    // Pastikan kartu ringkasan bulanan tampil
    await expect(page.locator('.monthly-cards-grid')).toBeVisible();
    await expect(page.locator('.monthly-card').first()).toBeVisible();
  });
});
