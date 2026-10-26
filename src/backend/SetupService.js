/**
 * SetupService.js
 * Inisialisasi dan verifikasi otomatis struktur sheet di dalam Google Spreadsheet pembeli.
 */

function ensureDatabaseStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const currentPeriod = getCurrentMonthPeriod();

  const configs = [
    {
      name: "DASHBOARD",
      headers: ["RINGKASAN FINANCE TRACKER", "", "", ""],
      setup: (sheet) => {
        sheet.setTabColor("#0D6858");
      }
    },
    {
      name: "TRANSAKSI",
      headers: ["ID", "Tanggal", "Tipe", "Dompet_ID", "Dompet_Tujuan_ID", "Kategori_ID", "Nominal", "Catatan", "Dibuat_Pada"],
      seeds: [],
      setup: (sheet) => {
        sheet.setTabColor("#2563EB");
      }
    },
    {
      name: "DOMPET",
      headers: ["ID", "Nama_Dompet", "Tipe", "Saldo_Awal", "Ikon", "Aktif"],
      seeds: [
        ["W-1", "Dompet Tunai", "Cash", 0, "Wallet", true],
        ["W-2", "BCA Tabungan", "Bank", 0, "Bank", true],
        ["W-3", "GoPay", "E-Wallet", 0, "Smartphone", true]
      ],
      setup: (sheet) => {
        sheet.setTabColor("#475569");
      }
    },
    {
      name: "KATEGORI",
      headers: ["ID", "Nama_Kategori", "Tipe", "Ikon"],
      seeds: [
        ["C-IN-1", "Gaji Pokok", "Income", "Briefcase"],
        ["C-IN-2", "Modal Awal / Setoran Kas", "Income", "PlusCircle"],
        ["C-IN-3", "Pemasukan Tambahan", "Income", "TrendingUp"],
        ["C-EX-1", "Makan & Minum", "Expense", "Coffee"],
        ["C-EX-2", "Transportasi & Bensin", "Expense", "Navigation"],
        ["C-EX-3", "Tagihan & WiFi", "Expense", "Zap"],
        ["C-EX-4", "Kebutuhan Rumah", "Expense", "Home"],
        ["C-EX-5", "Hiburan & Hobi", "Expense", "Smile"]
      ],
      setup: (sheet) => {
        sheet.setTabColor("#C53030");
      }
    },
    {
      name: "ANGGARAN",
      headers: ["ID", "Kategori_ID", "Periode", "Limit_Nominal"],
      seeds: [
        ["B-1", "C-EX-1", "RECURRING", 1500000],
        ["B-2", "C-EX-2", "RECURRING", 500000]
      ],
      setup: (sheet) => {
        sheet.setTabColor("#D97706");
      }
    }
  ];

  configs.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
      sheet.appendRow(cfg.headers);
      sheet.getRange(1, 1, 1, cfg.headers.length)
        .setFontWeight("bold")
        .setBackground("#F1F5F9")
        .setFontColor("#0F172A");
      sheet.setFrozenRows(1);

      if (cfg.seeds && cfg.seeds.length > 0) {
        sheet.getRange(2, 1, cfg.seeds.length, cfg.seeds[0].length).setValues(cfg.seeds);
      }
      if (cfg.setup) cfg.setup(sheet);
    }
  });

  return ss;
}

function getCurrentMonthPeriod() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function formatDateIso(val) {
  if (!val) return "";
  if (val instanceof Date) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, "0");
    const dd = String(val.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(val).substring(0, 10);
}
