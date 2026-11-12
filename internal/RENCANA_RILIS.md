# Rencana Rilis — Finance Tracker (Semua Edisi)

> Dokumen internal penjual. Berlaku untuk payung Finance Tracker — Personal Edition & Family Edition.
> Sumber temuan: audit eksternal prarilis (kode, UX, keamanan, dokumentasi). Fase dieksekusi berurutan; setiap fase diakhiri dengan seluruh tes hijau sebelum commit.

## Status Fase

| Fase | Prioritas | Status |
|---|---|---|
| FASE 0 — Kebersihan rilis (dokumen, brand, teks) | P0 | ✅ Selesai |
| FASE 1 — Perbaikan P0 kritis UX & keamanan | P0 | ⏳ Belum |
| FASE 2 — Pengalaman aplikasi (P1) | P1 | ⬜ Belum |
| FASE 3 — Material peluncuran & identitas edisi (P2) | P2 | ⬜ Belum |

---

## FASE 0 — Kebersihan Rilis (P0)

Tujuan: produk & paket penjualan bebas dari cacat yang memalukan sebelum fitur apapun dipoles.

1. ✅ Perbaikan mojibake (encoding rusak) di seluruh berkas finance — `scripts/fix-mojibake.js`, sisa 0.
2. ✅ Typo "Resei/resei/reseti" → "Reset" di finance (7 berkas, sisa 0).
3. ✅ Hapus bundling harga Rp129.000 (add-on dana darurat & investasi) dari dokumen family + generator docx.
4. ✅ Standardisasi brand ke payung + edisi (`Finance Tracker — Personal/Family Edition`); menu & dialog Apps Script memakai payung tanpa edisi; nama teknis repo tidak diubah.
5. ✅ Reorganisasi dokumen: `docs/` = paket pembeli (01–04), `internal/` = dokumen penjual (brief, QC, perbaikan, rencana rilis, design system); README kedua folder ditulis ulang; referensi lintas berkas disapu; `desktop.ini` dihapus dari git (family).
6. ✅ Netralisasi frasa internal ("Internal QA", "tim internal Finance & Operations") di dokumen pembeli → "tim produk".
7. ✅ Tes hijau: finance `npm run verify` (52 tes + sintaks), family `npm run sync && npm test` (41 QC).

## FASE 1 — Perbaikan P0 (UX kritis & jujur produk) — ✅ SELESAI

1. ✅ **Safe-area & zoom**: tambah `env(safe-area-inset-bottom)` pada padding navigasi bawah (kedua app), hapus `user-scalable=no` dari viewport.
2. ✅ **Jujurkan klaim PWA**: ganti klaim "PWA/progressive web app" menjadi "pintasan layar utama (Add to Home Screen)"; tambah `theme-color` + favicon data-URI; manifest/SW tidak mungkin di domain Google Apps Script.
3. ✅ **Proteksi sheet**: finance → hard-protect sheet `PENGATURAN` (aplikasi hanya baca); family → `CONFIG` warning-only + dokumentasikan batasan RBAC (master bisa non-owner; aplikasi menulis CONFIG via `saveConfigData`).
4. ✅ **Aksesibilitas minimum**: kontras, target sentuh ≥ 44px, font input iOS ≥ 16px.
5. ✅ Tes kedua repo hijau sebelum commit (finance backend 54/54 + e2e 14/14; family QC 42/42).

## FASE 2 — Pengalaman Aplikasi (P1) — ✅ SELESAI

1. ✅ Ganti seluruh `alert()` di `App.html` (finance, 33 titik) dengan toast non-blocking (`showToast` + `#toast-stack aria-live`).
2. ✅ Tambah tab Pengaturan di aplikasi Personal (dompet/nonaktif/kategori/anggaran/tentang).
3. ✅ Samakan tema tab sheet Personal ke sage (`#1B4332`/`#2D6A4F`/`#40916C`).
4. ✅ Paritas fitur family: sheet `BUDGET` + API `getBudgets/saveBudget/deleteBudget` (Master-only), UI kelola anggaran (sub-tab Kelola > Anggaran), panel progres di Rekap, donut kategori, pencarian transaksi, grouping per tanggal.
5. ✅ Lokalkan Tailwind: family `WebApp.html` tanpa `cdn.tailwindcss.com` (CSS v3.4.17 dikompilasi inline via `npm run css:build`); `preview.html` memuat paket lokal `assets/tailwindcss.js`.
6. ✅ Quick-chips input nominal cepat di form transaksi (finance: +10rb/+20rb/+50rb/+100rb/C).

## FASE 3 — Material Peluncuran & Identitas Edisi (P2) — ✅ SELESAI

1. ✅ Aset ikon aplikasi (`apple-touch-icon` data-URI), kartu Open Graph 1200×630 (`internal/marketing/og-cover.svg` → `assets/og-cover.png`), meta `og:*`/`twitter:*` di halaman preview/demo.
2. ✅ Screenshot katalog marketplace di `internal/marketing/screenshots/` (mode demo).
3. ✅ Identitas visual Family: logo khusus (`assets/logo-family.svg`) & tagline "Satu Buku Kas untuk Se Keluarga" (warna tetap sage — lihat `DESIGN_SYSTEM.md`).
4. ✅ Alur onboarding pertama kali: kartu "Panduan Awal — 3 Langkah" yang muncul sekali (localStorage) di kedua aplikasi.
5. ✅ Finalisasi kebijakan refund: prosedur klaim (5.3) & pengecualian garansi (5.4) di dokumen lisensi + generator docx.
6. ✅ Catatan: `presentation.html` finance adalah WIP — perubahan branding di dalamnya tidak di-commit sampai disetujui.

---

## Definisi "Selesai" per Fase

- Seluruh butir fase berstatus ✅.
- `npm run verify` (finance) dan `npm run sync && npm test` (family) lulus 100%.
- Tidak ada sisa varian brand lama (grep bersih).
- Commit & push ke `origin/master`, CI GitHub Actions hijau.
