# Laporan QC & Product Testing — Finance Tracker

**Dokumen**: Laporan Quality Control dan Product Testing
**Versi produk yang diuji**: 1.7.9 (`package.json`)
**Tanggal pengujian**: 5 November 2026
**Cakupan**: Produk asli (Google Apps Script container-bound) dan Produk demo (showcase statis + mock engine)
**Status rilis**: **TIDAK LAYAK RILIS** - 4 blocker, 17 high, 46 medium/low (29 medium, 17 low)

---

## 0. Definisi Lingkup: Produk Asli vs Produk Demo

Pemisahan ini dipakai konsisten di seluruh dokumen. Membaca laporan tanpa memahami tabel ini akan menghasilkan kesimpulan yang salah.

| Aspek | Produk Asli | Produk Demo |
|---|---|---|
| Kode backend | `src/backend/Code.js`, `SetupService.js`, `TransactionService.js` | Tidak ada backend. Diganti `tests/mocks/google-script-mock.js` |
| Kode frontend | `src/frontend/Index.html`, `Styles.html`, `App.html` | Build hasil generate: `demo/WebApp.html`, `WebApp.html`, `tests/fixtures/app-test.html` (isi frontend identik dengan produk asli) |
| Halaman pemasaran | Tidak ada | `demo/index.html` (showcase), `preview.html` (salinan identik) |
| Penyimpanan data | Google Sheets (`TRANSAKSI`, `DOMPET`, `KATEGORI`, `ANGGARAN`, `DASHBOARD`) | Objek `window.__MOCK_DB__` di memori browser, hilang saat reload |
| Deployment | `clasp push` ke project container-bound + manifest `src/appsscript.json` | Hosting statis (GitHub Pages/Vercel/Netlify/Cloudflare) |
| Autentikasi | OAuth Google + manifest akses web app | Tidak ada. Semua pengunjung memakai data mock yang sama |
| Cara pengujian | Eksekusi GAS + Spreadsheet sungguhan | Browser lokal + `file://`/HTTP |

**Fakta penting yang diverifikasi:** `WebApp.html`, `demo/WebApp.html`, dan `tests/fixtures/app-test.html` memiliki isi identik (hash sama). Ketiganya dibangun oleh `scripts/prepare-test-app.js` dari `src/frontend`. Akibatnya:

1. Setiap bug UI di `src/frontend` **pasti muncul juga di demo** (lihat Bagian C).
2. Demo **tidak pernah mengeksekusi** `Code.js`, `SetupService.js`, atau `TransactionService.js`, sehingga demo tidak bisa membuktikan produk asli bebas bug. Ini akar dari lolosnya blocker R-01.
3. Perbaikan harus dilakukan di `src/frontend`; memperbaiki `demo/WebApp.html` langsung akan tertimpa pada `npm test` berikutnya.

---

## 1. Ringkasan Eksekutif

**Vonis:** produk belum boleh dijual. Empat temuan memblokir rilis, dan tiga di antaranya hanya bisa ditemukan dengan menguji produk asli — bukan demo.

| Kategori | Blocker | High | Medium/Low | Total |
|---|---|---|---|---|
| A. Produk Asli saja | 3 | 11 | 11 | 25 |
| B. Produk Demo saja | 0 | 2 | 20 | 22 |
| C. Frontend bersama (muncul di keduanya) | 1 | 4 | 15 | 20 |
| **Total** | **4** | **17** | **46** | **67** |

**Empat blocker:**

1. **R-01** — Panduan instalasi manual menghasilkan aplikasi yang tidak bisa dibuka (path template `frontend/Index` vs file flat `Index.html`).
2. **R-02** — Konfigurasi akses web app membuka seluruh data keuangan ke publik (`ANYONE_ANONYMOUS` + `USER_DEPLOYING`) dan tidak ada pemeriksaan otorisasi.
3. **R-03** — `getDashboardData()` menulis ke sheet saat membaca dan membuat dompet `W-1` duplikat yang merusak net worth.
4. **S-01** — Stored XSS dari catatan/nama yang dirender mentah ke `innerHTML`; terverifikasi eksekusi JavaScript.

**Kesimpulan per artefak:**

- **Produk asli**: gagal pada aspek instalasi, keamanan akses, integritas data akuntansi, dan validasi input. Tidak ada satu pun tes otomatis yang menyentuh backend.
- **Produk demo**: tampil baik secara visual, tetapi (a) memiliki DOM XSS sendiri lewat `postMessage`, (b) menampilkan email `test@example.com` di halaman jual, (c) perilakunya berbeda dari produk asli di titik-titik penting, sehingga calon pembeli menilai fitur yang tidak sama dengan yang dibeli.
- **Repositori/rilis**: artefak build di-commit dan ditulis ulang oleh `npm test`; `clasp` tidak ada di `devDependencies`; tidak ada penomoran versi saat deploy.

---

## 2. Legenda dan Metode

**Severity**
- **B (Blocker)**: data rusak, aplikasi mati, atau celah keamanan langsung. Rilis diblokir.
- **H (High)**: fitur utama salah/terhambat, integritas laporan terganggu.
- **M (Medium)**: salah tampil, UX menghambat, atau risiko yang perlu ditutup sebelum promosi besar.
- **L (Low)**: kosmetik, kebersihan kode, atau ketidaksesuaian dokumen.

