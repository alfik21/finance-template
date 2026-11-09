/**
 * TransactionService.js (Container-Bound Edition)
 * Mengelola data mutasi kas, saldo dompet, anggaran, dan ringkasan siklus harian/bulanan.
 *
 * Perbaikan QC (lihat docs/06_DOKUMENTASI_PERBAIKAN.md):
 * - R-03: jalur baca tidak lagi menulis baris (tidak ada dompet default saat render).
 * - R-04/R-23: satu modul validasi untuk transaksi, dompet, kategori, anggaran.
 * - R-05: duplikasi kategori dinilai per (nama, tipe).
 * - R-06: hapus dompet diblokir bila saldo != 0; reaktivasi tersedia; minimal 1 dompet aktif.
 * - R-07: ID memakai Utilities.getUuid() (bukan Date.now).
 * - R-08: boolean/angka/tanggal dikoersi saat dibaca.
 * - R-09: LockService pada seluruh operasi tulis.
 * - R-10: nilai teks berawalan karakter formula diberi prefiks apostrof.
 * - R-11: pembatas jumlah transaksi yang dikirim ke klien.
 * - R-16: anggaran diikat per (kategori, periode).
 * - R-24: penghapusan dicatat di sheet AUDIT.
 * - R-25: urutan terbaru memakai tanggal lalu timestamp sebagai tiebreak.
 */

/** Batas transaksi yang dikirim ke klien per permintaan (R-11). */
const MAX_TX_PAYLOAD_ = 200;
const TX_TYPES_ = ["Income", "Expense", "Transfer"];
const WALLET_TYPES_ = ["Cash", "Bank", "E-Wallet", "Credit", "Other"];
const CAT_TYPES_ = ["Income", "Expense"];
const FORMULA_PREFIX_RE_ = /^[=+\-@\t\r]/;

/* ============================================================================
 * Utilitas bersama (R-04, R-07, R-08, R-09, R-10)
 * ==========================================================================*/

function withWriteLock_(fn) {
  let lock = null;
  try {
    if (typeof LockService !== "undefined" && LockService && LockService.getScriptLock) {
      lock = LockService.getScriptLock();
      if (!lock.tryLock(10000)) {
        lock = null;
        throw new Error("__LOCK_BUSY__");
      }
    }
  } catch (eLock) {
    lock = null;
    if (eLock && eLock.message === "__LOCK_BUSY__") {
      throw new Error("Data sedang diproses permintaan lain. Coba lagi dalam beberapa detik.");
    }
    // LockService tidak tersedia (lingkungan uji tanpa GAS) -> lanjut tanpa lock.
  }
  try {
    return fn();
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (eRel) { /* abaikan */ }
    }
  }
}

/** R-07: ID unik global, bukan timestamp yang bisa tabrakan. */
function newId_(prefix) {
  let uuid = "";
  try {
    if (typeof Utilities !== "undefined" && Utilities && Utilities.getUuid) {
      uuid = Utilities.getUuid();
    }
  } catch (e) { /* fallback di bawah */ }
  if (!uuid) {
    uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }
  return prefix + "-" + uuid.replace(/-/g, "").substring(0, 12).toUpperCase();
}

/** R-10: cegah eksekusi formula pada nilai teks yang ditulis ke sheet. */
function sanitizeCellText_(value) {
  if (typeof value !== "string") return value;
  if (FORMULA_PREFIX_RE_.test(value)) return "'" + value;
  return value;
}

/** R-08: koersi boolean sheet (true/false, "TRUE"/"FALSE", 1/0). */
function toBool_(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const low = v.trim().toLowerCase();
    if (low === "true" || low === "1" || low === "ya") return true;
    if (low === "false" || low === "0" || low === "tidak" || low === "") return false;
  }
  return v !== false;
}

