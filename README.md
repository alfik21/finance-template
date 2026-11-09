# Finance Tracker (Personal Edition)

Sistem pencatatan dan manajemen kas keuangan pribadi terpadu berbasis **Google Sheets** dan **Google Apps Script Web App (Container-Bound)**.

Bebas biaya langganan bulanan (*Zero-Subscription*), 100% data tersimpan aman di Google Drive pribadi Anda, dan dapat diakses dari browser komputer maupun ditambahkan sebagai pintasan di layar utama smartphone (*Add to Home Screen*). Catatan: aplikasi ini berupa Web App, bukan PWA penuh (tidak memakai `manifest.json`/service worker) sehingga tetap memerlukan koneksi internet.

---

## Fitur Utama Produk

- **Desain Modern & Utilitarian (Warm Sage Green)**: Tipografi *Plus Jakarta Sans* dengan angka tabular rapi (*JetBrains Mono / Tabular Nums*). Tanpa elemen berlebihan, cepat, dan responsif.
- **Buku Kas 3 Tampilan Fleksibel**:
  - **Tampilan Harian**: Daftar mutasi kas terkelompok rapi per hari dengan subtotal harian.
  - **Tampilan Bulanan**: Kartu ringkasan performa per bulan (Masuk, Keluar, Sisa Kas) dengan pemilih bulan dinamis.
  - **Tampilan Statistik**: Diagram lingkaran (*Donut Chart*) persentase alokasi belanja per kategori, serta bar horizontal alokasi per kantong dompet.
- **Kantong Saldo Multi-Akun & Saldo Awal**: Mendukung rekening bank, dompet tunai (*cash*), dan e-wallet. Dilengkapi pengaturan **Saldo Awal Tabungan** sehingga aset awal tercatat tanpa merusak arus kas masuk bulanan berjalan.
- **Mutasi Transfer Kas Antar Dompet**: Fitur pindah dana antar rekening dengan validasi cerdas pencegah transfer ke rekening yang sama.
- **Target Anggaran Berulang (*Recurring Budgets*)**: Tetapkan batas belanja per kategori yang otomatis berulang setiap awal bulan baru tanpa perlu diinput ulang.
- **Tombol Cepat Cerdas 1-Ketuk (*Smart Habit Chips*)**: Mengisi nominal, catatan, dan kategori belanja rutin (bensin, makan siang, kopi) secara instan hanya dengan 1 ketukan.
- **Fitur Koreksi Transaksi (Edit & Hapus)**: Edit dan perbarui mutasi transaksi yang salah input secara langsung dari smartphone.
- **Format Rupiah Otomatis Realtime**: Input nominal otomatis memformat pemisah ribuan titik (`.`) saat mengetik angka nominal.
- **Akses Langsung dari Menu Spreadsheet**: Buka antarmuka aplikasi lewat menu toolbar Google Sheets **`Finance Tracker` > `Buka Aplikasi (Modal)`** (jendela 1080x720px); menu juga memuat perintah **Jalankan Setup / Resei Template**, **Tutup Buku & Arsipkan Tahun Lalu**, dan **Petunjuk Pasang di HP (Pintasan)**.
- **Validasi & Keamanan Data**: Nominal, tanggal, tipe, kategori, dan dompet divalidasi di backend; operasi tulis memakai `LockService`; penghapusan tercatat di tab `AUDIT`; akses Web App dibatasi daftar email di sheet `PENGATURAN` (email lain melihat halaman **Akses Ditolak**).

---

## Struktur File & Folder