**Status verifikasi**
- **Terverifikasi**: direproduksi langsung (browser atau harness backend dengan fake Google Sheets API).
- **Code review**: dipastikan dari alur kode, belum dijalankan end-to-end di GAS.

**Lingkungan uji**
- Backend: `TransactionService.js` + `SetupService.js` dieksekusi di Node dengan implementasi palsu `SpreadsheetApp` (skenario S1–S11, Bagian 4).
- Frontend/demo: Chromium in-app pada `http://127.0.0.1:8765/demo/WebApp.html` dan `demo/index.html`.
- Playwright: `npx playwright test` tidak dapat menyelesaikan launch browser di mesin uji ini (hang pada `browserType.launch`), sehingga hasil asersi otomatis tidak dipakai sebagai bukti. Ini keterbatasan lingkungan uji, bukan temuan produk; implikasinya terhadap validitas pengujian dibahas di D-21.

---

# A. Daftar Bug Produk Asli

Hanya ada di produk asli: backend GAS, manifest, deployment, mode Sidebar/Dialog, dan dokumen yang dijual ke pembeli.

| ID | Sev | Area | Lokasi | Gejala dan dampak | Verifikasi |
|---|---|---|---|---|---|
| R-01 | B | Instalasi | `Code.js:30,43,55`; `Index.html:9,273`; `README.md:85-87`; `setup_guide.md:44-46` | Kode memanggil `frontend/Index`, `frontend/Styles`, `frontend/App`, tetapi panduan menyuruh membuat file flat `Index.html`. Pembeli yang mengikuti panduan mendapat `No HTML file named frontend/Index was found`. | Code review |
| R-02 | B | Keamanan akses | `appsscript.json:7-8` (root); `src/appsscript.json:7-8`; `Code.js:74-101` | Dua manifest berbeda. Root memakai `USER_DEPLOYING` + `ANYONE_ANONYMOUS`: siapa pun di internet menjalankan skrip dengan kredensial pemilik dan dapat membaca/menghapus seluruh data. Tidak ada allowlist email di dispatcher. | Code review |
| R-03 | B | Integritas data | `TransactionService.js:52-61,315`; `Code.js:54` | Jalur baca menulis ke sheet. Jika `W-1` sudah ada tetapi nonaktif, satu panggilan baca menambah baris `W-1` kedua. Transaksi lama kemudian dibebankan ke dompet duplikat. Net worth berubah dari -15.000 menjadi -20.000 pada skenario uji. | Terverifikasi (S1, S5) |
| R-04 | H | Validasi backend | `TransactionService.js:180-217,219-258` | `amount:"abc"` tersimpan sebagai NaN; `type:"Hacked"` diterima; `date:"05/11/2026"` diterima dan tidak masuk laporan bulan mana pun; `walletId` tidak dikenal diterima; kategori Income bisa dipakai untuk Expense; transfer ke dompet nonaktif memotong saldo asal tanpa menambah tujuan. | Terverifikasi (S2, S3, S4, S6, S7, S11) |
| R-05 | H | Kategori | `TransactionService.js:285-289` | Duplikasi dicek hanya berdasarkan nama, bukan `(nama, tipe)`. Permintaan kategori Expense bernama sama dengan kategori Income mengembalikan yang Income; dropdown frontend menjadi kosong dan transaksi tersimpan tanpa kategori. | Terverifikasi (S9 + browser) |
| R-06 | H | Akuntansi dompet | `TransactionService.js:314-345`; `App.html:922-927` | Guard hanya `balance > 0`, sehingga dompet dengan saldo negatif bisa dihapus. Soft delete menghapus `Saldo_Awal` dari net worth tetapi riwayat transaksi tetap masuk laporan. Tidak ada UI untuk reaktivasi; backend tidak menjaga minimal 1 dompet aktif. | Terverifikasi (S5) |
| R-07 | H | Identitas data | `TransactionService.js:201,291,302,361` | ID memakai `Date.now().toString(36)`. Dua penulisan pada milidetik yang sama (double tap, dua perangkat) menghasilkan ID identik; edit/hapus kemudian mengenai baris pertama yang cocok. | Code review |
| R-08 | H | Skema sheet | `SetupService.js:68-84,96-105`; `TransactionService.js:24,38,40,74,139` | Setup hanya membuat sheet yang belum ada; header/tipe data tidak divalidasi. `isActive !== false` membuat teks `"FALSE"` dianggap aktif. Nominal teks `"1.000.000"` menjadi 0. Tanggal ditulis sebagai teks sehingga pivot/SUMIFS pembeli tidak berfungsi. Serial date dibaca sebagai string rusak. | Code review |
| R-09 | H | Konkurensi | `TransactionService.js:353-359` dan semua operasi tulis | Tidak ada `LockService`. Dua tab/perangkat bersamaan dapat membuat baris anggaran ganda atau kehilangan update. | Code review |
| R-10 | H | Formula injection | `TransactionService.js:204-214` | Catatan/nama berawalan `=`, `+`, `-`, `@` ditulis apa adanya ke sheet; berpotensi dieksekusi sebagai formula saat sheet dibuka (mis. `IMPORTXML` untuk eksfiltrasi). | Terverifikasi (S8) |
| R-11 | H | Performa/payload | `TransactionService.js:15-18,133` | `getDashboardData` membaca seluruh sheet dan mengembalikan seluruh transaksi setiap request. Ribuan baris akan melampaui batas waktu/ukuran `google.script.run` dan memperlambat mobile. | Code review |
| R-12 | H | Keamanan web | `Code.js:61` | `XFrameOptionsMode.ALLOWALL` di produksi memungkinkan clickjacking terhadap aksi tulis/hapus. | Code review |
| R-13 | H | Flow Sidebar | `Styles.html:1285`; `App.html:1217-1221` | `body.SIDEBAR .section-actions { display:none!important }` menyembunyikan tombol "+ Pengeluaran", "+ Pemasukan", dan "Pindah Saldo". Di Sidebar hanya tersisa FAB yang selalu membuka form Expense; pengguna tidak bisa mencatat pemasukan/transfer. | Code review |
| R-14 | H | Fitur/dokumen | `SetupService.js:11-17`; `setup_guide.md:61` | Tab `DASHBOARD` dibuat kosong (hanya warna tab), padahal dokumen menjualnya sebagai kartu ringkasan kas/anggaran/dompet. | Code review |
| R-15 | M | Data awal | `SetupService.js:58-61` | Template menanam anggaran contoh 1.500.000 dan 500.000 yang tidak pernah disetel pembeli; rawan disangka data sendiri dan memicu status overbudget. | Code review |
| R-16 | M | Anggaran | `TransactionService.js:140-157,353-359` | `saveBudget` mengabaikan `Periode` dan mengubah baris apa pun menjadi `RECURRING`, menimpa anggaran historis. Model data mendukung periode, UI tidak pernah membuatnya. Baris duplikat menghasilkan hasil acak karena hanya baris pertama dipakai. | Code review |
| R-17 | M | Privasi | `Code.js:16-26`; `Index.html:48,63` | Email pengguna/efektif ditampilkan di UI. Pada mode deployment tertentu ini bisa menampilkan email pemilik ke pengunjung. | Code review |
| R-18 | M | Manifest/UI | `Code.js:53-63`; `Index.html:5` | `doGet(e)` mengabaikan parameter dan menambahkan meta viewport kedua yang bertentangan dengan meta di template. | Code review |
| R-19 | M | Build/deploy | `package.json:11-20`; `GEMINI.md:3-8` | `clasp` dipakai di script tetapi tidak ada di `devDependencies`. `npm run deploy` hanya `test && clasp push --force` tanpa `clasp version`, sehingga nomor versi Apps Script tidak pernah selaras dengan `package.json`. `main: index.js` menunjuk file yang tidak ada. | Code review |
| R-20 | M | Dokumen/klaim | `README.md:22,3`; `Code.js:35-36`; `demo/index.html:144`; `docs/01_PANDUAN_PENGUJIAN_PRODUK.md:100,104` | Dialog diklaim 980x680, kode 1080x720. Klaim "PWA" tanpa `manifest.json`/service worker (Add to Home Screen hanya bookmark). TC-SUM-04 menjanjikan subtotal masuk dan keluar per hari, UI hanya menampilkan net. TC-DSH-02 menjanjikan donut per dompet, implementasi berupa bar horizontal. | Code review |
| R-21 | L | Manifest | `appsscript.json:10-15` | Scope `spreadsheets.currentonly` dan `spreadsheets` diminta bersamaan (redundan/tidak konsisten). | Code review |
| R-22 | L | Menu | `Code.js:12,65-68` | Menu "Periksa / Inisialisasi Database" tidak memeriksa apa pun, hanya memastikan struktur; toast selalu sukses tanpa penanganan error. | Code review |
| R-23 | L | Validasi | `TransactionService.js:298-307,347-364` | `saveWallet` menerima nama berisi spasi dan tipe sembarang; `saveBudget` menerima limit 0/negatif dan kategori yang tidak ada. Frontend mencegah, API langsung tidak. | Terverifikasi (S10) |
| R-24 | L | Audit | `TransactionService.js:260-272` | Hapus transaksi permanen (`deleteRow`) tanpa soft delete, undo, atau jejak audit. Berisiko untuk aplikasi keuangan. | Code review |
| R-25 | L | Konsistensi | `TransactionService.js:132` | Urutan hanya berdasarkan tanggal. Transaksi di hari yang sama mempertahankan urutan sheet (terlama dulu), sehingga "5 Transaksi Terakhir" tidak selalu menampilkan input terbaru. | Code review |

