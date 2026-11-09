/**
 * Code.js (Container-Bound Edition)
 * Menghubungkan Google Sheets dengan antarmuka web app kustom.
 */

function onOpen() {
  // Struktur menu mengikuti pola menu pada family-finance-template:
  // satu pintasan utama, pemisah, lalu tiga perintah operasional.
  SpreadsheetApp.getUi()
    .createMenu("Finance Tracker")
    .addItem("Buka Aplikasi (Modal)", "openAppDialog")
    .addSeparator()
    .addItem("Jalankan Setup / Resei Template", "runManualSetup")
    .addItem("Tutup Buku & Arsipkan Tahun Lalu", "menuCloseYearArchive")
    .addItem("Petunjuk Pasang di HP (Pintasan)", "menuShowMobileGuide")
    .addToUi();
}

function getUserEmailSafe() {
  try {
    const email = Session.getActiveUser().getEmail();
    if (email) return email;
  } catch (e) {}
  try {
    const effective = Session.getEffectiveUser().getEmail();
    if (effective) return effective;
  } catch (e) {}
  return "Pengguna";
}

/**
 * R-17: tampilkan email dalam bentuk tersamar di UI (a***@domain.com)
 * agar email pemilik tidak bocor ke pengunjung pada mode deployment tertentu.
 */
function maskEmailForDisplay_(email) {
  if (!email || email === "Pengguna") return email || "Pengguna";
  const s = String(email);
  const at = s.indexOf("@");
  if (at <= 0) return "***";
  const user = s.substring(0, at);
  const domain = s.substring(at);
  const head = user.charAt(0);
  return head + "***" + domain;
}

/**
 * R-01: Resolusi path template yang toleran terhadap dua mode instalasi.
 * - Manual copy: file HTML datar "Index.html" -> "frontend/Index"
 * - Clasp / push: rootDir ./src sehingga path "frontend/Index" valid.
 */
function resolveIndexTemplateFile_() {
  const candidates = ["frontend/Index", "Index"];
  for (let i = 0; i < candidates.length; i++) {
    try {
      const t = HtmlService.createTemplateFromFile(candidates[i]);
      if (t) return { name: candidates[i], template: t };
    } catch (e) {
      // Lanjut ke kandidat berikutnya.
    }
  }
  throw new Error(
    "Template frontend tidak ditemukan. Pastikan file HTML 'Index' terpasang (mode manual) atau folder frontend/ ikut ter-push (mode clasp)."
  );
}

/**
 * R-02: Whitelist email pemilik. Web app deploy dengan executeAs USER_ACCESSING
 * tetap hanya boleh diakses akun yang terdaftar.
 * - Secara bawaan (default), akun pemilik sah spreadsheet (Session.getEffectiveUser())
 *   selalu diizinkan agar pembeli tidak terblokir di workbook mereka sendiri.
 * - Akun tambahan dapat didaftarkan via Script Properties: ALLOWED_EMAILS (dipisah koma).
 * - Mode pemilik bawaan dapat dimatikan dengan menyetel ALLOWED_EMAIL_OWNER=false.
 */
function isEmailAllowed_(email) {
  if (!email) return false;
  const user = String(email).trim().toLowerCase();
  try {
    const props = PropertiesService.getScriptProperties();
    const allowOwner = props ? String(props.getProperty("ALLOWED_EMAIL_OWNER") || "true").toLowerCase() : "true";

    // 1. Pemilik spreadsheet (effective user) selalu diizinkan secara default.
    if (allowOwner !== "false") {
      try {
        const ownerEmail = Session.getEffectiveUser().getEmail();
        if (ownerEmail && ownerEmail.trim().toLowerCase() === user) return true;
      } catch (eOwner) {}
    }

    // 2. Daftar email tambahan di Script Properties (ALLOWED_EMAILS).
    if (props) {
      const ownerList = String(props.getProperty("ALLOWED_EMAILS") || "")
        .split(",")
        .map(function (s) { return s.trim().toLowerCase(); })
        .filter(Boolean);
      if (ownerList.indexOf(user) !== -1) return true;
    }
  } catch (e) {}
  return false;
}

/**
 * R-02: Penjaga akses untuk seluruh entry point web app (doGet, apiDispatcher).
 */
