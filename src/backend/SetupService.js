/**
 * SetupService.js
 * Inisialisasi dan verifikasi otomatis struktur sheet di dalam Google Spreadsheet pembeli.
 *
 * Perbaikan QC:
 * - R-08: header divalidasi/dimigrasi, boolean Aktif dikoersi, format tanggal & angka diseragamkan.
 * - R-14: tab DASHBOARD diisi ringkasan (bukan hanya warna tab).
 * - R-15: seed anggaran contoh dihapus (hanya dompet/kategori bawaan yang disemai).
 * - R-18: insertSheet dibungkus try/catch dengan pesan yang bisa ditindaklanjuti.
 */

function ensureDatabaseStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const configs = [
    {
      name: "DASHBOARD",
      headers: ["RINGKASAN FINANCE TRACKER", "Nilai", "Keterangan", "Diperbarui"],
      setup: (sheet) => {
        sheet.setTabColor("#1B4332");
      },
      // R-14: isi ringkasan statis agar tab tidak kosong.
      content: (sheet) => {
        const rows = [
          ["Total Saldo (Net Worth)", 0, "Jumlah saldo seluruh dompet aktif", ""],
          ["Pemasukan Bulan Ini", 0, "Rekap mutasi tipe Income pada periode berjalan", ""],
          ["Pengeluaran Bulan Ini", 0, "Rekap mutasi tipe Expense pada periode berjalan", ""],
          ["Jumlah Dompet Aktif", 0, "Dompet dengan status Aktif = TRUE", ""],
          ["Jumlah Kategori", 0, "Kategori Income dan Expense", ""],
          ["Anggaran Aktif", 0, "Anggaran berperiode RECURRING", ""]
        ];
        sheet.getRange(2, 1, rows.length, 4).setValues(rows);
        sheet.getRange(2, 1, rows.length, 1).setFontWeight("bold");
        sheet.getRange(2, 2, rows.length, 1).setNumberFormat("#,##0");
        sheet.getRange(2, 4, rows.length, 1).setNumberFormat("yyyy-mm-dd hh:mm");
        return rows.length;
      }
    },
    {
      name: "TRANSAKSI",
      headers: ["ID", "Tanggal", "Tipe", "Dompet_ID", "Dompet_Tujuan_ID", "Kategori_ID", "Nominal", "Catatan", "Dibuat_Pada"],
      seeds: [],
      setup: (sheet) => {
        sheet.setTabColor("#2D6A4F");
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
        sheet.setTabColor("#40916C");
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
        sheet.setTabColor("#40916C");
      }
    },
    {
      name: "ANGGARAN",
      headers: ["ID", "Kategori_ID", "Periode", "Limit_Nominal"],
      // R-15: tidak ada seed anggaran contoh.
      seeds: [],
      setup: (sheet) => {
        sheet.setTabColor("#2D6A4F");
      }
    },
    {
      // R-02: daftar email yang diizinkan membuka Web App dibaca dari sheet ini
      // (baris berlabel mengandung "EMAIL"), sehingga pembeli cukup mengedit
      // spreadsheet - tanpa membuka Script Properties.
      name: "PENGATURAN",
      headers: ["PENGATURAN", "NILAI", "KETERANGAN"],
      seeds: [],
      setup: (sheet) => {
        sheet.setTabColor("#40916C");
      },
      content: (sheet) => {
        const rows = [
          ["Email Pemilik", "", "Email Google pemilik spreadsheet (selalu diizinkan)"],
          ["Email Tambahan", "", "Email lain yang boleh membuka Web App, dipisah koma"]
        ];
        sheet.getRange(2, 1, rows.length, 3).setValues(rows);
        sheet.getRange(2, 1, rows.length, 1).setFontWeight("bold");
        return rows.length;
      }
    }
  ];

  configs.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      // R-18: gagal membuat sheet harus menghasilkan pesan yang jelas, bukan error mentah.
      try {
        sheet = ss.insertSheet(cfg.name);
      } catch (err) {
        throw new Error(
          "Gagal membuat tab '" + cfg.name + "'. Periksa izin dan pastikan spreadsheet tidak terkunci. Detail: " +
          (err && err.message ? err.message : err)
        );
      }
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
      if (cfg.content) cfg.content(sheet);
    } else {
      // R-08: sheet lama tetap divalidasi & dimigrasi (header, boolean, format).
      migrateExistingSheet_(sheet, cfg);
      // R-14: sheet DASHBOARD lama yang kosong tetap diisi ringkasan.
      if (cfg.content && sheet.getLastRow() < 2) {
        try { cfg.content(sheet); } catch (eContent) { /* abaikan bila terkunci */ }
      }
    }
  });

  // R-21: sheet sistem PENGATURAN diproteksi keras (aplikasi & mitra hanya baca).
  hardenProtectPengaturan_(ss);

  return ss;
}

/**
 * R-21: proteksi keras sheet PENGATURAN.
 * Sheet ini hanya dibaca oleh aplikasi (daftar email izin). Proteksi dibuat
 * non-warning-only, editor lain dihapus, dan pemilik proteksi adalah user
 * efektif yang menjalankan setup. Kegagalan (mis. dijalankan oleh akun tanpa
 * izin proteksi) tidak menjatuhkan proses setup.
 */