---

# B. Daftar Bug Produk Demo

Hanya ada di artefak demo: `demo/index.html`, `demo/WebApp.html`, `preview.html`, `WebApp.html`, dan `tests/mocks/google-script-mock.js`. Tidak memengaruhi data pembeli, tetapi memengaruhi kredibilitas penjualan, keamanan halaman jual, dan validitas pengujian.

| ID | Sev | Area | Lokasi | Gejala dan dampak | Verifikasi |
|---|---|---|---|---|---|
| D-01 | H | Keamanan showcase | `demo/index.html:418-425,332-337,351-354` | Listener menerima `postMessage` apa pun tanpa memeriksa `event.origin` dan langsung merender `notes`/`name` dengan `innerHTML`. Siapa pun yang dapat membuka/frame halaman demo dapat menyuntik HTML/JS ke halaman jual. | Terverifikasi (`window.__demoXss === 2`) |
| D-02 | M | Kebocoran data | `demo/index.html:409-412` | `postMessage(..., '*')` menyiarkan seluruh isi `__MOCK_DB__` ke origin mana pun, tanpa target origin. | Code review |
| D-03 | M | Race condition | `demo/index.html:402-415,430-440` | "Reset Data" mengirim pesan sebelum iframe siap. Jika diklik saat iframe belum selesai dimuat, tabel kanan ter-reset tetapi aplikasi di iframe tetap memakai data lama. Tidak ada ack/handshake. | Code review |
| D-04 | M | Kredibilitas | `demo/WebApp.html:1351,1366` | Halaman demo publik menampilkan alamat `test@example.com` pada "Akun Aktif". Terlihat seperti produk belum jadi. | Terverifikasi |
| D-05 | M | Ekspektasi pengguna | `demo/index.html:206-208` | Tidak ada banner "DEMO, data hilang saat refresh". Teks "tersinkronisasi" benar hanya dalam satu sesi. Calon pembeli bisa menilai aplikasi tidak menyimpan data. | Code review |
| D-06 | M | Responsif | `demo/index.html:14-21,115` | `.device-mobile { width:400px }` tanpa `max-width`. Pada layar 390/360 px, halaman demo melebar melebihi viewport dan memaksa scroll horizontal. | Code review |
| D-07 | M | Ketergantungan jaringan | `demo/index.html:9-10` | Showcase memuat Tailwind dari `cdn.tailwindcss.com` dan Google Fonts. Tanpa internet, tampilan rusak; CDN Tailwind juga mengeluarkan peringatan "not for production". Bertentangan dengan klaim demo offline di README. | Code review |
| D-08 | M | Fidelitas mock | `tests/mocks/google-script-mock.js:133-143` | `google.script.run` di mock berupa singleton: `withSuccessHandler` menimpa `_successCb` milik panggilan sebelumnya. Dua aksi cepat dapat menerima callback milik aksi lain. Di GAS asli setiap panggilan punya runner sendiri. | Code review |
| D-09 | M | Fidelitas mock | `tests/mocks/google-script-mock.js:219-247` | `updateTransaction` membalik dampak saldo lama lebih dulu, baru memvalidasi transfer baru. Jika validasi gagal, saldo demo sudah berubah tetapi data transaksi tidak — demo menampilkan kerusakan yang tidak mungkin terjadi di backend asli (yang menghitung ulang dari nol). | Code review |
| D-10 | M | Fidelitas mock | `tests/mocks/google-script-mock.js:313-324` | Hapus dompet di demo menghapus permanen tanpa memedulikan riwayat, sedangkan produk asli melakukan soft delete. Pembeli melihat perilaku yang berbeda dari produk. | Code review |
| D-11 | M | Fidelitas mock | `tests/mocks/google-script-mock.js:154-155` vs `TransactionService.js:181` | Demo menolak `amount:"abc"` karena `Number(...) || 0`, sedangkan produk asli menyimpannya sebagai NaN. Demo menutupi bug backend R-04. | Terverifikasi (S2) |
| D-12 | M | Fidelitas mock | `tests/mocks/google-script-mock.js:6-7,170` | "Hari ini" dihitung dengan `toISOString()` (UTC), sedangkan produk asli memakai zona `Asia/Jakarta`. Sekitar pukul 00.00–06.59 WIB demo dan produk menampilkan tanggal berbeda. | Code review |
| D-13 | L | Kebijakan merek | `demo/index.html:179`; `preview.html:179` | Terdapat karakter emoji pensil (U+270F U+FE0F) pada daftar fitur, melanggar kebijakan zero-emoji di `GEMINI.md:10-13`. | Terverifikasi |
| D-14 | L | Aksesibilitas | `demo/index.html:116` | `<iframe>` tidak memiliki atribut `title`, sehingga tidak punya nama aksesibel. | Terverifikasi |
| D-15 | L | Akurasi tabel simulasi | `demo/index.html:211-241,329-337` | Tabel TRANSAKSI tidak punya kolom Tipe; transfer tampil tanpa tanda +/-. Tabel DOMPET tidak menampilkan `Aktif` dan `Saldo_Awal`, padahal sheet asli punya 6 kolom. Struktur yang ditunjukkan tidak sama dengan produk. | Code review |
| D-16 | L | Data statis | `demo/index.html:255-281` | `defaultDb.todaySummary.income = 0` padahal ada pemasukan 15.000.000; `budgets[0].spent = 750000` padahal transaksi hanya 50.000. Aman selama tidak dirender, tetapi menjadi jebakan saat fitur ditambah. | Code review |
| D-17 | L | Urutan data | `tests/mocks/google-script-mock.js:206` | Mock memakai `unshift` (terbaru selalu di atas), produk asli menyortir hanya berdasarkan tanggal sehingga transaksi hari yang sama tampil terlama dulu. Demo tidak merepresentasikan urutan asli. | Code review |
| D-18 | L | Validasi mock | `tests/mocks/google-script-mock.js:153-209,344-361` | Mock menerima tipe transaksi tak dikenal, budget 0/negatif, dan tidak memvalidasi periode. Berbeda dari produk yang seharusnya menolak. | Code review |
| D-19 | L | Artefak ganda | `WebApp.html`, `demo/WebApp.html`, `preview.html`, `tests/fixtures/app-test.html` | Semuanya hasil generate dan di-commit; `WebApp.html` dan `demo/WebApp.html` identik (hash sama), `preview.html` identik dengan `demo/index.html`. Risiko drift dan PR berisik; `preview.html` yang dihosting sendiri akan menunjuk `WebApp.html` yang tidak ada. | Terverifikasi |
| D-20 | L | Tes demo | `tests/e2e/demo.spec.js:22` | Asersi `toHaveCount(2)` pada tabel simulasi rapuh; berubah setiap data demo ditambah. | Code review |
| D-21 | H | Validitas pengujian | Seluruh `tests/e2e/*.spec.js` | Tes berjalan pada fixture dengan mock, bukan GAS/Sheets. Tidak ada tes backend sama sekali. Demo dapat 100% hijau sementara produk asli gagal total (terbukti pada R-01/R-03/R-04). | Terverifikasi (struktur tes) |
| D-22 | L | Repositori | `package.json:8-9`; `scripts/prepare-test-app.js:30-56` | `npm test` menulis ulang artefak yang di-commit. Setelah dijalankan, `git status` kotor hanya karena tanggal form berubah (`2026-10-26` menjadi `2026-11-05`). | Terverifikasi |

