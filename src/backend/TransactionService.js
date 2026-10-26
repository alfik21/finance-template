/**
 * TransactionService.js (Container-Bound Edition)
 * Mengelola data mutasi kas, saldo dompet, anggaran, dan ringkasan siklus harian/bulanan.
 */

function getDashboardData() {
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

  // 2. Parse Dompet & Saldo
  const wallets = [];
  const walletBalances = {};
  const walletMap = {};
  const allWalletMap = {};
  for (let i = 1; i < walletsRaw.length; i++) {
    const [id, name, type, initialBalance, icon, isActive] = walletsRaw[i];
    if (id) {
      const isAct = isActive !== false;
      allWalletMap[id] = { id, name, type, isActive: isAct };
      if (isAct) {
        const initBal = Number(initialBalance) || 0;
        const walletObj = { id, name, type, initialBalance: initBal, icon, balance: initBal };
        wallets.push(walletObj);
        walletBalances[id] = initBal;
        walletMap[id] = walletObj;
      }
    }
  }

  if (wallets.length === 0) {
    const defaultWallet = { id: "W-1", name: "Dompet Tunai", type: "Cash", initialBalance: 0, balance: 0 };
    wallets.push(defaultWallet);
    walletBalances["W-1"] = 0;
    walletMap["W-1"] = defaultWallet;
    allWalletMap["W-1"] = { id: "W-1", name: "Dompet Tunai", type: "Cash", isActive: true };
    if (walletSheet) {
      walletSheet.appendRow(["W-1", "Dompet Tunai", "Cash", 0, "Wallet", true]);
    }
  }

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

    const amount = Number(amountVal) || 0;
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
      createdAt
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

  // Total Saldo Akhir
  let totalNetWorth = 0;
  wallets.forEach(w => {
    w.balance = walletBalances[w.id] !== undefined ? walletBalances[w.id] : 0;
    totalNetWorth += w.balance;
  });

  // Urutkan transaksi terbaru
  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentTransactions = allTransactions;

  // 4. Budgeting
  const budgets = [];
  const processedCats = new Set();
  for (let i = 1; i < budgetsRaw.length; i++) {
    const [id, catId, period, limitVal] = budgetsRaw[i];
    if (id && catId && !processedCats.has(catId)) {
      // Prioritaskan budget recurring atau budget yang cocok dengan periode aktif
      if (period === "RECURRING" || period === currentPeriod || !period) {
        processedCats.add(catId);
        const limit = Number(limitVal) || 0;
        const spent = categorySpendingMonth[catId] || 0;
        budgets.push({
          id,
          categoryId: catId,
          categoryName: categoryMap[catId] ? categoryMap[catId].name : "-",
          limit,
          spent,
          remaining: limit - spent,
          percent: limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
        });
      }
    }
  }

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
    categories,
    budgets,
    recentTransactions
  };
}

function createTransaction(payload) {
  if (!payload.type || !payload.amount || Number(payload.amount) <= 0) {
    throw new Error("Nominal transaksi harus lebih dari 0.");
  }
  if (!payload.walletId) throw new Error("Kantong dompet wajib dipilih.");

  if (payload.type === "Transfer") {
    if (!payload.destWalletId) {
      throw new Error("Rekening tujuan wajib dipilih untuk transfer kas.");
    }
    if (payload.walletId === payload.destWalletId) {
      throw new Error("Rekening asal dan tujuan tidak boleh sama.");
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName("TRANSAKSI");
  const id = "TX-" + Date.now().toString(36).toUpperCase();
  const dateStr = payload.date || formatDateIso(new Date());

  txSheet.appendRow([
    id,
    dateStr,
    payload.type,
    payload.walletId,
    payload.destWalletId || "",
    payload.categoryId || "",
    Number(payload.amount),
    payload.notes || "",
    new Date().toISOString()
  ]);

  return { success: true, id };
}

function updateTransaction(payload) {
  if (!payload.id) throw new Error("ID transaksi tidak valid.");
  if (!payload.type || !payload.amount || Number(payload.amount) <= 0) {
    throw new Error("Nominal transaksi harus lebih dari 0.");
  }
  if (!payload.walletId) throw new Error("Kantong dompet wajib dipilih.");

  if (payload.type === "Transfer") {
    if (!payload.destWalletId) {
      throw new Error("Rekening tujuan wajib dipilih untuk transfer kas.");
    }
    if (payload.walletId === payload.destWalletId) {
      throw new Error("Rekening asal dan tujuan tidak boleh sama.");
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("TRANSAKSI");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id) {
      const rowIdx = i + 1;
      const dateStr = payload.date || formatDateIso(new Date());
      sheet.getRange(rowIdx, 2).setValue(dateStr);
      sheet.getRange(rowIdx, 3).setValue(payload.type);
      sheet.getRange(rowIdx, 4).setValue(payload.walletId);
      sheet.getRange(rowIdx, 5).setValue(payload.destWalletId || "");
      sheet.getRange(rowIdx, 6).setValue(payload.categoryId || "");
      sheet.getRange(rowIdx, 7).setValue(Number(payload.amount));
      sheet.getRange(rowIdx, 8).setValue(payload.notes || "");
      return { success: true, id: payload.id };
    }
  }
  throw new Error("Transaksi tidak ditemukan.");
}

function deleteTransaction(txId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("TRANSAKSI");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === txId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error("Transaksi tidak ditemukan.");
}

function saveWallet(payload) {
  if (!payload.name) throw new Error("Nama dompet wajib diisi.");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("DOMPET");
  const id = "W-" + Date.now().toString(36).toUpperCase();
  const initBal = Number(payload.initialBalance) || 0;

  sheet.appendRow([id, payload.name, payload.type || "Cash", initBal, "Wallet", true]);
  return { success: true, id };
}

function deleteWallet(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName("TRANSAKSI");
  const walletSheet = ss.getSheetByName("DOMPET");

  // Periksa apakah dompet sudah pernah digunakan di catatan transaksi
  const txData = txSheet ? txSheet.getDataRange().getValues() : [];
  let isUsedInTransactions = false;
  for (let i = 1; i < txData.length; i++) {
    if (txData[i][3] === id || txData[i][4] === id) {
      isUsedInTransactions = true;
      break;
    }
  }

  const walletData = walletSheet.getDataRange().getValues();
  for (let i = 1; i < walletData.length; i++) {
    if (walletData[i][0] === id) {
      if (isUsedInTransactions) {
        // Soft delete: tandai tidak aktif agar integritas riwayat transaksi masa lalu tidak rusak
        walletSheet.getRange(i + 1, 6).setValue(false);
      } else {
        // Jika belum pernah ada transaksi, baris aman dihapus permanen
        walletSheet.deleteRow(i + 1);
      }
      return { success: true };
    }
  }
  throw new Error("Dompet tidak ditemukan.");
}

function saveBudget(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ANGGARAN");
  const data = sheet.getDataRange().getValues();

  // Update budget kategori jika sudah ada (dibuat recurring berlaku permanen)
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === payload.categoryId) {
      sheet.getRange(i + 1, 4).setValue(Number(payload.limitAmount));
      sheet.getRange(i + 1, 3).setValue("RECURRING");
      return { success: true };
    }
  }

  const id = "B-" + Date.now().toString(36).toUpperCase();
  sheet.appendRow([id, payload.categoryId, "RECURRING", Number(payload.limitAmount)]);
  return { success: true, id };
}

function deleteBudget(budgetId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ANGGARAN");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === budgetId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error("Anggaran tidak ditemukan.");
}
