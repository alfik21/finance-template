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
    .addItem("Jalankan Setup / Reset Template", "runManualSetup")
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
 * R-02 (diperbarui): Whitelist email pembuka Web App.
 *
 * Setting deployment Apps Script TIDAK bisa membatasi akses per-email
 * (Who has access hanya menyediakan "Anyone with Google account" / "Anyone"),
 * sehingga penyaringan dilakukan di sisi server. Sumber daftar izin:
 *
 *   1. Sheet PENGATURAN (baris berlabel mengandung "EMAIL"):
 *      - "Email Pemilik"    -> kolom B
 *      - "Email Tambahan"   -> kolom B, dipisah koma / titik koma / baris baru
 *      (dibuat otomatis oleh ensureDatabaseStructure)
 *   2. Pemilik spreadsheet (ss.getOwner()) - selalu diizinkan kecuali
 *      ALLOWED_EMAIL_OWNER=false. CATATAN: dipakai ss.getOwner(), BUKAN
 *      Session.getEffectiveUser(), karena pada deployment USER_ACCESSING
 *      effective user SELALU sama dengan pengunjung sehingga akan membocorkan
 *      akses ke semua orang.
 *   3. Cadangan: Script Properties ALLOWED_EMAILS (dipisah koma).
 *
 * Fail-closed: email kosong (deploy salah / anonim) = ditolak.
 */
function getActiveEmail_() {
  let email = "";
  try { email = Session.getActiveUser().getEmail(); } catch (e) {}
  return String(email || "").trim().toLowerCase();
}

function getSpreadsheetOwnerEmail_(ss) {
  try {
    return String(ss && ss.getOwner ? (ss.getOwner().getEmail() || "") : "").trim().toLowerCase();
  } catch (e) {
    return "";
  }
}

/** Daftar email izin dari sheet PENGATURAN (baris berlabel EMAIL). */
function getAllowedEmailsFromSheet_(ss) {
  const out = {};
  try {
    const sh = ss ? ss.getSheetByName("PENGATURAN") : null;
    if (!sh) return out;
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const label = String(rows[i][0] || "").toUpperCase();
      if (label.indexOf("EMAIL") === -1) continue;
      String(rows[i][1] || "")
        .split(/[,;\n]/g)
        .forEach(function (v) {
          const e = v.trim().toLowerCase();
          if (e) out[e] = true;
        });
    }
  } catch (e) {}
  return out;
}

/**
 * Inti whitelist: apakah `email` terdaftar? (fail-closed)
 * Dipakai oleh getWebAppAccess_() dan isEmailAllowed_().
 */
function isEmailAllowed_(email) {
  if (!email) return false;
  const user = String(email).trim().toLowerCase();

  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    return false;
  }
  if (!ss) return false;

  const allowed = getAllowedEmailsFromSheet_(ss);
  let allowOwner = "true";
  try {
    const props = PropertiesService.getScriptProperties();
    if (props) {
      allowOwner = String(props.getProperty("ALLOWED_EMAIL_OWNER") || "true").toLowerCase();
      String(props.getProperty("ALLOWED_EMAILS") || "")
        .split(",")
        .forEach(function (s) {
          const e = s.trim().toLowerCase();
          if (e) allowed[e] = true;
        });
    }
  } catch (e) {}

  // Pemilik spreadsheet (bukan effective user) diizinkan secara bawaan.
  const owner = getSpreadsheetOwnerEmail_(ss);
  if (allowOwner !== "false" && owner && owner === user) return true;

  return !!allowed[user];
}

/**
 * Pemeriksaan akses Web App.
 * @return {{allowed:boolean, email:string, code:string, message:string}}
 *   code: 'no-identity' | 'no-sheet-access' | 'not-registered'
 */
function getWebAppAccess_() {
  const email = getActiveEmail_();
  if (!email) {
    return {
      allowed: false,
      email: "",
      code: "no-identity",
      message:
        "Email Google Anda tidak terdeteksi. Web App harus dideploy dengan " +
        "Execute as: User accessing the web app agar identitas pengunjung bisa dibaca."
    };
  }

  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    ss = null;
  }
  if (!ss) {
    return {
      allowed: false,
      email: email,
      code: "no-sheet-access",
      message: "Spreadsheet tidak dapat diakses oleh akun " + email + "."
    };
  }

  if (!isEmailAllowed_(email)) {
    return {
      allowed: false,
      email: email,
      code: "not-registered",
      message: "Email " + email + " belum terdaftar sebagai pengguna yang diizinkan."
    };
  }

  return { allowed: true, email: email, code: "", message: "" };
}