---

# C. Bug Frontend yang Muncul di Keduanya

Kode `src/frontend` dipakai produk asli dan di-bundling ke `demo/WebApp.html`. Bug berikut **bukan bug demo saja**: demo hanya memperlihatkannya, dan perbaikannya harus di `src/frontend`.

| ID | Sev | Area | Lokasi | Gejala dan dampak | Verifikasi |
|---|---|---|---|---|---|
| S-01 | B | Keamanan | `App.html:471,1133,1166,1278,1243` | Catatan, nama dompet/kategori, `searchQuery`, dan `tx.id` disisipkan mentah ke `innerHTML`/atribut. Stored XSS tereksekusi. Di produk asli dampaknya lebih besar karena data berasal dari sheet yang bisa diedit dan sesi punya akses tulis. | Terverifikasi |
| S-02 | H | Loading | `App.html:32-59` | Guard `typeof google !== 'undefined'` tidak punya `else`. Bila API tidak tersedia, layar berhenti di "Memuat buku kas..." selamanya. Ini yang membuat R-01 tampak seperti aplikasi rusak tanpa pesan. | Code review |
| S-03 | H | Pencarian | `App.html:806-809,1243` | `oninput` memanggil `renderApp()` yang mengganti seluruh `#app-root`; input hancur dan fokus pindah ke `BODY` setiap satu huruf. Huruf besar juga dipaksa menjadi kecil. | Terverifikasi |
| S-04 | H | Tampilan Bulanan | `App.html:370,445-465` | Jika bulan terpilih tidak punya transaksi, `activeGroup` jatuh ke `monthGroups[0]`. Judul tetap bulan terpilih, isi tabel bulan lain. Terbukti: "Catatan Transaksi Oktober 2026" menampilkan transaksi November. | Terverifikasi |
| S-05 | H | Tanggal/zona waktu | `App.html:5,19,513,554,991`; `Index.html:145` | Tanggal default dan "hari ini" memakai `toISOString()` (UTC), sedangkan backend memakai `Asia/Jakarta`. Pukul 00.00–06.59 WIB tanggal default menjadi kemarin; pada tanggal 1, bulan default menjadi bulan lalu. | Code review |
| S-06 | M | Performa | `App.html:782-793,934-935`; seluruh `renderApp` | Setiap aksi mengganti `innerHTML` penuh: posisi scroll hilang, muncul flicker "Memuat buku kas...", dan render ulang seluruh daftar transaksi. | Code review |
| S-07 | M | Filter | `App.html:1192-1194,1244-1256` | Filter memakai nama kategori, bukan ID. Nama sama di tipe berbeda bercampur; rename kategori memutus filter. | Code review |
| S-08 | M | Edit transaksi | `App.html:559-560,1375-1388` | Transaksi pada dompet nonaktif tidak bisa diedit: nilai select tidak ada di opsi, menjadi kosong, server menolak. Riwayat menjadi read-only permanen. | Code review |
| S-09 | M | Modal | `App.html:64-69,576-578`; `Index.html:105,181,208,235` | Escape dan klik overlay menutup semua modal tanpa konfirmasi; modal kategori menutup modal transaksi sehingga input hilang. Shortcut `n` tidak memeriksa modal yang sedang terbuka. | Code review |
| S-10 | M | Format uang | `App.html:165-167,429,433,1232` | `formatRupiah` tidak menangani negatif: satu tempat menampilkan `-Rp 50.000`, tempat lain `Rp -50.000`. Kartu bulanan tidak memberi label "Defisit" saat sisa kas negatif. | Code review |
| S-11 | M | Grafik | `App.html:282-289` | `stroke-dasharray` dihitung dari persentase yang sudah dibulatkan lalu diakumulasi, sehingga total bisa 99/101 dan arc tumpang tindih/bercelah. Tidak ada rotasi -90 derajat. | Code review |
| S-12 | M | State bulan | `App.html:202-210,320-323,983-988` | `currentMonthPeriod` dipakai bersama Dashboard dan Buku Kas; menggeser bulan di Buku Kas diam-diam mengubah angka "Bulan Ini" di Dashboard. | Code review |
| S-13 | M | Statistik | `App.html:1322-1347` | Bagian "Alokasi per Kantong Dompet" tetap tampil saat mode Pemasukan dipilih, padahal datanya selalu pengeluaran. | Code review |
| S-14 | M | Input nominal | `App.html:102-107` | Semua non-digit dibuang, sehingga `"1.5"` menjadi 15. Tidak ada batas atas, tidak ada penolakan tanggal masa depan/tahun tidak wajar. | Code review |
| S-15 | M | Error handling | `App.html:49,55,665,723,...`; `1364-1371` | Semua error memakai `alert()` dan pesan internal server ditampilkan mentah. Tidak ada deteksi offline, retry, atau jalur pelaporan. | Code review |
| S-16 | M | Aksesibilitas | `Index.html:5,25,34`; modal di `Index.html` | `user-scalable=no` memblokir zoom; navigasi memakai `<div onclick>`; modal tanpa `role="dialog"`, `aria-modal`, focus trap, dan focus return. | Code review |
| S-17 | M | Laporan harian | `App.html:217-227,1268-1270` | `totalIncome`/`totalExpense` per hari sudah dihitung tetapi tidak dirender; hanya net yang tampil. Bertentangan dengan TC-SUM-04. | Code review |
| S-18 | L | Logika ganda | `TransactionService.js`, `App.html:971-1000`, `google-script-mock.js:4-67` | Tiga implementasi aturan bisnis yang sama. Sudah terbukti berbeda: backend membatasi persen 100, frontend tidak; mock hard delete, backend soft delete. | Terverifikasi |
| S-19 | L | Fokus form | `Index.html:217,244` | Atribut `autofocus` hanya bekerja saat halaman dimuat, tidak saat modal dibuka; modal kategori tidak pernah mendapat fokus. | Code review |
| S-20 | L | Duplikasi sumber | `App.html:1-1395` | `appState.form` menyimpan nilai yang juga dibaca langsung dari DOM; rawan nilai state dan DOM tidak sinkron (sudah terlihat pada H5/R-05). | Code review |

