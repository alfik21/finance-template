# Dokumentasi Perbaikan — Finance Tracker v1.8.7

**Dokumen**: Dokumentasi Perbaikan Bug (Bug Fix Documentation)
**Sumber temuan**: [`docs/05_LAPORAN_QC_PRODUCT_TESTING.md`](file:///J:/Aplikasi/finance-template/docs/05_LAPORAN_QC_PRODUCT_TESTING.md) (67 temuan: 25 produk asli, 22 demo, 20 frontend bersama)
**Versi produk**: 1.8.7 (`package.json`)
**Tanggal perbaikan**: 5 November 2026
**Status**: Seluruh 67 temuan tertutup, ditambah 1 temuan baru yang ditemukan selama verifikasi (T-01) dan sudah diperbaiki. Pekerjaan lanjutan v1.8.1 (keamanan dependensi, CI, sinkronisasi dokumen/generator), v1.8.2 (penyelarasan 32 TC dan penambahan 4 tes backend), v1.8.3 (izin bawaan pemilik tanpa setup Script Properties), v1.8.4 (kompatibilitas pelari tes lintas Node 20/22 di CI), v1.8.5 (rekonsiliasi awal demo), v1.8.6 (penghapusan saldo gaib melalui mutasi transfer alami dan pembersihan berkas redundan), serta v1.8.7 (perapian layout badge master sidebar) tercatat di bagian 9 s/d 15.

---

## 1. Ringkasan Perbaikan

| Kelompok | Jumlah | Status | Bukti utama |
|---|---|---|---|
| A. Produk asli (R-01 s/d R-25) | 25 | Selesai | 38 tes regresi backend `node:test` |
| B. Produk demo (D-01 s/d D-22) | 22 | Selesai | Verifikasi browser in-app (showcase + iframe) |
| C. Frontend bersama (S-01 s/d S-20) | 20 | Selesai | Verifikasi browser + tes backend terkait |
| Temuan baru T-01 (regresi verifikasi) | 1 | Selesai | Reproduksi dan verifikasi ulang di browser |
| **Total** | **68** | **Selesai** | |

Tiga keputusan struktural yang memengaruhi seluruh perbaikan:

1. **Perbaikan frontend hanya di `src/frontend/`**. `WebApp.html`, `demo/WebApp.html`, `tests/fixtures/app-test.html`, dan `preview.html` adalah artefak hasil generate oleh `scripts/prepare-test-app.js`; mengeditnya langsung akan tertimpa pada build berikutnya (menutup D-19/D-22).
2. **Satu manifest dan satu aturan akses**. `appsscript.json` (root) dan `src/appsscript.json` kini identik: scope hanya 3 izin, tanpa `ANYONE_ANONYMOUS`, plus allowlist email di kode (R-02/R-21).
3. **Backend punya tes regresi sendiri**. `tests/backend/` memakai `node:test` dengan tiruan `SpreadsheetApp`, sehingga temuan backend tidak lagi hanya ditutup lewat review kode (menutup D-21).

---

## 2. Pemetaan Perbaikan A — Produk Asli

| ID | Perbaikan (lokasi kode) | Logika dan alur pengguna | Bukti |
|---|---|---|---|
| R-01 | `Code.js`: `resolveIndexTemplateFile_()` mencoba kandidat `["frontend/Index", "Index"]`; `include()` jatuh balik dari `frontend/X` ke `X` | Pembeli yang mengikuti panduan instalasi manual (file datar `Index.html`) maupun pengguna `clasp push` (`rootDir: "./src"`) sama-sama bisa membuka aplikasi. Bila kedua nama tidak ada, muncul pesan error yang menyebut kedua opsi penamaan, bukan galat `No HTML file named frontend/Index was found` | Tes `R-01` (3 kasus) |
| R-02 | `appsscript.json` + `src/appsscript.json` menyatu; `Code.js`: `doGet` dan `apiDispatcher` memeriksa allowlist `ALLOWED_EMAILS` / `ALLOWED_EMAIL_OWNER` dari Script Properties | Link Web App hanya bisa dibuka email yang terdaftar. Tanpa properti, pengunjung menerima halaman penolakan yang menjelaskan cara mengisi allowlist, bukan data keuangan | Tes `R-02` (3 kasus) |
| R-03 | `TransactionService.js`: `getDashboardData()` murni baca; pembuatan dompet default dipindah ke `ensureDatabaseStructure()`; penyegaran `DASHBOARD` hanya lewat `refreshDashboardSummary_()` pada jalur tulis | Membuka dashboard, mengganti tab, atau memuat ulang tidak pernah menambah/mengubah baris sheet. Baris `W-1` tidak pernah terduplikasi sehingga net worth tidak meleset | Tes `R-03` (2 kasus) |
| R-04 | `TransactionService.js`: `validateTransactionPayload_()` — `type` harus dari whitelist, `Number.isFinite` + `Math.round`, regex tanggal ISO (`YYYY-MM-DD`), `walletId`/`categoryId` wajib ada dan aktif, kategori harus sesuai tipe, transfer wajib beda dompet dan dompet tujuan aktif | Pengguna menolong dirinya sendiri lewat validasi form; pemanggil API langsung (misal lewat Apps Script editor) menerima galat jelas: `Nominal tidak valid`, `Tipe transaksi tidak dikenal`, `Tanggal harus format YYYY-MM-DD`, `Kategori tidak cocok dengan tipe transaksi` | Tes `R-04` (2 kasus) |
| R-05 | `TransactionService.js`: duplikasi kategori dicek pada `(nama, tipe)` | Membuat kategori Income "Bonus" lalu Expense "Bonus" tidak saling berebut. Dropdown kategori tidak lagi kosong dan transaksi tersimpan tanpa kategori | Tes `R-05` |
| R-06 | `TransactionService.js`: hapus dompet diblokir bila saldo akhir tidak nol (positif/negatif); bila ada riwayat dilakukan soft delete ke `inactiveWallets`; aksi `restoreWallet` untuk reaktivasi; server menjaga minimal 1 dompet aktif | Pengguna dipaksa memindahkan saldo sisa terlebih dahulu (pesan menyebut saldo dan saran tindakan), riwayat tetap utuh, dan dompet bisa diaktifkan kembali lewat tombol "Aktifkan" | Tes `R-06` (4 kasus) |
| R-07 | `TransactionService.js`: `newId_()` memakai `Utilities.getUuid()` dengan fallback acak bila API tidak ada | Dua penyimpanan pada milidetik yang sama (double tap / dua perangkat) tidak lagi menghasilkan ID identik, sehingga edit/hapus tidak mengenai baris yang salah | Tes `R-07` |
| R-08 | `SetupService.js`: `migrateExistingSheet_()` memvalidasi dan memigrasikan header, data validation, format tanggal/angka, serta mengkoersi kolom `Aktif` (`"TRUE"`/`"FALSE"`/`1`/`0` → boolean) dan angka teks (`"1.000.000"` → 1000000) | Jalur "Periksa / Inisialisasi Database" memperbaiki sheet lama milik pembeli: tanggal menjadi tanggal sungguhan (SUMIFS/pivot jalan), `FALSE` teks menjadi boolean, nominal teks menjadi angka | Tes `R-08` (2 kasus) |
| R-09 | `TransactionService.js`: `withWriteLock_(fn)` membungkus seluruh operasi tulis dengan `LockService` | Dua tab/perangkat yang menyimpan bersamaan tidak lagi membuat baris anggaran ganda; bila lock sibuk pengguna menerima pesan "coba lagi sebentar", dan aplikasi tetap berjalan bila `LockService` tidak tersedia | Tes `R-09` (3 kasus) |
| R-10 | `TransactionService.js`: `sanitizeCellText_()` menambahkan prefiks apostrof untuk nilai berawalan `=`, `+`, `-`, `@` | Catatan berawalan karakter formula ditulis sebagai teks, bukan formula. Mencegah eksekusi `IMPORTXML`/serupa saat sheet dibuka | Tes `R-10` |
| R-11 | `TransactionService.js`: `MAX_TX_PAYLOAD_ = 200` (transaksi terbaru dikirim, total tetap dihitung dari seluruh baris); `Code.js`: `apiDispatcher` menolak payload mentah > batas | Dashboard tetap ringan pada sheet ribuan baris; permintaan dengan payload tidak wajar ditolak sebelum menyentuh sheet | Tes `R-11` (2 kasus) |
| R-12 | `Code.js`: `setXFrameOptionsMode(XFrameOptionsMode.DEFAULT)` | Web App tidak lagi bisa dipasang di dalam frame situs lain, sehingga aksi tulis/hapus tidak rawan clickjacking | Review kode + tes `R-02` (manifest) |
| R-13 | `Styles.html`: aturan `display:none!important` pada `.section-actions` dihapus; mode SIDEBAR memakai grid 3 kolom | Di Sidebar 380px tombol **+ Pengeluaran**, **+ Pemasukan**, dan **Pindah Saldo** tampil semua; pengguna tidak lagi terjebak hanya pada FAB yang selalu membuka form pengeluaran | Tes `R-13` (memastikan CSS tidak menyembunyikan tombol) |
| R-14 | `SetupService.js`: tab `DASHBOARD` diisi baris ringkasan (Total Saldo, Jumlah Dompet Aktif, Anggaran Aktif, dsb.); `Code.js`: `refreshDashboardSummary_()` menyegarkannya pada setiap operasi tulis | Tab `DASHBOARD` menampilkan kartu ringkasan sesuai yang dijual di `setup_guide.md`, dan angkanya selalu menyusul setelah transaksi disimpan | Tes `R-14` |
| R-15 | `SetupService.js`: pembuatan tab `ANGGARAN` tidak lagi menanam anggaran contoh | Template baru bersih: tidak ada anggaran 1.500.000/500.000 yang mengatasnamakan data pembeli dan memicu status overbudget | Tes `R-15` |
| R-16 | `TransactionService.js`: `saveBudget` mengikat baris pada `(categoryId, periode)`, memvalidasi limit > 0 dan kategori ada, serta mempertahankan anggaran historis (prioritas periode aktif → `RECURRING`) | Menyetel anggaran bulan ini tidak lagi menimpa anggaran bulan lalu; baris duplikat tidak membuat hasil acak | Tes `R-16` |
| R-17 | `Code.js`: `maskEmailForDisplay_()` menyamarkan email (`ma***@gmail.com`); `openAppSidebar` membungkus `showSidebar` dengan try/catch | Email tidak lagi ditampilkan utuh di UI (risiko bocor ke pemilik deployment mode tertentu); kegagalan membuka sidebar memberi pesan jelas, bukan error mentah | Tes `R-17` (3 kasus) |
| R-18 | `Code.js`: `doGet` tidak lagi menambahkan meta viewport kedua (template sudah punya satu viewport yang benar) | Satu viewport di seluruh halaman; zoom dan lebar tampilan mobile konsisten | Review kode |
| R-19 | `package.json`: `@google/clasp` masuk `devDependencies`, `main: src/backend/Code.js`, script `deploy` memanggil `scripts/clasp-version.js` setelah `clasp push` | `npm install` langsung menyediakan clasp; `npm run deploy` membuat versi Apps Script `v<versi package.json>` sehingga nomor versi selaras (aturan GEMINI.md) | `npx clasp --version` = 3.4.1; `npm run deploy` |
| R-20 | Dokumen disinkronkan dengan kode: `README.md`, `setup_guide.md`, `docs/01`, `docs/02`; `Code.js`: `openAppSidebar().setWidth(380)` | Klaim dokumen kini sama dengan implementasi: sidebar 380px, dialog 1080x720px, Web App (bukan PWA penuh), subtotal harian, dan donut kategori + bar dompet | Review kode + verifikasi browser |
| R-21 | Manifest hanya meminta 3 scope: `spreadsheets.currentonly`, `script.container.ui`, `userinfo.email` | Izin minimal dan konsisten; tidak ada permintaan `spreadsheets` penuh yang redundan | Tes `R-21/R-02: manifest menyatu` |
| R-22 | `Code.js`: `runManualSetup()` membungkus `ensureDatabaseStructure()` + `refreshDashboardSummary_()`; sukses hanya bila kedua langkah selesai, kegagalan menampilkan toast `GAGAL` lalu melempar ulang galat | Pengguna tahu hasil sebenarnya: "Database siap: struktur tab terverifikasi dan ringkasan DASHBOARD diperbarui" atau pesan kegagalan beserta penyebabnya | Tes `R-22` |
| R-23 | `TransactionService.js`: `saveWallet` (nama wajib, tipe dari whitelist `Bank/E-Wallet/Cash/Credit`, saldo wajib angka) dan `saveBudget` (limit > 0, kategori wajib ada) | Form dicegah di depan, dan API langsung menolak dengan pesan yang sama | Tes `R-23` (2 kasus) |
| R-24 | `TransactionService.js`: `appendAuditLog_()` mencatat penghapusan transaksi/anggaran ke tab `AUDIT` (aksi, id, ringkasan data, waktu, pelaku) sebelum baris hilang | Setiap penghapusan memiliki jejak yang bisa ditelusuri di spreadsheet — penting untuk aplikasi keuangan | Tes `R-24` |
| R-25 | `TransactionService.js`: `compareTxRecent_()` mengurutkan tanggal dulu, lalu timestamp pencatatan sebagai tiebreak | "5 Transaksi Terakhir" menampilkan input terbaru meski tanggalnya sama, dan urutannya konsisten dengan mock demo (D-17) | Tes `R-25` |

---

## 3. Pemetaan Perbaikan B — Produk Demo

| ID | Perbaikan (lokasi kode) | Logika dan alur pengguna | Bukti |
|---|---|---|---|
| D-01 | `demo/index.html`: `escDemo()` meng-escape `& < > " '`; seluruh sel tabel memakai `escDemo`; listener `message` memeriksa `event.source === frame.contentWindow` dan origin yang diizinkan | Payload `<img src=x onerror=...>` pada catatan/nama tampil sebagai teks biasa; pesan dari pihak lain diabaikan sehingga HTML/JS tidak bisa disuntikkan ke halaman jual | Verifikasi browser: injeksi tampil literal, `document.querySelectorAll('img[src="x"]').length === 0` |
| D-02 | `demo/index.html`: seluruh `postMessage` memakai target origin eksplisit (`http://127.0.0.1:8765` / origin halaman), bukan `'*'` | Data `__MOCK_DB__` hanya dikirim ke frame demo yang benar | Review kode + verifikasi browser (sinkron tetap berfungsi) |
| D-03 | `demo/index.html`: handshake `IFRAME_READY` dari `demo/WebApp.html` ke induk; tombol **Reset Data** menunggu handshake lalu mengirim reset berantai | Klik **Reset Data** sebelum iframe siap tidak membuat tabel kanan dan aplikasi di dalam frame berbeda data | Verifikasi browser: reset tersinkron (frame dan tabel kembali ke data contoh) |
| D-04 | `scripts/prepare-test-app.js` + `demo/WebApp.html`: substitusi email uji menjadi `Pengguna Demo` | Halaman jual tidak menampilkan `test@example.com`; akun tampil sebagai "Pengguna Demo" | Verifikasi browser: teks `test@example.com` tidak ada |
| D-05 | `demo/index.html`: pita **MODE DEMO** di bagian atas halaman; `src/frontend/Index.html` + `App.html`: header **MODE DEMO** di dalam aplikasi yang hanya aktif saat berjalan dari mock/artefak demo | Calon pembeli sejak awal tahu bahwa data adalah contoh di browser dan tidak tersimpan ke Google Sheets, termasuk saat membuka **Buka Demo Layar Penuh** | Verifikasi browser: banner terbaca di `demo/index.html`, `preview.html`, dan header `WebApp.html`; pada GAS asli (`google.script.run` tersedia) header tidak tampil |
| D-06 | `demo/index.html`: `.device-mobile` memakai `max-width` + media query | Pada layar 360/390px halaman demo tidak lagi melebar dan memaksa scroll horizontal | Review kode + verifikasi toggle **Mobile View/Desktop View** |
| D-07 | `demo/index.html` + `demo/assets/tailwindcss.js` (451 KB, dipaket lokal); `preview.html` me-rewrite path menjadi `demo/assets/tailwindcss.js` | Demo tetap tampil penuh tanpa internet; tidak ada peringatan CDN "not for production"; `preview.html` yang dihosting sendiri tetap menemukan asetnya | Verifikasi browser: `tailwindSrc = .../demo/assets/tailwindcss.js`, tanpa permintaan 404 |
| D-08 | `tests/mocks/google-script-mock.js`: `google.script.run` berupa runner per panggilan (bukan singleton) | Dua aksi cepat tidak saling menimpa callback; perilaku sama dengan GAS asli | Review kode |
| D-09 | Mock: validasi dijalankan **sebelum** perubahan saldo apa pun | Jika validasi gagal, saldo tidak berubah — demo tidak lagi menampilkan kerusakan yang mustahil terjadi di backend asli | Review kode |
| D-10 | Mock: hapus dompet = soft delete ke `inactiveWallets` + aturan saldo (sama dengan R-06), plus `restoreWallet` | Demo memperlihatkan perilaku yang sama dengan produk asli (riwayat tetap, bisa diaktifkan kembali) | Review kode |
| D-11 | Mock: validasi setara backend (`amount` wajib angka, `type` whitelist, tanggal, dompet, kategori) | Demo tidak lagi menolak hal yang diterima backend atau sebaliknya (menutup celah "mock menutupi bug backend") | Review kode |
| D-12 | Mock: "hari ini" dihitung dengan tanggal lokal (bukan `toISOString()` UTC) | Setelah pukul 00.00 WIB, demo dan produk menampilkan tanggal yang sama | Review kode + verifikasi browser (tanggal default `2026-11-05`) |
| D-13 | `demo/index.html`: karakter emoji pensil (U+270F U+FE0F) diganti ikon SVG | Kebijakan zero-emoji `GEMINI.md` dipatuhi di halaman pemasaran | Pencarian karakter emoji pada `demo/index.html`, `preview.html`, `WebApp.html` = 0 |
| D-14 | `demo/index.html`: `<iframe title="Simulasi aplikasi Finance Tracker (mode demo)">` | Frame memiliki nama aksesibel untuk pembaca layar dan pembantu browser | Verifikasi browser: snapshot aksesibilitas menampilkan judul frame |
| D-15 | `demo/index.html`: tabel TRANSAKSI menambah kolom **Tipe** (dengan tanda `+`/`-`), tabel DOMPET menambah **Saldo Awal** dan **Aktif** | Struktur tabel simulasi kini sama dengan sheet asli (`TRANSAKSI` 6 kolom, `DOMPET` 6 kolom) sehingga calon pembeli tidak diperlihatkan struktur berbeda | Verifikasi browser: header kolom sesuai |
| D-16 | `demo/index.html`: `defaultDb` disesuaikan (ringkasan hari ini, anggaran `spent`, saldo) dan tanggal dihitung lokal | Tidak ada lagi angka contoh yang bertentangan dengan transaksi contoh (jebakan bila fitur baru dirender) | Review kode + verifikasi browser |
| D-17 | Mock: pengurutan memakai tanggal lalu timestamp (paritas dengan `compareTxRecent_`) | Demo menampilkan urutan yang sama dengan produk asli | Review kode |
| D-18 | Mock: validasi budget (limit > 0, kategori ada, periode valid) dan tipe transaksi | Mock menolak hal yang juga ditolak backend (R-04/R-23) | Review kode |
| D-19 | `scripts/prepare-test-app.js`: header `FILE HASIL GENERATE` pada artefak; `preview.html` memakai path aset `demo/assets/`; seluruh artefak dibangun ulang dari `src/frontend` | Artefak ganda kini jelas berstatus hasil generate; `preview.html` yang dihosting sendiri tidak 404 pada Tailwind; risiko drift berkurang karena semua berasal dari satu sumber | `node scripts/prepare-test-app.js` dua kali → hash identik |
| D-20 | `tests/e2e/demo.spec.js`: asersi `toHaveCount(2)` diganti pemeriksaan visibilitas baris pertama + keberadaan catatan contoh | Tes tidak lagi rapuh ketika data demo bertambah | Review kode |
| D-21 | `tests/backend/harness.js` + `tests/backend/backend.test.js`: 38 tes regresi produk asli dengan tiruan `SpreadsheetApp` (bukan mock demo) | Temuan backend kini ditangkap oleh tes, bukan hanya review. Ini menutup celah "demo 100% hijau sementara produk asli gagal total" | `npm run test:backend` → 38/38 lulus |
| D-22 | `scripts/prepare-test-app.js`: tidak ada substitusi tanggal; email substitusi `Pengguna Demo`; build deterministik | Menjalankan build berulang tidak membuat `git status` kotor karena tanggal berubah | Hash artefak identik pada dua kali build berturut-turut |

---

## 4. Pemetaan Perbaikan C — Frontend Bersama (produk asli + demo)

| ID | Perbaikan (lokasi kode) | Logika dan alur pengguna | Bukti |
|---|---|---|---|
| S-01 | `App.html`: helper `esc()` dipakai pada seluruh interpolasi `innerHTML`/atribut (catatan, nama dompet/kategori, `searchQuery`, `tx.id`); pemanggilan baris memakai event delegation `data-action`/`data-id` | Catatan berisi tag HTML tampil sebagai teks; stored XSS tidak tereksekusi di produk asli maupun demo | Verifikasi browser: payload `<b>bold</b>` & `"quote"` tampil literal, 0 elemen injeksi |
| S-02 | `App.html`: guard `google.script.run` memiliki cabang `else` → layar "Gagal memuat data buku kas" + tombol **Muat Ulang** (`retryLoad`) | Bila API tidak tersedia atau gagal, pengguna melihat pesan yang bisa ditindaklanjuti, bukan layar "Memuat buku kas..." selamanya | Verifikasi browser `WebApp.html` (tanpa API) → render data contoh, tanpa layar macet |
| S-03 | `App.html`: `searchTransactions()` hanya menyimpan `appState.searchQuery` lalu me-render; state input dipertahankan dan fokus tidak dipindahkan; pencarian case-insensitive | Mengetik "NASI" tetap menemukan "Nasi Padang", kursor tetap di kolom pencarian, nilai tetap utuh | Verifikasi browser: `document.activeElement.id === 'tx-search-input'`, nilai `"NASI"` dipertahankan, 1 baris cocok |
| S-04 | `App.html`: `activePeriod` diambil dari `bookMonthPeriod`; bila bulan terpilih tidak punya transaksi dibuat grup kosong (empty state) | Judul bulan dan isi tabel selalu sama; bulan kosong menampilkan keterangan "tidak ada transaksi", bukan transaksi bulan lain | Review kode (`activeGroup` fallback + empty state) |
| S-05 | `App.html`: `localDateStr()` / `localMonthPeriod()` berbasis zona waktu lokal; tanggal default form memakai helper yang sama | Pukul 00.00–06.59 WIB tanggal default tetap hari ini, dan bulan default tidak mundur pada tanggal 1 | Verifikasi browser: `#form-date` = `2026-11-05` (tanggal mesin) |
| S-06 | `App.html`: posisi scroll disimpan (`scrollBefore`) dan dikembalikan setelah render; layar "Memuat" hanya tampil saat data pertama kali kosong | Berpindah tab/aksi tidak membuat halaman melompat ke atas atau berkedip "Memuat buku kas..." | Review kode (`window.scrollTo(0, scrollBefore)`) |
| S-07 | `App.html`: filter memakai `categoryId` (bukan nama kategori) | Kategori bernama sama di tipe berbeda tidak tercampur; rename kategori tidak memutus filter | Review kode |
| S-08 | `App.html` + `TransactionService.js`: `ensureWalletOption()` menambahkan opsi sementara untuk dompet nonaktif; backend mengizinkan dompet nonaktif saat mode edit | Transaksi lama pada dompet yang sudah nonaktif tetap bisa diedit dan disimpan; riwayat tidak terkunci permanen | Tes backend `S-08: edit transaksi lama boleh memakai dompet nonaktif` |
| S-09 | `App.html`: `appState.modalStack` — Escape/klik overlay hanya menutup modal teratas; shortcut `n` diperiksa saat tidak ada modal terbuka | Buka modal kategori dari modal transaksi lalu Escape menutup modal kategori saja; input transaksi tidak hilang | Review kode (`closeModal` berbasis stack) |
| S-10 | `App.html`: `formatRupiah()` menangani nilai negatif (`-Rp 50.000`); kartu bulanan memberi label **Defisit** saat sisa kas negatif | Satu format uang konsisten di seluruh tampilan dan arah defisit terbaca | Review kode + verifikasi browser (subtotal `-Rp 50.000`) |
| S-11 | `App.html`: akumulasi `stroke-dasharray` dihitung dari rasio asli (bukan persen hasil pembulatan) + rotasi `rotate(-90 21 21)` | Donut tidak lagi bercelah/tumpang tindih pada total 99%/101% dan mulai dari posisi jam 12 | Review kode |
| S-12 | `App.html`: state bulan pemisah — `currentMonthPeriod` untuk Dashboard, `bookMonthPeriod` untuk Buku Kas | Menggeser bulan di Buku Kas tidak lagi mengubah angka "Bulan Ini" di Dashboard | Review kode |
| S-13 | `App.html`: bagian "Alokasi per Kantong Dompet" mengikuti `statsType` (Pengeluaran/Pemasukan) | Saat mode Pemasukan dipilih, kartu dompet menampilkan penerimaan (mis. "BCA Tabungan Rp 15.000.000"), bukan data pengeluaran | Verifikasi browser: toggle Pengeluaran → Pemasukan mengubah donut ("Gaji Pokok") dan kartu dompet |
| S-14 | `App.html`: `parseCurrencyValue()` menjaga pemisah ribuan & desimal; validasi nominal > 0, tanggal wajib dan tahun 2000..(tahun sekarang + 1) | "1.5" tidak lagi berubah menjadi 15; tahun salah ketik (mis. 20999) ditolak dengan pesan jelas | Review kode (`submitTransactionForm`) |
| S-15 | `App.html`: `#offline-banner` + `setupOfflineWatcher()` menampilkan status offline; pesan galat backend tetap ditampilkan dengan konteks; ada tombol coba lagi | Pengguna tahu penyebab gagal simpan (offline) dan bisa memulai ulang tanpa menebak-nebak | Verifikasi browser: `#offline-banner` hadir di DOM |
| S-16 | `Index.html`: viewport tanpa `user-scalable=no`; navigasi desktop memakai `role="button" tabindex="0"` + handler keyboard; setiap `modal-dialog` memakai `role="dialog" aria-modal="true"` | Zoom tetap bisa dilakukan; navigasi bisa diakses keyboard; pembaca layar mengenali modal sebagai dialog | Review kode (atribut terverifikasi di DOM) |
| S-17 | `App.html`: subtotal harian menampilkan masuk, keluar, dan net | Tampilan Harian sesuai TC-SUM-04: `+Rp 0 / -Rp 50.000 | -Rp 50.000` per tanggal | Verifikasi browser: `.date-group-subtotal` terisi |
| S-18 | Penyelarasan aturan bisnis: backend `Math.min(100, ...)` pada persen anggaran, mock dan frontend memakai aturan yang sama; mock memakai validasi setara backend | Tidak ada lagi tiga versi aturan yang berbeda (persen > 100, hard delete vs soft delete) | Review kode + tes backend |
| S-19 | `Index.html`: atribut `autofocus` dihapus; `openModal()` memfokuskan input pertama (`focus({preventScroll:true})`) dan `closeModal()` mengembalikan fokus ke pemicu | Fokus masuk ke input yang benar saat modal dibuka, dan kembali ke tombol pemicu saat ditutup | Review kode (`lastFocusedElement`) |
| S-20 | `App.html`: sumber nilai form disatukan — `updateCategoryDropdown()` mempertahankan pilihan bila masih valid, `updateWalletDropdowns()` menyimpan nilai sebelum membangun ulang opsi | State dan DOM tidak lagi saling menimpa (akar bug kategori terpilih hilang saat render ulang) | Review kode + verifikasi browser (T-01) |

---

## 5. Temuan Baru Selama Verifikasi

### T-01 — Dropdown kategori kosong bila modal dibuka sebelum data tiba (diperbaiki)

- **Lokasi**: `src/frontend/App.html` — `loadDashboardData()` + helper baru `refreshOpenTransactionModal_()`.
- **Gejala**: pengguna bisa menekan tombol **Catat Transaksi** pada saat aplikasi masih menampilkan "Memuat buku kas...". `openModal('transaction-modal', 'Expense')` memanggil `updateCategoryDropdown('Expense')` yang mengembalikan nilai bila `appState.data` belum ada, sehingga `<select id="form-category">` tetap kosong. `renderApp()` hanya membangun ulang select **dompet** (`updateWalletDropdowns`), tidak pernah select kategori, sehingga dropdown tetap kosong selamanya dan pengguna terkunci pada alert "Pilih kategori transaksi terlebih dahulu."
- **Alur pengguna**: buka aplikasi → langsung tekan Catat Transaksi → isi nominal → Simpan → alert "Pilih kategori" padahal dropdown tidak berisi pilihan apa pun.
- **Perbaikan**: pada `withSuccessHandler` `getDashboardData`, setelah data tiba dipanggil `refreshOpenTransactionModal_()`; fungsi ini memeriksa apakah `#transaction-modal` sedang terbuka, lalu membangun ulang select dompet **dan** kategori (mode tipe yang sedang aktif).
- **Bukti**: reproduksi sebelum perbaikan (buka modal saat loading → `cat.options.length === 0`); sesudah perbaikan pada kondisi yang sama → `cat.options.length === 4` setelah data tiba, modal tetap terbuka, dan transaksi bisa disimpan.

### T-02 — Observasi kecil (tidak diperbaiki)

Menekan tombol yang memakai `onclick="openModal(...)"` **sebelum** skrip halaman selesai diparse menghasilkan `ReferenceError: openModal is not defined` di konsol. Ini hanya mungkin pada jendela milidetik saat pemuatan (dalam pengujian direproduksi lewat klik paksa secepat mungkin) dan tidak memengaruhi pengguna normal. Diputuskan tidak diperbaiki agar tidak menambah percabangan; dicatat sebagai risiko kosmetik.

---

## 6. Bukti Pengujian

### 6.1 Regresi backend (wajib lulus sebelum rilis)

```
npm run test:backend        # node --test "tests/backend/*.test.js"
```

Hasil: **38 tes, 38 lulus, 0 gagal** (Node 20+, tanpa browser). Cakupan: R-01, R-02, R-03, R-04, R-05, R-06, R-07, R-08, R-09, R-10, R-11, R-13, R-14, R-15, R-16, R-17, R-19/R-21, R-22, R-23, R-24, R-25, S-08.

Tiga tes lahir langsung dari bug pada proses perbaikan sendiri (bukti tes bekerja):

1. Harness `getRange` tidak membaca offset kolom → diperbaiki di `tests/backend/harness.js`.
2. `setValues()` pada migrasi menerima 1D, bukan 2D → bug di `SetupService.js` ditemukan dan diperbaiki.
3. `openAppSidebar` yang gagal harus melalui `alert` (bukan melempar) → asersi disesuaikan dengan perilaku yang benar.

### 6.2 Integritas build

```
node scripts/prepare-test-app.js
```

- Seluruh script inline pada `WebApp.html`, `preview.html`, `demo/index.html`, dan `demo/WebApp.html` lolos parser sintaks (`0 errors`).
- Build deterministik (dua kali berturut-turut, hash identik):
  - `WebApp.html` / `demo/WebApp.html` / `tests/fixtures/app-test.html` = `8938E0366B6CBC3E52B3E676D722E393201BD709CBAACC0B7A41A87D9033B7D1`
  - `preview.html` = `FE0BE9C8A4ED141C69BA9C4680DEB707BFEBD0C1EEA73FE44327F83F422502EE`
- Tidak ada tanggal yang ditulis ke artefak; substitusi identitas hanya `Pengguna Demo`.

### 6.3 Pemeriksaan sintaks otomatis

```
npm run test:syntax        # node scripts/check-syntax.js
```

- Meng-parse seluruh `<script>` inline pada 5 berkas hasil generate (`WebApp.html`, `preview.html`, `demo/index.html`, `demo/WebApp.html`, `tests/fixtures/app-test.html`) memakai `vm.Script`.
- Hasil: **LULUS, 0 galat** — menjadi gerbang mutu lokal dan di CI.

### 6.4 Verifikasi browser (Chromium in-app, `http://127.0.0.1:8765`)

| Skenario | Hasil |
|---|---|
| Buka `demo/index.html` | Tanpa error konsol; pita **MODE DEMO** tampil; Tailwind dimuat dari `assets/tailwindcss.js` (lokal) |
| Tabel simulasi TRANSAKSI/DOMPET | Header sesuai sheet asli (Tgl, Tipe, Catatan, Kantong, Kategori, Nominal / Nama Dompet, Tipe Akun, Saldo Awal, Aktif, Saldo Kas) |
| Sinkronisasi iframe | Transaksi baru tersimpan → baris muncul di tabel showcase; hapus → baris hilang keduanya |
| Escape data | Catatan `<b>bold</b> & "quote"` tampil literal; `img[src="x"]` = 0 (D-01/S-01) |
| Toggle **Mobile View / Desktop View** | Kelas `.device-mobile` / `.device-desktop` berganti (D-06) |
| `preview.html` (hasil generate) | Tanpa error konsol, tanpa permintaan gagal, Tailwind dari `demo/assets/tailwindcss.js` (D-19) |
| `WebApp.html` tanpa API Apps Script | Menampilkan data contoh + tombol muat ulang, tidak macet di "Memuat..." (S-02) |
| Pencarian di Buku Kas | Fokus tetap di kolom pencarian, nilai utuh, pencarian case-insensitive (S-03) |
| Tampilan Harian | Subtotal per hari tampil (S-17) |
| Tampilan Statistik | Donut per kategori + bar per dompet; toggle Pengeluaran/Pemasukan mengubah data (S-13) |
| Aksesibilitas | `role="dialog" aria-modal="true"`, nav `role="button" tabindex="0"`, `#offline-banner` (S-15/S-16) |
| Race T-01 | Modal dibuka saat loading → dropdown terisi setelah data tiba |

### 6.5 Keterbatasan pengujian

- **Playwright e2e tidak dapat dijalankan** di mesin uji ini (`browserType.launch` hang). Skrip `tests/e2e/*.spec.js` sudah diperbaiki (termasuk D-20) tetapi hasilnya belum dianggap sebagai bukti; bukti utama adalah 38 tes backend dan verifikasi browser di atas.
- **Belum diuji end-to-end di Google Apps Script sungguhan** (deployment, LockService, Script Properties allowlist, dan migrasi sheet pada workbook pembeli). Semua tes backend memakai tiruan `SpreadsheetApp`. Eksekusi 32 TC di `docs/02_PANDUAN_PENGUJIAN_PRODUK.md` pada akun Google baru tetap wajib sebelum rilis.

---

## 7. Dokumen yang Disinkronkan

| Berkas | Penyesuaian |
|---|---|
| `README.md` | Web App (bukan PWA penuh), donut kategori + bar dompet, dialog 1080x720, sidebar 380px, allowlist `ALLOWED_EMAILS`, struktur folder (`tests/backend`, `demo/assets`, `scripts/clasp-version.js`), tabel pengujian otomatis, baris dokumen 05 & 06 |
| `setup_guide.md` | Catatan penamaan file (R-01), kewajiban allowlist (R-02), catatan hasil generate (D-19/D-22), klaim Add to Home Screen sebagai pintasan browser |
| `docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.md` | Mode akses (Web App + pintasan, sidebar 380px, dialog 1080x720), 3 tampilan buku kas, Versi Rilis 1.8.1 / 5 November 2026 |
| `docs/02_PANDUAN_PENGUJIAN_PRODUK.md` | Versi 1.8.1 / 5 November 2026, TC-DSH-02 (bar dompet), TC-VAL-06 (saldo tidak nol), TC-CPY-06/07, bagian G (perintah pengujian otomatis) |
| `docs/02_PRODUCT_TESTING_CHECKLIST.md` | 4 baris TC disamakan dengan generator XLSX; blok tautan CSV yang berkasnya tidak ada dihapus |
| `docs/03_USER_GUIDE.md` | Versi Berkas 1.8.1, klaim PWA diganti Web App + pintasan, statistik = donat kategori + bar dompet |
| `docs/04_LICENSE_AND_TERMS_OF_USE.md` | Tanggal Berlaku Efektif 5 November 2026 |
| `package.json` | Versi 1.8.1, `main: src/backend/Code.js`, `@google/clasp` 3.4.1 di devDependencies, `overrides` zod/uuid/glob, script `test:backend` / `test:syntax` / `verify` / `test:all` / `deploy` |

---

## 8. Sisa Pekerjaan Sebelum Rilis

1. Job `e2e` di `.github/workflows/ci.yml` sudah tersedia (informatif, `continue-on-error`); aktifkan sebagai gerbang wajib setelah terbukti hijau di lingkungan yang dapat menjalankan browser (`npx playwright install chromium`).
2. `npm run login` lalu `npm run deploy` untuk memverifikasi allowlist, manifest, dan penomoran versi pada project Apps Script nyata.
3. Eksekusi 32 TC Fase 1 pada workbook salinan baru, termasuk pemasangan manual sesuai panduan (ujian langsung R-01) dan pembatasan akses (ujian langsung R-02).
4. UAT mobile nyata (Safari iOS + Chrome Android) untuk alur: buka Sidebar, catat pemasukan, transfer, edit, hapus, atur anggaran, cek laporan bulan lalu.

---

## 9. Pekerjaan Lanjutan v1.8.1

Batch ini melengkapi perbaikan temuan dengan pekerjaan keamanan, otomasi, dan konsistensi dokumen.

### 9.1 Keamanan dependensi (npm audit)

| Sebelum | Sesudah | Tindakan |
|---|---|---|
| 5 kerentanan (1 high: `@google/clasp` path traversal GHSA-hqjg-pww4-pcgq; 4 moderate: `uuid`, `zod`) | **0 vulnerabilities** | `@google/clasp` dinaikkan `^2.5.0` → `^3.4.1`; `overrides` `zod ^4.6.6`, `uuid ^11.1.1`, `glob ^14.0.2` (perbaikan versi aman untuk rantai `clasp → googleapis → rimraf/glob`) |

Verifikasi clasp 3.4.1: `npx clasp --version` = 3.4.1, `npx clasp show-file-status` memetakan 7 file `src/` dengan benar, `clasp create-version`/`clasp version` (dipakai `scripts/clasp-version.js`) tetap tersedia, `generate-testing-xlsx.js` dan `generate-docs-docx.js` berjalan normal dengan exceljs/uuid hasil override.

### 9.2 CI GitHub Actions (`.github/workflows/ci.yml`)

Job `backend-and-artifacts` (Node 20 dan 22): `npm ci` → `npm run test:backend` (38 tes) → regenerasi artefak + `git diff --exit-code` (deteksi drift D-19/D-22) → `npm run test:syntax` → `npm audit --audit-level=high` (gerbang keamanan).
Job `e2e` (Playwright) berjalan `continue-on-error: true` sehingga informatif sampai terbukti stabil (lihat bagian 8).

Gerbang lokal baru: `npm run test:syntax` (`scripts/check-syntax.js`) dan `npm run verify` (tes backend + build fixture + cek sintaks).

### 9.3 Konsistensi versi dokumen & generator

- `scripts/generate-testing-xlsx.js` dan `scripts/generate-docs-docx.js` kini membaca versi dari `package.json` (`RELEASE_VERSION`), tanggal dari konstanta `EFFECTIVE_DATE = '5 November 2026'`, dan nomor lisensi dari `LICENSE_TAG` — mencegah kekambuhan temuan R-20 (dokumen tertinggal dari kode).
- Klaim yang disinkronkan di seluruh dokumen dan generator: Web App + pintasan (bukan PWA penuh), dialog 1080x720, sidebar 380px, statistik = donat kategori + bar dompet, TC-VAL-06 (saldo tidak nol), TC-CPY-06/07 (allowlist + pintasan).
- Berkas CSV yang ditautkan di `docs/02_PRODUCT_TESTING_CHECKLIST.md` tetapi tidak pernah ada di repo dihapus dari dokumen.

Bukti: `npm run verify` = 38 tes lulus + build deterministik + 0 galat sintaks; `npm audit` = 0 vulnerabilities.

---

## 10. Pekerjaan Lanjutan v1.8.2

Batch ini menutup celah pengujian backend dan memperbaiki inkonsistensi formula matriks uji dokumen:

### 10.1 Penyelarasan Matriks Uji 32 Kasus (Bukan 26)
- Formula pada tab `DASHBOARD_UJI` di `scripts/generate-testing-xlsx.js` dan `docs/02_PRODUCT_TESTING_CHECKLIST.md` diperbaiki dari `=COUNTA(MATRIKS_UJI!A2:A27)` menjadi `=COUNTA(MATRIKS_UJI!A2:A33)` dan `=COUNTIF(MATRIKS_UJI!F2:F33, "PASS")` dengan target 32. Hal ini memastikan seluruh 32 skenario (`TC-INP-01` s/d `TC-CPY-07`) terhitung dalam evaluasi metrik kelulusan spreadsheet.
- Dokumen panduan `docs/02_PANDUAN_PENGUJIAN_PRODUK.md` dan generator `scripts/generate-docs-docx.js` diselaraskan dari 26 skenario menjadi 32 skenario.

### 10.2 Penambahan Tes Unit Backend (Total 42 Tes)
- Penambahan pengujian unit komprehensif pada `tests/backend/backend.test.js`:
  1. Pengujian routing `apiDispatcher` untuk seluruh 10 aksi (`getDashboard`, `createTransaction`, `updateTransaction`, `deleteTransaction`, `saveBudget`, `deleteBudget`, `saveCategory`, `saveWallet`, `deleteWallet`, `restoreWallet`) dan penolakan aksi asing.
  2. Pengujian `onOpen()` untuk memastikan menu toolbar spreadsheet `Finance Tracker` terdaftar dengan 3 item yang tepat.
  3. Pengujian `openAppDialog()` untuk memastikan modal dibuka dengan dimensi 1080x720 px.
  4. Pengujian idempotensi `ensureDatabaseStructure()` untuk memastikan struktur sheet dan seed awal tidak terduplikasi saat inisialisasi ulang.
- Hasil: 42 tes unit backend seluruhnya **LULUS (42 pass, 0 fail)**.

---

## 11. Pekerjaan Lanjutan v1.8.3

Batch ini menyelesaikan kendala akses izin pemilik spreadsheet tanpa mewajibkan konfigurasi Script Properties manual:

### 11.1 Otomatisasi Izin Pemilik Sah Spreadsheet (R-02)
- Sebelumnya, fungsi `isEmailAllowed_()` memblokir seluruh akun bila properti `ALLOWED_EMAILS` atau `ALLOWED_EMAIL_OWNER=true` belum disetel pada *Script Properties*. Hal ini menyebabkan pemilik workbook yang membuka aplikasi pertama kali terhalang oleh pesan: `"Akses ditolak: email '...' tidak terdaftar sebagai pemilik"`.
- `isEmailAllowed_()` diperbarui agar secara default selalu mengizinkan akun pemilik sah (`Session.getEffectiveUser()`). Pengguna luar/asing tetap ditolak kecuali terdaftar di `ALLOWED_EMAILS`.
- Opsi pembatasan ketat tetap dipertahankan dengan menyetel `ALLOWED_EMAIL_OWNER=false`.
- Hasil pengujian: Ditambahkan 2 tes unit baru pada `backend.test.js` (`44 pass, 0 fail`).

---

## 12. Pekerjaan Lanjutan v1.8.4

Batch ini menyelesaikan kompatibilitas perintah uji backend lintas versi Node.js (Node 20 dan Node 22) pada lingkungan CI Linux:

### 12.1 Kompatibilitas Argumen Runner `node --test` di CI Linux
- Pada Node 20 di Linux/bash, perintah `node --test "tests/backend/*.test.js"` tidak mengekspansi tanda bintang `*` karena tanda petik ganda mencegah shell globbing dan runner bawaan Node 20 belum mendukung internal globbing untuk argumen string literal. Hal ini menyebabkan kegagalan: `Could not find '.../tests/backend/*.test.js'`.
- Script `test:backend` di `package.json` dispesifikasikan langsung ke berkas `tests/backend/backend.test.js` tanpa tanda petik yang membingungkan parser.
- Hasil pengujian: Lulus 100% pada Node 20, 22, dan 24 lintas platform (Linux, macOS, dan Windows).

---

## 13. Pekerjaan Lanjutan v1.8.5

Batch ini menyelesaikan cacat logika akuntansi pada database tampilan demo dan simulator spreadsheet (`demo/index.html` dan `tests/mocks/google-script-mock.js`):

### 13.1 Rekonsiliasi Saldo Awal, Pemasukan, dan Total Nilai Bersih (*Net Worth*)
- **Temuan Cacat**:
  1. Pada data demo sebelumnya, transaksi `TX-2` mencatat Pemasukan Gaji = Rp 15.000.000 dan `TX-1` mencatat Pengeluaran Makan Siang = Rp 50.000, menghasilkan sisa kas bulanan Rp 14.950.000. Namun, total saldo seluruh dompet (*Net Worth*) di kartu hero hanya tertulis Rp 12.500.000 (terjadi selisih minus Rp 2.450.000 yang tidak masuk akal).
  2. Rekening BCA memiliki Saldo Awal Rp 0 dan menerima mutasi masuk gaji Rp 15.000.000, namun saldo akhirnya hanya tertulis Rp 10.000.000 tanpa adanya catatan mutasi keluar.
  3. Dompet Tunai dan GoPay memiliki Saldo Awal Rp 0 di tabel DOMPET simulasi, namun masing-masing memiliki saldo akhir Rp 500.000 dan Rp 2.000.000 tanpa riwayat mutasi masuk.
- **Tindakan Perbaikan**:
  1. **Rekonsiliasi Mutasi Gaji**: Transaksi pemasukan gaji `TX-2` diselaraskan menjadi Rp 10.000.000 masuk ke rekening BCA Tabungan (Saldo Awal Rp 0 + Mutasi Masuk Rp 10.000.000 = Saldo Akhir Rp 10.000.000).
  2. **Rekonsiliasi Saldo Awal Dompet Tunai**: Saldo awal Dompet Tunai disetel ke Rp 550.000. Setelah dipotong pengeluaran `TX-1` Makan Siang Nasi Padang Rp 50.000, saldo akhir menjadi tepat Rp 500.000.
  3. **Rekonsiliasi Saldo Awal GoPay**: Saldo awal GoPay disetel ke Rp 2.000.000 (saldo akhir tetap Rp 2.000.000).
  4. **Rekonsiliasi Total Kekayaan Bersih**: Total Saldo Awal (Rp 2.550.000) + Pemasukan (Rp 10.000.000) - Pengeluaran (Rp 50.000) = Rp 12.500.000. 100% klop dan konsisten secara akuntansi.
  5. **Kronologi Transaksi**: Timestamp `TX-1` (jam 12:30 WIB) dibuat lebih baru daripada `TX-2` (jam 08:00 WIB), sehingga Makan Siang Nasi Padang muncul secara presisi di baris paling atas daftar transaksi terakhir.
  6. **Fidelitas Mock**: Pada fungsi `saveWallet` di `tests/mocks/google-script-mock.js`, properti `initialBalance` kini dipasangkan ke objek dompet baru sehingga dompet baru yang ditambahkan di simulator spreadsheet menampilkan nilai saldo awal yang tepat. Selain itu, fungsi `updateTransaction` mempertahankan `createdAt` asli transaksi agar urutan kronologis tidak teracak saat hanya mengedit nominal atau catatan.
- **Hasil Pengujian**: Seluruh 44 pengujian backend lulus, 8 script inline bebas galat sintaks, dan seluruh artefak showcase terdistribusi secara sinkron.

---

## 14. Pekerjaan Lanjutan v1.8.6

Batch ini menyelesaikan transparansi asal-usul kas demo secara natural (menghilangkan ketergantungan saldo gaib/saldo awal tanpa riwayat) dan membersihkan berkas manifest duplikat di root repositori:

### 14.1 Aliran Kas Alami Penuh (*Natural Cash Flow*) Tanpa Saldo Gaib
- **Latar Belakang & Cacat Logika**:
  - Pada v1.8.5, dompet tunai dan e-wallet mengandalkan kolom Saldo Awal (*Initial Balance*) di sheet `DOMPET` (Rp 550.000 dan Rp 2.000.000) tanpa ada catatan transaksi mutasi di Buku Kas.
  - Jika pengunjung menghapus transaksi gaji bulanan, pemasukan menjadi Rp 0, pengeluaran Rp 50.000 (makan siang), dan sisa kas menjadi -Rp 50.000, namun saldo di GoPay (Rp 2.000.000) dan Dompet Tunai (Rp 500.000) masih ada secara tiba-tiba tanpa riwayat uang masuk.
- **Tindakan Perbaikan**:
  1. **Saldo Awal Murni Nol**: Saldo awal seluruh akun dompet (`W-1`, `W-2`, `W-3`) disetel ke **Rp 0** di `demo/index.html` dan `tests/mocks/google-script-mock.js`.
  2. **Pemasukan Gaji Pokok**: Dicatat sebesar **Rp 12.550.000** masuk ke rekening utama *BCA Tabungan*.
  3. **Pencatatan Pindah Saldo (Transfer) Alami**:
     - Ditambahkan transaksi transfer **Tarik Tunai ATM** sebesar **Rp 550.000** dari *BCA Tabungan → Dompet Tunai*.
     - Ditambahkan transaksi transfer **Top Up Saldo GoPay** sebesar **Rp 2.000.000** dari *BCA Tabungan → GoPay*.
  4. **Pengeluaran**: Dicatat transaksi makan siang sebesar **Rp 50.000** dari *Dompet Tunai*.
  5. **Hasil Neraca**:
     - BCA Tabungan: 12.550.000 - 550.000 - 2.000.000 = **Rp 10.000.000**.
     - Dompet Tunai: 550.000 - 50.000 = **Rp 500.000**.
     - GoPay: **Rp 2.000.000**.
     - Total Kekayaan Bersih (*Net Worth*): **Rp 12.500.000**.
     - Pemasukan Kas: Rp 12.550.000, Pengeluaran Kas: Rp 50.000, Sisa Kas Bersih: Rp 12.500.000.
  6. **Bukti Konsistensi**: Jika transaksi gaji bulanan dihapus, rekening BCA menjadi minus Rp 2.550.000 (karena dana yang ditarik/ditransfer belum ada) dan total saldo seluruh akun menjadi tepat **-Rp 50.000**, persis sama dengan sisa kas pengeluaran makan siang tanpa ada uang gaib.

### 14.2 Pembersihan Berkas Repositori (*Repository Hygiene*)
- Menghapus berkas redundan `appsscript.json` di root repositori. Konfigurasi `.clasp.json` menggunakan `"rootDir": "./src"`, sehingga `src/appsscript.json` menjadi satu-satunya sumber kebenaran (*single source of truth*) yang diunggah ke Google Apps Script.
- Menyesuaikan pengujian unit manifest pada `tests/backend/backend.test.js` agar hanya memvalidasi `src/appsscript.json`.
- Membersihkan folder artefak lokal `test-results/`.
- Hasil pengujian: Seluruh 44 tes regresi backend lulus 100%, 8 script inline bebas galat sintaks.

---

## 15. Pekerjaan Lanjutan v1.8.7

Batch ini merapikan estetika tipografi dan tata letak badge identitas aplikasi pada sidebar desktop:

### 15.1 Perapian Layout Badge Identitas (*Anti-Wrapping*)
- **Masalah Visual**:
  - Pada header sidebar desktop (`Index.html`), teks badge identitas sebelumnya tertulis `Template Master`.
  - Karena lebar sidebar terbatas (240px dengan padding 16px) dan berada sebaris dengan nama aplikasi `Finance Tracker`, ruang yang tersisa tidak mencukupi untuk 15 karakter teks badge.
  - Akibat tidak adanya deklarasi `white-space: nowrap`, teks badge patah secara vertikal menjadi dua baris canggung (`Template` di atas, `Master` di bawah) di dalam badge pill lonjong.
- **Tindakan Perbaikan**:
  1. **Penyelarasan Teks**: Menyeragamkan label badge sidebar desktop menjadi `Master` (persis sama dengan header mobile pada baris 65).
  2. **Penguatan CSS**: Menambahkan properti `white-space: nowrap;`, `flex-shrink: 0;`, `display: inline-flex; align-items: center; justify-content: center;`, dan `line-height: 1.4;` pada kelas `.user-badge` di `Styles.html` untuk menjamin badge selalu tampil utuh dalam satu baris horizontal tanpa risiko patah teks.
- **Hasil Pengujian**: Tampilan badge menjadi bersih, padat, dan estetis sesuai standar tipografi utilitarian *Sage Green*. 44 tes backend lulus, 8 script inline bebas galat.