function assertWebAccessAllowed_() {
  let email = "";
  try { email = Session.getActiveUser().getEmail(); } catch (e) {}
  if (!email) {
    try { email = Session.getEffectiveUser().getEmail(); } catch (eEff) {}
  }
  if (!isEmailAllowed_(email)) {
    throw new Error(
      "Akses ditolak: email '" + (email || "tanpa identitas") +
      "' tidak terdaftar sebagai pemilik. Daftarkan di Script Properties -> ALLOWED_EMAILS."
    );
  }
}

function openAppDialog() {
  ensureDatabaseStructure();
  const resolved = resolveIndexTemplateFile_();
  const template = resolved.template;
  template.userEmail = maskEmailForDisplay_(getUserEmailSafe());
  template.mode = "DIALOG";

  const html = template.evaluate()
    .setWidth(1080)
    .setHeight(720);

  SpreadsheetApp.getUi().showModalDialog(html, "Finance Tracker");
}

function openAppSidebar() {
  ensureDatabaseStructure();
  // R-17: Sajikan sidebar hanya bila konteks UI Google Sheets tersedia.
  try {
    const ui = SpreadsheetApp.getUi();
    if (!ui) throw new Error("UI Google Sheets tidak tersedia");
    const template = resolveIndexTemplateFile_().template;
    template.userEmail = maskEmailForDisplay_(getUserEmailSafe());
    template.mode = "SIDEBAR";

    const html = template.evaluate()
      .setTitle("Finance Tracker")
      .setWidth(380);

    ui.showSidebar(html);
  } catch (e) {
    const msg = "Sidebar hanya dapat dibuka dari dalam Google Sheets (menu Finance Tracker). Error: " +
      (e && e.message ? e.message : e);
    try {
      SpreadsheetApp.getUi().alert(msg);
    } catch (e2) {
      throw new Error(msg);
    }
  }
}

function doGet(e) {
  // R-02: batasi akses web app pada email yang terdaftar.
  assertWebAccessAllowed_();
  ensureDatabaseStructure();
  const template = resolveIndexTemplateFile_().template;
  template.userEmail = maskEmailForDisplay_(getUserEmailSafe());
  template.mode = "FULL";

  // R-18: tidak ada meta viewport kedua - template Index.html sudah memuatnya.
  return template.evaluate()
    .setTitle("Finance Tracker")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function runManualSetup() {
  // R-22: laporan hasil yang sebenarnya - sukses hanya bila seluruh langkah
  // inisialisasi dan penyegaran ringkasan benar-benar selesai.
  try {
    ensureDatabaseStructure();
    refreshDashboardSummary_();
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Database siap: struktur tab terverifikasi dan ringkasan DASHBOARD diperbarui.",
      "Finance Tracker - Setup / Resei Template",
      5
    );
  } catch (err) {
    const msg = "Setup / resei template GAGAL: " + (err && err.message ? err.message : err);
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(msg, "Finance Tracker", 8);
    } catch (e2) {
      throw new Error(msg);
    }
    throw err;
  }
}

/**
 * Item menu "Tutup Buku & Arsipkan Tahun Lalu".
 * Pengguna mengetik tahun yang akan ditutup (konfirmasi eksplisit), lalu
 * closeAndArchiveYear() memindahkan transaksi tahun itu ke tab ARSIP_<tahun>.
 */
