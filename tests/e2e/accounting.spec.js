const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('E2E: Logika Akuntansi Saldo, Budgeting & UX Formulir', () => {
  test.beforeEach(async ({ page }) => {
    const fixturePath = path.resolve(__dirname, '../fixtures/app-test.html');
    await page.goto('file://' + fixturePath);
    // Tunggu data awal termuat
    await expect(page.locator('.hero-balance')).toBeVisible();
  });

  test('1. Mutasi Transfer: memotong dompet asal, menambah dompet tujuan, dan netWorth tetap', async ({ page }) => {
    // Awal: Dompet Tunai: 500.000, BCA Tabungan: 10.000.000, NetWorth: 12.500.000
    await page.click('.nav-item[data-tab="transactions"]');
    await page.click('button:has-text("Pindah Saldo")');

    const modal = page.locator('#transaction-modal');
    await expect(modal).toBeVisible();

    // Isi formulir transfer Rp 100.000 dari Dompet Tunai (W-1) ke BCA Tabungan (W-2)
    await page.fill('#form-amount', '100000');
    await page.selectOption('#form-wallet', 'W-1');
    await page.selectOption('#form-dest-wallet', 'W-2');
    await page.fill('#form-notes', 'Tarik Tunai ke Bank');

    await page.click('#btn-submit-tx');
    await expect(modal).not.toBeVisible();

    // Verifikasi tampilan rincian dompet di transaksi
    await expect(page.locator('text=Dompet Tunai → BCA Tabungan').first()).toBeVisible();

    // Verifikasi saldo kantong di tab Dasbor
    await page.click('.nav-item[data-tab="dashboard"]');
    // Dompet Tunai jadi 400.000
    await expect(page.locator('.wallet-pill:has-text("Dompet Tunai") .wallet-pill-val')).toContainText('Rp 400.000');
    // BCA Tabungan jadi 10.100.000
    await expect(page.locator('.wallet-pill:has-text("BCA Tabungan") .wallet-pill-val')).toContainText('Rp 10.100.000');
    // Total Saldo (netWorth) tetap Rp 12.500.000
    await expect(page.locator('.hero-balance')).toContainText('Rp 12.500.000');
  });

  test('2. Hapus Transaksi: rollback saldo dompet yang bersangkutan', async ({ page }) => {
    // Awal: Dompet Tunai 500.000 (setelah TX-1 Expense 50.000)
    // Hapus TX-1 (Expense Makan Siang Nasi Padang 50.000)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    const btnDelete = page.locator('.ledger-row:has-text("Makan Siang Nasi Padang") button[title="Hapus transaksi"]').first();
    await btnDelete.click();

    // Verifikasi mutasi terhapus
    await expect(page.locator('text=Makan Siang Nasi Padang')).not.toBeVisible();

    // Verifikasi saldo Dompet Tunai dikembalikan (+50.000 menjadi 550.000)
    await expect(page.locator('.wallet-pill:has-text("Dompet Tunai") .wallet-pill-val')).toContainText('Rp 550.000');
  });

  test('3. Edit Transaksi: rekalkulasi saldo dompet (reverse old, apply new)', async ({ page }) => {
    // Edit TX-1: ubah Expense dari 50.000 menjadi 100.000
    const btnEdit = page.locator('.ledger-row:has-text("Makan Siang Nasi Padang") button[title="Edit transaksi"]').first();
    await btnEdit.click();

    const modal = page.locator('#transaction-modal');
    await expect(modal).toBeVisible();

    await page.fill('#form-amount', '100000');
    await page.click('#btn-submit-tx');
    await expect(modal).not.toBeVisible();

    // Dompet Tunai awalnya 500.000. Reversal +50.000 = 550.000, lalu apply -100.000 = 450.000
    await expect(page.locator('.wallet-pill:has-text("Dompet Tunai") .wallet-pill-val')).toContainText('Rp 450.000');
  });

  test('4. Integritas Hapus Dompet: cegah penghapusan jika saldo dompet > 0', async ({ page }) => {
    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    // Coba hapus BCA Tabungan yang memiliki saldo 10.000.000
    const btnDelBCA = page.locator('.wallet-pill:has-text("BCA Tabungan") button[title="Hapus dompet"]');
    await btnDelBCA.click();

    // Pastikan muncul peringatan saldo
    expect(alertMsg).toContain('masih memiliki saldo');
    // Dompet tetap ada di daftar dompet
    await expect(page.locator('.wallets-grid').locator('text=BCA Tabungan')).toBeVisible();
  });

  test('5. Tambah Kategori Baru secara mandiri melalui modal kategori', async ({ page }) => {
    await page.locator('button:has-text("+ Catat Transaksi")').first().click();
    await expect(page.locator('#transaction-modal')).toBeVisible();

    // Klik tombol "+ Tambah Kategori"
    await page.click('button:has-text("+ Tambah Kategori")');
    const catModal = page.locator('#category-modal');
    await expect(catModal).toBeVisible();

    // Isi nama kategori baru
    await page.fill('#category-name', 'Investasi Saham & Reksadana');
    await page.selectOption('#category-type', 'Expense');
    await page.click('#btn-submit-cat');

    // Modal kategori tertutup
    await expect(catModal).not.toBeVisible();

    // Kategori baru terpilih otomatis di dropdown kategori
    const selectedCatText = await page.locator('#form-category option:checked').innerText();
    expect(selectedCatText).toContain('Investasi Saham & Reksadana');
  });

  test('6. Modul Anggaran Belanja: menghitung spent, persentase, dan sisa tanpa undefined%', async ({ page }) => {
    const budgetCard = page.locator('.overview-panel:has-text("Batas Anggaran Belanja") .mini-bar-item:has-text("Makan & Minum")');
    await expect(budgetCard).toBeVisible();

    // Tidak boleh ada teks "undefined%"
    const cardText = await budgetCard.innerText();
    expect(cardText).not.toContain('undefined');
    expect(cardText).toContain('Makan & Minum');
    expect(cardText).toContain('Tersisa:');
  });
});
