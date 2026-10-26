// tests/mocks/google-script-mock.js
// Mock database awal yang realistis sesuai format TransactionService.js
if (!window.__MOCK_DB__) {
  const currentPeriod = new Date().toISOString().substring(0, 7); // '2026-10'
  const todayStr = new Date().toISOString().substring(0, 10);

  window.__MOCK_DB__ = {
    netWorth: 12500000,
    todaySummary: {
      date: todayStr,
      income: 0,
      expense: 50000,
      net: -50000
    },
    monthSummary: {
      period: currentPeriod,
      income: 15000000,
      expense: 2500000,
      netSavings: 12500000
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
      { id: "B-1", categoryId: "C-EX-1", categoryName: "Makan & Minum", limit: 2000000, spent: 750000 }
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
              this._successCb({ success: true, data: db });
              if (window.parent && window.parent !== window) {
                try {
                  window.parent.postMessage({ type: 'FINANCE_MOCK_SYNC', action, db }, '*');
                } catch (e) {}
              }
            } 
            else if (action === 'createTransaction') {
              const wallet = db.wallets.find(w => w.id === payload.walletId);
              const category = db.categories.find(c => c.id === payload.categoryId);
              const amt = Number(payload.amount) || 0;

              const newTx = {
                id: 'TX-' + Date.now(),
                date: payload.date || new Date().toISOString().substring(0, 10),
                type: payload.type,
                amount: amt,
                walletId: payload.walletId,
                walletName: wallet ? wallet.name : 'Dompet',
                categoryId: payload.categoryId,
                categoryName: category ? category.name : (payload.type === 'Transfer' ? 'Pindah Saldo' : 'Lainnya'),
                notes: payload.notes || ''
              };

              // Update mutasi transaksi
              db.recentTransactions.unshift(newTx);

              // Update saldo & rangkuman
              if (payload.type === 'Expense') {
                if (wallet) wallet.balance -= amt;
                db.monthSummary.expense += amt;
                db.netWorth -= amt;
              } else if (payload.type === 'Income') {
                if (wallet) wallet.balance += amt;
                db.monthSummary.income += amt;
                db.netWorth += amt;
              }

              this._successCb({ success: true, data: { id: newTx.id } });
            } 
            else if (action === 'updateTransaction') {
              const tx = db.recentTransactions.find(t => t.id === payload.id);
              if (tx) {
                const wallet = db.wallets.find(w => w.id === payload.walletId);
                const category = db.categories.find(c => c.id === payload.categoryId);
                const amt = Number(payload.amount) || 0;
                tx.date = payload.date;
                tx.type = payload.type;
                tx.amount = amt;
                tx.walletId = payload.walletId;
                tx.walletName = wallet ? wallet.name : tx.walletName;
                tx.categoryId = payload.categoryId;
                tx.categoryName = category ? category.name : tx.categoryName;
                tx.notes = payload.notes || '';
              }
              this._successCb({ success: true, data: { id: payload.id } });
            } 
            else if (action === 'deleteTransaction') {
              const idx = db.recentTransactions.findIndex(t => t.id === payload.id);
              if (idx !== -1) {
                db.recentTransactions.splice(idx, 1);
              }
              this._successCb({ success: true });
            } 
            else if (action === 'saveWallet') {
              const initBal = Number(payload.initialBalance) || 0;
              const newWallet = {
                id: 'W-' + Date.now(),
                name: payload.name,
                type: payload.type || 'Cash',
                balance: initBal,
                icon: 'Wallet'
              };
              db.wallets.push(newWallet);
              db.netWorth += initBal;
              this._successCb({ success: true, id: newWallet.id });
            } 
            else if (action === 'deleteWallet') {
              const idx = db.wallets.findIndex(w => w.id === payload.id);
              if (idx !== -1) {
                db.wallets.splice(idx, 1);
              }
              this._successCb({ success: true });
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
              this._successCb({ success: true });
            }
            else if (action === 'deleteBudget') {
              const idx = db.budgets.findIndex(b => b.id === payload.id);
              if (idx !== -1) {
                db.budgets.splice(idx, 1);
              }
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
      loadDashboardData();
    }
  }
});