function menuCloseYearArchive() {
  const ui = SpreadsheetApp.getUi();
  const pending = checkPendingArchive_();
  const defaultYear = pending.pendingYears.length > 0
    ? pending.pendingYears[0]
    : new Date().getFullYear() - 1;

  let response;
  try {
    response = ui.prompt(
      "Tutup Buku & Arsip Tahunan",
      "Masukkan tahun yang ingin ditutup dan diarsipkan (contoh: " + defaultYear + "):\n\n" +
        "Seluruh transaksi tahun tersebut akan disalin ke tab ARSIP_<tahun> lalu dihapus dari TRANSAKSI. " +
        "Saldo awal tiap dompet otomatis disesuaikan agar total saldo tidak berubah, dan proses tercatat di tab AUDIT. " +
        "Tabel ANGGARAN, DOMPET, KATEGORI, dan DASHBOARD tidak dihapus.",
      ui.ButtonSet.OK_CANCEL
    );
  } catch (e) {
    ui.alert("Prompt tidak tersedia di konteks ini. Buka menu langsung dari spreadsheet Google Sheets.");
    return;
  }

  if (response.getSelectedButton() !== ui.Button.OK) return; // dibatalkan pengguna

  const input = String(response.getResponseText() || "").trim();
  if (!/^\d{4}$/.test(input)) {
    ui.alert("Tahun tidak valid. Proses dibatalkan.");
    return;
  }

  try {
    const res = closeAndArchiveYear(Number(input));
    ui.alert(res.success ? "Tutup Buku Selesai" : "Tutup Buku Gagal", res.message, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert(
      "Tutup Buku Gagal",
      "Terjadi galat: " + (err && err.message ? err.message : err),
      ui.ButtonSet.OK
    );
  }
}

/**
 * Item menu "Petunjuk Pasang di HP (Pintasan)".
 * Label memakai "pintasan" alih-alih "PWA" sesuai temuan R-20: produk tidak
 * memiliki manifest/service worker sehingga Add to Home Screen hanyalah
 * bookmark browser yang tetap membutuhkan koneksi internet.
 */
function menuShowMobileGuide() {
  const ui = SpreadsheetApp.getUi();
  const body =
    "Untuk membuka Finance Tracker di smartphone Anda:\n\n" +
    "1. Di komputer, buka menu Ekstensi > Apps Script.\n" +
    "2. Klik Deploy (Terapkan) > New deployment (Penerapan baru), pilih tipe Web app.\n" +
    "3. Isi Execute as: User accessing the web app dan Who has access: Anyone with Google account " +
      "(akun yang terdaftar di Script Properties ALLOWED_EMAILS).\n" +
    "4. Klik Deploy lalu salin URL Web App yang dihasilkan, kirimkan ke ponsel Anda.\n" +
    "5. Buka URL tersebut di Safari (iOS) atau Chrome (Android).\n" +
    "6. Tambahkan ke Layar Utama (Add to Home Screen) agar tampil seperti aplikasi tanpa instalasi " +
      "Play Store / App Store.\n\n" +
    "Catatan: ini pintasan browser (bookmark), bukan PWA penuh karena tidak memiliki manifest/service worker, " +
      "sehingga tetap memerlukan koneksi internet.\n" +
    "Di dalam spreadsheet, aplikasi tetap dapat dibuka lewat menu Finance Tracker > Buka Aplikasi (Modal).";
  ui.alert("Petunjuk Menggunakan Aplikasi di Smartphone", body, ui.ButtonSet.OK);
}

function include(filename) {
  // R-01: dukung instalasi manual (file datar "Styles"/"App") sekaligus
  // instalasi clasp (path "frontend/Styles", "frontend/App").
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (e) {
    const alt = String(filename).replace(/^frontend\//, "");
    return HtmlService.createHtmlOutputFromFile(alt).getContent();
  }
}

function apiDispatcher(action, payload) {
  try {
    // R-02: seluruh aksi API wajib lolos whitelist email.
    assertWebAccessAllowed_();
    // R-11: tolak payload berukuran tidak wajar sebelum diproses.
    if (payload !== null && payload !== undefined) {
      let size = 0;
      try { size = JSON.stringify(payload).length; } catch (eSer) { size = 0; }
      if (size > 200000) {
        throw new Error("Payload terlalu besar (" + size + " karakter). Maksimal 200.000 karakter.");
      }
    }
    switch (action) {
      case "getDashboard":
        return { success: true, data: getDashboardData() };
      case "createTransaction":
        return { success: true, data: createTransaction(payload) };
      case "updateTransaction":
        return { success: true, data: updateTransaction(payload) };
      case "deleteTransaction":
        return { success: true, data: deleteTransaction(payload.id) };
      case "saveBudget":
        return { success: true, data: saveBudget(payload) };
      case "deleteBudget":
        return { success: true, data: deleteBudget(payload.id) };
      case "saveCategory":
        return { success: true, data: saveCategory(payload) };
      case "saveWallet":
        return { success: true, data: saveWallet(payload) };
      case "deleteWallet":
        return { success: true, data: deleteWallet(payload.id) };
      case "restoreWallet":
        return { success: true, data: restoreWallet(payload.id) };
      default:
        throw new Error("Aksi API '" + action + "' tidak dikenali.");
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
