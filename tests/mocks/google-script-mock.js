// tests/mocks/google-script-mock.js
// Mock database awal yang realistis sesuai format TransactionService.js
//
// Perbaikan fidelitas (lihat docs/06_DOKUMENTASI_PERBAIKAN.md):
// - D-08: setiap pemanggilan google.script.run memakai runner sendiri.
// - D-09: updateTransaction memvalidasi dulu, baru membalik/menerapkan saldo.
// - D-10: hapus dompet mengikuti aturan produk (blokir saldo != 0, soft delete
//         bila ada riwayat, minimal 1 dompet aktif) + restoreWallet.
// - D-11: nominal non-angka ditolak dengan pesan yang sama dengan backend.
// - D-12: "hari ini"/periode memakai tanggal lokal, bukan UTC.
// - D-17: urutan transaksi (tanggal desc, lalu timestamp desc) sama dengan backend.
// - D-18: validasi tipe, kategori, anggaran, dan periode sama dengan backend.

function mockLocalDateStr(d) {
  const dt = d || new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mockLocalMonthPeriod(d) {
  const dt = d || new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function mockCompareTxRecent(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const ca = a.createdAt || '';
  const cb = b.createdAt || '';
  if (ca === cb) return 0;
  return ca > cb ? -1 : 1;
}

// Validasi yang dipakai bersama agar mock tidak menampilkan perilaku
// yang berbeda dari produk asli (D-11, D-18).
function mockValidateTransaction(db, payload, opts) {
  opts = opts || {};
  const TX_TYPES = ['Income', 'Expense', 'Transfer'];
  const type = String(payload.type || '').trim();
  if (TX_TYPES.indexOf(type) === -1) {
    throw new Error("Tipe transaksi harus salah satu dari: Income, Expense, Transfer.");
  }
  const amountNum = typeof payload.amount === 'number' ? payload.amount : Number(payload.amount);
  if (!Number.isFinite(amountNum) || Math.round(amountNum) <= 0) {
    throw new Error("Nominal transaksi harus berupa angka lebih dari 0.");
  }
  const wallet = db.wallets.find(w => w.id === payload.walletId);
  if (!wallet) throw new Error("Dompet sumber tidak ditemukan.");
  if (!wallet.active && !opts.isUpdate) throw new Error("Dompet sumber '" + wallet.name + "' tidak aktif.");

  let destWalletId = String(payload.destWalletId || '').trim();
  let categoryId = String(payload.categoryId || '').trim();
  const dateStr = payload.date || mockLocalDateStr();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) {
    throw new Error("Tanggal transaksi tidak valid. Gunakan format YYYY-MM-DD.");
  }

  if (type === 'Transfer') {
    if (!destWalletId) throw new Error("Rekening tujuan wajib dipilih untuk transfer kas.");
    if (destWalletId === payload.walletId) throw new Error("Rekening asal dan tujuan tidak boleh sama.");
    const dest = db.wallets.find(w => w.id === destWalletId);
    if (!dest) throw new Error("Dompet tujuan tidak ditemukan.");
    if (!dest.active && !opts.isUpdate) throw new Error("Dompet tujuan '" + dest.name + "' tidak aktif.");
    categoryId = '';
  } else {
    destWalletId = '';
    if (!categoryId) throw new Error("Kategori wajib dipilih untuk " + (type === 'Income' ? 'pemasukan' : 'pengeluaran') + ".");
    const cat = db.categories.find(c => c.id === categoryId);
    if (!cat) throw new Error("Kategori tidak ditemukan.");
    if (cat.type !== type) {
      throw new Error("Kategori '" + cat.name + "' bertipe " + cat.type +
        " dan tidak boleh dipakai untuk transaksi " + type + ".");
    }
  }
  return { type, amount: Math.round(amountNum), dateStr, walletId: payload.walletId, destWalletId, categoryId };
}

function recalculateMockSummary(db) {
  if (!db) return;
  // D-12: zona waktu lokal, selaras dengan backend Asia/Jakarta pada user WIB.
  const currentPeriod = mockLocalMonthPeriod();
  const todayStr = mockLocalDateStr();

  // 1. Total Saldo (netWorth) dari total seluruh dompet aktif
  let totalNetWorth = 0;
  (db.wallets || []).forEach(w => {
    totalNetWorth += (Number(w.balance) || 0);
  });
  db.netWorth = totalNetWorth;

  // 2. Siklus Bulanan & Harian Dinamis
  let mIncome = 0;
  let mExpense = 0;
  let tIncome = 0;
  let tExpense = 0;
  const catSpending = {};

  (db.recentTransactions || []).forEach(tx => {
    const amt = Number(tx.amount) || 0;
    const dStr = tx.date || '';
    if (dStr.startsWith(currentPeriod)) {
      if (tx.type === 'Income') {
        mIncome += amt;
      } else if (tx.type === 'Expense') {
        mExpense += amt;
        if (tx.categoryId) {
          catSpending[tx.categoryId] = (catSpending[tx.categoryId] || 0) + amt;
        }
      }
    }
    if (dStr === todayStr) {
      if (tx.type === 'Income') {
        tIncome += amt;
      } else if (tx.type === 'Expense') {
        tExpense += amt;
      }
    }
  });

  db.monthSummary = {
    period: currentPeriod,
    income: mIncome,
    expense: mExpense,
    netSavings: mIncome - mExpense
  };

  db.todaySummary = {
    date: todayStr,
    income: tIncome,
    expense: tExpense,
    net: tIncome - tExpense
  };

  // 3. Rekalkulasi Anggaran Belanja (Budget) - persen dibatasi 100 seperti backend
  (db.budgets || []).forEach(b => {
    const spent = catSpending[b.categoryId] || 0;
    const limit = Number(b.limit) || 0;
    b.spent = spent;
    b.remaining = limit - spent;
    b.percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  });

  // D-17: urutkan seperti backend (tanggal desc, timestamp desc).
  (db.recentTransactions || []).sort(mockCompareTxRecent);
}

if (!window.__MOCK_DB__) {
  const currentPeriod = mockLocalMonthPeriod();
  const todayStr = mockLocalDateStr();

  window.__MOCK_DB__ = {
    netWorth: 12500000,
    inactiveWallets: [],
    todaySummary: {
      date: todayStr,
      income: 10000000,
      expense: 50000,
      net: 9950000
    },
    monthSummary: {
      period: currentPeriod,
      income: 10000000,
      expense: 50000,
      netSavings: 9950000
    },
    wallets: [
      { id: "W-1", name: "Dompet Tunai", type: "Cash", balance: 500000, initialBalance: 550000, icon: "Wallet", active: true },
      { id: "W-2", name: "BCA Tabungan", type: "Bank", balance: 10000000, initialBalance: 0, icon: "CreditCard", active: true },
      { id: "W-3", name: "GoPay", type: "E-Wallet", balance: 2000000, initialBalance: 2000000, icon: "Smartphone", active: true }
    ],
    categories: [
      { id: "C-IN-1", name: "Gaji Pokok", type: "Income", icon: "Briefcase" },
      { id: "C-IN-2", name: "Pemasukan Tambahan", type: "Income", icon: "TrendingUp" },
      { id: "C-EX-1", name: "Makan & Minum", type: "Expense", icon: "Coffee" },
      { id: "C-EX-2", name: "Transportasi", type: "Expense", icon: "Car" },
      { id: "C-EX-3", name: "Tagihan & WiFi", type: "Expense", icon: "Zap" },
      { id: "C-EX-4", name: "Kebutuhan Rumah", type: "Expense", icon: "Home" }
    ],
    budgets: [
      { id: "B-1", categoryId: "C-EX-1", categoryName: "Makan & Minum", period: "RECURRING", limit: 2000000, spent: 50000, remaining: 1950000, percent: 3 }
    ],
    recentTransactions: [
      {
        id: "TX-1",
        date: todayStr,
        createdAt: "2026-01-01T05:30:00.000Z",
        type: "Expense",
        amount: 50000,
        walletId: "W-1",
        walletName: "Dompet Tunai",
        categoryId: "C-EX-1",
        categoryName: "Makan & Minum",
        notes: "Makan Siang Nasi Padang"
      },
      {
        id: "TX-2",
        date: todayStr,
        createdAt: "2026-01-01T01:00:00.000Z",
        type: "Income",
        amount: 10000000,
        walletId: "W-2",
        walletName: "BCA Tabungan",
        categoryId: "C-IN-1",
        categoryName: "Gaji Pokok",
        notes: "Gaji Bulanan"
      }
    ]
  };

  recalculateMockSummary(window.__MOCK_DB__);
}

// D-08: setiap rantai withSuccessHandler/withFailureHandler memakai runner
// sendiri, seperti google.script.run asli (bukan singleton yang saling menimpa).
function createMockRunner() {
  const runner = {
    _successCb: null,
    _failureCb: null,
    withSuccessHandler(successCb) {
      const next = createMockRunner();
      next._successCb = successCb;
      next._failureCb = this._failureCb;
      return next;
    },
    withFailureHandler(failureCb) {
      const next = createMockRunner();
      next._failureCb = failureCb;
      next._successCb = this._successCb;
      return next;
    },
    apiDispatcher(action, payload) {
      const successCb = this._successCb;
      const failureCb = this._failureCb;
      setTimeout(() => {
        try {
          const db = window.__MOCK_DB__;

          if (action === 'getDashboard') {
            recalculateMockSummary(db);
            if (successCb) successCb({ success: true, data: db });
          }
          else if (action === 'createTransaction') {
            const v = mockValidateTransaction(db, payload);

            let newTx;
            if (v.type === 'Transfer') {
              const srcWallet = db.wallets.find(w => w.id === v.walletId);
              const destWallet = db.wallets.find(w => w.id === v.destWalletId);
              if (srcWallet) srcWallet.balance -= v.amount;
              if (destWallet) destWallet.balance += v.amount;

              newTx = {
                id: 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
                date: v.dateStr,
                createdAt: new Date().toISOString(),
                type: 'Transfer',
                amount: v.amount,
                walletId: v.walletId,
                walletName: srcWallet ? srcWallet.name : 'Asal',
                destWalletId: v.destWalletId,
                destWalletName: destWallet ? destWallet.name : 'Tujuan',
                categoryId: '',
                categoryName: 'Pindah Saldo',
                notes: payload.notes || 'Pindah Saldo Dompet'
              };
            } else {
              const wallet = db.wallets.find(w => w.id === v.walletId);
              const category = db.categories.find(c => c.id === v.categoryId);

              if (v.type === 'Expense') {
                if (wallet) wallet.balance -= v.amount;
              } else if (v.type === 'Income') {
                if (wallet) wallet.balance += v.amount;
              }

              newTx = {
                id: 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
                date: v.dateStr,
                createdAt: new Date().toISOString(),
                type: v.type,
                amount: v.amount,
                walletId: v.walletId,
                walletName: wallet ? wallet.name : 'Dompet',
                destWalletId: '',
                destWalletName: '',
                categoryId: v.categoryId,
                categoryName: category ? category.name : (v.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'),
                notes: payload.notes || ''
              };
            }

            db.recentTransactions.push(newTx);
            recalculateMockSummary(db);

            if (successCb) successCb({ success: true, data: { id: newTx.id } });
          }
          else if (action === 'updateTransaction') {
            const tx = db.recentTransactions.find(t => t.id === payload.id);
            if (!tx) throw new Error("Transaksi tidak ditemukan.");

            // D-09: validasi SEBELUM ada perubahan saldo apa pun.
            const v = mockValidateTransaction(db, payload, { isUpdate: true });

            // 1. Reversal: Kembalikan efek saldo lama
            if (tx.type === 'Expense') {
              const oldW = db.wallets.find(w => w.id === tx.walletId);
              if (oldW) oldW.balance += tx.amount;
            } else if (tx.type === 'Income') {
              const oldW = db.wallets.find(w => w.id === tx.walletId);
              if (oldW) oldW.balance -= tx.amount;
            } else if (tx.type === 'Transfer') {
              const oldSrc = db.wallets.find(w => w.id === tx.walletId);
              const oldDest = db.wallets.find(w => w.id === tx.destWalletId);
              if (oldSrc) oldSrc.balance += tx.amount;
              if (oldDest) oldDest.balance -= tx.amount;
            }

            // 2. Apply: Terapkan efek saldo baru
            if (v.type === 'Expense') {
              const newW = db.wallets.find(w => w.id === v.walletId);
              if (newW) newW.balance -= v.amount;
            } else if (v.type === 'Income') {
              const newW = db.wallets.find(w => w.id === v.walletId);
              if (newW) newW.balance += v.amount;
            } else if (v.type === 'Transfer') {
              const newSrc = db.wallets.find(w => w.id === v.walletId);
              const newDest = db.wallets.find(w => w.id === v.destWalletId);
              if (newSrc) newSrc.balance -= v.amount;
              if (newDest) newDest.balance += v.amount;
            }

            // 3. Update objek transaksi
            const newWallet = db.wallets.find(w => w.id === v.walletId);
            tx.date = v.dateStr;
            tx.createdAt = tx.createdAt || new Date().toISOString();
            tx.type = v.type;
            tx.amount = v.amount;
            tx.walletId = v.walletId;
            tx.walletName = newWallet ? newWallet.name : tx.walletName;
            tx.notes = payload.notes || '';

            if (v.type === 'Transfer') {
              const newDest = db.wallets.find(w => w.id === v.destWalletId);
              tx.destWalletId = v.destWalletId;
              tx.destWalletName = newDest ? newDest.name : 'Tujuan';
              tx.categoryId = '';
              tx.categoryName = 'Pindah Saldo';
            } else {
              const category = db.categories.find(c => c.id === v.categoryId);
              tx.destWalletId = '';
              tx.destWalletName = '';
              tx.categoryId = v.categoryId;
              tx.categoryName = category ? category.name : tx.categoryName;
            }

            recalculateMockSummary(db);
            if (successCb) successCb({ success: true, data: { id: payload.id } });
          }
          else if (action === 'deleteTransaction') {
            const idx = db.recentTransactions.findIndex(t => t.id === payload.id);
            if (idx === -1) throw new Error("Transaksi tidak ditemukan.");

            const tx = db.recentTransactions[idx];

            // Rollback mutasi saldo
            if (tx.type === 'Expense') {
              const w = db.wallets.find(item => item.id === tx.walletId);
              if (w) w.balance += tx.amount;
            } else if (tx.type === 'Income') {
              const w = db.wallets.find(item => item.id === tx.walletId);
              if (w) w.balance -= tx.amount;
            } else if (tx.type === 'Transfer') {
              const srcW = db.wallets.find(item => item.id === tx.walletId);
              const destW = db.wallets.find(item => item.id === tx.destWalletId);
              if (srcW) srcW.balance += tx.amount;
              if (destW) destW.balance -= tx.amount;
            }

            db.recentTransactions.splice(idx, 1);
            recalculateMockSummary(db);
            if (successCb) successCb({ success: true });
          }
          else if (action === 'saveWallet') {
            if (!payload.name || !String(payload.name).trim()) throw new Error("Nama dompet wajib diisi.");
            const WALLET_TYPES = ['Cash', 'Bank', 'E-Wallet', 'Credit', 'Other'];
            const wType = String(payload.type || 'Cash').trim();
            if (WALLET_TYPES.indexOf(wType) === -1) {
              throw new Error("Tipe dompet harus salah satu dari: " + WALLET_TYPES.join(", ") + ".");
            }
            const initBalNum = typeof payload.initialBalance === 'number'
              ? payload.initialBalance : Number(payload.initialBalance);
            if (!Number.isFinite(initBalNum)) throw new Error("Saldo awal harus berupa angka.");
            const newWallet = {
              id: 'W-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
              name: String(payload.name).trim().substring(0, 60),
              type: wType,
              balance: Math.round(initBalNum),
              initialBalance: Math.round(initBalNum),
              icon: 'Wallet',
              active: true
            };
            db.wallets.push(newWallet);
            recalculateMockSummary(db);
            if (successCb) successCb({ success: true, id: newWallet.id });
          }
          else if (action === 'deleteWallet') {
            const idx = db.wallets.findIndex(w => w.id === payload.id);
            const inactiveIdx = (db.inactiveWallets || []).findIndex(w => w.id === payload.id);
            if (idx === -1 && inactiveIdx === -1) throw new Error("Dompet tidak ditemukan.");

            if (idx !== -1) {
              const targetW = db.wallets[idx];
              // D-10/R-06: saldo harus nol persis (termasuk negatif).
              if ((Number(targetW.balance) || 0) !== 0) {
                throw new Error("Dompet masih memiliki saldo. Pindahkan atau kosongkan saldo dompet terlebih dahulu sebelum menghapus.");
              }
              // R-06: minimal 1 dompet aktif.
              if (db.wallets.length <= 1) {
                throw new Error("Tidak dapat menghapus dompet terakhir yang aktif. Aktifkan dompet lain terlebih dahulu.");
              }
              const usedInTx = db.recentTransactions.some(t =>
                t.walletId === targetW.id || t.destWalletId === targetW.id);
              if (usedInTx) {
                // Soft delete seperti produk asli: riwayat tetap utuh.
                db.inactiveWallets = db.inactiveWallets || [];
                db.wallets.splice(idx, 1);
                targetW.active = false;
                db.inactiveWallets.push(targetW);
              } else {
                db.wallets.splice(idx, 1);
              }
            } else {
              // Dompet sudah nonaktif: saldo awal harus 0 sebelum hapus permanen.
              const targetW = db.inactiveWallets[inactiveIdx];
              if ((Number(targetW.balance) || 0) !== 0) {
                throw new Error("Dompet nonaktif masih memiliki saldo. Ubah saldo awal menjadi 0 terlebih dahulu sebelum menghapus.");
              }
              db.inactiveWallets.splice(inactiveIdx, 1);
            }
            recalculateMockSummary(db);
            if (successCb) successCb({ success: true });
          }
          else if (action === 'restoreWallet') {
            const list = db.inactiveWallets || [];
            const idx = list.findIndex(w => w.id === payload.id);
            if (idx === -1) throw new Error("Dompet tidak ditemukan.");
            const targetW = list.splice(idx, 1)[0];
            targetW.active = true;
            db.wallets.push(targetW);
            recalculateMockSummary(db);
            if (successCb) successCb({ success: true, id: targetW.id });
          }
          else if (action === 'saveCategory') {
            if (!payload.name || !String(payload.name).trim()) throw new Error("Nama kategori wajib diisi.");
            const name = String(payload.name).trim().substring(0, 60);
            const type = String(payload.type || 'Expense').trim();
            if (['Income', 'Expense'].indexOf(type) === -1) {
              throw new Error("Tipe kategori harus Income atau Expense.");
            }
            // R-05: duplikasi dinilai per (nama, tipe).
            const existing = db.categories.find(c =>
              c.name.toLowerCase() === name.toLowerCase() && c.type === type);
            if (existing) {
              if (successCb) successCb({ success: true, data: existing });
            } else {
              const newCat = {
                id: 'C-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
                name: name,
                type: type,
                icon: 'Tag'
              };
              db.categories.push(newCat);
              if (successCb) successCb({ success: true, data: newCat });
            }
          }
          else if (action === 'saveBudget') {
            const cat = db.categories.find(c => c.id === payload.categoryId);
            if (!cat) throw new Error("Kategori anggaran tidak ditemukan.");
            const limitNum = typeof payload.limitAmount === 'number'
              ? payload.limitAmount : Number(payload.limitAmount);
            if (!Number.isFinite(limitNum) || Math.round(limitNum) <= 0) {
              throw new Error("Limit anggaran harus berupa angka lebih dari 0.");
            }
            const period = String(payload.period || 'RECURRING').trim().toUpperCase();
            if (period !== 'RECURRING' && !/^\d{4}-\d{2}$/.test(period)) {
              throw new Error("Periode anggaran harus RECURRING atau format YYYY-MM.");
            }
            const existing = db.budgets.find(b =>
              b.categoryId === payload.categoryId && (b.period || 'RECURRING') === period);
            if (existing) {
              existing.limit = Math.round(limitNum);
            } else {
              db.budgets.push({
                id: 'B-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
                categoryId: payload.categoryId,
                categoryName: cat.name,
                period: period,
                limit: Math.round(limitNum),
                spent: 0
              });
            }
            recalculateMockSummary(db);
            if (successCb) successCb({ success: true });
          }
          else if (action === 'deleteBudget') {
            const idx = db.budgets.findIndex(b => b.id === payload.id);
            if (idx === -1) throw new Error("Anggaran tidak ditemukan.");
            db.budgets.splice(idx, 1);
            recalculateMockSummary(db);
            if (successCb) successCb({ success: true });
          }
          else {
            if (successCb) successCb({ success: true });
          }

          // Notifikasi parent frame jika di dalam iframe demo
          if (window.parent && window.parent !== window) {
            try {
              const target = (window.location && window.location.origin &&
                window.location.origin !== 'null' && window.location.origin !== 'file://')
                ? window.location.origin : '*';
              window.parent.postMessage({ type: 'FINANCE_MOCK_SYNC', action, db }, target);
            } catch (e) {}
          }
        } catch (err) {
          if (failureCb) failureCb(err);
        }
      }, 30);
    }
  };
  return runner;
}

// Simulasi google.script.run
window.google = {
  script: {
    run: createMockRunner()
  }
};

// Listener untuk pesan dari parent frame (misal: Reset Data)
window.addEventListener('message', (e) => {
  // D-01: hanya menerima perintah dari parent frame yang sah.
  if (e.source !== window.parent) return;
  if (e.origin && e.origin !== 'null' && e.origin !== window.location.origin) return;
  if (e.data && e.data.type === 'RESET_FINANCE_MOCK') {
    if (typeof loadDashboardData === 'function') {
      window.__MOCK_DB__ = JSON.parse(JSON.stringify(e.data.defaultDb));
      recalculateMockSummary(window.__MOCK_DB__);
      loadDashboardData();
    }
  }
});

// D-03: handshake "siap" ke parent sehingga Reset Data tidak mengirim pesan
// sebelum mock/dokumen ini benar-benar sudah terpasang.
try {
  if (window.parent && window.parent !== window) {
    const target = (window.location && window.location.origin &&
      window.location.origin !== 'null' && window.location.origin !== 'file://')
      ? window.location.origin : '*';
    window.parent.postMessage({ type: 'IFRAME_READY' }, target);
  }
} catch (e) { /* bukan dalam iframe */ }