/** R-08/R-23: parsing angka toleran terhadap "1.000.000", "1,500", "Rp 50.000". */
function parseNumber_(v) {
  if (typeof v === "number") return isFinite(v) ? v : NaN;
  if (typeof v === "boolean" || v === null || v === undefined) return NaN;
  let s = String(v).trim().replace(/rp\s*/ig, "").replace(/\s/g, "");
  if (!s) return NaN;
  const hasDot = s.indexOf(".") !== -1;
  const hasComma = s.indexOf(",") !== -1;
  if (hasDot && hasComma) {
    if (s.lastIndexOf(".") > s.lastIndexOf(",")) s = s.replace(/,/g, "");
    else s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    if (/^[+-]?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(",", ".");
  } else if (hasDot && /^[+-]?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

/** R-04: validasi & normalisasi tanggal yyyy-mm-dd menjadi string. */
function normalizeDateStr_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return formatDateIso(v);
  const s = String(v || "").trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const probe = new Date(y, mo - 1, d);
  if (probe.getFullYear() !== y || probe.getMonth() !== mo - 1 || probe.getDate() !== d) return null;
  return formatDateIso(probe);
}

/** R-08: tanggal ISO -> objek Date lokal agar sel terformat tanggal, bukan teks. */
function dateObjFromIso_(iso) {
  const parts = String(iso).split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/**
 * R-04/R-23: validasi terpadu payload transaksi.
 * Melempar Error dengan pesan yang bisa ditindaklanjuti bila gagal.
 */
function validateTransactionPayload_(payload, opts) {
  opts = opts || {};
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload transaksi tidak valid.");
  }
  const type = String(payload.type || "").trim();
  if (TX_TYPES_.indexOf(type) === -1) {
    throw new Error("Tipe transaksi harus salah satu dari: " + TX_TYPES_.join(", ") + ".");
  }

  const amountNum = parseNumber_(payload.amount);
  if (!Number.isFinite(amountNum) || Math.round(amountNum) <= 0) {
    throw new Error("Nominal transaksi harus berupa angka lebih dari 0.");
  }
  const amount = Math.round(amountNum);

  const dateStr = normalizeDateStr_(payload.date || formatDateIso(new Date()));
  if (!dateStr) {
    throw new Error("Tanggal transaksi tidak valid. Gunakan format YYYY-MM-DD.");
  }

  const walletId = String(payload.walletId || "").trim();
  if (!walletId) throw new Error("Kantong dompet wajib dipilih.");

  const notes = sanitizeCellText_(String(payload.notes || "").substring(0, 500));

  const ctx = readReferenceData_();

  const srcWallet = ctx.allWalletMap[walletId];
  if (!srcWallet) throw new Error("Dompet sumber tidak ditemukan.");
  // S-08: saat EDIT, dompet nonaktif tetap diperbolehkan agar riwayat tidak
  // terkunci permanen. Transaksi baru tetap wajib memakai dompet aktif.
  if (!srcWallet.isActive && !opts.isUpdate) {
    throw new Error("Dompet sumber '" + srcWallet.name + "' tidak aktif.");
  }

  let destWalletId = String(payload.destWalletId || "").trim();
  let categoryId = String(payload.categoryId || "").trim();

  if (type === "Transfer") {
    if (!destWalletId) throw new Error("Rekening tujuan wajib dipilih untuk transfer kas.");
    if (destWalletId === walletId) throw new Error("Rekening asal dan tujuan tidak boleh sama.");
    const destWallet = ctx.allWalletMap[destWalletId];
    if (!destWallet) throw new Error("Dompet tujuan tidak ditemukan.");
    if (!destWallet.isActive && !opts.isUpdate) {
      throw new Error("Dompet tujuan '" + destWallet.name + "' tidak aktif.");
    }
    categoryId = ""; // transfer tidak memakai kategori
  } else {
    destWalletId = "";
    if (!categoryId) throw new Error("Kategori wajib dipilih untuk " +
      (type === "Income" ? "pemasukan" : "pengeluaran") + ".");
    const cat = ctx.categoryMap[categoryId];
    if (!cat) throw new Error("Kategori tidak ditemukan.");
    if (cat.type !== type) {
      throw new Error("Kategori '" + cat.name + "' bertipe " + cat.type +
        " dan tidak boleh dipakai untuk transaksi " + type + ".");
    }
  }

  return { type, amount, dateStr, walletId, destWalletId, categoryId, notes };
}

/** Pembacaan referensi (dompet & kategori) untuk keperluan validasi. */
function readReferenceData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catSheet = ss.getSheetByName("KATEGORI");
  const walletSheet = ss.getSheetByName("DOMPET");
  const categoriesRaw = catSheet ? catSheet.getDataRange().getValues() : [];
  const walletsRaw = walletSheet ? walletSheet.getDataRange().getValues() : [];

  const categoryMap = {};
  for (let i = 1; i < categoriesRaw.length; i++) {
    const [id, name, type, icon] = categoriesRaw[i];
    if (id) categoryMap[id] = { id, name, type, icon };
  }
  const allWalletMap = {};
  for (let i = 1; i < walletsRaw.length; i++) {
    const [id, name, type, initialBalance, icon, isActive] = walletsRaw[i];
    if (id) {
      allWalletMap[id] = {
        id, name, type, icon,
        initialBalance: parseNumber_(initialBalance) || 0,
        isActive: toBool_(isActive)
      };
    }
  }
  return { categoryMap, allWalletMap };
}

/** R-06: saldo akhir sebuah dompet (aktif maupun nonaktif) dari sheet mentah. */
function computeAnyWalletBalance_(walletId, walletSheet, txSheet) {
  let balance = 0;
  const walletData = walletSheet ? walletSheet.getDataRange().getValues() : [];
  let found = false;
  for (let i = 1; i < walletData.length; i++) {
    if (String(walletData[i][0]) === String(walletId)) {
      balance = parseNumber_(walletData[i][3]) || 0;
      found = true;
      break;
    }
  }
  if (!found) return 0;

  const txData = txSheet ? txSheet.getDataRange().getValues() : [];
  for (let i = 1; i < txData.length; i++) {
    const amount = parseNumber_(txData[i][6]) || 0;
    const type = String(txData[i][2] || "");
    const src = String(txData[i][3] || "");
    const dest = String(txData[i][4] || "");
    if (type === "Income" && src === String(walletId)) balance += amount;
    else if (type === "Expense" && src === String(walletId)) balance -= amount;
    else if (type === "Transfer") {
      if (src === String(walletId)) balance -= amount;
      if (dest === String(walletId)) balance += amount;
    }
  }
  return Math.round(balance * 100) / 100;
}

/** R-24: jejak audit penghapusan/perubahan data keuangan. */
function appendAuditLog_(action, detail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("AUDIT");
    if (!sheet) {
      sheet = ss.insertSheet("AUDIT");
      sheet.appendRow(["Waktu", "Aksi", "Detail", "Pengguna"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#F1F5F9");
      sheet.setFrozenRows(1);
      sheet.setTabColor("#64748B");
    }
    sheet.appendRow([
      new Date(),
      sanitizeCellText_(String(action)),
      sanitizeCellText_(String(detail).substring(0, 500)),
      getUserEmailSafe()
    ]);
  } catch (e) {
    // Audit tidak boleh menjatuhkan operasi utama.
    console.warn("Audit log gagal ditulis: " + (e && e.message ? e.message : e));
  }
}

/* ============================================================================
 * Jalur baca (R-03: tanpa penulisan)
 * ==========================================================================*/

function getDashboardData() {
  return buildDashboardData_();
}

function buildDashboardData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureDatabaseStructure();

  const txSheet = ss.getSheetByName("TRANSAKSI");
  const walletSheet = ss.getSheetByName("DOMPET");
  const catSheet = ss.getSheetByName("KATEGORI");
  const budgetSheet = ss.getSheetByName("ANGGARAN");

  const walletsRaw = walletSheet ? walletSheet.getDataRange().getValues() : [];
  const categoriesRaw = catSheet ? catSheet.getDataRange().getValues() : [];
  const transactionsRaw = txSheet ? txSheet.getDataRange().getValues() : [];
  const budgetsRaw = budgetSheet ? budgetSheet.getDataRange().getValues() : [];

  // 1. Parse Kategori
  const categories = [];
  const categoryMap = {};
  for (let i = 1; i < categoriesRaw.length; i++) {
    const [id, name, type, icon] = categoriesRaw[i];
    if (id) {
      const catObj = { id, name, type, icon };
      categories.push(catObj);
      categoryMap[id] = catObj;
    }
  }

  // 2. Parse Dompet & Saldo (R-08: boolean & angka dikoersi; R-03: tanpa tulis)
  const wallets = [];
  const inactiveWallets = [];
  const walletBalances = {};
  const walletMap = {};
  const allWalletMap = {};
  for (let i = 1; i < walletsRaw.length; i++) {
    const [id, name, type, initialBalance, icon, isActive] = walletsRaw[i];
    if (id) {
      const isAct = toBool_(isActive);
      const initBal = parseNumber_(initialBalance) || 0;
      allWalletMap[id] = { id, name, type, icon, initialBalance: initBal, isActive: isAct };
      if (isAct) {
        const walletObj = { id, name, type, initialBalance: initBal, icon, balance: initBal };
        wallets.push(walletObj);
        walletBalances[id] = initBal;
        walletMap[id] = walletObj;
      } else {
        inactiveWallets.push({ id, name, type, icon, initialBalance: initBal });
      }
    }
  }
  // Catatan R-03: tidak ada pembuatan dompet default di sini. Tab DOMPET sudah
  // disemai oleh ensureDatabaseStructure; bila semua dompet nonaktif, UI menampilkan
  // empty state dan pengguna dapat mengaktifkan kembali lewat restoreWallet.

  // 3. Hitung Mutasi Saldo & Siklus Kas
  const todayStr = formatDateIso(new Date());
  const currentPeriod = getCurrentMonthPeriod();
  let totalIncomeMonth = 0;
  let totalExpenseMonth = 0;
  let totalIncomeToday = 0;
  let totalExpenseToday = 0;
  const categorySpendingMonth = {};

  const allTransactions = [];
  for (let i = 1; i < transactionsRaw.length; i++) {
    const [id, dateVal, type, walletId, destWalletId, catId, amountVal, notes, createdAt] = transactionsRaw[i];
    if (!id) continue;

    const amount = parseNumber_(amountVal) || 0;
    const dateStr = formatDateIso(dateVal);
    const wObj = allWalletMap[walletId];
    const destWObj = allWalletMap[destWalletId];

    allTransactions.push({
      id,
      date: dateStr,
      type,
      walletId,
      walletName: wObj ? wObj.name : "-",
      destWalletId,
      destWalletName: destWObj ? destWObj.name : "-",
      categoryId: catId,
      categoryName: categoryMap[catId] ? categoryMap[catId].name : "-",
      amount,
      notes: notes || (type === "Transfer" ? "Pindah Saldo Dompet" : "-"),
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt || "")
    });

    // Mutasi Saldo
    if (type === "Income" && walletBalances[walletId] !== undefined) {
      walletBalances[walletId] += amount;
    } else if (type === "Expense" && walletBalances[walletId] !== undefined) {
      walletBalances[walletId] -= amount;
    } else if (type === "Transfer") {
      if (walletBalances[walletId] !== undefined) walletBalances[walletId] -= amount;
      if (walletBalances[destWalletId] !== undefined) walletBalances[destWalletId] += amount;
    }

    // Siklus Harian
    if (dateStr === todayStr) {
      if (type === "Income") totalIncomeToday += amount;
      else if (type === "Expense") totalExpenseToday += amount;
    }

    // Siklus Bulanan
    if (dateStr.startsWith(currentPeriod)) {
      if (type === "Income") {
        totalIncomeMonth += amount;
      } else if (type === "Expense") {
        totalExpenseMonth += amount;
        categorySpendingMonth[catId] = (categorySpendingMonth[catId] || 0) + amount;
      }
    }
  }

  // Total Saldo Akhir (hanya dompet aktif yang ikut net worth)
  let totalNetWorth = 0;
  wallets.forEach(w => {
    w.balance = walletBalances[w.id] !== undefined ? walletBalances[w.id] : 0;
    totalNetWorth += w.balance;
  });

  // R-25: urutkan tanggal dulu, lalu timestamp pencatatan sebagai tiebreak.
  // R-11: batasi jumlah transaksi yang dikirim ke klien.
  allTransactions.sort(compareTxRecent_);
  const txTotal = allTransactions.length;
  const recentTransactions = allTransactions.slice(0, MAX_TX_PAYLOAD_);

  // 4. Budgeting (R-16: prioritas periode aktif -> RECURRING; deterministik)
  const budgets = [];
  const budgetCandidates = {};
  for (let i = 1; i < budgetsRaw.length; i++) {
    const [id, catId, period, limitVal] = budgetsRaw[i];
    if (!id || !catId) continue;
    const p = period ? String(period) : "RECURRING";
    if (!(p === "RECURRING" || p === currentPeriod)) continue;
    const key = catId + "|" + p;
    if (!budgetCandidates[key]) budgetCandidates[key] = [];
    budgetCandidates[key].push({
      id,
      categoryId: catId,
      categoryName: categoryMap[catId] ? categoryMap[catId].name : "-",
      limit: parseNumber_(limitVal) || 0,
      period: p
    });
  }

  Object.keys(budgetCandidates).forEach(key => {
    const list = budgetCandidates[key];
    // Baris pertama yang terurut per baris sheet -> deterministik (bukan acak).
    const chosen = list[0];
    const [catId, period] = key.split("|");
    const spent = categorySpendingMonth[catId] || 0;
    const limit = chosen.limit;
    budgets.push({
      id: chosen.id,
      categoryId: catId,
      categoryName: chosen.categoryName,
      period,
      limit,
      spent,
      remaining: limit - spent,
      percent: limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
    });
  });
  // Tampilkan anggaran periode aktif lebih dulu.
  budgets.sort((a, b) => (a.period === currentPeriod ? -1 : 0) - (b.period === currentPeriod ? -1 : 0));

  return {
    netWorth: totalNetWorth,
    todaySummary: {
      date: todayStr,
      income: totalIncomeToday,
      expense: totalExpenseToday,
      net: totalIncomeToday - totalExpenseToday
    },
    monthSummary: {
      period: currentPeriod,
      income: totalIncomeMonth,
      expense: totalExpenseMonth,
      netSavings: totalIncomeMonth - totalExpenseMonth
    },
    wallets,
    inactiveWallets,
    categories,
    budgets,
    recentTransactions,
    txTotal
  };
}

