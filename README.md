# Finance Tracker (Personal & Business Edition)

Sistem pencatatan dan manajemen kas keuangan pribadi terpadu berbasis **Google Sheets** dan **Google Apps Script Web App (Container-Bound PWA)**. 

Bebas biaya langganan bulanan (*Zero-Subscription*), 100% data tersimpan aman di Google Drive pribadi Anda, dan dapat diakses dari browser komputer maupun dipasang di layar utama smartphone (*Add to Home Screen*).

---

## Fitur Utama Produk

- **Desain Modern & Utilitarian (Warm Sage Green)**: Tipografi *Plus Jakarta Sans* dengan angka tabular rapi (*JetBrains Mono / Tabular Nums*). Tanpa elemen berlebihan, cepat, dan responsif.
- **Buku Kas 3 Tampilan Fleksibel**:
  - **Tampilan Harian**: Daftar mutasi kas terkelompok rapi per hari dengan subtotal harian.
  - **Tampilan Bulanan**: Kartu ringkasan performa per bulan (Masuk, Keluar, Sisa Kas) dengan pemilih bulan dinamis.
  - **Tampilan Statistik**: Diagram lingkaran (*Donut Chart*) persentase alokasi belanja per kategori & per kantong dompet.
- **Kantong Saldo Multi-Akun & Saldo Awal**: Mendukung rekening bank, dompet tunai (*cash*), dan e-wallet. Dilengkapi pengaturan **Saldo Awal Tabungan** sehingga aset awal tercatat tanpa merusak arus kas masuk bulanan berjalan.
- **Mutasi Transfer Kas Antar Dompet**: Fitur pindah dana antar rekening dengan validasi cerdas pencegah transfer ke rekening yang sama.
- **Target Anggaran Berulang (*Recurring Budgets*)**: Tetapkan batas belanja per kategori yang otomatis berulang setiap awal bulan baru tanpa perlu diinput ulang.
- **Tombol Cepat Cerdas 1-Ketuk (*Smart Habit Chips*)**: Mengisi nominal, catatan, dan kategori belanja rutin (bensin, makan siang, kopi) secara instan hanya dengan 1 ketukan.
- **Fitur Koreksi Transaksi (Edit & Hapus)**: Edit dan perbarui mutasi transaksi yang salah input secara langsung dari smartphone.
- **Format Rupiah Otomatis Realtime**: Input nominal otomatis memformat pemisah ribuan titik (`.`) saat mengetik angka nominal.
- **Dual Mode Akses Spreadsheet**: Buka antarmuka aplikasi langsung dari menu toolbar Google Sheets sebagai **Sidebar Kanan** (380px) atau **Jendela Penuh (Dialog)** (980x680px).

---

## Struktur File & Folder

```text
├── src/
│   ├── appsscript.json            # Manifest izin Apps Script (Container-Bound)
│   ├── backend/
│   │   ├── Code.js                # Handler onOpen(), doGet(), dan API dispatcher
│   │   ├── SetupService.js        # Inisialisasi otomatis tab sheet & styling tema
│   │   └── TransactionService.js  # Mesin kalkulasi saldo, mutasi, anggaran, & dompet
│   └── frontend/
│       ├── Index.html             # Shell struktur aplikasi & navigasi bawah HP
│       ├── Styles.html            # Desain CSS sistem Sage Green utilitarian
│       └── App.html               # Logika antarmuka klien & interaksi reaktif
├── docs/
│   ├── 01_PRODUCT_BRIEF_AND_REQUIREMENTS.md  # Product Brief, target market, & model harga
│   ├── 02_PRODUCT_TESTING_CHECKLIST.md       # Matriks pengujian QA sebelum rilis penjualan
│   ├── 03_USER_GUIDE.md                      # Panduan lengkap pembeli (salin, input, dashboard, & HP)
│   └── 04_LICENSE_AND_TERMS_OF_USE.md        # Perjanjian lisensi, hak modifikasi, & ketentuan refund
├── demo/
│   ├── index.html                 # Interactive Product Preview (Showcase simulator untuk calon pembeli)
│   └── WebApp.html                # Standalone Web App client untuk frame preview demo
├── tests/
│   ├── e2e/                       # Pengujian otomatis Playwright (transaksi & demo)
│   ├── fixtures/                  # Fixture pengujian lokal
│   └── mocks/                     # Google Apps Script API mock engine
├── scripts/
│   └── prepare-test-app.js        # Compiler fixture pengujian & sinkronisasi file demo
├── preview.html                   # Pratinjau aplikasi offline untuk komputer lokal
├── setup_guide.md                 # Panduan lengkap penjual: Master sheet, trik URL /copy, & hosting demo
├── package.json                   # Metadata proyek & version tracking
└── README.md                      # Dokumentasi pengenalan dan instalasi
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

### Langkah 3: Inisialisasi Otomatis Spreadsheet
1. Kembali ke tab Google Sheets Anda, lalu lakukan **Refresh / Muat Ulang Halaman (F5)**.
2. Tunggu beberapa detik hingga menu kustom baru muncul di menu bar atas:  
   **`[ Finance Tracker ]`**
3. Klik menu tersebut > pilih **Buka di Panel Samping (Sidebar)** atau **Buka Aplikasi (Jendela Penuh)**.
4. Saat pertama kali dijalankan, Google akan memunculkan konfirmasi izin (*Authorization Required*):
   - Klik **Lanjutkan / Review Permissions** > pilih akun Google Anda.
   - Klik **Advanced (Lanjutan)** > klik **Go to Finance Tracker (unsafe)**.
   - Klik **Allow / Izinkan**.
5. Seluruh struktur tab sheet (`TRANSAKSI`, `DOMPET`, `KATEGORI`, `ANGGARAN`, `DASHBOARD`) akan terformat rapi secara otomatis.

### Langkah 4: Deploy Web App untuk Akses Smartphone
1. Di halaman Apps Script, klik tombol biru **Deploy** (Terapkan) di pojok kanan atas > pilih **New deployment** (Penerapan baru).
2. Klik tombol gerigi di samping *Select type* > pilih **Web app**.
3. Atur konfigurasi:
   - **Description**: `Finance Tracker v1.0`
   - **Execute as**: `User accessing the web app`
   - **Who has access**: `Anyone with Google account` (atau `Anyone`)
4. Klik **Deploy** dan salin **Web app URL** yang muncul.

### Langkah 5: Pasang di Layar Utama HP (Add to Home Screen)
Buka link Web App tersebut di smartphone Anda:
- **Di iPhone (Safari)**: Buka URL > tap ikon **Share** (kotak panah ke atas) > pilih **Add to Home Screen** (*Tambah ke Layar Utama*).
- **Di Android (Chrome)**: Buka URL > tap menu titik tiga di pojok kanan atas > pilih **Add to Home screen** / **Install app**.

Kini aplikasi dapat dibuka dalam 1 detik langsung dari layar HP tanpa perlu membuka spreadsheet manual.

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
