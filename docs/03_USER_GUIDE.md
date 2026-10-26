# Panduan Pengguna (User Guide)
## Finance Tracker — Personal & Business Edition

**Tipe Dokumen**: Panduan Pengguna & Serah Terima Pembeli (Edisi Rilis Perdana)  
**Format Target**: PDF (Tata Letak Standar 4 Halaman Siap Cetak / Print-Ready)  
**Divisi Penanggung Jawab (PIC)**: Operations  
**Versi Berkas**: 1.7.5  

---

<!-- ======================================================================= -->
<!-- HALAMAN 1 DARI 4                                                        -->
<!-- ======================================================================= -->

### Dokumen: Finance Tracker User Guide | Halaman 1 dari 4 | Pengenalan & Duplikasi

## 1. Selamat Datang di Finance Tracker

Selamat atas kepemilikan template **Finance Tracker**. Sistem ini memadukan kekuatan Google Sheets dengan kemudahan aplikasi web mobile (PWA), memungkinkan Anda mencatat mutasi kas secepat kilat tanpa biaya langganan bulanan (*zero-subscription*).

### Nilai Utama Produk:
- **Privasi Terjamin 100%**: Berkas tersimpan di Google Drive pribadi Anda, bukan di server asing.
- **Akses Fleksibel**: Buka dari layar smartphone (*Add to Home Screen*) maupun dari menu toolbar Google Sheets komputer Anda.
- **Multi-Dompet & Saldo Awal**: Tabungan awal tercatat sebagai aset tanpa merusak laporan pemasukan bulanan berjalan.

---

## 2. Cara Membuat Salinan Template ke Google Drive Pribadi

Untuk menggunakan template, Anda cukup menduplikasi berkas Master Template ke akun Google Drive Anda dalam satu langkah mudah.

### Langkah-langkah:
1. Pastikan Anda telah masuk (*login*) ke akun Google Anda di peramban komputer/laptop.
2. Buka tautan akses template resmi yang Anda terima saat pembelian:  
   `https://docs.google.com/spreadsheets/d/.../copy`
3. Peramban akan secara otomatis membuka jendela konfirmasi resmi dari Google:  
   **"Salin dokumen — Apakah Anda ingin membuat salinan dari Finance Tracker?"**
4. Klik tombol biru besar bertuliskan **"Buat salinan"** (*Make a copy*).
5. Google Spreadsheet beserta seluruh sistem skrip aplikasinya akan diduplikasi secara utuh ke Google Drive Anda.
6. Berkas baru ini sekarang sepenuhnya menjadi milik pribadi Anda. Anda dapat mengubah nama berkas sesuai preferensi (misal: *Keuangan Keluarga 2026*).

```text
+-----------------------------------------------------------------------------------+
| TANGKAPAN LAYAR 01: HALAMAN DUPLIKASI GOOGLE SHEETS                               |
| Lokasi: Jendela browser saat mengakses tautan /copy                               |
| Dimensi Rekomendasi: 16:9 | Resolusi: 1920x1080                                  |
|                                                                                   |
|  [ Logo Google Sheets ]                                                          |
|  Salin dokumen                                                                    |
|  Apakah Anda ingin membuat salinan dari Finance Tracker - Master?                 |
|                                                                                   |
|                             [  Buat salinan  ]                                    |
+-----------------------------------------------------------------------------------+
```

--- [BATAS HALAMAN / PAGE BREAK — HALAMAN 1 SELESAI] ---

<!-- ======================================================================= -->
<!-- HALAMAN 2 DARI 4                                                        -->
<!-- ======================================================================= -->

### Dokumen: Finance Tracker User Guide | Halaman 2 dari 4 | Otorisasi & Setup Awal

## 3. Otorisasi Keamanan Google Apps Script (Hanya 1 Kali)

Saat pertama kali membuka menu aplikasi di Google Sheets, Google mewajibkan konfirmasi otorisasi izin keamanan. Ini adalah prosedur resmi dan aman untuk memastikan skrip hanya berjalan di akun Anda sendiri.

### Panduan Otorisasi Langkah demi Langkah:
1. Di tab Google Sheets Anda, segarkan halaman (*refresh* / F5).
2. Tunggu 5 detik hingga muncul menu baru di bilah menu atas: **`[ Finance Tracker ]`**.
3. Klik menu **`[ Finance Tracker ]`** > pilih **"Buka di Panel Samping (Sidebar)"**.
4. Muncul kotak dialog bertuliskan *"Authorization Required"*, klik **"Continue"** (*Lanjutkan*).
5. Pilih akun Google Anda.
6. Saat muncul peringatan *"Google hasn't verified this app"*, klik tautan kecil di kiri bawah: **"Advanced"** (*Lanjutan*).
7. Klik baris tulisan: **"Go to Finance Tracker (unsafe)"** (*Buka Finance Tracker*).
8. Gulir ke bawah lalu klik tombol **"Allow"** (*Izinkan*).
9. Aplikasi akan terbuka, dan struktur lembar kerja (`DASHBOARD`, `TRANSAKSI`, `DOMPET`, `KATEGORI`, `ANGGARAN`) akan otomatis terbentuk rapi.