function compareTxRecent_(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const ca = a.createdAt || "";
  const cb = b.createdAt || "";
  if (ca === cb) return 0;
  return ca > cb ? -1 : 1;
}

/**
 * R-14: perbarui isi tab DASHBOARD. Dipanggil HANYA dari operasi tulis
 * (bukan dari jalur baca) agar konsisten dengan R-03.
 */
function refreshDashboardSummary_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("DASHBOARD");
    if (!sheet) return;
    const d = buildDashboardData_();
    const now = new Date();
    const values = [
      ["Total Saldo (Net Worth)", d.netWorth, "Jumlah saldo seluruh dompet aktif", now],
      ["Pemasukan Bulan Ini", d.monthSummary.income, "Rekap mutasi tipe Income pada periode berjalan", now],
      ["Pengeluaran Bulan Ini", d.monthSummary.expense, "Rekap mutasi tipe Expense pada periode berjalan", now],
      ["Jumlah Dompet Aktif", d.wallets.length, "Dompet dengan status Aktif = TRUE", now],
      ["Jumlah Kategori", d.categories.length, "Kategori Income dan Expense", now],
      ["Anggaran Aktif", d.budgets.length, "Anggaran RECURRING atau periode berjalan", now]
    ];
    sheet.getRange(2, 1, values.length, 4).setValues(values);
    sheet.getRange(2, 2, values.length, 1).setNumberFormat("#,##0");
    sheet.getRange(2, 4, values.length, 1).setNumberFormat("yyyy-mm-dd hh:mm");
  } catch (e) {
    console.warn("DASHBOARD gagal diperbarui: " + (e && e.message ? e.message : e));
  }
}