```text
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ appsscript.json            # Manifest izin Apps Script (Container-Bound)
â”‚   â”œâ”€â”€ backend/
â”‚   â”‚   â”œâ”€â”€ Code.js                # Handler onOpen(), doGet(), dan API dispatcher
â”‚   â”‚   â”œâ”€â”€ SetupService.js        # Inisialisasi otomatis tab sheet & styling tema
â”‚   â”‚   â””â”€â”€ TransactionService.js  # Mesin kalkulasi saldo, mutasi, anggaran, & dompet
â”‚   â””â”€â”€ frontend/
â”‚       â”œâ”€â”€ Index.html             # Shell struktur aplikasi & navigasi bawah HP
â”‚       â”œâ”€â”€ Styles.html            # Desain CSS sistem Sage Green utilitarian
â”‚       â””â”€â”€ App.html               # Logika antarmuka klien & interaksi reaktif
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ 01_PRODUCT_BRIEF_AND_REQUIREMENTS.md  # Product Brief, target market, & model harga
â”‚   â”œâ”€â”€ 02_PRODUCT_TESTING_CHECKLIST.md       # Matriks pengujian QA sebelum rilis penjualan
â”‚   â”œâ”€â”€ 03_USER_GUIDE.md                      # Panduan lengkap pembeli (salin, input, dashboard, & HP)
â”‚   â””â”€â”€ 04_LICENSE_AND_TERMS_OF_USE.md        # Perjanjian lisensi, hak modifikasi, & ketentuan refund
â”œâ”€â”€ demo/
â”‚   â”œâ”€â”€ index.html                 # Interactive Product Preview (Showcase simulator untuk calon pembeli)
â”‚   â”œâ”€â”€ assets/tailwindcss.js      # Tailwind lokal agar demo tidak bergantung CDN
â”‚   â””â”€â”€ WebApp.html                # Standalone Web App client untuk frame preview demo
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ e2e/                       # Pengujian otomatis Playwright (transaksi & demo)
â”‚   â”œâ”€â”€ backend/                   # Regresi backend GAS (node:test + fake SpreadsheetApp)
â”‚   â”œâ”€â”€ fixtures/                  # Fixture pengujian lokal (hasil generate)
â”‚   â””â”€â”€ mocks/                     # Google Apps Script API mock engine
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ prepare-test-app.js        # Compiler fixture pengujian & sinkronisasi file demo
â”‚   â””â”€â”€ clasp-version.js           # Menyamakan versi Apps Script dengan package.json
â”œâ”€â”€ preview.html                   # Pratinjau aplikasi offline untuk komputer lokal
â”œâ”€â”€ setup_guide.md                 # Panduan lengkap penjual: Master sheet, trik URL /copy, & hosting demo
â”œâ”€â”€ package.json                   # Metadata proyek & version tracking
â””â”€â”€ README.md                      # Dokumentasi pengenalan dan instalasi
```

---

## Uji Coba Cepat di Komputer Lokal (Interactive Demo)

Anda dapat menguji antarmuka dan alur kerja aplikasi secara langsung di browser tanpa perlu koneksi internet:

