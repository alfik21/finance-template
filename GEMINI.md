# Panduan Proyek Finance Tracker

## Pelacakan Versi (Version Tracking)
- **Bump Version di `package.json`**: Setiap kali melakukan perubahan kode, perbaikan bug, atau penambahan fitur baru, selalu perbarui nomor versi di `package.json` sebelum menandai pekerjaan selesai:
  - **Patch** (misal `1.0.0` -> `1.0.1`): Untuk perbaikan bug kecil, penyesuaian styling, atau konfigurasi.
  - **Minor** (misal `1.0.0` -> `1.1.0`): Untuk penambahan fitur baru atau perubahan fungsional yang signifikan.
  - **Major** (misal `1.0.0` -> `2.0.0`): Untuk perombakan arsitektur besar / breaking changes.
- **Konsistensi Deployment**: Saat mempublikasikan versi baru (deploy/versioning Apps Script), pastikan nomor versi Apps Script selaras dengan versi yang tertera di `package.json`.

## Aturan Desain: Bebas Emoticon & Emoji (Zero-Emoji Policy)
- **Larangan Emoji**: Dilarang keras menggunakan emoticon atau emoji (seperti 📊, 📋, 📅, ✏️, 💰, 🚀, 💡, 📱, dll.) baik pada:
  - Seluruh elemen antarmuka pengguna (tombol, tab, navigasi, badge, judul form, teks label).
  - Nama menu toolbar Google Sheets (`createMenu`, `addItem`).
  - Dokumentasi resmi maupun pesan aplikasi.
- **Alternatif yang Digunakan**: Gunakan ikon vektor SVG garis bersih (*clean stroke SVG*), tipografi standar (*Plus Jakarta Sans / JetBrains Mono*), atau teks murni yang fungsional demi menjaga estetika profesional, utilitarian, dan menghindari kesan *AI slop*.
