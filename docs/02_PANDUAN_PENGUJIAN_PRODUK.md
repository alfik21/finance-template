# Panduan & Prosedur Pengujian Produk (Product Testing Guide)
## Finance Tracker — Personal & Business Edition

**Tipe Dokumen**: Standar Operasional Prosedur (SOP) Pengujian Mutu  
**Format Target**: Google Docs / PDF  
**Divisi Penanggung Jawab (PIC)**: Finance + Operations  
**Konteks Produk**: Produk Baru Selesai Dikembangkan (Fresh Development) — Belum Diuji oleh Pengguna Asli  
**Versi Berkas**: 1.7.5  
**Tanggal Berlaku**: 26 Oktober 2026  
**Berkas Lembar Uji Terkait**:
- Workbook Template Kosong (.xlsx): [`docs/02_PRODUCT_TESTING_CHECKLIST.xlsx`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.xlsx)
- Spesifikasi Lembar Uji Markdown: [`docs/02_PRODUCT_TESTING_CHECKLIST.md`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.md)

---

## 1. Latar Belakang dan Tujuan Pengujian

Produk Finance Tracker ini **baru saja selesai dibangun dan selesai dikembangkan pada tingkat kode (*code freeze*)**. Seluruh fitur utama (Web App PWA, perhitungan multi-dompet, mutasi transfer, anggaran berulang, dan tombol cepat habit chip) telah selesai dikoding, **namun belum pernah diuji coba oleh pengguna nyata (*real end-users*)**.

Oleh karena itu, dokumen ini menetapkan kerangka kerja pengujian bertahap:
1. **Fase 1: Verifikasi Fungsional Internal (Internal QA)**: Dilakukan oleh tim internal **Finance** dan **Operations** untuk memverifikasi 26 kasus uji teknis.
2. **Fase 2: Pengujian Penerimaan Pengguna Asli (User Acceptance Testing / UAT)**: Dilakukan bersama 3–5 orang perwakilan pengguna nyata (pekerja lepas / pemilik UMKM) untuk mengamati kendala navigasi, kebingungan bahasa, atau hambatan saat pertama kali membuka template.

---

## 2. Struktur Pengujian Dua Fase

```text
+---------------------------------------------------------------------------------+
| TAHAP 1: PENGUJIAN INTERNAL QA (FINANCE + OPERATIONS)                           |
| - Verifikasi 26 Butir Matriks Uji Fungsional                                   |
| - Uji Stabilitas Rumus & Saldo di Google Sheets                                |
| - Uji Alur Otorisasi Script & Error Handling                                   |
+---------------------------------------------------------------------------------+
                                      |
                                      v (Jika Lulus 100%)
+---------------------------------------------------------------------------------+
| TAHAP 2: PENGUJIAN PENGGUNA ASLI / PILOT USER TESTING (UAT)                     |
| - Libatkan 3-5 Calon Pengguna Riil (Freelancer & Pemilik UMKM)                 |
| - Pengguna Mencoba Mandiri: Akses Link /copy > Otorisasi > Catat Transaksi     |
| - Pengumpulan Masukan (Feedback) Kenyamanan & Keterbacaan Bahasa               |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| KEPUTUSAN RILIS KOMERSIAL: PRODUK LAYAK JUAL (READY TO SELL)                   |
+---------------------------------------------------------------------------------+
```

---

## 3. Persiapan Lingkungan Uji Bersih (Clean Test Environment)

Karena produk belum pernah disentuh oleh pengguna asli, pengujian wajib disimulasikan dari sudut pandang pengguna awam:

1. **Gunakan Akun Google Uji Baru**:  
   Jangan gunakan akun Google yang memiliki akses developer ke repositori. Gunakan akun Gmail biasa yang belum pernah memberi izin pada skrip ini.
2. **Uji Salinan Mandiri via Link `/copy`**:  
   Buka tautan master berakhiran `/copy`. Pastikan muncul dialog Google resmi: *"Apakah Anda ingin membuat salinan dari Finance Tracker?"*.
3. **Simulasi Akses Smartphone**:  
   Penguji wajib menguji alur instalasi Web App pada perangkat smartphone fisik (iPhone via Safari dan Android via Chrome), bukan hanya simulator inspect browser di laptop.

---

## 4. Klasifikasi Tingkat Keparahan Bug (Severity Levels)

Jika ditemukan anomali atau kebingungan pengguna selama proses uji:

