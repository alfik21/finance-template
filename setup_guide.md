# Panduan Lengkap: Menyiapkan, Mendistribusikan, & Menjual "Finance Tracker"

Dokumen ini disusun khusus bagi Anda sebagai **Kreator / Pemilik Produk** untuk:
1. Menyiapkan **Master Google Spreadsheet**.
2. Membagikan template ke pembeli menggunakan **Trik URL Duplikasi Otomatis (`/copy`)**.
3. Menghosting halaman **Interactive Showcase Demo** (`demo/`) secara gratis agar calon pembeli bisa mencoba sebelum membeli.
4. Memberikan instruksi serah terima yang rapi dan memuaskan bagi pembeli digital.

---

## 1. Nilai Jual Produk (Selling Points)

Mengapa template ini sangat diminati oleh target pasar pencatat keuangan pribadi dan UMKM?

1. **Sekali Bayar, Tanpa Biaya Berlangganan (Zero Subscription)**:
   - Aplikasi keuangan di Play Store / App Store umumnya membebankan langganan Rp 30.000 - Rp 99.000 setiap bulan.
   - Produk ini menawarkan kepemilikan seumur hidup tanpa tagihan berulang.
2. **Privasi 100% Terjamin di Google Drive Pribadi**:
   - Data finansial tidak masuk ke server startup pihak ketiga yang rawan ditutup atau bocor. Seluruh baris transaksi berada di Google Drive pembeli sendiri.
3. **Cepat & Praktis di Smartphone (PWA Native-Like)**:
   - Dapat ditambahkan ke Layar Utama (*Add to Home Screen*) di iOS (Safari) dan Android (Chrome). Sangat mudah mencatat saat berada di depan kasir.
4. **Fleksibilitas Spreadsheet Asli**:
   - Pembeli tetap memiliki fleksibilitas rumus Google Sheets jika ingin membuat laporan pajak, pivot chart, atau ekspor data ke Excel / PDF.
5. **Akses Toolbar Langsung di Google Sheets**:
   - Pembeli dapat memunculkan aplikasi antarmuka di panel samping kanan (*Sidebar*) sambil mengamati tabel data.

---

## 2. Langkah Menyiapkan "Master Spreadsheet" (File Induk Penjual)

Sebagai penjual, Anda cukup membuat **1 Master Spreadsheet** sekali saja. Pembeli nantinya akan menduplikasi file ini secara otomatis.