/**
 * R-02: Penjaga akses untuk seluruh entry point web app (doGet, apiDispatcher).
 * Melempar Error bertanda accessDenied agar dispatcher bisa menandai responsnya.
 */
function assertWebAccessAllowed_() {
  const access = getWebAppAccess_();
  if (!access.allowed) {
    const err = new Error("Akses ditolak: " + access.message);
    err.accessDenied = true;
    throw err;
  }
  return access;
}

/**
 * Halaman penolakan akses yang ramah (tanpa data aplikasi apa pun).
 */
function buildAccessDeniedOutput_(access) {
  let tips;
  if (access.code === "no-identity") {
    tips =
      "Buka <b>Deploy &gt; Manage deployments &gt; Edit</b>, ubah <b>Execute as</b> menjadi " +
      "<b>User accessing the web app</b>, lalu Deploy ulang sebagai <b>New version</b>.";
  } else if (access.code === "no-sheet-access") {
    tips =
      "Bagikan spreadsheet ini sebagai <b>Editor</b> kepada akun Anda melalui tombol " +
      "<b>Bagikan (Share)</b> di Google Sheets.";
  } else {
    tips =
      "Daftarkan email tersebut pada sheet <b>PENGATURAN</b> (baris <b>Email Pemilik</b> atau " +
      "<b>Email Tambahan</b>, dipisah koma), atau tambahkan properti <b>ALLOWED_EMAILS</b> " +
      "di <b>Project Settings &gt; Script Properties</b>. Perubahan langsung berlaku - " +
      "tidak perlu deploy ulang.";
  }

  const html = [
    "<!DOCTYPE html>",
    '<html lang="id"><head><base target="_top"><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>Akses Ditolak — Finance Tracker</title>",
    "<style>",
    "body{margin:0;background:#f6f8f7;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#1c1e21;",
    "display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}",
    ".card{max-width:520px;background:#fff;border:1px solid #e1e5ea;border-radius:16px;",
    "padding:28px;box-shadow:0 10px 30px rgba(28,30,33,.08);}",
    ".badge{display:inline-block;font-size:11px;font-weight:bold;letter-spacing:.08em;",
    "text-transform:uppercase;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;",
    "border-radius:999px;padding:4px 10px;margin-bottom:14px;}",
    "h1{font-size:20px;margin:0 0 10px;}",
    "p{font-size:14px;line-height:1.6;color:#656b73;margin:0 0 12px;}",
    ".box{background:#f4f7f5;border:1px solid #e1e5ea;border-radius:10px;padding:12px 14px;",
    "font-size:13px;color:#1c1e21;margin-bottom:14px;word-break:break-word;}",
    ".foot{font-size:12px;color:#94a3b8;}",
    "</style></head><body><div class=\"card\">",
    '<span class="badge">Akses Ditolak</span>',
    "<h1>Anda tidak memiliki akses ke Finance Tracker</h1>",
    '<div class="box"><b>Email terdeteksi:</b><br>' + (access.email || "(tidak terdeteksi)") + "</div>",
    "<p>" + access.message + "</p>",
    "<p><b>Solusi:</b> " + tips + "</p>",
    '<p class="foot">Link Web App ini hanya dapat dibuka oleh akun Google yang terdaftar ' +
      "sebagai pemilik atau pengguna izin spreadsheet.</p>",
    "</div></body></html>"
  ].join("");

  return HtmlService.createHtmlOutput(html)
    .setTitle("Akses Ditolak — Finance Tracker")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
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
  // Bila ditolak, sajikan halaman "Akses Ditolak" yang ramah (bukan exception).
  const access = getWebAppAccess_();
  if (!access.allowed) return buildAccessDeniedOutput_(access);
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
      "Finance Tracker — Setup / Reset Template",
      5
    );
  } catch (err) {
    const msg = "Setup / reset template GAGAL: " + (err && err.message ? err.message : err);
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
    // R-02: beri penanda akses ditolak agar frontend bisa menampilkan
    // layar penolakan, bukan sekadar pesan error generik.
    if (err && err.accessDenied) {
      return { success: false, accessDenied: true, error: err.message };
    }
    return { success: false, error: err.message };
  }
}
