# Lembar Kerja Pengujian Produk (Product Testing Checklist - Blank Template)

**Tipe Dokumen**: Lembar Kendali Mutu Pra-Peluncuran (Pre-Launch QA & UAT Checklist)  
**Format Target**: Google Sheets (Struktur 2 Tab: `DASHBOARD_UJI` dan `MATRIKS_UJI`)  
**Divisi Penanggung Jawab (PIC)**: Finance + Operations  
**Status Produk**: Baru Selesai Dikembangkan (Fresh Build) — Belum Diuji oleh Pengguna Asli  
**Dokumen Panduan & SOP Uji**: [`docs/02_PANDUAN_PENGUJIAN_PRODUK.md`](file:///J:/Aplikasi/finance-template/docs/02_PANDUAN_PENGUJIAN_PRODUK.md)  
**Berkas Spreadsheet Multi-Sheet Kosong (.xlsx)**: [`docs/02_PRODUCT_TESTING_CHECKLIST.xlsx`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.xlsx)  
**Berkas CSV Kosong Per-Sheet**:  
- Tab 1: [`docs/02_PRODUCT_TESTING_CHECKLIST_TAB1_DASHBOARD.csv`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST_TAB1_DASHBOARD.csv)  
- Tab 2: [`docs/02_PRODUCT_TESTING_CHECKLIST_TAB2_MATRIKS.csv`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST_TAB2_MATRIKS.csv)  

---

> [!IMPORTANT]
> **Kondisi Berkas Pengujian**:  
> Produk ini berada pada fase **baru selesai dikembangkan pada level koding**. Seluruh formulir pengujian berikut sengaja berstatus **PENDING** dan dikosongkan pada kolom hasil observasi (`Actual Result`) serta tanggal verifikasi agar tim internal (**Finance** dan **Operations**) bersama partisipan pengguna asli (*pilot users*) dapat menguji dan mengisi data secara objektif.

---

## 1. Tab 1: DASHBOARD_UJI (Ringkasan Eksekutif & Lembar Sign-Off Kosong)

### A. Metrik Kelulusan Pengujian Produk Baru

| Parameter Metrik | Formula Google Sheets | Nilai Saat Ini | Target Kelulusan | Status Evaluasi |
|---|---|---|---|---|
| Total Kasus Uji Fungsional | `=COUNTA(MATRIKS_UJI!A2:A27)` | 26 | 26 | Terdefinisi |
| Skenario Lulus (PASS) | `=COUNTIF(MATRIKS_UJI!F2:F27, "PASS")` | 0 | 26 | Belum Diuji |
| Skenario Gagal (FAIL) | `=COUNTIF(MATRIKS_UJI!F2:F27, "FAIL")` | 0 | 0 | Menunggu Eksekusi |
| Skenario Belum Diuji (PENDING) | `=COUNTIF(MATRIKS_UJI!F2:F27, "PENDING")` | 26 | 0 | 26 Butir Antre Uji |
| Tingkat Kelulusan (Pass Rate) | `=C4/C3` | 0.0% | 100.0% | Belum Memenuhi Syarat |
| Status Kesiapan Komersial | `=IF(C7=1, "LAYAK JUAL (READY TO SELL)", "DITAHAN (HOLD)")` | DITAHAN (HOLD) | LAYAK JUAL | Menunggu Hasil QA & UAT |

### B. Lembar Tanda Tangan Persetujuan Rilis (Sign-Off Kosong Bertahap)

| Tahap Persetujuan | Penanggung Jawab (PIC) | Tanggal Verifikasi | Status Keputusan |
|---|---|---|---|
| Tahap 1: Verifikasi Fungsional Internal | Operations Team | [Belum Diisi] | [Pending QA] |
| Tahap 1: Verifikasi Rumus & Rekonsiliasi Saldo | Finance Team | [Belum Diisi] | [Pending QA] |
| Tahap 2: Verifikasi Uji Coba Pengguna Asli (UAT) | 3-5 Pilot Users | [Belum Diisi] | [Pending UAT] |
| Persetujuan Akhir Rilis Penjualan Publik | Operations Lead | [Belum Diisi] | [Pending Sign-Off] |

---

## 2. Tab 2: MATRIKS_UJI (Formulir 26 Kasus Uji Kosong)

### Modul A: Input Transaksi Kas

| Test ID | Modul | Fitur & Skenario | Expected Result | Actual Result | Status | PIC | Tanggal Uji | Catatan / Evidence |
|---|---|---|---|---|---|---|---|---|
| TC-INP-01 | Input Kas | Input Pengeluaran Normal | Mutasi tersimpan ke sheet TRANSAKSI, form ter-reset, saldo dompet terpotong sesuai nominal. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-INP-02 | Input Kas | Input Pemasukan Normal | Mutasi tersimpan bertipe Income, saldo dompet tujuan bertambah, laporan bulanan ter-update. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-INP-03 | Input Kas | Pintasan Habit Chip | Satu ketukan pada chip mengisi nominal, kategori, dan catatan secara presisi tanpa salah ketik. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-INP-04 | Input Kas | Format Ribuan Otomatis | Mengetik 150000 otomatis memunculkan titik pemisah ribuan 150.000 realtime. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-INP-05 | Input Kas | Input Tanggal Kustom | Transaksi bertanggal lampau tersimpan persis sesuai tanggal input, bukan tanggal hari ini. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |

### Modul B: Perhitungan Saldo & Akuntansi Kas

| Test ID | Modul | Fitur & Skenario | Expected Result | Actual Result | Status | PIC | Tanggal Uji | Catatan / Evidence |
|---|---|---|---|---|---|---|---|---|
| TC-BAL-01 | Akuntansi | Kalkulasi Net Worth | Total Kekayaan Bersih sama dengan total saldo seluruh dompet aktif yang dijumlahkan. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-BAL-02 | Akuntansi | Isolasi Saldo Awal Dompet | Nilai Saldo Awal menambah Net Worth tanpa menggelembungkan total pemasukan bulanan berjalan. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-BAL-03 | Akuntansi | Mutasi Transfer Antar Dompet | Dompet asal terpotong, dompet tujuan bertambah, Net Worth stabil, tidak dihitung belanja. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-BAL-04 | Akuntansi | Koreksi Transaksi (Edit) | Mengubah nominal/dompet membatalkan dampak mutasi lama dan menerapkan mutasi baru. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-BAL-05 | Akuntansi | Hapus Transaksi (Rollback) | Menghapus mutasi mengembalikan saldo dompet asal secara presisi ke posisi semula. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |

### Modul C: Ringkasan & Siklus Waktu (Harian & Bulanan)

| Test ID | Modul | Fitur & Skenario | Expected Result | Actual Result | Status | PIC | Tanggal Uji | Catatan / Evidence |
|---|---|---|---|---|---|---|---|---|
| TC-SUM-01 | Ringkasan | Arus Kas Bulan Aktif | Kartu Bulan Ini menghitung hanya transaksi yang terjadi di dalam periode bulan aktif berjalan. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-SUM-02 | Ringkasan | Arus Kas Hari Ini | Kartu Hari Ini di dashboard hanya menampilkan total mutasi dengan tanggal sistem saat ini. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-SUM-03 | Ringkasan | Pemilih Bulan (Selector) | Memilih bulan pada Buku Kas menyajikan rekapitulasi masuk, keluar, dan sisa kas bulan terkait. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-SUM-04 | Ringkasan | Subtotal Harian | Setiap grup tanggal di Buku Kas menampilkan subtotal penerimaan dan pengeluaran per hari. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |

### Modul D: Visualisasi & Grafik Dashboard

| Test ID | Modul | Fitur & Skenario | Expected Result | Actual Result | Status | PIC | Tanggal Uji | Catatan / Evidence |
|---|---|---|---|---|---|---|---|---|
| TC-DSH-01 | Visual | Diagram Donut Belanja | Proporsi alokasi belanja kategori terhitung dalam persentase yang valid total 100%. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-DSH-02 | Visual | Diagram Sebaran Dompet | Proporsi likuiditas saldo kas tunai, bank, dan e-wallet digambarkan secara proporsional. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-DSH-03 | Visual | Progress Anggaran Belanja | Indikator rasio anggaran (Spent / Limit) * 100 tampil akurat tanpa tulisan undefined%. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-DSH-04 | Visual | Status Batas Overbudget | Kategori belanja yang melampaui limit anggaran otomatis berubah menjadi indikator batas merah. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |

### Modul E: Validasi & Integritas Data

| Test ID | Modul | Fitur & Skenario | Expected Result | Actual Result | Status | PIC | Tanggal Uji | Catatan / Evidence |
|---|---|---|---|---|---|---|---|---|
| TC-VAL-01 | Validasi | Nominal Kosong atau Nol | Menolak simpan transaksi bernilai <= 0 dengan pesan Nominal transaksi harus lebih dari 0. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-VAL-02 | Validasi | Dompet Asal Kosong | Menolak simpan tanpa pemilihan dompet dengan pesan Kantong dompet wajib dipilih. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-VAL-03 | Validasi | Transfer Dompet Sama | Menolak transfer ke rekening yang sama: Rekening asal dan tujuan tidak boleh sama. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-VAL-04 | Validasi | Transfer Tujuan Kosong | Menolak transfer tanpa tujuan: Rekening tujuan wajib dipilih untuk transfer kas. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-VAL-05 | Validasi | Tambah Dompet Tanpa Nama | Menolak pembuatan dompet baru tanpa nama: Nama dompet wajib diisi. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-VAL-06 | Validasi | Hapus Dompet Bersaldo | Memblokir hapus dompet bersaldo > 0 dan meminta pemindahan dana terlebih dahulu. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |
| TC-VAL-07 | Validasi | Soft Delete Dompet Riwayat | Dompet bersaldo 0 yang memiliki riwayat mutasi lampau ditandai status Aktif = false. | [Kosong] | PENDING | Finance | [Kosong] | [Kosong] |

### Modul F: Verifikasi Salinan Template (Post-Copy Verification)

| Test ID | Modul | Fitur & Skenario | Expected Result | Actual Result | Status | PIC | Tanggal Uji | Catatan / Evidence |
|---|---|---|---|---|---|---|---|---|
| TC-CPY-01 | Distribusi | Akses Link Trik /copy | Tautan /copy menampilkan laman resmi konfirmasi Google Make a copy tanpa perlu izin akses. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-CPY-02 | Distribusi | Isolasi Berkas Pembeli | Berkas tersimpan di Google Drive pembeli; perubahan tidak berdampak pada Master Template. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-CPY-03 | Distribusi | Kemunculan Menu Toolbar | Menu bar [ Finance Tracker ] muncul otomatis di toolbar atas spreadsheet (< 5 detik). | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-CPY-04 | Distribusi | Otorisasi Script Pengguna | Dialog otorisasi keamanan Google berjalan mulus melalui opsi Advanced > Go to Finance Tracker. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-CPY-05 | Distribusi | Inisialisasi Otomatis Sheet | Berkas otomatis membentuk tab DASHBOARD, TRANSAKSI, DOMPET, KATEGORI, ANGGARAN terformat rapi. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-CPY-06 | Distribusi | Deploy Web App Mandiri | Pembeli dapat men-deploy Web App pribadi dan mengaksesnya lancar via browser ponsel. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |
| TC-CPY-07 | Distribusi | Pasang ke Layar HP (PWA) | Add to Home Screen menghasilkan shortcut mandiri berlayar penuh tanpa bilah URL peramban. | [Kosong] | PENDING | Operations | [Kosong] | [Kosong] |

---

## 3. Instruksi Pelaksanaan Pengujian

1. Unduh berkas [`02_PRODUCT_TESTING_CHECKLIST.xlsx`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.xlsx).
2. Unggah ke Google Sheets (`File > Open > Upload`).
3. Jalankan pengujian Fase 1 (Internal QA) sesuai SOP di [`02_PANDUAN_PENGUJIAN_PRODUK.md`](file:///J:/Aplikasi/finance-template/docs/02_PANDUAN_PENGUJIAN_PRODUK.md).
4. Setelah seluruh 26 butir lulus (**PASS**), lakukan pengujian Fase 2 bersama 3–5 orang perwakilan pengguna nyata (*pilot users*).
5. Isi tanggal verifikasi dan tanda tangani lembar persetujuan sign-off sebelum produk dipublikasikan untuk penjualan komersial.