/* ============================================================================
 * Operasi tulis (R-09: LockService; R-04/R-23: validasi)
 * ==========================================================================*/

function createTransaction(payload) {
  return withWriteLock_(function () {
    const v = validateTransactionPayload_(payload);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const txSheet = ss.getSheetByName("TRANSAKSI");
    if (!txSheet) throw new Error("Sheet TRANSAKSI tidak ditemukan.");

    const id = newId_("TX");
    txSheet.appendRow([
      id,
      dateObjFromIso_(v.dateStr),
      v.type,
      v.walletId,
      v.destWalletId,
      v.categoryId,
      v.amount,
      v.notes || (v.type === "Transfer" ? "Pindah Saldo Dompet" : ""),
      new Date().toISOString()
    ]);
    // R-08: format tanggal & angka pada baris baru.
    const row = txSheet.getLastRow();
    txSheet.getRange(row, 2).setNumberFormat("yyyy-mm-dd");
    txSheet.getRange(row, 7).setNumberFormat("#,##0");

    refreshDashboardSummary_();
    return { success: true, id };
  });
}

function updateTransaction(payload) {
  return withWriteLock_(function () {
    if (!payload || !payload.id) throw new Error("ID transaksi tidak valid.");
    const v = validateTransactionPayload_(payload, { isUpdate: true });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TRANSAKSI");
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.id)) {
        const rowIdx = i + 1;
        sheet.getRange(rowIdx, 2).setValue(dateObjFromIso_(v.dateStr)).setNumberFormat("yyyy-mm-dd");
        sheet.getRange(rowIdx, 3).setValue(v.type);
        sheet.getRange(rowIdx, 4).setValue(v.walletId);
        sheet.getRange(rowIdx, 5).setValue(v.destWalletId);
        sheet.getRange(rowIdx, 6).setValue(v.categoryId);
        sheet.getRange(rowIdx, 7).setValue(v.amount).setNumberFormat("#,##0");
        sheet.getRange(rowIdx, 8).setValue(v.notes || (v.type === "Transfer" ? "Pindah Saldo Dompet" : ""));
        refreshDashboardSummary_();
        return { success: true, id: payload.id };
      }
    }
    throw new Error("Transaksi tidak ditemukan.");
  });
}