1. Buka file [`demo/index.html`](file:///J:/Aplikasi/finance-template/demo/index.html) langsung di browser Anda (Google Chrome / Edge / Safari).
2. Di toolbar atas, coba ganti tampilan antara **Mobile View** dan **Desktop View**.
3. Coba tap tombol cepat atau input catatan pengeluaran baru.
4. Perhatikan tabel **Simulasi Spreadsheet Realtime** di sebelah kanan yang otomatis ter-update secara langsung.
5. Folder `demo/` ini siap Anda hosting di **GitHub Pages, Vercel, Netlify, atau Cloudflare Pages** sebagai link demo gratis bagi calon pembeli produk Anda.

---

## Panduan Instalasi ke Google Sheets & Deploy Web App (3 Menit)

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka browser dan kunjungi [sheets.new](https://sheets.new).
2. Beri nama file spreadsheet Anda, misalnya: `Finance Tracker 2026`.

### Langkah 2: Buka Apps Script & Masukkan Kode
1. Di menu atas Google Sheets, klik **Ekstensi** (*Extensions*) > **Apps Script**.
2. Di panel kiri Apps Script:
   - Buat file skrip baru bernama `SetupService.gs`, lalu salin seluruh isi dari file [`src/backend/SetupService.js`](file:///J:/Aplikasi/finance-template/src/backend/SetupService.js).
   - Buat file skrip baru bernama `TransactionService.gs`, lalu salin seluruh isi dari file [`src/backend/TransactionService.js`](file:///J:/Aplikasi/finance-template/src/backend/TransactionService.js).
   - Di file default `Code.gs`, ganti isinya dengan isi dari file [`src/backend/Code.js`](file:///J:/Aplikasi/finance-template/src/backend/Code.js).
   - Klik tombol **+** di sebelah Files > pilih **HTML** > beri nama `Index.html`. Salin isi dari [`src/frontend/Index.html`](file:///J:/Aplikasi/finance-template/src/frontend/Index.html).
   - Klik tombol **+** di sebelah Files > pilih **HTML** > beri nama `Styles.html`. Salin isi dari [`src/frontend/Styles.html`](file:///J:/Aplikasi/finance-template/src/frontend/Styles.html).
   - Klik tombol **+** di sebelah Files > pilih **HTML** > beri nama `App.html`. Salin isi dari [`src/frontend/App.html`](file:///J:/Aplikasi/finance-template/src/frontend/App.html).
3. Klik tombol **Simpan** (Ctrl+S / Cmd+S).

> **Penting (R-01)**: nama file HTML harus persis `Index`, `Styles`, dan `App` pada instalasi manual (tanpa folder `frontend/`). Sejak v1.8.0 backend mendukung dua mode sekaligus: file datar seperti di atas **atau** struktur `frontend/Index.html` bila Anda memakai `clasp push` dengan `rootDir: "./src"` (lihat `.clasp.json`). Tidak perlu mengubah `include()` secara manual.

> **Alternatif untuk pengguna teknis**: gunakan [`@google/clasp`](https://github.com/google/clasp) â€” `npm install`, lalu `npm run login` dan `npm run push`. Perintah `npm run deploy` juga membuat versi Apps Script otomatis dari nomor versi `package.json`.

### Langkah 3: Inisialisasi Otomatis Spreadsheet
1. Kembali ke tab Google Sheets Anda, lalu lakukan **Refresh / Muat Ulang Halaman (F5)**.
2. Tunggu beberapa detik hingga menu kustom baru muncul di menu bar atas:  
   **`[ Finance Tracker ]`**
3. Klik menu tersebut > pilih **Buka Aplikasi (Modal)**. (Menu juga memuat **Jalankan Setup / Resei Template**, **Tutup Buku & Arsipkan Tahun Lalu**, dan **Petunjuk Pasang di HP (Pintasan)**.)
4. Saat pertama kali dijalankan, Google akan memunculkan konfirmasi izin (*Authorization Required*):
   - Klik **Lanjutkan / Review Permissions** > pilih akun Google Anda.
   - Klik **Advanced (Lanjutan)** > klik **Go to Finance Tracker (unsafe)**.
   - Klik **Allow / Izinkan**.
5. Seluruh struktur tab sheet (`TRANSAKSI`, `DOMPET`, `KATEGORI`, `ANGGARAN`, `DASHBOARD`, `PENGATURAN`) akan terformat rapi secara otomatis.

### Langkah 4: Deploy Web App untuk Akses Smartphone
1. Di halaman Apps Script, klik tombol biru **Deploy** (Terapkan) di pojok kanan atas > pilih **New deployment** (Penerapan baru).
2. Klik tombol gerigi di samping *Select type* > pilih **Web app**.
3. Atur konfigurasi:
   - **Description**: `Finance Tracker v1.0`
   - **Execute as**: `User accessing the web app`
   - **Who has access**: `Anyone with Google account` (atau `Anyone`)
4. Klik **Deploy** dan salin **Web app URL** yang muncul.
5. **Wajib (R-02): batasi siapa saja yang boleh membuka link Web App.** Sumber daftar email izin, dari yang paling utama:
   - **Sheet `PENGATURAN`** (dibuat otomatis saat setup) — isi kolom **NILAI** pada baris:
     - `Email Pemilik` = akun Google Anda,
     - `Email Tambahan` = email lain yang diizinkan, dipisah koma (contoh: `satu@gmail.com, dua@gmail.com`).
   - **Pemilik spreadsheet** selalu diizinkan secara bawaan. Matikan dengan properti `ALLOWED_EMAIL_OWNER=false`.
   - **Cadangan: Script Properties** `ALLOWED_EMAILS` (dipisah koma) bila Anda tidak memakai sheet.

   Email yang tidak terdaftar akan melihat halaman **"Akses Ditolak"** (bukan error), dan seluruh fungsi API ikut diblokir. Perubahan daftar email langsung berlaku tanpa deploy ulang.
   - **Catatan deployment**: gunakan **Execute as: User accessing the web app**. Bila salah setel (Execute as: Me), setiap pengunjung dianggap tanpa identitas dan akan ditolak (*fail-closed*).

### Langkah 5: Pasang di Layar Utama HP (Add to Home Screen)
Buka link Web App tersebut di smartphone Anda:
- **Di iPhone (Safari)**: Buka URL > tap ikon **Share** (kotak panah ke atas) > pilih **Add to Home Screen** (*Tambah ke Layar Utama*).
- **Di Android (Chrome)**: Buka URL > tap menu titik tiga di pojok kanan atas > pilih **Add to Home screen** / **Install app**.

Kini aplikasi dapat dibuka dalam 1 detik langsung dari pintasan layar HP tanpa perlu membuka spreadsheet manual. Ini adalah pintasan browser (*bookmark*), bukan aplikasi PWA yang dapat berjalan offline.

---

## Pengujian Otomatis

| Perintah | Cakupan |
|---|---|
| `npm run test:backend` | Regresi backend produk asli (52 tes `node:test` dengan tiruan `SpreadsheetApp`): validasi transaksi, saldo, lock, allowlist email, DASHBOARD, AUDIT, resolusi template, serta menu dan tutup buku/arsip tahunan. Tidak memerlukan browser. |
| `npm run test:syntax` | Parse seluruh `<script>` inline pada artefak hasil generate (`WebApp.html`, `preview.html`, `demo/index.html`, `demo/WebApp.html`, `tests/fixtures/app-test.html`); gagal bila ada script rusak. |
| `npm run verify` | `test:backend` + regenerasi fixture + `test:syntax`. Gerbang cepat sebelum commit. |
| `npm test` | Regenerate fixture lalu menjalankan seluruh tes Playwright (UI, akuntansi, demo). Memerlukan `npx playwright install chromium` dan lingkungan yang dapat menjalankan browser. |
| `npm run test:all` | `test:backend` + `test`. |

CI GitHub Actions (`.github/workflows/ci.yml`) menjalankan `test:backend`, regenerasi artefak + deteksi drift (`git diff --exit-code`), `test:syntax`, dan `npm audit --audit-level=high` pada Node 20 & 22 setiap push/PR; job Playwright berjalan informatif (`continue-on-error`).

Artefak `WebApp.html`, `demo/WebApp.html`, `preview.html`, dan `tests/fixtures/app-test.html` seluruhnya **hasil generate** (`node scripts/prepare-test-app.js`) dan tidak boleh diedit manual; build bersifat deterministik (tidak menulis tanggal).

---

## Dokumentasi Resmi & Berkas Penjualan

Seluruh dokumen pelengkap komersial dan acuan operasional tersedia di folder [`docs/`](file:///J:/Aplikasi/finance-template/docs):

| No. | Dokumen | Fungsi | Format | PIC | Berkas Siap Baca (DOCX / XLSX) |
|---|---|---|---|---|---|
| 1 | [**Product Brief & Requirements**](file:///J:/Aplikasi/finance-template/docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.md) | Menjelaskan target pengguna, tujuan produk, fitur, dan batasannya | Google Docs | Operations | [**Unduh DOCX**](file:///J:/Aplikasi/finance-template/docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx) |
| 2a | [**Panduan & SOP Pengujian Produk**](file:///J:/Aplikasi/finance-template/docs/02_PANDUAN_PENGUJIAN_PRODUK.md) | Petunjuk teknis prosedur pengujian langkah demi langkah | Google Docs / PDF | Finance + Operations | [**Unduh DOCX**](file:///J:/Aplikasi/finance-template/docs/02_PANDUAN_PENGUJIAN_PRODUK.docx) |
| 2b | [**Product Testing Checklist (Blank Template)**](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.md) | Lembar kerja kosong verifikasi rumus & fungsi fitur | Google Sheets | Finance + Operations | [**Workbook XLSX 2 Tab**](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.xlsx) |
| 3 | [**User Guide**](file:///J:/Aplikasi/finance-template/docs/03_USER_GUIDE.md) | Panduan penggunaan untuk pembeli | PDF | Operations | [**Unduh DOCX**](file:///J:/Aplikasi/finance-template/docs/03_USER_GUIDE.docx) |
| 4 | [**License & Terms of Use**](file:///J:/Aplikasi/finance-template/docs/04_LICENSE_AND_TERMS_OF_USE.md) | Mengatur hak penggunaan, distribusi, dan ketentuan pembelian | PDF | Operations + Finance | [**Unduh DOCX**](file:///J:/Aplikasi/finance-template/docs/04_LICENSE_AND_TERMS_OF_USE.docx) |
| 5 | [**Laporan QC & Product Testing**](file:///J:/Aplikasi/finance-template/docs/05_LAPORAN_QC_PRODUCT_TESTING.md) | Hasil audit 67 temuan (produk asli, demo, dan frontend bersama) | Markdown | QA | - |
| 6 | [**Dokumentasi Perbaikan v1.9.0**](file:///J:/Aplikasi/finance-template/docs/06_DOKUMENTASI_PERBAIKAN.md) | Pemetaan setiap temuan ke perbaikan kode + bukti pengujian | Markdown | Engineering | - |
