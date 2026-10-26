// tests/mocks/google-script-mock.js
// Mock database awal yang realistis sesuai format TransactionService.js

function recalculateMockSummary(db) {
  if (!db) return;
  const currentPeriod = new Date().toISOString().substring(0, 7);
  const todayStr = new Date().toISOString().substring(0, 10);

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

  // 3. Rekalkulasi Anggaran Belanja (Budget)
  (db.budgets || []).forEach(b => {
    const spent = catSpending[b.categoryId] || 0;
    const limit = Number(b.limit) || 0;
    b.spent = spent;
    b.remaining = limit - spent;
    b.percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  });
}

if (!window.__MOCK_DB__) {
  const currentPeriod = new Date().toISOString().substring(0, 7);
  const todayStr = new Date().toISOString().substring(0, 10);

  window.__MOCK_DB__ = {
    netWorth: 12500000,
    todaySummary: {
      date: todayStr,
      income: 15000000,
      expense: 50000,
      net: 14950000
    },
    monthSummary: {
      period: currentPeriod,
      income: 15000000,
      expense: 50000,
      netSavings: 14950000
    },
    wallets: [
      { id: "W-1", name: "Dompet Tunai", type: "Cash", balance: 500000, icon: "Wallet" },
      { id: "W-2", name: "BCA Tabungan", type: "Bank", balance: 10000000, icon: "CreditCard" },
      { id: "W-3", name: "GoPay", type: "E-Wallet", balance: 2000000, icon: "Smartphone" }
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
      { id: "B-1", categoryId: "C-EX-1", categoryName: "Makan & Minum", limit: 2000000, spent: 50000, remaining: 1950000, percent: 3 }
    ],
    recentTransactions: [
      {
        id: "TX-1",
        date: todayStr,
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
        type: "Income",
        amount: 15000000,
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

// Simulasi google.script.run
window.google = {
  script: {
    run: {
      withSuccessHandler(successCb) {
        this._successCb = successCb;
        return this;
      },
      withFailureHandler(failureCb) {
        this._failureCb = failureCb;
        return this;
      },
      apiDispatcher(action, payload) {
        setTimeout(() => {
          try {
            const db = window.__MOCK_DB__;

            if (action === 'getDashboard') {
              recalculateMockSummary(db);
              this._successCb({ success: true, data: db });
            } 
            else if (action === 'createTransaction') {
              const amt = Number(payload.amount) || 0;
              if (amt <= 0) throw new Error("Nominal transaksi harus lebih dari 0.");
              if (!payload.walletId) throw new Error("Kantong dompet wajib dipilih.");

              let newTx;
              if (payload.type === 'Transfer') {
                if (!payload.destWalletId) throw new Error("Rekening tujuan transfer wajib dipilih.");
                if (payload.walletId === payload.destWalletId) throw new Error("Kantong asal dan tujuan transfer tidak boleh sama.");

                const srcWallet = db.wallets.find(w => w.id === payload.walletId);
                const destWallet = db.wallets.find(w => w.id === payload.destWalletId);
                if (srcWallet) srcWallet.balance -= amt;
                if (destWallet) destWallet.balance += amt;

                newTx = {
                  id: 'TX-' + Date.now(),
                  date: payload.date || new Date().toISOString().substring(0, 10),
                  type: 'Transfer',
                  amount: amt,
                  walletId: payload.walletId,
                  walletName: srcWallet ? srcWallet.name : 'Asal',
                  destWalletId: payload.destWalletId,
                  destWalletName: destWallet ? destWallet.name : 'Tujuan',
                  categoryId: '',
                  categoryName: 'Pindah Saldo',
                  notes: payload.notes || 'Pindah Saldo Dompet'
                };
              } else {
                const wallet = db.wallets.find(w => w.id === payload.walletId);
                const category = db.categories.find(c => c.id === payload.categoryId);

                if (payload.type === 'Expense') {
                  if (wallet) wallet.balance -= amt;
                } else if (payload.type === 'Income') {
                  if (wallet) wallet.balance += amt;
                }

                newTx = {
                  id: 'TX-' + Date.now(),
                  date: payload.date || new Date().toISOString().substring(0, 10),
                  type: payload.type,
                  amount: amt,
                  walletId: payload.walletId,
                  walletName: wallet ? wallet.name : 'Dompet',
                  destWalletId: '',
                  destWalletName: '',
                  categoryId: payload.categoryId || '',
                  categoryName: category ? category.name : (payload.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'),
                  notes: payload.notes || ''
                };
              }

              db.recentTransactions.unshift(newTx);
              recalculateMockSummary(db);

              this._successCb({ success: true, data: { id: newTx.id } });
            } 
            else if (action === 'updateTransaction') {
              const tx = db.recentTransactions.find(t => t.id === payload.id);
              if (!tx) throw new Error("Transaksi tidak ditemukan.");

              const amt = Number(payload.amount) || 0;
              if (amt <= 0) throw new Error("Nominal transaksi harus lebih dari 0.");
              if (!payload.walletId) throw new Error("Kantong dompet wajib dipilih.");

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
              if (payload.type === 'Expense') {
                const newW = db.wallets.find(w => w.id === payload.walletId);
                if (newW) newW.balance -= amt;
              } else if (payload.type === 'Income') {
                const newW = db.wallets.find(w => w.id === payload.walletId);
                if (newW) newW.balance += amt;
              } else if (payload.type === 'Transfer') {
                if (!payload.destWalletId) throw new Error("Rekening tujuan transfer wajib dipilih.");
                if (payload.walletId === payload.destWalletId) throw new Error("Kantong asal dan tujuan transfer tidak boleh sama.");
                const newSrc = db.wallets.find(w => w.id === payload.walletId);
                const newDest = db.wallets.find(w => w.id === payload.destWalletId);
                if (newSrc) newSrc.balance -= amt;
                if (newDest) newDest.balance += amt;
              }

              // 3. Update objek transaksi
              const newWallet = db.wallets.find(w => w.id === payload.walletId);
              tx.date = payload.date || tx.date;
              tx.type = payload.type;
              tx.amount = amt;
              tx.walletId = payload.walletId;
              tx.walletName = newWallet ? newWallet.name : tx.walletName;
              tx.notes = payload.notes || '';

              if (payload.type === 'Transfer') {
                const newDest = db.wallets.find(w => w.id === payload.destWalletId);
                tx.destWalletId = payload.destWalletId;
                tx.destWalletName = newDest ? newDest.name : 'Tujuan';
                tx.categoryId = '';
                tx.categoryName = 'Pindah Saldo';
              } else {
                const category = db.categories.find(c => c.id === payload.categoryId);
                tx.destWalletId = '';
                tx.destWalletName = '';
                tx.categoryId = payload.categoryId || '';
                tx.categoryName = category ? category.name : tx.categoryName;
              }

              recalculateMockSummary(db);
              this._successCb({ success: true, data: { id: payload.id } });
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
              this._successCb({ success: true });
            } 
            else if (action === 'saveWallet') {
              if (!payload.name || !payload.name.trim()) throw new Error("Nama dompet wajib diisi.");
              const initBal = Number(payload.initialBalance) || 0;
              const newWallet = {
                id: 'W-' + Date.now(),
                name: payload.name.trim(),
                type: payload.type || 'Cash',
                balance: initBal,
                icon: 'Wallet'
              };
              db.wallets.push(newWallet);
              recalculateMockSummary(db);
              this._successCb({ success: true, id: newWallet.id });
            } 
            else if (action === 'deleteWallet') {
              const idx = db.wallets.findIndex(w => w.id === payload.id);
              if (idx === -1) throw new Error("Dompet tidak ditemukan.");

              const targetW = db.wallets[idx];
              if ((Number(targetW.balance) || 0) > 0) {
                throw new Error("Dompet masih memiliki saldo. Pindahkan atau kosongkan saldo dompet terlebih dahulu sebelum menghapus.");
              }

              db.wallets.splice(idx, 1);
              recalculateMockSummary(db);
              this._successCb({ success: true });
            }
            else if (action === 'saveCategory') {
              if (!payload.name || !payload.name.trim()) throw new Error("Nama kategori wajib diisi.");
              const name = payload.name.trim();
              const type = payload.type || 'Expense';
              const existing = db.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
              if (existing) {
                this._successCb({ success: true, data: existing });
                return;
              }
              const newCat = {
                id: 'C-' + Date.now(),
                name: name,
                type: type,
                icon: 'Tag'
              };
              db.categories.push(newCat);
              this._successCb({ success: true, data: newCat });
            }
            else if (action === 'saveBudget') {
              const cat = db.categories.find(c => c.id === payload.categoryId);
              const limitAmt = Number(payload.limitAmount) || 0;
              const existing = db.budgets.find(b => b.categoryId === payload.categoryId);
              if (existing) {
                existing.limit = limitAmt;
              } else {
                db.budgets.push({
                  id: 'B-' + Date.now(),
                  categoryId: payload.categoryId,
                  categoryName: cat ? cat.name : 'Kategori',
                  limit: limitAmt,
                  spent: 0
                });
              }
              recalculateMockSummary(db);
              this._successCb({ success: true });
            }
            else if (action === 'deleteBudget') {
              const idx = db.budgets.findIndex(b => b.id === payload.id);
              if (idx !== -1) {
                db.budgets.splice(idx, 1);
              }
              recalculateMockSummary(db);
              this._successCb({ success: true });
            } 
            else {
              this._successCb({ success: true });
            }

            // Notifikasi parent frame jika di dalam iframe demo
            if (window.parent && window.parent !== window) {
              try {
                window.parent.postMessage({ type: 'FINANCE_MOCK_SYNC', action, db }, '*');
              } catch (e) {}
            }
          } catch (err) {
            if (this._failureCb) this._failureCb(err);
          }
        }, 30);
      }
    }
  }
};

// Listener untuk pesan dari parent frame (misal: Reset Data)
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'RESET_FINANCE_MOCK') {
    if (typeof loadDashboardData === 'function') {
      window.__MOCK_DB__ = JSON.parse(JSON.stringify(e.data.defaultDb));
      recalculateMockSummary(window.__MOCK_DB__);
      loadDashboardData();
    }
  }
});