function deleteTransaction(txId) {
  return withWriteLock_(function () {
    if (!txId) throw new Error("ID transaksi tidak valid.");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TRANSAKSI");
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(txId)) {
        const snapshot = {
          id: data[i][0],
          tanggal: formatDateIso(data[i][1]),
          tipe: data[i][2],
          nominal: data[i][6],
          catatan: data[i][7]
        };
        sheet.deleteRow(i + 1);
        // R-24: jejak audit sebelum data hilang permanen.
        appendAuditLog_("HAPUS_TRANSAKSI", JSON.stringify(snapshot));
        refreshDashboardSummary_();
        return { success: true };
      }
    }
    throw new Error("Transaksi tidak ditemukan.");
  });
}

/** R-05: duplikasi dinilai per (nama, tipe), bukan nama saja. */
function saveCategory(payload) {
  return withWriteLock_(function () {
    if (!payload || !payload.name || !String(payload.name).trim()) {
      throw new Error("Nama kategori wajib diisi.");
    }
    const name = sanitizeCellText_(String(payload.name).trim().substring(0, 60));
    const type = String(payload.type || "Expense").trim();
    if (CAT_TYPES_.indexOf(type) === -1) {
      throw new Error("Tipe kategori harus Income atau Expense.");
    }
    const icon = sanitizeCellText_(String(payload.icon || "Tag").substring(0, 40));

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const catSheet = ss.getSheetByName("KATEGORI");
    const data = catSheet ? catSheet.getDataRange().getValues() : [];

    for (let i = 1; i < data.length; i++) {
      const rowName = String(data[i][1] || "").trim().toLowerCase();
      const rowType = String(data[i][2] || "").trim();
      if (rowName === name.toLowerCase() && rowType === type) {
        return { id: data[i][0], name: data[i][1], type: data[i][2], icon: data[i][3] };
      }
    }

    const id = newId_("C");
    if (catSheet) catSheet.appendRow([id, name, type, icon]);
    return { id, name, type, icon };
  });
}

