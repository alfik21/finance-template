# Indeks Dokumentasi Penjualan & Operasional
## Finance Tracker — Personal & Business Edition

Dokumen ini merupakan panduan katalog dokumentasi komersial dan operasional produk Finance Tracker versi 1.7.8. Seluruh dokumen telah diselaraskan dengan standar tata letak resmi dan disesuaikan untuk konteks **produk yang baru selesai dibangun/dikembangkan (*fresh build*) dan sedang bersiap untuk tahap verifikasi mutu internal (QA) serta pengujian pengguna asli (*User Acceptance Testing / UAT*)**.

---

## Matriks Dokumentasi Produk

| No. | Dokumen | Fungsi | Format Target | PIC | Lokasi Berkas |
|---|---|---|---|---|---|
| 1 | **Product Brief & Requirements** | Menjelaskan target pengguna, tujuan produk, fitur, dan batasannya | Google Docs | Operations | Berkas Word / Docs (.docx): [`docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx`](file:///J:/Aplikasi/finance-template/docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx)<br>Markdown: [`docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.md`](file:///J:/Aplikasi/finance-template/docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.md) |
| 2a | **Panduan & SOP Pengujian Produk** | Petunjuk teknis prosedur pengujian langkah demi langkah | Google Docs / PDF | Finance + Operations | Berkas Word / Docs (.docx): [`docs/02_PANDUAN_PENGUJIAN_PRODUK.docx`](file:///J:/Aplikasi/finance-template/docs/02_PANDUAN_PENGUJIAN_PRODUK.docx)<br>Markdown: [`docs/02_PANDUAN_PENGUJIAN_PRODUK.md`](file:///J:/Aplikasi/finance-template/docs/02_PANDUAN_PENGUJIAN_PRODUK.md) |
| 2b | **Product Testing Checklist (Blank Template)** | Lembar kerja kosong untuk verifikasi rumus & fungsi fitur | Google Sheets | Finance + Operations | Workbook 2 Tab (.xlsx): [`docs/02_PRODUCT_TESTING_CHECKLIST.xlsx`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.xlsx)<br>Spesifikasi (.md): [`docs/02_PRODUCT_TESTING_CHECKLIST.md`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.md) |
| 3 | **User Guide** | Panduan penggunaan untuk pembeli | PDF | Operations | Berkas Word / Docs (.docx): [`docs/03_USER_GUIDE.docx`](file:///J:/Aplikasi/finance-template/docs/03_USER_GUIDE.docx)<br>Markdown: [`docs/03_USER_GUIDE.md`](file:///J:/Aplikasi/finance-template/docs/03_USER_GUIDE.md) |
| 4 | **License & Terms of Use** | Mengatur hak penggunaan, distribusi, dan ketentuan pembelian | PDF | Operations + Finance | Berkas Word / Docs (.docx): [`docs/04_LICENSE_AND_TERMS_OF_USE.docx`](file:///J:/Aplikasi/finance-template/docs/04_LICENSE_AND_TERMS_OF_USE.docx)<br>Markdown: [`docs/04_LICENSE_AND_TERMS_OF_USE.md`](file:///J:/Aplikasi/finance-template/docs/04_LICENSE_AND_TERMS_OF_USE.md) |

---

## Petunjuk Penggunaan Format Berkas

### 1. Dokumen 1: Product Brief & Requirements (Format: Google Docs)
- **Format Sumber**: Berkas Word (.docx) siap buka dan Markdown berstruktur dokumen formal dengan tabel kontrol dokumen, hirarki judul standar (*Title, Subtitle, Heading 1, Heading 2, Heading 3*), tabel komparasi masalah & solusi, diagram roadmap rilis, dan tabel persetujuan kesiapan uji.
- **Cara Penggunaan**:
  1. Buka langsung berkas [`docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx`](file:///J:/Aplikasi/finance-template/docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx) di Microsoft Word atau Google Docs ([docs.new](https://docs.new)).
  2. Seluruh tabel, teks, dan margin telah terformat rapi sesuai standar dokumen formal Google Docs.

### 2. Dokumen 2a: Panduan & SOP Pengujian Produk (Format: Google Docs / PDF)
- **Format Sumber**: Berkas Word (.docx) siap buka dan [`docs/02_PANDUAN_PENGUJIAN_PRODUK.md`](file:///J:/Aplikasi/finance-template/docs/02_PANDUAN_PENGUJIAN_PRODUK.md).
- **Fungsi**: Berisi instruksi kerja terperinci untuk 26 skenario pengujian fungsional internal (Fase 1) dan panduan pengujian pengguna asli UAT (Fase 2), klasifikasi tingkat keparahan bug (*severity*), dan syarat rilis komersial.

### 3. Dokumen 2b: Lembar Kerja Pengujian Produk Kosong (Format: Google Sheets)
- **Format Sumber**:
  - **Workbook 2-Sheet Asli (.xlsx)**: [`docs/02_PRODUCT_TESTING_CHECKLIST.xlsx`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.xlsx) yang memuat tab `DASHBOARD_UJI` dan `MATRIKS_UJI` kosong siap pakai dengan formula live.
  - **Spesifikasi Lembar Uji Lengkap**: [`docs/02_PRODUCT_TESTING_CHECKLIST.md`](file:///J:/Aplikasi/finance-template/docs/02_PRODUCT_TESTING_CHECKLIST.md).
- **Cara Penggunaan**:
  - Buka Google Sheets > `File` > `Open` > `Upload` > pilih berkas `02_PRODUCT_TESTING_CHECKLIST.xlsx`. Lembar kerja kosong siap diisi hasil uji riil oleh tim Finance & Operations.

### 4. Dokumen 3: User Guide (Format: PDF)
- **Format Sumber**: Berkas Word (.docx) siap buka dan [`docs/03_USER_GUIDE.md`](file:///J:/Aplikasi/finance-template/docs/03_USER_GUIDE.md) berstandar cetak PDF (*Print & PDF Ready*) dengan alokasi tepat 4 halaman, pembatas halaman fisik (*Page Break markers*), spesifikasi rasio tangkapan layar, dan header/footer dokumen.
- **Cara Penggunaan**:
  1. Buka berkas [`docs/03_USER_GUIDE.docx`](file:///J:/Aplikasi/finance-template/docs/03_USER_GUIDE.docx) di Microsoft Word atau peramban.
  2. Lakukan ekspor/simpan ke PDF untuk disertakan dalam surel konfirmasi pembelian atau paket unduhan pembeli.

### 5. Dokumen 4: License & Terms of Use (Format: PDF)
- **Format Sumber**: Berkas Word (.docx) siap buka dan [`docs/04_LICENSE_AND_TERMS_OF_USE.md`](file:///J:/Aplikasi/finance-template/docs/04_LICENSE_AND_TERMS_OF_USE.md) dokumen hukum legal dengan pembagian pasal formal (Pasal 1 s/d Pasal 7), klausul hak pakai tunggal, ketentuan pengembalian dana, dan kotak pengesahan lisensi.
- **Cara Penggunaan**:
  1. Buka berkas [`docs/04_LICENSE_AND_TERMS_OF_USE.docx`](file:///J:/Aplikasi/finance-template/docs/04_LICENSE_AND_TERMS_OF_USE.docx).
  2. Ekspor menjadi berkas PDF untuk disertakan di dalam paket serah terima pembeli di Lynk.id / Mayar / Gumroad.

---

## Ketersediaan Berkas Dokumen Word / Google Docs (.docx)

Untuk memudahkan pembacaan langsung di komputer, ponsel, Microsoft Word, Google Docs, maupun WPS Office tanpa perlu mengonversi dari Markdown, seluruh dokumen naratif telah digenerate dalam format `.docx` siap pakai dengan tata letak visual rapi dan palet warna Sage Green:

1. **Product Brief & Requirements**: [`docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx`](file:///J:/Aplikasi/finance-template/docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx)
2. **Panduan & SOP Pengujian Produk**: [`docs/02_PANDUAN_PENGUJIAN_PRODUK.docx`](file:///J:/Aplikasi/finance-template/docs/02_PANDUAN_PENGUJIAN_PRODUK.docx)
3. **User Guide (Panduan Pengguna)**: [`docs/03_USER_GUIDE.docx`](file:///J:/Aplikasi/finance-template/docs/03_USER_GUIDE.docx)
4. **License & Terms of Use**: [`docs/04_LICENSE_AND_TERMS_OF_USE.docx`](file:///J:/Aplikasi/finance-template/docs/04_LICENSE_AND_TERMS_OF_USE.docx)

*Berkas `.docx` dapat langsung dibuka dengan Microsoft Word atau diunggah (drag & drop) ke Google Drive untuk dibuka secara langsung dengan Google Docs.*