---

## 3. Matriks Fidelitas: Demo vs Produksi

Bagian ini menjawab pertanyaan "kalau demo lulus, apakah produk lulus?" — jawabannya tidak.

| Perilaku | Produk Asli | Demo | Dampak |
|---|---|---|---|
| Simpan data | Google Sheets permanen | Memori, hilang saat reload | Pembeli mengira tidak menyimpan |
| Hapus dompet | Soft delete bila ada riwayat | Hard delete | Demo menunjukkan perilaku yang tidak ada di produk |
| Dompet terakhir | Dibuat ulang otomatis (bug R-03) | Boleh kosong | Demo menyembunyikan bug produk |
| Nominal `"abc"` | Tersimpan NaN | Ditolak | Demo menutupi R-04 |
| Transfer ke dompet nonaktif | Saldo asal hilang | Tidak relevan (dompet dihapus) | Demo tidak menguji kasus nyata |
| Tanggal "hari ini" | `Asia/Jakarta` | UTC | Selisih tanggal dini hari |
| Urutan transaksi | Tanggal, stabil sesuai urutan sheet | Terbaru selalu di atas | Tampilan berbeda |
| Kategori nama ganda | Bug R-05 | Bug sama, dropdown kosong | Demo memperlihatkan bug produk |
| Otorisasi | OAuth + manifest | Tidak ada | Rasa aman palsu |
| Performa | Kuota dan batas GAS | Instan (30 ms) | Demo tidak bisa jadi bukti performa |
| Pemasangan/PWA | Deploy web app + bookmark | Iframe statis | Klaim "PWA" tidak teruji |