/** R-23: validasi nama, tipe, dan saldo awal dompet. */
function saveWallet(payload) {
  return withWriteLock_(function () {
    if (!payload || !payload.name || !String(payload.name).trim()) {
      throw new Error("Nama dompet wajib diisi.");
    }
    const name = sanitizeCellText_(String(payload.name).trim().substring(0, 60));
    const type = String(payload.type || "Cash").trim();
    if (WALLET_TYPES_.indexOf(type) === -1) {
      throw new Error("Tipe dompet harus salah satu dari: " + WALLET_TYPES_.join(", ") + ".");
    }
    const initBalRaw = parseNumber_(payload.initialBalance);
    if (!Number.isFinite(initBalRaw)) {
      throw new Error("Saldo awal harus berupa angka.");
    }
    const initBal = Math.round(initBalRaw);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("DOMPET");
    const id = newId_("W");
    sheet.appendRow([id, name, type, initBal, "Wallet", true]);
    const row = sheet.getLastRow();
    sheet.getRange(row, 4).setNumberFormat("#,##0");

    refreshDashboardSummary_();
    return { success: true, id };
  });
}

/**
 * R-06: blokir penghapusan bila saldo != 0 (termasuk negatif), sediakan
 * reaktivasi, dan jaga minimal satu dompet aktif.
 */
function deleteWallet(id) {
  return withWriteLock_(function () {
    if (!id) throw new Error("ID dompet tidak valid.");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const txSheet = ss.getSheetByName("TRANSAKSI");
    const walletSheet = ss.getSheetByName("DOMPET");
    if (!walletSheet) throw new Error("Sheet DOMPET tidak ditemukan.");

    const dashData = buildDashboardData_();
    const activeWallets = dashData.wallets;
    const targetActive = activeWallets.find(w => w.id === id);
    const targetInactive = (dashData.inactiveWallets || []).find(w => w.id === id);

    if (!targetActive && !targetInactive) {
      throw new Error("Dompet tidak ditemukan.");
    }

    // Saldo harus nol persis (positif, negatif, maupun pecahan) sebelum dihapus.
    const currentBalance = computeAnyWalletBalance_(id, walletSheet, txSheet);
    if (currentBalance !== 0) {
      throw new Error(
        "Dompet masih memiliki saldo " + formatAngka_(currentBalance) +
        ". Pindahkan atau kosongkan saldo dompet terlebih dahulu sebelum menghapus."
      );
    }

    // Minimal satu dompet aktif harus selalu ada.
    if (targetActive && activeWallets.length <= 1) {
      throw new Error("Tidak dapat menghapus dompet terakhir yang aktif. Aktifkan dompet lain terlebih dahulu.");
    }

    // Periksa riwayat transaksi
    const txData = txSheet ? txSheet.getDataRange().getValues() : [];
    let isUsedInTransactions = false;
    for (let i = 1; i < txData.length; i++) {
      if (String(txData[i][3]) === String(id) || String(txData[i][4]) === String(id)) {
        isUsedInTransactions = true;
        break;
      }
    }

    const walletData = walletSheet.getDataRange().getValues();
    for (let i = 1; i < walletData.length; i++) {
      if (String(walletData[i][0]) === String(id)) {
        if (isUsedInTransactions) {
          // Soft delete: riwayat transaksi tetap utuh.
          walletSheet.getRange(i + 1, 6).setValue(false);
          appendAuditLog_("NONAKTIFKAN_DOMPET", id + " | " + walletData[i][1]);
        } else {
          walletSheet.deleteRow(i + 1);
          appendAuditLog_("HAPUS_DOMPET", id + " | " + walletData[i][1]);
        }
        refreshDashboardSummary_();
        return { success: true };
      }
    }
    throw new Error("Dompet tidak ditemukan.");
  });
}

/** R-06: reaktivasi dompet yang pernah dinonaktifkan. */
function restoreWallet(id) {
  return withWriteLock_(function () {
    if (!id) throw new Error("ID dompet tidak valid.");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const walletSheet = ss.getSheetByName("DOMPET");
    if (!walletSheet) throw new Error("Sheet DOMPET tidak ditemukan.");

    const data = walletSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        if (toBool_(data[i][5])) {
          return { success: true, id, alreadyActive: true };
        }
        walletSheet.getRange(i + 1, 6).setValue(true);
        appendAuditLog_("AKTIFKAN_DOMPET", id + " | " + data[i][1]);
        refreshDashboardSummary_();
        return { success: true, id };
      }
    }
    throw new Error("Dompet tidak ditemukan.");
  });
}

