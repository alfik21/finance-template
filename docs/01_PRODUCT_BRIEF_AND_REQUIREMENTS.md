# Product Brief & Requirements: Finance Tracker (Container-Bound Edition)

**Tipe Dokumen**: Dokumen Spesifikasi Produk & Perencanaan Pengembangan  
**Format Target**: Google Docs  
**Divisi Penanggung Jawab (PIC)**: Operations  
**Fase Siklus Produk**: Baru Selesai Pengembangan (Fresh Build) — Menuju Tahap Pengujian Internal & Pengguna Asli  

---

## Tabel Kontrol Dokumen

| Parameter | Keterangan |
|---|---|
| ID Dokumen | DOC-OPS-PBR-2026-001 |
| Judul Dokumen | Product Brief & Functional Requirements — Finance Tracker |
| Edisi Produk | Container-Bound Web App & Spreadsheet Edition |
| Versi Rilis | 1.7.5 (Build Perdana Pasca-Pengembangan) |
| Tanggal Efektif | 26 Oktober 2026 |
| Klasifikasi Akses | Internal — Terbatas (Internal Confidential) |
| Penanggung Jawab (PIC) | Operations Team |
| Tim Peninjau (Reviewer) | Finance Team, Product Lead |
| Status Dokumen | Selesai Pengembangan — Menunggu Pengujian QA & Pengguna Asli (Awaiting QA & UAT) |

---

## Ringkasan Eksekutif (Executive Summary)

Finance Tracker adalah produk pencatatan keuangan pribadi dan usaha kecil berbasis Google Apps Script Web App yang terikat langsung di dalam Google Sheets (*container-bound*). 

Sistem ini **baru saja selesai dibangun dan dikembangkan (*freshly developed*)** oleh tim pengembang. Sebelum produk dibuka untuk penjualan komersial publik, produk wajib melalui dua tahapan verifikasi kritis:
1. **Pengujian Kendali Mutu Internal (Internal QA)**: Memastikan tidak ada galat rumus, rekonsiliasi saldo akurat, dan validasi data berfungsi normal.
2. **Pengujian Pengguna Asli (*Pilot User Testing / UAT*)**: Menguji antarmuka, pemahaman instruksi, dan kemudahan pengoperasian oleh calon pengguna riil pertama kali.

---

## 1. Identitas dan Deskripsi Produk

### 1.1. Nama Produk
- **Nama Komersial**: Finance Tracker (Personal & Business Edition)
- **Nama Teknis Repositori**: `finance-template`

### 1.2. Deskripsi Konseptual
Aplikasi web pencatatan keuangan berbasis peramban (PWA) yang tertanam di dalam spreadsheet pengguna. Menghilangkan kebutuhan instalasi aplikasi dari Play Store/App Store dengan 3 mode akses:
1. **Mode Smartphone (PWA)**: Berjalan mandiri di layar utama ponsel (*Add to Home Screen*) melalui peramban Safari (iOS) atau Chrome (Android).
2. **Mode Panel Samping (Sidebar)**: Panel antarmuka selebar 380px di sisi kanan Google Sheets untuk pencatatan sambil memantau baris data.
3. **Mode Jendela Dialog (Modal Dialog)**: Antarmuka terpusat berukuran 980x680px di Google Sheets untuk evaluasi bulanan yang leluasa.

---

## 2. Profil Target Pengguna Asli (Target Pilot & End Users)

Profil pengguna yang ditargetkan untuk pengujian awal dan penjualan komersial:

### 2.1. Pekerja Lepas & Profesional Mandiri (Freelancers)
- **Karakteristik**: Arus kas masuk tidak teratur dari berbagai klien, memiliki banyak rekening (Bank BCA, Mandiri, e-wallet GoPay/OVO).
- **Fokus Uji Coba**: Kemudahan melacak saldo kas nyata (*Net Worth*) di banyak kantong dompet dan fitur pemindahan dana antar-rekening (*Transfer*).

### 2.2. Pemilik Usaha Mikro, Kecil, dan Menengah (UMKM)
- **Karakteristik**: Mengelola arus kas harian tanpa software akuntansi berbayar mahal.
- **Fokus Uji Coba**: Kemudahan pencatatan omzet harian dan pemisahan belanja modal vs belanja operasional.

### 2.3. Pengguna Sadar Privasi Data Finansial
- **Karakteristik**: Tidak ingin data mutasi bank tersimpan di server pihak ketiga yang berisiko bocor atau dijual.
- **Fokus Uji Coba**: Keamanan Google Drive pribadi dan independensi sistem tanpa ketergantungan server startup luar.

### 2.4. Pengguna Spreadsheet yang Membutuhkan Kecepatan di Ponsel
- **Karakteristik**: Terbiasa memakai rumus Excel/Google Sheets, namun lelah mengisi baris sel kecil di layar sentuh ponsel.
- **Fokus Uji Coba**: Responsivitas form mobile dan tombol pintas 1-ketukan (*Smart Habit Chips*).

---

## 3. Masalah yang Ingin Diselesaikan

