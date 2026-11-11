# Design System — Finance Tracker (Payung Semua Edisi)

> Dokumen internal penjual. Berlaku untuk semua edisi: **Personal**, **Family**, dan kelak **Couple**.
> Prinsip: satu bahasa visual yang sama antar edisi — edisi hanya dibedakan oleh **logo & copy**, tidak oleh warna.

## 1. Prinsip Identitas

| Aspek | Aturan |
|---|---|
| Nama payung | `Finance Tracker` |
| Nama edisi | `Finance Tracker — Personal Edition` / `Finance Tracker — Family Edition` |
| Menu spreadsheet & dialog Apps Script | Payung saja: `Finance Tracker` (tanpa nama edisi) |
| Header aplikasi | Boleh menyertakan nama edisi |
| Pembeda antar edisi | Logo + tagline/copy saja; **warna tetap identik** |
| Repo/package name teknis | Tidak diubah (tetap `finance-template`, `family-finance-template`) |

## 2. Palet Warna — Sage Green & Ink Utilitarian

Sumber kebenaran: `src/frontend/Styles.html` (finance) dan `WebApp.html` > `tailwind.config` (family).

### Token dasar
| Token | Nilai | Fungsi |
|---|---|---|
| `--bg-canvas` | `#f6f8f7` | Latar kanvas halaman |
| `--bg-surface` | `#ffffff` | Permukaan kartu/modal |
| `--bg-subtle` | `#f4f7f5` | Latar area sekunder |
| `--bg-hover` | `#e8f0ec` | Hover ringan |
| `--border-color` | `#e1e5ea` | Border utama |
| `--border-subtle` | `#edf2f0` | Border halus |

### Teks (Ink)
| Token | Nilai |
|---|---|
| `--text-main` | `#1c1e21` |
| `--text-muted` | `#656b73` |
| `--text-subtle` | `#94a3b8` |

### Aksen signature — Sage Green
| Token | Nilai | Pemakaian tipikal |
|---|---|---|
| `--sage-50` | `#f4f7f5` | Latar chip/badge lembut |
| `--sage-100` | `#e8f0ec` | Latar pill aktif, selection |
| `--sage-200` | `#d1e0d8` | Border komponen sage |
| `--sage-300` | `#b7ccc0` | Border kuat / divider aksen |
| `--sage-500` | `#40916c` | Aksen utama (titik status, FAB, aktif) |
| `--sage-700` | `#2d6a4f` | Teks di atas sage-50/100, ikon |
| `--sage-800` | `#1b4332` | Teks badge, hover gelap |
| `--sage-900` | `#081c15` | Teks kontras maksimum di sage-100 |

### Semantik keuangan
| Token | Nilai | Fungsi |
|---|---|---|
| `--color-income` | `#2d6a4f` | Pemasukan |
| `--color-expense` | `#b91c1c` | Pengeluaran |
| `--color-transfer` | `#2563eb` | Transfer |
| `amber-700` (Tailwind) | `#b45309` | Warning/banner RBAC |

## 3. Tipografi

| Token | Nilai | Pemakaian |
|---|---|---|
| `--font-sans` | `'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | UI utama (dimuat via Google Fonts) |
| `--font-mono` | `'JetBrains Mono', "SFMono-Regular", Consolas, monospace` | Angka pada tabel ledger |

- Bobot: 400 body, 500 label sekunder, **600 judul kartu**, **700 angka/nilai penting**.
- Judul aplikasi: `font-bold tracking-tight`, ukuran `text-base` → `sm:text-lg`.

## 4. Bentuk & Elevation

| Token | Nilai |
|---|---|
| `--radius-sm` | `10px` (chip, input kecil) |
| `--radius-md` | `16px` (kartu, modal, tombol utama) |
| `--radius-lg` | `20px` (container besar / sheet bawah) |

- Elevasi dibuat minimal: `border: 1px solid var(--border-color)` lebih diutamakan daripada drop-shadow.
- Badge/pill: `rounded-full`, latar `sage-100`, teks `sage-800`, border `sage-200`.

## 5. Komponen Berulang

| Komponen | Spesifikasi |
|---|---|
| Navigasi bawah (HP) | Fixed bottom, 4 tab, ikon + label, item aktif `sage-700` |
| Tab desktop | `touch-btn rounded-lg px-4 py-2`, aktif = latar sage |
| Kartu KPI | Latar `--bg-surface`, border halus, label `text-muted` + nilai `font-bold` |
| Tabel ledger | Angka `--font-mono`, warna semantik income/expense/transfer |
| Banner peringatan | Latar amber-50, ikon + teks `amber-700` |
| Dialog Apps Script | Judul payung `Finance Tracker`, styling mengikuti palet di atas |

## 6. Aksesibilitas (minimum)

- Kontras teks normal ≥ 4.5:1; `--text-subtle` hanya untuk teks bantu ≥ 12px.
- Target sentuh ≥ 44×44px.
- `font-size` input iOS ≥ 16px agar tidak auto-zoom.
- Tidak memakai warna sebagai satu-satunya penanda status (selalu + ikon/teks).

## 7. Aturan untuk Edisi Baru (mis. Couple)

1. Salin palet & tipografi di atas **tanpa perubahan**.
2. Buat logo & tagline baru untuk edisi tersebut.
3. Nama menu/dialog tetap `Finance Tracker`.
4. Tambahkan baris edisi di `RENCANA_RILIS.md` dan indeks `docs/README.md`.