/** R-16: anggaran diikat per (kategori, periode) dan divalidasi. */
function saveBudget(payload) {
  return withWriteLock_(function () {
    if (!payload) throw new Error("Payload anggaran tidak valid.");
    const ctx = readReferenceData_();
    const categoryId = String(payload.categoryId || "").trim();
    if (!categoryId) throw new Error("Kategori anggaran wajib dipilih.");
    if (!ctx.categoryMap[categoryId]) throw new Error("Kategori anggaran tidak ditemukan.");

    const limitRaw = parseNumber_(payload.limitAmount);
    if (!Number.isFinite(limitRaw) || Math.round(limitRaw) <= 0) {
      throw new Error("Limit anggaran harus berupa angka lebih dari 0.");
    }
    const limit = Math.round(limitRaw);

    const period = String(payload.period || "RECURRING").trim().toUpperCase();
    if (period !== "RECURRING" && !/^\d{4}-\d{2}$/.test(period)) {
      throw new Error("Periode anggaran harus RECURRING atau format YYYY-MM.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("ANGGARAN");
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const rowPeriod = data[i][2] ? String(data[i][2]).toUpperCase() : "RECURRING";
      if (String(data[i][1]) === categoryId && rowPeriod === period) {
        sheet.getRange(i + 1, 4).setValue(limit).setNumberFormat("#,##0");
        refreshDashboardSummary_();
        return { success: true, id: data[i][0] };
      }
    }

    const id = newId_("B");
    sheet.appendRow([id, categoryId, period, limit]);
    const row = sheet.getLastRow();
    sheet.getRange(row, 4).setNumberFormat("#,##0");
    refreshDashboardSummary_();
    return { success: true, id };
  });
}

function deleteBudget(budgetId) {
  return withWriteLock_(function () {
    if (!budgetId) throw new Error("ID anggaran tidak valid.");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("ANGGARAN");
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(budgetId)) {
        sheet.deleteRow(i + 1);
        appendAuditLog_("HAPUS_ANGGARAN", String(budgetId) + " | kategori " + data[i][1]);
        refreshDashboardSummary_();
        return { success: true };
      }
    }
    throw new Error("Anggaran tidak ditemukan.");
  });
}

function formatAngka_(n) {
  try {
    return "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");
  } catch (e) {
    return String(n);
  }
}

/* ============================================================================
 * Tutup buku tahunan (item menu Finance Tracker)
 * ==========================================================================*/

/** Tahun lampau yang masih tersimpan di TRANSAKSI (menunggu diarsipkan). */
function checkPendingArchive_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const txSheet = ss.getSheetByName("TRANSAKSI");
    if (!txSheet) return { hasPending: false, pendingYears: [] };
    const lastRow = txSheet.getLastRow();
    if (lastRow <= 1) return { hasPending: false, pendingYears: [] };

    const currentYear = new Date().getFullYear();
    const rawDates = txSheet.getRange(2, 2, lastRow - 1, 1).getValues();
    const years = {};
    for (let i = 0; i < rawDates.length; i++) {
      const y = yearOfCell_(rawDates[i][0]);
      if (y && y < currentYear) years[y] = true;
    }
    const pendingYears = Object.keys(years).map(Number).sort((a, b) => a - b);
    return { hasPending: pendingYears.length > 0, pendingYears };
  } catch (e) {
    return { hasPending: false, pendingYears: [], error: e && e.message ? e.message : String(e) };
  }
}

/** Tahun dari sel tanggal (Date maupun teks); 0 bila tidak terbaca. */
function yearOfCell_(val) {
  if (val === null || val === undefined || val === "") return 0;
  const d = val instanceof Date ? val : new Date(String(val).trim());
  const y = d.getFullYear();
  return isNaN(y) ? 0 : y;
}

/**
 * Tutup buku satu tahun: salin seluruh transaksi tahun `targetYear` ke tab
 * ARSIP_<tahun>, hapus barisnya dari TRANSAKSI, lalu geser Saldo_Awal tiap
 * dompet sebesar net efek tahun tersebut sehingga total saldo tidak berubah.
 * Kembalian { success, message, ... } agar bisa langsung ditampilkan ke UI.
 */