---

## 4. Bukti Reproduksi

### 4.1 Harness backend

`TransactionService.js` dan `SetupService.js` dieksekusi di Node dengan `SpreadsheetApp` palsu (sheet berupa array, mendukung `getDataRange`, `appendRow`, `deleteRow`, `getRange().setValue`). Hasil:

| Kode | Skenario | Hasil |
|---|---|---|
| S1 | DOMPET hanya berisi `W-1` nonaktif, lalu `getDashboardData()` | DOMPET bertambah baris `W-1` kedua; satu panggilan baca mengubah data |
| S2 | `createTransaction({ amount: "abc" })` | `success: true`; kolom Nominal berisi NaN |
| S3 | `createTransaction({ type: "Hacked" })` | Tersimpan; ringkasan bulan tetap 0; saldo tidak berubah |
| S4 | `createTransaction({ date: "05/11/2026" })` | Tersimpan apa adanya; tidak dihitung di bulan mana pun |
| S5 | Dompet saldo -15.000 dihapus | `success: true`; soft delete; net worth berubah dan `W-1` duplikat muncul |
| S6 | Transfer 50.000 ke dompet nonaktif | Net worth turun 100.000 menjadi 50.000; dana tujuan tidak tercatat |
| S7 | `walletId` tidak dikenal | Tersimpan; net worth tidak terpengaruh |
| S8 | Catatan `=IMPORTXML(...)` | Tersimpan utuh sebagai string formula |
| S9 | Kategori "Bonus" Income lalu dibuat "Bonus" Expense | Mengembalikan objek Income |
| S10 | `saveWallet({ name: "   " })` | Dompet bernama spasi dibuat |
| S11 | Expense dengan kategori Income | Diterima; `categoryName` menjadi "Gaji" |