```text
+-----------------------------------------------------------------------------------+
| TANGKAPAN LAYAR 02: ALUR OTORISASI KEAMANAN APPS SCRIPT                           |
| Lokasi: Jendela modal Google OAuth Consent Screen                                 |
| Dimensi Rekomendasi: 16:9 | Fokus: Klik 'Advanced' lalu 'Go to Finance Tracker'  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Pengaturan Awal (Setup 5 Menit)

Sebelum mulai mencatat, lakukan penyesuaian awal pada dompet dan anggaran Anda:

### A. Mengatur Kantong Dompet & Saldo Awal
Buka tab **Dompet** pada antarmuka aplikasi:
1. Telah tersedia dompet standar: *Dompet Tunai*, *BCA Tabungan*, dan *GoPay*.
2. Tekan **"Tambah Dompet"** untuk menambah rekening lain (misal: *Mandiri*, *OVO*, atau *ShopeePay*).
3. Masukkan **Saldo Awal**: Jumlah riil uang di rekening tersebut saat ini. Saldo awal ini otomatis menjadi modal awal di Kekayaan Bersih (*Net Worth*) tanpa mengotori laporan pemasukan bulanan berjalan.

### B. Menetapkan Batas Anggaran Berulang (Recurring Budgets)
1. Buka tab **Anggaran**.
2. Tentukan kategori belanja (misal: *Makan & Minum*) dan tetapkan batas maksimal nominal bulanan (misal: *Rp 1.500.000*).
3. Anggaran ini bersifat **Recurring** (berulang otomatis setiap awal bulan baru tanpa perlu diatur ulang).

```text
+-----------------------------------------------------------------------------------+
| TANGKAPAN LAYAR 03: PENGATURAN DOMPET & ANGGARAN                                  |
| Lokasi: Tab Dompet & Anggaran pada antarmuka aplikasi                             |
| Menampilkan: Form Saldo Awal Dompet dan Batang Batas Anggaran Kategori            |
+-----------------------------------------------------------------------------------+
```

--- [BATAS HALAMAN / PAGE BREAK — HALAMAN 2 SELESAI] ---

<!-- ======================================================================= -->
<!-- HALAMAN 3 DARI 4                                                        -->
<!-- ======================================================================= -->

### Dokumen: Finance Tracker User Guide | Halaman 3 dari 4 | Transaksi & Dashboard

## 5. Cara Memasukkan Transaksi

Formulir transaksi dirancang sederhana dengan tiga tab utama:

```text
+-----------------------------------------------------------------------------------+
| FORM PENCATATAN MUTASI                                                            |
| [ Pengeluaran ]              [ Pemasukan ]               [ Transfer ]             |
|                                                                                   |
| Nominal : [ 45.000                                           ] (Format Otomatis)  |
| Kategori: [ Makan & Minum                                    ]                    |
| Dompet  : [ Dompet Tunai                                     ]                    |
| Catatan : [ Makan Siang Kantor                               ]                    |
|                                                                                   |
| SMART HABIT CHIPS: [ Bensin Rp 50.000 ] [ Kopi Rp 25.000 ] [ Makan Rp 35.000 ]   |
|                                                                                   |
|                            [ SIMPAN TRANSAKSI ]                                   |
+-----------------------------------------------------------------------------------+
```

1. **Pengeluaran**: Pilih tab Pengeluaran, isi nominal (titik ribuan muncul otomatis), pilih kategori dan dompet pemotong, lalu klik Simpan.
2. **Pemasukan**: Pilih tab Pemasukan, isi nominal gaji/omzet, pilih dompet penerima, lalu klik Simpan. Saldo dompet akan langsung bertambah.
3. **Transfer Kas Antar Dompet**: Gunakan saat tarik tunai ATM atau top-up dompet digital. Saldo dompet asal berkurang dan saldo dompet tujuan bertambah tanpa dihitung sebagai belanja pengeluaran.
4. **Smart Habit Chips (1-Ketuk)**: Ketuk tombol cepat di bawah formulir untuk mengisi nominal, kategori, dan catatan secara seketika untuk rutinitas harian.

---

## 6. Cara Membaca Dashboard & Buku Kas

```text
+-----------------------------------------------------------------------------------+
| TANGKAPAN LAYAR 04: DASHBOARD UTAMA & BUKU KAS                                    |
| Menampilkan: Kartu Net Worth, Arus Kas Bulan Ini, Donut Chart, & Rekap Harian    |
+-----------------------------------------------------------------------------------+
```

### A. Indikator Dashboard Utama
- **Total Saldo (Kekayaan Bersih)**: Posisi likuiditas uang nyata Anda saat ini dari gabungan seluruh dompet aktif.
- **Arus Kas Hari Ini & Bulan Ini**: Membandingkan total uang masuk vs keluar serta sisa kas bersih (*Net Savings*).
- **Progress Anggaran Belanja**: Bar indikator persentase konsumsi limit. Indikator berubah menjadi penanda merah (*Overbudget*) jika Anda melewati batas limit.

### B. Buku Kas (Tiga Tampilan)
- **Tampilan Harian**: Mengelompokkan mutasi per tanggal lengkap dengan subtotal pengeluaran/pemasukan harian.
- **Tampilan Bulanan**: Kartu evaluasi ringkasan kas per bulan dengan pemilih bulan dinamis (*Month Selector*).
- **Tampilan Statistik**: Diagram donat proporsi belanja per pos kategori dan diversifikasi aset kas.

### C. Koreksi Transaksi (Edit & Hapus)
Salah memasukkan nominal atau salah memilih rekening? Cari transaksi di Buku Kas, lalu klik tombol **Edit** (ubah data) atau tombol **Hapus** (batalkan transaksi). Saldo dompet akan dihitung ulang secara otomatis.

--- [BATAS HALAMAN / PAGE BREAK — HALAMAN 3 SELESAI] ---

<!-- ======================================================================= -->
<!-- HALAMAN 4 DARI 4                                                        -->
<!-- ======================================================================= -->

### Dokumen: Finance Tracker User Guide | Halaman 4 dari 4 | PWA Smartphone & Bantuan

## 7. Memasang di Layar Utama Smartphone (Add to Home Screen)

Akses Finance Tracker di smartphone layaknya aplikasi native tanpa perlu membuka laptop:

### Langkah 1: Buat Tautan Web App Pribadi
1. Buka spreadsheet Finance Tracker Anda di komputer.
2. Klik **Ekstensi** > **Apps Script**.
3. Di pojok kanan atas, klik **Deploy** > **New deployment** > pilih jenis **Web app**.
4. Konfigurasikan: Execute as = *User accessing the web app*, Who has access = *Anyone with Google account*.
5. Klik **Deploy** dan salin URL Web App yang dihasilkan. Kirimkan tautan tersebut ke smartphone Anda.

### Langkah 2: Pasang di Layar Utama HP
- **Pengguna iPhone (Safari)**: Buka tautan URL di Safari > ketuk tombol **Share** (kotak panah ke atas) > pilih **"Add to Home Screen"** (*Tambah ke Layar Utama*).
- **Pengguna Android (Chrome)**: Buka tautan URL di Chrome > ketuk **Menu Titik Tiga** di pojok kanan atas > pilih **"Add to Home screen"** / **"Install app"**.

```text
+-----------------------------------------------------------------------------------+
| TANGKAPAN LAYAR 05: PEMASANGAN DI SMARTPHONE                                      |
| Menampilkan: Tampilan Ikon PWA di Home Screen iPhone dan Android                  |
+-----------------------------------------------------------------------------------+
```

---

## 8. Solusi Masalah Umum (Troubleshooting FAQ)

| Gejala Kendala | Penyebab Umum | Langkah Solusi Cepat |
|---|---|---|
| Menu `[ Finance Tracker ]` tidak muncul di Google Sheets. | Pemuatan skrip sedang berjalan atau dibuka di aplikasi mobile Google Sheets. | Buka lewat peramban komputer/laptop dan lakukan refresh halaman (F5). Tunggu 5 detik hingga skrip siap. |
| Muncul pesan "Authorization Required" berulang kali. | Ada lebih dari 1 akun Google aktif di jendela browser yang sama. | Gunakan jendela **Incognito / Private Browsing**, masuk hanya dengan satu akun Google pemilik file, lalu otorisasi ulang. |
| Tombol "Hapus Dompet" menampilkan galat. | Dompet masih memiliki sisa saldo kas (> 0). | Pindahkan sisa saldo melalui menu **Transfer** hingga bersaldo 0 sebelum menghapusnya. |
| Rumus spreadsheet terhapus tidak sengaja. | Sel formula tertekan atau terhapus manual. | Buka menu **File** > **Version history** > **See version history**, lalu pilih versi sebelum terhapus dan pulihkan (*Restore*). |

---

## 9. Kontak Bantuan & Formulir Masukan Pengguna (Feedback)

Sebagai produk edisi rilis perdana yang baru selesai dikembangkan, tim Operations sangat terbuka menerima saran dan laporan kendala dari pengguna:
- **Surel Bantuan**: `support@financetracker.local` (atau surel resmi toko penyedia)
- **Layanan Pesan Instan**: WhatsApp Layanan Pelanggan (tertera di bukti pembayaran Lynk.id / Mayar)
- **Kanal Masukan & Saran Fitur**: Tautan formulir evaluasi pengguna (*User Feedback Form*)
- **Jam Layanan Operasional**: Senin – Jumat, pukul 09:00 – 17:00 WIB
- **Komitmen Waktu Tanggap**: Maksimal 1 x 24 jam kerja

*Hak Cipta 2026 Finance Tracker Operations Team. Seluruh hak dilindungi undang-undang.*