| Tingkat Keparahan | Kriteria | Tindakan Operasional |
|---|---|---|
| **Critical (Blocker)** | Rumus spreadsheet rusak, saldo tidak sesuai, aplikasi tidak mau terbuka, atau otorisasi gagal total. | Rilis DIBLOKIR. Pengembang wajib memperbaiki sebelum lanjut ke UAT. |
| **High (Major)** | Fitur transfer gagal, validasi data tembus (misal angka 0 tersimpan), atau tombol PWA di ponsel macet. | Wajib diperbaiki dan diuji ulang. |
| **Medium (Minor)** | Teks label membingungkan pengguna awam, format titik ribuan terlambat muncul, atau tata letak geser di layar kecil. | Diperbaiki dalam siklus perbaikan rilis perdana. |
| **Low (Trivial)** | Saran perubahan warna, redaksi panduan kurang jelas, atau permintaan fitur tambahan baru. | Dicatat dalam dokumen masukan pengguna (*Product Backlog*). |

---

## 5. Prosedur Uji Fase 1: Matriks Fungsional Internal (26 Skenario)

Lakukan verifikasi pada lembar kerja kosong [`docs/02_PRODUCT_TESTING_CHECKLIST.xlsx`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.xlsx):

### A. Modul Input Transaksi Kas (PIC: Operations)
- **TC-INP-01**: Input pengeluaran normal. Pastikan saldo terpotong dan form ter-reset.
- **TC-INP-02**: Input pemasukan normal. Pastikan saldo bertambah dan laporan masuk ter-update.
- **TC-INP-03**: Satu ketukan pada Smart Habit Chip. Pastikan nominal dan kategori terisi otomatis.
- **TC-INP-04**: Format pemisah ribuan otomatis realtime saat mengetik angka nominal.
- **TC-INP-05**: Input mutasi dengan tanggal mundur/lampau. Pastikan tanggal tersimpan presisi.

### B. Modul Akuntansi Kas & Saldo (PIC: Finance)
- **TC-BAL-01**: Kalkulasi Kekayaan Bersih (*Net Worth*) mencerminkan akumulasi saldo seluruh dompet aktif.
- **TC-BAL-02**: Saldo Awal dompet baru masuk ke Net Worth tanpa menambah arus kas masuk bulan berjalan.
- **TC-BAL-03**: Mutasi Transfer Antar Dompet memotong dompet asal, menambah dompet tujuan, Net Worth tetap sama, dan tidak dihitung sebagai pengeluaran belanja.
- **TC-BAL-04**: Koreksi Edit Transaksi membatalkan efek transaksi lama dan menerapkan data baru (*reverse-and-apply*).
- **TC-BAL-05**: Hapus Transaksi me-rollback saldo dompet asal kembali ke nilai sebelum transaksi dicatat.

### C. Modul Ringkasan & Siklus Waktu (PIC: Finance + Operations)
- **TC-SUM-01**: Kartu Bulan Ini hanya menghitung mutasi yang jatuh di bulan aktif berjalan.
- **TC-SUM-02**: Kartu Hari Ini hanya menghitung mutasi yang bertanggal hari ini.
- **TC-SUM-03**: Pemilih bulan (*Month Selector*) di Buku Kas Bulanan dapat menampilkan rekapitulasi bulan lampau.
- **TC-SUM-04**: Tampilan Buku Kas Harian menyajikan subtotal kas masuk dan keluar per hari secara rapi.

### D. Modul Visualisasi & Grafik Dashboard (PIC: Operations + Finance)
- **TC-DSH-01**: Donut chart alokasi belanja kategori menghitung persentase proporsi secara valid (total 100%).
- **TC-DSH-02**: Donut chart sebaran dompet menggambarkan porsi likuiditas kas tunai vs bank vs e-wallet.
- **TC-DSH-03**: Bar progress anggaran kategori menghitung (Spent / Limit) * 100 tanpa tulisan `undefined%`.
- **TC-DSH-04**: Kategori yang belanjanya melewati limit otomatis berubah warna menjadi penanda batas merah (*Overbudget*).

### E. Modul Validasi & Keamanan Data (PIC: Operations + Finance)
- **TC-VAL-01**: Sistem menolak nominal transaksi <= 0 dengan pesan: *"Nominal transaksi harus lebih dari 0"*.
- **TC-VAL-02**: Sistem menolak penyimpanan transaksi tanpa kantong dompet terpilih.
- **TC-VAL-03**: Sistem menolak mutasi transfer jika rekening asal dan tujuan identik.
- **TC-VAL-04**: Sistem menolak mutasi transfer jika rekening tujuan belum dipilih.
- **TC-VAL-05**: Sistem menolak pembuatan dompet baru jika nama dompet dikosongkan.
- **TC-VAL-06**: Sistem memblokir penghapusan dompet yang masih memiliki sisa saldo kas (> 0).
- **TC-VAL-07**: Sistem menerapkan *soft-delete* (Aktif = false) jika dompet yang dihapus memiliki riwayat transaksi di masa lalu.