| Masalah Pengguna Saat Ini | Solusi yang Selesai Dikembangkan |
|---|---|
| **Subscription Fatigue**: Beban biaya langganan bulanan software keuangan (Rp 30.000 – Rp 99.000/bulan). | Skema sekali beli untuk penggunaan seumur hidup (*zero-subscription*) tanpa biaya server bulanan. |
| **Privasi Terancam**: Kekhawatiran data keuangan diunggah ke server startup asing yang rawan kebocoran. | 100% kepemilikan data berada di Google Drive pribadi pengguna. |
| **Entri Ponsel Lambat**: Mengetik baris sel di aplikasi Google Sheets mobile memakan waktu dan rawan merusak rumus. | Antarmuka Web App mobile yang cepat dengan format ribuan otomatis dan tombol cepat 1-ketuk (*Habit Chips*). |
| **Kekacauan Saldo Akibat Transfer**: Pindah dana antar rekening sering salah tercatat sebagai belanja/pengeluaran baru. | Modul transfer kas khusus yang memotong rekening asal dan menambah rekening tujuan tanpa mempengaruhi laporan belanja bulanan. |
| **Pengeluaran Boncos Tanpa Sadar**: Ketiadaan alarm visual saat pengeluaran mendekati batas anggaran bulanan. | Modul Anggaran Berulang (*Recurring Budgets*) dengan auto-reset bulanan dan indikator merah jika melebihi batas (*Overbudget*). |

---

## 4. Daftar Fitur yang Telah Selesai Dikembangkan

1. **Antarmuka Sage Green Utilitarian**: Tipografi *Plus Jakarta Sans* dan angka tabular *JetBrains Mono*, kontras tinggi, bebas emotikon/emoji (*Zero-Emoji Policy*).
2. **Kantong Saldo Multi-Akun & Saldo Awal**: Mendukung Tunai, Bank, dan E-Wallet. Saldo awal tabungan langsung tercatat di Kekayaan Bersih (*Net Worth*) tanpa mengotori arus kas masuk bulan berjalan.
3. **Mesin Rekonsiliasi Mutasi**: Koreksi transaksi (*Edit & Delete*) dengan pembatalan dampak mutasi lama dan penerapan mutasi baru secara otomatis (*reverse-and-apply*).
4. **Buku Kas 3 Tampilan**: Tampilan Harian (subtotal per hari), Tampilan Bulanan (kartu ringkasan kas & selector bulan), dan Tampilan Statistik (visual donat alokasi pengeluaran).
5. **Format Rupiah Otomatis Realtime**: Input nominal otomatis memformat titik pemisah ribuan saat diketik.
6. **Otomasi Database (SetupService)**: Pembentukan otomatis 5 tab sheet standar (`DASHBOARD`, `TRANSAKSI`, `DOMPET`, `KATEGORI`, `ANGGARAN`).

---

## 5. Batasan Produk (Product Scope & Constraints)

1. **Ketergantungan Ekosistem Google**: Berjalan di atas Google Sheets & Google Apps Script; tidak dapat dijalankan secara luring murni di software Microsoft Excel (.xlsx biasa).
2. **Kebutuhan Koneksi Internet**: Penyimpanan data mutasi membutuhkan koneksi internet aktif untuk menulis ke Google Spreadsheet awan.
3. **Mata Uang Tunggal**: Dikonfigurasi untuk format mata uang Rupiah Indonesia (IDR).
4. **Metode Kas Tunggal**: Menggunakan pencatatan kas nyata (*single-entry cash basis*), bukan sistem akuntansi berpasangan murni (*double-entry accrual*).

---

## 6. Rencana Tahapan Rilis (Product Release Roadmap)

```text
+-----------------------+      +-----------------------+      +-----------------------+
| Tahap 1: PENGEMBANGAN | ---> | Tahap 2: PENGUJIAN    | ---> | Tahap 3: PELUNCURAN   |
| Status: SELESAI       |      | Status: SEDANG JALAN  |      | Status: MENDATANG     |
|                       |      |                       |      |                       |
| - Koding Backend      |      | - Internal QA Testing |      | - Buka Toko Digital   |
| - Koding Frontend PWA |      | - UAT Pengguna Asli   |      | - Distribusi Link     |
| - Test Otomatis E2E   |      | - Evaluasi Feedback   |      | - Kampanye Promosi    |
+-----------------------+      +-----------------------+      +-----------------------+
```

---

## 7. Model Penetapan Harga Target Sementara (Provisional Pricing)

| Parameter | Ketetapan Target Sementara |
|---|---|
| Model Lisensi | Pembelian Lisensi Tunggal Digital (Seumur Hidup) |
| Harga Referensi Normal (MSRP) | Rp 99.000 |
| Target Harga Jual Reguler | Rp 79.000 |
| Target Harga Promosi Peluncuran (Early Bird) | Rp 49.000 |
| Saluran Penjualan Rencana | Lynk.id, Mayar.id, Gumroad, Shopee Produk Digital |

---

## 8. Persetujuan Kesiapan Memasuki Tahap Pengujian

Dokumen ini menyatakan bahwa tahap pengembangan kode telah rampung dan produk siap dilanjutkan ke tahap pengujian mutu internal serta pengujian pengguna asli:

| Peran | Penanggung Jawab | Tanggal | Status Keputusan |
|---|---|---|---|
| Lead Developer | Engineering Team | 26 Oktober 2026 | Kode Siap Diuji (Code Freeze) |
| Operasional | Operations Team | 26 Oktober 2026 | Siap Masuk Tahap QA & UAT |
| Keuangan | Finance Team | 26 Oktober 2026 | Siap Verifikasi Rumus |