function hardenProtectPengaturan_(ss) {
  try {
    const sheet = ss.getSheetByName("PENGATURAN");
    if (!sheet || typeof sheet.protect !== "function") return;
    const type = (SpreadsheetApp.ProtectionType && SpreadsheetApp.ProtectionType.SHEET) || "SHEET";
    let prot;
    const existing = typeof sheet.getProtections === "function"
      ? sheet.getProtections(type)
      : [];
    if (existing && existing.length > 0) {
      prot = existing[0];
      if (prot.isWarningOnly && prot.isWarningOnly()) prot.setWarningOnly(false);
    } else {
      prot = sheet.protect().setDescription(
        "Finance Tracker — sheet sistem (dibaca aplikasi; ubah via menu Finance Tracker)"
      );
    }
    const me = Session.getEffectiveUser().getEmail();
    if (prot.getEditors) {
      const otherEditors = (prot.getEditors() || [])
        .map((u) => (u && u.getEmail ? u.getEmail() : ""))
        .filter((e) => e && e !== me);
      if (otherEditors.length && prot.removeEditors) prot.removeEditors(otherEditors);
    }
    if (prot.canDomainEdit && prot.canDomainEdit()) prot.setDomainEdit(false);
  } catch (e) {
    console.warn("Proteksi PENGATURAN dilewati: " + (e && e.message ? e.message : e));
  }
}

/**
 * R-08: validasi header sheet yang sudah ada, tambahkan kolom yang hilangkan,
 * koersi nilai boolean Aktif, dan terapkan format tanggal/angka.
 */
function migrateExistingSheet_(sheet, cfg) {
  try {
    const headerRange = sheet.getRange(1, 1, 1, cfg.headers.length);
    const current = headerRange.getValues()[0];
    let headerChanged = false;
    for (let i = 0; i < cfg.headers.length; i++) {
      const expected = cfg.headers[i];
      const actual = current[i];
      const actualStr = actual === null || actual === undefined ? "" : String(actual).trim();
      if (actualStr !== expected) {
        // Hanya menimpa bila sel kosong atau tidak cocok dengan nama kolom yang dikenal.
        if (actualStr === "" || !isKnownHeader_(actualStr)) {
          current[i] = expected;
          headerChanged = true;
        }
      }
    }
    if (headerChanged) headerRange.setValues([current]);

    // Koersi kolom boolean Aktif (DOMPET): teks "FALSE"/"false" -> false, dst.
    if (cfg.name === "DOMPET") {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const values = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
        let changed = false;
        // getValues()/setValues() selalu 2 dimensi: kembalikan [nilai] per baris.
        const coerced = values.map(row => {
          const v = row[0];
          if (typeof v === "string") {
            const low = v.trim().toLowerCase();
            if (low === "true" || low === "1" || low === "ya") { changed = true; return [true]; }
            if (low === "false" || low === "0" || low === "tidak" || low === "") { changed = true; return [false]; }
          }
          return [v];
        });
        if (changed) sheet.getRange(2, 6, lastRow - 1, 1).setValues(coerced);
      }
    }

    // Format tanggal (TRANSAKSI.Tanggal, ANGGARAN tanpa tanggal) & angka.
    const lastRow2 = sheet.getLastRow();
    if (lastRow2 > 1) {
      if (cfg.name === "TRANSAKSI") {
        sheet.getRange(2, 2, lastRow2 - 1, 1).setNumberFormat("yyyy-mm-dd");
        sheet.getRange(2, 7, lastRow2 - 1, 1).setNumberFormat("#,##0");
      } else if (cfg.name === "DOMPET") {
        sheet.getRange(2, 4, lastRow2 - 1, 1).setNumberFormat("#,##0");
      } else if (cfg.name === "ANGGARAN") {
        sheet.getRange(2, 4, lastRow2 - 1, 1).setNumberFormat("#,##0");
      }
    }
  } catch (e) {
    // Migrasi tidak boleh menjatuhkan seluruh aplikasi; lanjutkan dengan struktur lama.
    console.warn("Migrasi sheet " + cfg.name + " gagal: " + (e && e.message ? e.message : e));
  }
}

const KNOWN_HEADERS_ = {
  ID: true, Tanggal: true, Tipe: true, Dompet_ID: true, Dompet_Tujuan_ID: true,
  Kategori_ID: true, Nominal: true, Catatan: true, Dibuat_Pada: true,
  Nama_Dompet: true, Saldo_Awal: true, Ikon: true, Aktif: true,
  Nama_Kategori: true, Periode: true, Limit_Nominal: true,
  Nilai: true, Keterangan: true, Diperbarui: true,
  PENGATURAN: true, NILAI: true
};

function isKnownHeader_(name) {
  return KNOWN_HEADERS_[name] === true;
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
  // R-08: serial date GAS terbaca sebagai number -> konversi, bukan String(...).substring(0,10).
  if (typeof val === "number" && isFinite(val) && val > 20000 && val < 60000) {
    const ms = Math.round((val - 25569) * 86400 * 1000);
    const d = new Date(ms);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const s = String(val).trim();
  // Format dd/mm/yyyy -> yyyy-mm-dd agar masuk periode yang benar.
  const idMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (idMatch) {
    const dd = String(idMatch[1]).padStart(2, "0");
    const mm = String(idMatch[2]).padStart(2, "0");
    return `${idMatch[3]}-${mm}-${dd}`;
  }
  return s.substring(0, 10);
}