### F. Modul Verifikasi Salinan Template (PIC: Operations)
- **TC-CPY-01**: Tautan `/copy` membuka halaman resmi konfirmasi Google "Make a copy".
- **TC-CPY-02**: Berkas tersalin secara mandiri ke Google Drive pembeli tanpa merusak Master Template.
- **TC-CPY-03**: Menu toolbar `[ Finance Tracker ]` muncul dalam waktu < 5 detik setelah sheet dibuka.
- **TC-CPY-04**: Dialog otorisasi keamanan Google dapat diselesaikan dengan memilih *Advanced > Go to Finance Tracker*.
- **TC-CPY-05**: Kelima tab utama terformat sempurna saat pertama kali dibuka.
- **TC-CPY-06**: Pengguna dapat melakukan deployment Web App mandiri untuk smartphone.
- **TC-CPY-07**: Fitur *Add to Home Screen* menghasilkan ikon aplikasi mandiri di ponsel.

---

## 6. Prosedur Uji Fase 2: Pengujian Penerimaan Pengguna Asli (UAT)

Setelah seluruh 26 butir Fase 1 bertanda **PASS**, lanjutkan ke pengujian dengan pengguna nyata:

### A. Kriteria Pemilihan Partisipan Uji Coba:
- 1–2 orang pekerja lepas / profesional mandiri.
- 1–2 orang pemilik usaha mikro / gerai dagang kecil.
- 1 orang pengguna awam yang belum pernah menggunakan Google Apps Script.

### B. Skenario Tugas Pengguna Asli (Tanpa Bantuan Panduan Lisan):
1. **Tugas 1: Akses Awal**: Berikan tautan `/copy` kepada partisipan, amati apakah mereka berhasil menyalin dokumen ke Google Drive mereka sendiri.
2. **Tugas 2: Otorisasi Mandiri**: Amati apakah partisipan dapat melewati layar peringatan Google Apps Script dengan membaca panduan tertulis di [User Guide](file:///J:/Aplikasi/finance-template/docs/03_USER_GUIDE.md).
3. **Tugas 3: Pengaturan Dompet Pribadi**: Minta partisipan mendaftarkan 1 rekening bank riil dan memasukkan saldo awal mereka.
4. **Tugas 4: Catat Transaksi Nyata**: Minta partisipan mencatat 3 mutasi belanja terakhir mereka hari ini (misal: bensin, makan siang, isi pulsa) menggunakan form di HP.
5. **Tugas 5: Evaluasi Dashboard**: Minta partisipan membaca berapa total saldo mereka dan berapa sisa anggaran mereka bulan ini.

### C. Formulir Rekapitulasi Umpan Balik Pengguna Asli (UAT Feedback Form):

| Partisipan | Latar Belakang | Kendala yang Dihadapi | Kemudahan Otorisasi (1–5) | Kemudahan Input di HP (1–5) | Keputusan Pengguna |
|---|---|---|---|---|---|
| Tester 1 | Freelancer | [Catat kendala riil] | [Skor 1-5] | [Skor 1-5] | [Puas / Butuh Perbaikan] |
| Tester 2 | Pemilik Toko | [Catat kendala riil] | [Skor 1-5] | [Skor 1-5] | [Puas / Butuh Perbaikan] |
| Tester 3 | Pengguna Awam | [Catat kendala riil] | [Skor 1-5] | [Skor 1-5] | [Puas / Butuh Perbaikan] |

---

## 7. Syarat Ambang Batas Kelulusan Menuju Penjualan Komersial (Release Gate)

Produk Finance Tracker baru dinyatakan **SELESAI DIUJI & LAYAK JUAL (*READY TO SELL*)** apabila:
1. **Fase 1 (Internal QA)**: 26 dari 26 skenario fungsional berstatus **PASS** (100%).
2. **Fase 2 (User Testing)**: Minimal 80% partisipan pengguna asli menyatakan dapat mengoperasikan aplikasi secara mandiri tanpa bantuan teknis langsung.
3. **Nol Temuan Blocker**: Tidak ada bug berkategori *Critical* atau *High* yang belum terselesaikan.
4. **Persetujuan Akhir**: Lembar persetujuan (*Sign-Off*) ditandatangani oleh **PIC Operations**, **PIC Finance**, dan **Product Lead**.