### 4.2 Pemeriksaan browser

| Pemeriksaan | Hasil |
|---|---|
| Ketik pencarian dua karakter | Fokus berpindah ke `BODY` setelah karakter pertama; input diganti elemen baru |
| Pilih Oktober 2026 di tampilan Bulanan | Header "Oktober 2026", baris berisi transaksi November 2026 |
| Catatan `<img src=x onerror=...>` di produk/demo | Handler tereksekusi (`__xss = 1`) |
| `postMessage` palsu ke halaman demo | Handler tereksekusi di halaman jual (`__demoXss = 2`) |
| Buka `demo/index.html` | "Akun Aktif" menampilkan `test@example.com`; iframe tanpa `title`; lebar perangkat tetap 400 px |

---

## 5. Yang Sudah Baik

- Konsep saldo dihitung ulang dari saldo awal + seluruh transaksi (bukan saldo berjalan yang bisa melenceng) sudah tepat dan menyederhanakan rollback edit/hapus.
- Pemisahan transaksi `Transfer` dari arus kas masuk/keluar sudah benar, termasuk sanitasi kategori pada transfer.
- Soft delete dompet adalah keputusan desain yang tepat untuk menjaga riwayat; implementasinya yang perlu diperbaiki, bukan konsepnya.
- Frontend memakai satu sumber data (`getDashboardData`) dan menghitung ulang ringkasan, sehingga tidak ada saldo hardcoded.
- Struktur dokumen penjualan (`docs/01`–`04`) sudah lengkap dan siap dipakai setelah disinkronkan dengan implementasi.
- Sudah ada kerangka Playwright, fixture, dan mock; fondasinya bisa dipakai ulang setelah mock dipisahkan dari pengujian backend.

---

## 6. Rencana Perbaikan dan Release Gate

### Wave 1 — Blocker (wajib sebelum dijual)

1. **R-01**: samakan konvensi nama file. Untuk produk yang dijual manual, ubah referensi ke nama flat (`createTemplateFromFile("Index")`, `include('Styles')`, `include('App')`), atau ubah panduan agar menyebut path `frontend/...` dan hanya mendukung clasp. Tambahkan smoke test yang benar-benar memuat template.
2. **R-02**: satu manifest saja. Hapus `ANYONE_ANONYMOUS`/`USER_DEPLOYING`; gunakan `USER_ACCESSING` + akses terbatas; tambahkan allowlist email di `doGet` dan `apiDispatcher`; turunkan `ALLOWALL` (R-12) ke mode aman.
3. **R-03**: hapus semua penulisan dari jalur baca. Pindahkan pembuatan default wallet ke `ensureDatabaseStructure`, cek keberadaan ID, gunakan `Utilities.getUuid()`.
4. **S-01**: escape seluruh interpolasi, ganti `onclick` berbasis data dengan `data-id` + event delegation, validasi format ID di server.
5. **S-02**: tambahkan `else` pada guard `google.script.run`, pesan error yang bisa ditindaklanjuti, dan tombol retry.

### Wave 2 — Integritas dan keamanan data

6. **R-04, R-23**: satu modul validasi (`type` whitelist, `Number.isFinite`, `Math.round`, regex tanggal, cek dompet/kategori ada dan aktif, kategori harus sesuai tipe).
7. **R-05**: unik per `(nama, tipe)`; frontend memverifikasi opsi sebelum set nilai.
8. **R-06**: blokir hapus bila saldo tidak nol (termasuk negatif), wajibkan transfer sisa, sediakan reaktivasi, cek minimal 1 dompet di server.
9. **R-07**: ganti seluruh ID ke `Utilities.getUuid()`.
10. **R-08**: validasi dan migrasi header, data validation, format tanggal/angka, koersi boolean `Aktif`.
11. **R-09**: `LockService` pada semua operasi tulis.
12. **R-10**: prefix `'` untuk nilai berawalan karakter formula.
13. **D-01**: validasi `event.origin`, gunakan `textContent`/escape di tabel simulasi, dan kirim `postMessage` dengan target origin eksplisit (D-02).