function closeAndArchiveYear(targetYear) {
  const year = Number(targetYear);
  const currentYear = new Date().getFullYear();
  if (!year || isNaN(year) || year < 2000 || year >= currentYear) {
    return {
      success: false,
      message: "Tahun tidak valid. Masukkan tahun antara 2000 dan " + (currentYear - 1) + "."
    };
  }

  return withWriteLock_(function () {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const txSheet = ss.getSheetByName("TRANSAKSI");
    if (!txSheet) return { success: false, message: "Sheet TRANSAKSI tidak ditemukan." };

    const lastRow = txSheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "Tidak ada data transaksi di sheet TRANSAKSI." };

    const headers = txSheet.getRange(1, 1, 1, 9).getValues()[0];
    const allRows = txSheet.getRange(2, 1, lastRow - 1, 9).getValues();

    const archiveRows = [];
    const remainingRows = [];
    const netPerWallet = {};
    let totalIncome = 0;
    let totalExpense = 0;

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      if (yearOfCell_(row[1]) !== year) {
        remainingRows.push(row);
        continue;
      }
      archiveRows.push(row);

      const amount = parseNumber_(row[6]) || 0;
      const type = String(row[2] || "");
      const src = String(row[3] || "");
      const dest = String(row[4] || "");
      if (type === "Income") {
        totalIncome += amount;
        if (src) netPerWallet[src] = (netPerWallet[src] || 0) + amount;
      } else if (type === "Expense") {
        totalExpense += amount;
        if (src) netPerWallet[src] = (netPerWallet[src] || 0) - amount;
      } else if (type === "Transfer") {
        if (src) netPerWallet[src] = (netPerWallet[src] || 0) - amount;
        if (dest) netPerWallet[dest] = (netPerWallet[dest] || 0) + amount;
      }
    }

    if (archiveRows.length === 0) {
      return {
        success: false,
        message: "Tidak ditemukan transaksi tahun " + year + ". Tidak ada data yang diarsipkan."
      };
    }

    // 1. Salin ke ARSIP_<tahun>; bila tab sudah ada, baris lama tidak ditimpa.
    const archiveName = "ARSIP_" + year;
    let archiveSheet = ss.getSheetByName(archiveName);
    if (!archiveSheet) {
      archiveSheet = ss.insertSheet(archiveName);
      archiveSheet.appendRow(headers);
      archiveSheet
        .getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#F1F5F9")
        .setFontColor("#0F172A");
      archiveSheet.setFrozenRows(1);
      archiveSheet.setTabColor("#64748B");
    }
    const archiveStart = archiveSheet.getLastRow() + 1;
    archiveSheet.getRange(archiveStart, 1, archiveRows.length, headers.length).setValues(archiveRows);

    // 2. Tulis ulang TRANSAKSI tanpa baris tahun tersebut lalu buang sisa barisnya.
    if (remainingRows.length > 0) {
      txSheet.getRange(2, 1, remainingRows.length, headers.length).setValues(remainingRows);
    }
    const deleteCount = allRows.length - remainingRows.length;
    if (deleteCount > 0) txSheet.deleteRows(2 + remainingRows.length, deleteCount);

    // 3. Geser Saldo_Awal dompet terdampak agar saldo akhir tetap sama.
    let adjustedWallets = 0;
    const walletSheet = ss.getSheetByName("DOMPET");
    if (walletSheet) {
      const wLastRow = walletSheet.getLastRow();
      if (wLastRow > 1) {
        const walletRows = walletSheet.getRange(2, 1, wLastRow - 1, 6).getValues();
        let changed = false;
        for (let i = 0; i < walletRows.length; i++) {
          const walletId = String(walletRows[i][0] || "");
          if (walletId && netPerWallet[walletId]) {
            walletRows[i][3] = (parseNumber_(walletRows[i][3]) || 0) + netPerWallet[walletId];
            delete netPerWallet[walletId];
            changed = true;
            adjustedWallets++;
          }
        }
        if (changed) walletSheet.getRange(2, 1, walletRows.length, 6).setValues(walletRows);
      }
    }

    refreshDashboardSummary_();

    const netFlow = Math.round((totalIncome - totalExpense) * 100) / 100;
    const message =
      "Tahun " + year + " ditutup: " + archiveRows.length + " transaksi dipindahkan ke tab " + archiveName +
      " (pemasukan " + formatAngka_(totalIncome) + ", pengeluaran " + formatAngka_(totalExpense) +
      ", net " + formatAngka_(netFlow) + "). Saldo awal " + adjustedWallets +
      " dompet disesuaikan agar total saldo tidak berubah; ringkasan DASHBOARD diperbarui.";

    appendAuditLog_(
      "TUTUP_BUKU",
      "Tahun " + year + ": " + archiveRows.length + " transaksi -> " + archiveName +
      ", pemasukan " + totalIncome + ", pengeluaran " + totalExpense +
      ", dompet disesuaikan " + adjustedWallets
    );

    return {
      success: true,
      message: message,
      archiveName: archiveName,
      archivedCount: archiveRows.length,
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      adjustedWallets: adjustedWallets
    };
  });
}
