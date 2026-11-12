# Aset Marketing (internal)

Materi promosi/rilis yang dipakai bersama dokumen penjual. **Bukan** bagian paket
pembeli — tidak perlu disertakan saat mengirim `docs/01`–`04` ke pembeli.

| Berkas | Kegunaan |
| --- | --- |
| `og-cover.svg` | Sumber desain kartu Open Graph (1200×630). PNG hasil ekspor: `demo/assets/og-cover.png`. |
| `screenshots/` | Tangkapan layar aplikasi (mode demo, 600–900 px) untuk katalog marketplace. Ganti dengan tangkapan data asli sebelum unggah bila diinginkan. |

## Catatan Open Graph

- `demo/index.html` (sumber) → `preview.html` (hasil generate) memuat meta
  `og:*` dan `twitter:*`; `og:image` relatif ke `demo/assets/og-cover.png`.
- Sebelum promosi, ganti `og:image`/`twitter:image` menjadi URL absolut domain
  hosting (mis. `https://domain-anda/demo/assets/og-cover.png`) agar pratinjau
  tautan tampil benar saat dibagikan di WhatsApp/media sosial.
- Regenerasi PNG dari SVG (butuh `sharp`):
  `npx sharp-cli -i internal/marketing/og-cover.svg -o demo/assets/og-cover.png resize 1200 630`
  atau ekspor manual dari editor vektor (Figma/Inkscape) dengan ukuran 1200×630.