### Wave 3 — Akuntansi, UX, dan kualitas rilis

14. **S-03** pencarian tanpa render ulang, **S-04** empty state bulan, **S-05** satu helper tanggal lokal + tanggal server dari template.
15. **R-11/S-06** pagination/periode di server dan render parsial; **R-13** perbaikan tombol Sidebar.
16. **R-14, R-15, R-16** DASHBOARD/seed/period budget; **R-20** sinkronkan seluruh klaim dokumen.
17. **D-04–D-12** perbaikan demo: hapus email uji, banner demo + peringatan reset, `max-width` perangkat, bundel aset secara lokal, handler async per panggilan, samakan aturan hapus dompet, dan tambahkan disclaimer fidelitas.
18. **D-19/D-22** keluarkan artefak generate dari repo atau generate ke folder ignored; tambahkan `clasp` ke devDependencies dan `clasp version` di pipeline.

### Test yang wajib ditambahkan (mengunci temuan)

| Test baru | Mengunci |
|---|---|
| Muat `Index` sebagai template dengan nama file sesuai panduan | R-01 |
| `doGet` tanpa email berizin harus ditolak | R-02, R-12 |
| Panggil `getDashboardData` dua kali pada data tanpa dompet aktif: jumlah baris DOMPET tidak berubah | R-03 |
| `apiDispatcher` dengan amount `"abc"`, type asing, tanggal locale, wallet asing | R-04 |
| Buat kategori nama sama tipe berbeda, lalu simpan Expense | R-05 |
| Hapus dompet saldo negatif dan dompet dengan riwayat | R-06 |
| Ketik pencarian 5 karakter sekaligus dan cek fokus | S-03 |
| Navigasi ke bulan kosong di tampilan Bulanan | S-04 |
| Jalankan pada 00:30 WIB dan 1 bulan baru | S-05 |
| Catatan berisi tag HTML dan berawalan `=` | S-01, R-10 |
| Buka mode Sidebar 380 px dan cari tombol Pemasukan/Transfer | R-13 |
| Mode Pemasukan pada tab Statistik | S-13 |

### Definition of Done

- Semua blocker dan high tertutup, dengan tes regresi yang gagal sebelum perbaikan dan lulus sesudahnya.
- Tes backend nyata (bukan mock) berjalan di CI.
- 26 TC di `docs/01_PANDUAN_PENGUJIAN_PRODUK.md` dieksekusi ulang pada akun Google baru lewat tautan `/copy`.
- UAT mobile nyata (Safari iOS + Chrome Android) untuk alur: buka Sidebar, catat pemasukan, transfer, edit, hapus, atur anggaran, cek laporan bulan lalu.
- Demo diperbarui dari sumber yang sama dan diverifikasi ulang setelah setiap perubahan frontend.

---

## 7. Lampiran: Pemetaan ke Checklist Uji yang Ada

| TC lama | Klaim | Kondisi nyata |
|---|---|---|
| TC-INP-01/02 | Input pengeluaran/pemasukan | Berfungsi di UI; backend tidak memvalidasi tipe/tanggal/nominal |
| TC-INP-04 | Format ribuan realtime | Berfungsi, tetapi desimal dipotong (S-14) |
| TC-BAL-01/02/03 | Net worth, saldo awal, transfer | Logika inti benar; rusak oleh R-03/R-06 dan transfer ke dompet nonaktif |
| TC-BAL-04/05 | Edit/hapus rollback | Backend menghitung ulang (benar); tidak teruji otomatis |
| TC-SUM-01/02 | Ringkasan bulan/hari | Rawan salah di dini hari karena UTC (S-05) |
| TC-SUM-03 | Pemilih bulan lalu | Berfungsi, tetapi bulan tanpa data menampilkan bulan lain (S-04) |
| TC-SUM-04 | Subtotal masuk/keluar per hari | Tidak diimplementasikan (S-17) |
| TC-DSH-01 | Donut total 100% | Pembulatan dapat menghasilkan 99/101 (S-11) |
| TC-DSH-02 | Donut sebaran dompet | Implementasi berupa bar horizontal (R-20) |
| TC-DSH-03 | Persen anggaran tanpa `undefined` | Terpenuhi |
| TC-DSH-04 | Penanda overbudget | Terpenuhi secara visual |
| TC-VAL-01..07 | Validasi input & hapus dompet | Hanya sebagian; R-04/R-06/R-23 membuktikan celah |
| TC-CPY-05 | Lima tab terformat | Tab DASHBOARD kosong (R-14) |
| TC-CPY-06/07 | Deploy web app & Add to Home Screen | Tidak ada manifest/service worker; bukan PWA (R-20) |

---

**Catatan penutup:** laporan ini sengaja memisahkan produk asli dan demo. Kesalahan paling berbahaya dalam proyek ini bukan bug individual, melainkan asumsi bahwa demo yang lulus berarti produk siap jual. Demo berjalan di atas mock dan tidak pernah menyentuh Google Sheets, OAuth, manifest, maupun `TransactionService.js`. Semua pengujian penerimaan harus dijalankan ulang pada produk asli dengan akun Google bersih sebelum status rilis diubah.