### A. Buat Spreadsheet Baru
1. Buka browser dan kunjungi [sheets.new](https://sheets.new).
2. Beri nama file:  
   `Finance Tracker - Master Template`

### B. Pasang Kode Skrip Google Apps Script
1. Di menu atas Google Sheets, klik menu **Ekstensi** (*Extensions*) > **Apps Script**.
2. Di panel kiri Apps Script:
   - Pada file bawaan `Code.gs`, hapus isinya dan tempel kode dari file [`src/backend/Code.js`](file:///J:/Aplikasi/finance-template/src/backend/Code.js).
   - Klik tombol **+** di sebelah *Files* > pilih **Script** > beri nama `SetupService.gs`. Tempel kode dari file [`src/backend/SetupService.js`](file:///J:/Aplikasi/finance-template/src/backend/SetupService.js).
   - Klik tombol **+** di sebelah *Files* > pilih **Script** > beri nama `TransactionService.gs`. Tempel kode dari file [`src/backend/TransactionService.js`](file:///J:/Aplikasi/finance-template/src/backend/TransactionService.js).
   - Klik tombol **+** di sebelah *Files* > pilih **HTML** > beri nama `Index.html`. Tempel kode dari file [`src/frontend/Index.html`](file:///J:/Aplikasi/finance-template/src/frontend/Index.html).
   - Klik tombol **+** di sebelah *Files* > pilih **HTML** > beri nama `Styles.html`. Tempel kode dari file [`src/frontend/Styles.html`](file:///J:/Aplikasi/finance-template/src/frontend/Styles.html).
   - Klik tombol **+** di sebelah *Files* > pilih **HTML** > beri nama `App.html`. Tempel kode dari file [`src/frontend/App.html`](file:///J:/Aplikasi/finance-template/src/frontend/App.html).
   - *(Opsional)*: Klik ikon gerigi (*Project Settings*) di panel kiri > centang *"Show 'appsscript.json' manifest file in editor"*. Buka `appsscript.json` dan pastikan isinya sama dengan [`src/appsscript.json`](file:///J:/Aplikasi/finance-template/src/appsscript.json).
3. Klik tombol **Simpan** (Ctrl + S).

### C. Jalankan Setup Otomatis Template
1. Kembali ke tab Google Sheets, lalu lakukan **Refresh halaman (F5)**.
2. Tunggu beberapa detik hingga muncul menu baru di toolbar atas:  
   **`[ Finance Tracker ]`**
3. Klik menu **Finance Tracker** > pilih **Buka di Panel Samping (Sidebar)** atau **Buka Aplikasi (Jendela Penuh)**.
4. Saat pertama kali dijalankan, Google akan memunculkan popup *"Authorization Required"* (Izin Diperlukan):
   - Klik **Lanjutkan / Continue**.
   - Pilih akun Google Anda.
   - Klik **Advanced (Lanjutan)** > Klik **Go to Finance Tracker (unsafe)**.
   - Klik **Allow / Izinkan**.
5. Sheet akan otomatis memformat 5 tab utama bertema *Sage Green*:
   - **`DASHBOARD`**: Kartu ringkasan kas, sisa anggaran, dan alokasi kantong dompet.
   - **`TRANSAKSI`**: Lembar pencatatan mutasi kas (Tanggal, Tipe, Kategori, Dompet, Nominal).
   - **`DOMPET`**: Daftar kantong rekening bank, e-wallet, dan kas tunai.
   - **`KATEGORI`**: Master kategori pengeluaran dan pemasukan.
   - **`ANGGARAN`**: Target batas belanja per kategori yang berulang bulanan (*Recurring*).

---

## 3. Trik URL Sakti `/copy` untuk Pengiriman Otomatis ke Pembeli

Saat menjual di platform digital seperti **Lynk.id, Mayar, Gumroad, Shopee, TikTok Shop, atau pesan otomatis WhatsApp**:

1. Di Google Sheets Master Anda, klik tombol **Bagikan (Share)** di pojok kanan atas.
2. Pada bagian *Akses Umum (General Access)*, ubah dari *Dibatasi (Restricted)* menjadi:  
   **"Siapa saja yang memiliki link" -> "Pelihat" (*Anyone with the link -> Viewer*)**.
3. Klik **Salin link** (*Copy link*). Format aslinya adalah:
   ```text
   https://docs.google.com/spreadsheets/d/1jXZXm9cc1LVcyfx-YRqXAKXySK6da_T6ni5z3yuw1u_gZfHmb56kJ9OH/edit?usp=sharing
   ```
4. Ganti bagian akhir `/edit?usp=sharing` menjadi **/copy**.  
   Contoh link yang diberikan ke pembeli:
   ```text
   https://docs.google.com/spreadsheets/d/1jXZXm9cc1LVcyfx-YRqXAKXySK6da_T6ni5z3yuw1u_gZfHmb56kJ9OH/copy
   ```
5. **Keajaiban Link `/copy`**:  
   Ketika pembeli mengklik tautan tersebut, Google Sheets akan langsung menampilkan tombol besar:  
   **"Buat salinan dokumen" (*Make a copy*)**.  
   Seluruh rumus, format desain, dan skrip Web App otomatis tersalin ke akun Google Drive pembeli dalam 1 detik tanpa bisa merusak master template milik Anda!

---

## 4. Cara Menghosting Halaman Demo Interaktif (`demo/`)

Folder `demo/` telah dirancang khusus agar dapat dihosting secara gratis di berbagai platform hosting statis untuk keperluan demo produk:

### Opsi A: Menggunakan Vercel / Netlify (Sangat Mudah)
1. Unggah folder proyek ke repositori GitHub Anda.
2. Masuk ke [vercel.com](https://vercel.com) atau [netlify.com](https://netlify.com).
3. Buat New Project dan pilih folder root sebagai `demo` (atau buat redirect `/` ke `demo/index.html`).
4. Situs demo interaktif langsung aktif dengan domain gratis seperti `finance-tracker-demo.vercel.app`.

### Opsi B: Menggunakan GitHub Pages
1. Di repositori GitHub Anda, buka menu **Settings** > **Pages**.
2. Pada bagian *Branch*, pilih branch `main`, dan pilih folder `/demo` (atau rename file ke root jika diinginkan).
3. Simpan dan link demo Anda siap dibagikan ke calon pembeli.

---

## 5. Template Pesan Serah Terima ke Pembeli (Siap Salin)

Sertakan teks ini pada halaman *Thank You Page*, email otomatis pembeli, atau pesan WhatsApp:

```text
Halo Kak! Terima kasih banyak telah membeli "Finance Tracker (Personal & Business Edition)".

Berikut adalah akses file template Google Spreadsheet milik Kakak:
Link Akses: https://docs.google.com/spreadsheets/d/1jXZXm9cc1LVcyfx-YRqXAKXySK6da_T6ni5z3yuw1u_gZfHmb56kJ9OH/copy

PANDUAN CEPAT (1 MENIT):
1. Buka link di atas lewat browser komputer/laptop, lalu klik tombol "Buat Salinan" (Make a copy).
2. Spreadsheet dan seluruh sistem aplikasi otomatis tersimpan 100% di akun Google Drive Kakak.
3. Di toolbar menu atas spreadsheet, klik menu "[ Finance Tracker ]" untuk membuka aplikasi antarmuka.
4. Jika muncul verifikasi izin Google saat pertama kali dibuka, klik "Lanjutkan" > "Advanced" > "Go to Finance Tracker (unsafe)" > "Allow".
5. Untuk memasang di layar HP: Di menu Apps Script, klik Deploy > New Deployment > Web App, lalu buka link tersebut di HP dan pilih "Add to Home Screen".

Selamat mengelola keuangan dengan rapi, nyaman, dan bebas pusing! Jika ada kendala, silakan hubungi kami.
```

---

## 6. Cara Menggunakan Halaman Demo untuk Marketing & Konversi

File [`demo/index.html`](file:///J:/Aplikasi/finance-template/demo/index.html) dan [`demo/WebApp.html`](file:///J:/Aplikasi/finance-template/demo/WebApp.html) adalah aset pemasaran yang sangat bernilai:

1. **Uji Coba Langsung di Browser Pembeli**:
   - Calon pembeli dapat menguji langsung sensasi mencatat transaksi di frame HP iPhone maupun tampilan desktop tanpa harus menginstal apapun.
   - Perubahan mutasi kas, saldo kantong dompet, dan diagram pengeluaran tersimulasi secara realtime di panel kanan.
2. **Hosting Terpisah untuk Demo**:
   - Anda dapat men-deploy folder `demo/` ini secara independen di platform hosting seperti Vercel, Netlify, atau Cloudflare Pages.
   - Cantumkan tautan demo tersebut di profil bio Instagram, TikTok, atau halaman penjualan Lynk.id/Mayar/Gumroad Anda agar calon pembeli bisa mencoba sebelum memutuskan membeli.

---

## 7. Template Teks Copywriting Penjualan (Tinggal Salin)

Anda dapat menyalin teks promosi ini untuk deskripsi produk di Lynk.id, Mayar, Shopee, TikTok Shop, atau caption media sosial:

> **Judul Produk:**  
> Finance Tracker — Template Kas & Keuangan Terpadu (Google Sheets + Web App)
>
> **Deskripsi:**  
> Sering merasa uang gaji atau omzet kas cepat habis tapi tidak tahu ke mana perginya? Atau bosan dengan aplikasi pengatur keuangan di Play Store / App Store yang membebankan biaya langganan bulanan mahal?
>
> Kenalkan **Finance Tracker**, solusi pencatatan dan pemantauan arus kas berbasis Google Sheets & Web App mandiri yang dirancang untuk kebutuhan personal maupun operasional usaha mikro.
>
> **Fitur Unggulan:**  
> - **Sekali Beli, Milik Anda Selamanya**: Tanpa biaya langganan bulanan (*Zero-Subscription*), 100% data tersimpan privat di Google Drive milik Anda sendiri.  
> - **Buku Kas 3 Tampilan Fleksibel**: Pantau mutasi kas dalam mode Harian berurutan, mode Bulanan per rekapitulasi kalender, dan mode Diagram Statistik lingkaran.  
> - **Multi-Dompet & Saldo Awal**: Catat tabungan awal tanpa menggelembungkan arus kas bulanan berjalan. Mendukung rekening bank, dompet tunai, dan e-wallet.  
> - **Transfer Kas Antar Dompet**: Fitur mutasi saldo dengan validasi pencegahan rekening asal dan tujuan yang sama.  
> - **Target Anggaran Berulang (Recurring Budgets)**: Batas budget belanja per kategori otomatis berlaku di setiap bulan baru tanpa perlu disetel ulang.  
> - **Tombol Cepat 1-Ketuk**: Isi nominal dan kategori belanja rutin (bensin, makan siang, kopi) secara instan dalam 1 sentuhan.  
> - **Fitur Edit & Hapus Transaksi**: Koreksi transaksi salah input langsung dari HP tanpa perlu mencari baris di spreadsheet.  
> - **Format Rupiah Otomatis Realtime**: Input nominal otomatis memformat pemisah ribuan titik saat mengetik.  
> - **Akses Cepat di Smartphone**: Pasang langsung di layar utama HP (*Add to Home Screen*) layaknya aplikasi native tanpa install dari App Store / Play Store.  
> - **Dukungan Menu Toolbar Spreadsheet**: Buka antarmuka sebagai panel samping (*Sidebar*) atau jendela pop-up dialog langsung dari Google Sheets.  
>
> **Yang Anda Dapatkan:**  
> - Link Akses Google Sheets Master Siap Duplikasi Instan (1 Klik)  
> - Skrip Antarmuka Web App Terintegrasi  
> - Dokumen Panduan Pemasangan & Pemakaian Lengkap (Mudah dipahami pemula)
