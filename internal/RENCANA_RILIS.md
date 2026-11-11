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

## FASE 1 — Perbaikan P0 (UX kritis & jujur produk)

1. **Safe-area & zoom**: tambah `env(safe-area-inset-bottom)` pada padding navigasi bawah (kedua app), hapus `user-scalable=no` dari viewport.
2. **Jujurkan klaim PWA**: ganti klaim "PWA/progressive web app" menjadi "pintasan layar utama (Add to Home Screen)"; tambah `theme-color` + favicon data-URI; manifest/SW tidak mungkin di domain Google Apps Script.
3. **Proteksi sheet**: finance → hard-protect sheet `PENGATURAN` (aplikasi hanya baca); family → `CONFIG` warning-only + dokumentasikan batasan RBAC (master bisa non-owner; aplikasi menulis CONFIG via `saveConfigData`).
4. **Aksesibilitas minimum**: kontras, target sentuh ≥ 44px, font input iOS ≥ 16px.
5. Tes kedua repo hijau sebelum commit.

## FASE 2 — Pengalaman Aplikasi (P1)

1. Ganti ±31 `alert()` di `App.html` (finance) dengan toast/inline feedback.
2. Tambah tab Pengaturan di aplikasi Personal (paritas dengan Family).
3. Samakan tema sheet Personal ke sage (saat ini 1/6 tab hijau).
4. Paritas fitur family: UI pagu anggaran, pencarian transaksi, grouping, donut chart (KPI dashboard sudah ada).
5. Lokalkan Tailwind (keluarkan dependensi CDN untuk produksi), termasuk di family `WebApp.html`.
6. Quick-chips input nominal cepat di form transaksi (finance).

## FASE 3 — Material Peluncuran & Identitas Edisi (P2)

1. Aset ikon aplikasi (apple-touch-icon dsb.), meta Open Graph untuk halaman demo/preview.
2. Screenshot resmi untuk katalog marketplace.
3. Identitas visual Family: logo & tagline khusus (warna tetap sage — lihat `DESIGN_SYSTEM.md`).
4. Alur onboarding pertama kali (permintaan akses Google + salin template).
5. Finalisasi kebijakan refund di dokumen lisensi.
6. Catatan: `presentation.html` finance adalah WIP — perubahan branding di dalamnya tidak di-commit sampai disetujui.

---

## Definisi "Selesai" per Fase

- Seluruh butir fase berstatus ✅.
- `npm run verify` (finance) dan `npm run sync && npm test` (family) lulus 100%.
- Tidak ada sisa varian brand lama (grep bersih).
- Commit & push ke `origin/master`, CI GitHub Actions hijau.
