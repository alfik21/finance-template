const docx = require('docx');
const fs = require('fs');
const path = require('path');

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType
} = docx;

// Common Color Palette (Sage Green Utilitarian)
const COLOR_PRIMARY = '1E3A34';   // Deep Forest Sage
const COLOR_SECONDARY = '2D6A4F'; // Medium Sage Green
const COLOR_TEXT = '0F172A';      // Dark Slate Body
const COLOR_MUTED = '475569';     // Muted Slate
const COLOR_BG_LIGHT = 'F8FAFC';  // Off-white / light slate
const COLOR_BORDER = 'CBD5E1';    // Border grey

// Helper: Paragraph Builders
function createTitle(text) {
  return new Paragraph({
    spacing: { before: 100, after: 120 },
    children: [
      new TextRun({ text, font: 'Arial', size: 38, bold: true, color: COLOR_PRIMARY })
    ]
  });
}

function createSubtitle(text) {
  return new Paragraph({
    spacing: { before: 0, after: 240 },
    children: [
      new TextRun({ text, font: 'Arial', size: 22, italics: true, color: COLOR_MUTED })
    ]
  });
}

function createH1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({ text, font: 'Arial', size: 28, bold: true, color: COLOR_PRIMARY })
    ]
  });
}

function createH2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text, font: 'Arial', size: 24, bold: true, color: COLOR_SECONDARY })
    ]
  });
}

function createH3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 140, after: 60 },
    children: [
      new TextRun({ text, font: 'Arial', size: 21, bold: true, color: COLOR_TEXT })
    ]
  });
}

function createP(text, options = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({ text, font: 'Arial', size: 20, color: COLOR_TEXT, ...options }));
  } else if (Array.isArray(text)) {
    text.forEach(item => {
      if (typeof item === 'string') {
        runs.push(new TextRun({ text: item, font: 'Arial', size: 20, color: COLOR_TEXT }));
      } else {
        runs.push(new TextRun({ font: 'Arial', size: 20, color: COLOR_TEXT, ...item }));
      }
    });
  }
  return new Paragraph({
    spacing: { before: 40, after: 100 },
    children: runs
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ': ', font: 'Arial', size: 20, bold: true, color: COLOR_TEXT }));
  }
  children.push(new TextRun({ text, font: 'Arial', size: 20, color: COLOR_TEXT }));
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60 },
    children
  });
}

function createCallout(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_SECONDARY },
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLOR_BG_LIGHT },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: title ? title + ' — ' : '', font: 'Arial', size: 19, bold: true, color: COLOR_PRIMARY }),
                  new TextRun({ text, font: 'Arial', size: 19, color: COLOR_MUTED })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createTable(headers, rowsData) {
  const headerCells = headers.map(h => new TableCell({
    shading: { fill: COLOR_PRIMARY },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, font: 'Arial', size: 19, bold: true, color: 'FFFFFF' })]
      })
    ]
  }));

  const tableRows = [
    new TableRow({ tableHeader: true, children: headerCells })
  ];

  rowsData.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 1;
    const cells = row.map((cellText, colIdx) => new TableCell({
      shading: isEven ? { fill: COLOR_BG_LIGHT } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          children: [new TextRun({ text: String(cellText), font: 'Arial', size: 19, color: COLOR_TEXT })]
        })
      ]
    }));
    tableRows.push(new TableRow({ children: cells }));
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
    },
    rows: tableRows
  });
}

function createDivider() {
  return new Paragraph({
    spacing: { before: 140, after: 140 },
    border: { bottom: { color: COLOR_BORDER, space: 1, style: BorderStyle.SINGLE, size: 6 } }
  });
}

// =========================================================================
// BUILD DOC 1: PRODUCT BRIEF & REQUIREMENTS
// =========================================================================
async function buildDoc1() {
  const children = [
    createTitle('Product Brief & Requirements: Finance Tracker'),
    createSubtitle('Container-Bound Edition — Dokumen Spesifikasi Produk & Perencanaan Pengembangan'),
    createCallout('Fase Siklus Produk', 'Baru Selesai Pengembangan (Fresh Build) — Menuju Tahap Pengujian Internal & Pengguna Asli.'),
    createDivider(),
    createH1('Tabel Kontrol Dokumen'),
    createTable(
      ['Parameter', 'Keterangan'],
      [
        ['ID Dokumen', 'DOC-OPS-PBR-2026-001'],
        ['Judul Dokumen', 'Product Brief & Functional Requirements — Finance Tracker'],
        ['Edisi Produk', 'Container-Bound Web App & Spreadsheet Edition'],
        ['Versi Rilis', '1.7.6 (Build Perdana Pasca-Pengembangan)'],
        ['Tanggal Efektif', '26 Oktober 2026'],
        ['Klasifikasi Akses', 'Internal — Terbatas (Internal Confidential)'],
        ['Penanggung Jawab (PIC)', 'Operations Team'],
        ['Tim Peninjau (Reviewer)', 'Finance Team, Product Lead'],
        ['Status Dokumen', 'Selesai Pengembangan — Menunggu Pengujian QA & Pengguna Asli (Awaiting QA & UAT)']
      ]
    ),
    createDivider(),
    createH1('Ringkasan Eksekutif (Executive Summary)'),
    createP('Finance Tracker adalah produk pencatatan keuangan pribadi dan usaha kecil berbasis Google Apps Script Web App yang terikat langsung di dalam Google Sheets (container-bound).'),
    createP('Sistem ini baru saja selesai dibangun dan dikembangkan (freshly developed) oleh tim pengembang. Sebelum produk dibuka untuk penjualan komersial publik, produk wajib melalui dua tahapan verifikasi kritis:'),
    createBullet('Memastikan tidak ada galat rumus, rekonsiliasi saldo akurat, dan validasi data berfungsi normal.', '1. Pengujian Kendali Mutu Internal (Internal QA)'),
    createBullet('Menguji antarmuka, pemahaman instruksi, dan kemudahan pengoperasian oleh calon pengguna riil pertama kali.', '2. Pengujian Pengguna Asli (Pilot User Testing / UAT)'),
    createH1('1. Identitas dan Deskripsi Produk'),
    createH2('1.1. Nama Produk'),
    createBullet('Finance Tracker (Personal & Business Edition)', 'Nama Komersial'),
    createBullet('finance-template (Container-Bound Edition)', 'Nama Teknis Repositori'),
    createH2('1.2. Deskripsi Konseptual'),
    createP('Aplikasi web pencatatan keuangan berbasis peramban (PWA) yang tertanam di dalam spreadsheet pengguna. Menghilangkan kebutuhan instalasi aplikasi dari Play Store/App Store dengan 3 mode akses:'),
    createBullet('Berjalan mandiri di layar utama ponsel (Add to Home Screen) melalui peramban Safari (iOS) atau Chrome (Android).', '1. Mode Smartphone (PWA)'),
    createBullet('Panel antarmuka selebar 380px di sisi kanan Google Sheets untuk pencatatan sambil memantau baris data.', '2. Mode Panel Samping (Sidebar)'),
    createBullet('Antarmuka terpusat berukuran 980x680px di Google Sheets untuk evaluasi bulanan yang leluasa.', '3. Mode Jendela Dialog (Modal Dialog)'),
    createH1('2. Profil Target Pengguna Asli (Target Pilot & End Users)'),
    createH2('2.1. Pekerja Lepas & Profesional Mandiri (Freelancers)'),
    createBullet('Arus kas masuk tidak teratur dari berbagai klien, memiliki banyak rekening (Bank BCA, Mandiri, e-wallet GoPay/OVO).', 'Karakteristik'),
    createBullet('Kemudahan melacak saldo kas nyata (Net Worth) di banyak kantong dompet dan fitur transfer antar-rekening.', 'Fokus Uji Coba'),
    createH2('2.2. Pemilik Usaha Mikro, Kecil, dan Menengah (UMKM)'),
    createBullet('Mengelola arus kas harian tanpa software akuntansi berbayar mahal.', 'Karakteristik'),
    createBullet('Kemudahan pencatatan omzet harian dan pemisahan belanja modal vs belanja operasional.', 'Fokus Uji Coba'),
    createH2('2.3. Pengguna Sadar Privasi Data Finansial'),
    createBullet('Tidak ingin data mutasi bank tersimpan di server pihak ketiga yang berisiko bocor atau dijual.', 'Karakteristik'),
    createBullet('Keamanan Google Drive pribadi dan independensi sistem tanpa ketergantungan server startup luar.', 'Fokus Uji Coba'),
    createH2('2.4. Pengguna Spreadsheet yang Membutuhkan Kecepatan di Ponsel'),
    createBullet('Terbiasa memakai rumus Excel/Google Sheets, namun lelah mengisi baris sel kecil di layar sentuh ponsel.', 'Karakteristik'),
    createBullet('Responsivitas form mobile dan tombol pintas 1-ketukan (Smart Habit Chips).', 'Fokus Uji Coba'),
    createH1('3. Masalah yang Ingin Diselesaikan'),
    createTable(
      ['Masalah Pengguna Saat Ini', 'Solusi yang Selesai Dikembangkan'],
      [
        ['Subscription Fatigue: Beban biaya sewa aplikasi keuangan Rp 30.000 – Rp 99.000/bulan.', 'Skema sekali beli untuk penggunaan seumur hidup (zero-subscription) tanpa biaya server bulanan.'],
        ['Privasi Terancam: Kekhawatiran data keuangan diunggah ke server startup asing yang rawan kebocoran.', '100% kepemilikan data berada di Google Drive pribadi pengguna.'],
        ['Entri Ponsel Lambat: Mengetik baris sel di Google Sheets mobile memakan waktu dan rawan merusak rumus.', 'Antarmuka Web App mobile yang cepat dengan format ribuan otomatis dan tombol cepat 1-ketuk (Habit Chips).'],
        ['Kekacauan Saldo Akibat Transfer: Pindah dana antar rekening sering salah tercatat sebagai belanja baru.', 'Modul transfer kas khusus yang memotong rekening asal dan menambah rekening tujuan tanpa mempengaruhi laporan belanja.'],
        ['Pengeluaran Boncos: Ketiadaan alarm visual saat pengeluaran mendekati batas anggaran bulanan.', 'Modul Anggaran Berulang (Recurring Budgets) dengan auto-reset bulanan dan indikator merah jika melebihi batas (Overbudget).']
      ]
    ),
    createH1('4. Daftar Fitur yang Telah Selesai Dikembangkan'),
    createBullet('Tipografi Plus Jakarta Sans dan angka tabular JetBrains Mono, kontras tinggi, bebas emotikon/emoji (Zero-Emoji Policy).', '1. Antarmuka Sage Green Utilitarian'),
    createBullet('Mendukung Tunai, Bank, dan E-Wallet. Saldo awal tabungan langsung tercatat di Kekayaan Bersih (Net Worth) tanpa mengotori arus kas masuk berjalan.', '2. Kantong Saldo Multi-Akun & Saldo Awal'),
    createBullet('Koreksi transaksi (Edit & Delete) dengan pembatalan dampak mutasi lama dan penerapan mutasi baru secara otomatis (reverse-and-apply).', '3. Mesin Rekonsiliasi Mutasi'),
    createBullet('Tampilan Harian (subtotal per hari), Tampilan Bulanan (kartu ringkasan kas & selector bulan), dan Tampilan Statistik (visual donat alokasi).', '4. Buku Kas 3 Tampilan'),
    createBullet('Input nominal otomatis memformat titik pemisah ribuan saat diketik.', '5. Format Rupiah Otomatis Realtime'),
    createBullet('Pembentukan otomatis 5 tab sheet standar (DASHBOARD, TRANSAKSI, DOMPET, KATEGORI, ANGGARAN).', '6. Otomasi Database (SetupService)'),
    createH1('5. Batasan Produk (Product Scope & Constraints)'),
    createBullet('Berjalan di atas Google Sheets & Google Apps Script; tidak dapat dijalankan secara luring murni di software Microsoft Excel (.xlsx biasa).', '1. Ketergantungan Ekosistem Google'),
    createBullet('Penyimpanan data mutasi membutuhkan koneksi internet aktif untuk menulis ke Google Spreadsheet awan.', '2. Kebutuhan Koneksi Internet'),
    createBullet('Dikonfigurasi untuk format mata uang Rupiah Indonesia (IDR).', '3. Mata Uang Tunggal'),
    createBullet('Menggunakan pencatatan kas nyata (single-entry cash basis), bukan sistem akuntansi berpasangan murni (double-entry accrual).', '4. Metode Kas Tunggal'),
    createH1('6. Rencana Tahapan Rilis (Product Release Roadmap)'),
    createBullet('Koding Backend, Frontend PWA, dan test otomatis E2E.', 'Tahap 1: PENGEMBANGAN [STATUS: SELESAI]'),
    createBullet('Pengujian internal QA (Finance/Ops), UAT bersama calon pengguna riil, dan evaluasi masukan.', 'Tahap 2: PENGUJIAN [STATUS: SEDANG BERJALAN]'),
    createBullet('Pembukaan toko digital, distribusi tautan /copy, dan kampanye promosi peluncuran.', 'Tahap 3: PELUNCURAN [STATUS: MENDATANG]'),
    createH1('7. Model Penetapan Harga Target Sementara (Provisional Pricing)'),
    createTable(
      ['Parameter', 'Ketetapan Target Sementara'],
      [
        ['Model Lisensi', 'Pembelian Lisensi Tunggal Digital (Seumur Hidup)'],
        ['Harga Referensi Normal (MSRP)', 'Rp 99.000'],
        ['Target Harga Jual Reguler', 'Rp 79.000'],
        ['Target Harga Promosi Peluncuran (Early Bird)', 'Rp 49.000'],
        ['Saluran Penjualan Rencana', 'Lynk.id, Mayar.id, Gumroad, Shopee Produk Digital']
      ]
    ),
    createH1('8. Persetujuan Kesiapan Memasuki Tahap Pengujian'),
    createTable(
      ['Peran', 'Penanggung Jawab', 'Tanggal', 'Status Keputusan'],
      [
        ['Lead Developer', 'Engineering Team', '26 Oktober 2026', 'Kode Siap Diuji (Code Freeze)'],
        ['Operasional', 'Operations Team', '26 Oktober 2026', 'Siap Masuk Tahap QA & UAT'],
        ['Keuangan', 'Finance Team', '26 Oktober 2026', 'Siap Verifikasi Rumus']
      ]
    )
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(__dirname, '..', 'docs', '01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx'), buffer);
  console.log('01_PRODUCT_BRIEF_AND_REQUIREMENTS.docx berhasil dibuat.');
}

// =========================================================================
// BUILD DOC 2: PANDUAN PENGUJIAN PRODUK (SOP)
// =========================================================================
async function buildDoc2() {
  const children = [
    createTitle('Panduan & SOP Pengujian Produk: Finance Tracker'),
    createSubtitle('Standard Operating Procedure (SOP) Pengujian Mutu 2 Fase: Internal QA & UAT Pengguna Asli'),
    createCallout('Konteks Produk', 'Produk Baru Selesai Dikembangkan (Fresh Development) — Belum Diuji oleh Pengguna Asli.'),
    createDivider(),
    createH1('Tabel Informasi Dokumen SOP'),
    createTable(
      ['Parameter', 'Keterangan'],
      [
        ['ID Dokumen', 'SOP-QA-2026-002'],
        ['Versi Dokumen', '1.7.6'],
        ['Divisi Penanggung Jawab', 'Finance + Operations Team'],
        ['Tanggal Berlaku', '26 Oktober 2026'],
        ['Berkas Terkait', 'docs/02_PRODUCT_TESTING_CHECKLIST.xlsx (Template Kosong 2 Tab)']
      ]
    ),
    createH1('1. Latar Belakang dan Tujuan Pengujian'),
    createP('Produk Finance Tracker ini baru saja selesai dibangun dan selesai dikembangkan pada tingkat kode (code freeze). Seluruh fitur utama (Web App PWA, perhitungan multi-dompet, mutasi transfer, anggaran berulang, dan tombol cepat habit chip) telah selesai dikoding, namun belum pernah diuji coba oleh pengguna nyata (real end-users).'),
    createP('Oleh karena itu, dokumen ini menetapkan kerangka kerja pengujian bertahap:'),
    createBullet('Dilakukan oleh tim internal Finance dan Operations untuk memverifikasi 26 kasus uji teknis pada lembar kerja kosong.', 'Fase 1: Verifikasi Fungsional Internal (Internal QA)'),
    createBullet('Dilakukan bersama 3–5 orang perwakilan pengguna nyata (pekerja lepas / pemilik UMKM) untuk mengamati kendala navigasi dan pemahaman awal.', 'Fase 2: Pengujian Penerimaan Pengguna Asli (User Acceptance Testing / UAT)'),
    createH1('2. Persiapan Lingkungan Uji Bersih (Clean Test Environment)'),
    createBullet('Jangan gunakan akun Google yang memiliki hak developer. Gunakan akun Gmail biasa yang belum pernah memberi izin pada skrip ini.', '1. Gunakan Akun Google Uji Baru'),
    createBullet('Buka tautan master berakhiran /copy. Pastikan muncul dialog Google resmi: Apakah Anda ingin membuat salinan dari Finance Tracker?.', '2. Uji Salinan Mandiri via Link /copy'),
    createBullet('Penguji wajib menguji alur instalasi Web App pada perangkat smartphone fisik (iPhone via Safari dan Android via Chrome).', '3. Simulasi Akses Smartphone Fisik'),
    createH1('3. Klasifikasi Tingkat Keparahan Bug (Severity Levels)'),
    createTable(
      ['Tingkat Keparahan', 'Kriteria & Dampak', 'Tindakan Operasional'],
      [
        ['Critical (Blocker)', 'Rumus spreadsheet rusak, saldo tidak sesuai, aplikasi tidak terbuka, otorisasi gagal.', 'Rilis DIBLOKIR. Pengembang wajib memperbaiki sebelum lanjut ke UAT.'],
        ['High (Major)', 'Fitur transfer gagal, validasi data tembus (angka 0 tersimpan), tombol PWA ponsel macet.', 'Wajib diperbaiki dan diuji ulang.'],
        ['Medium (Minor)', 'Teks label membingungkan pengguna awam, format titik ribuan terlambat muncul.', 'Diperbaiki dalam siklus perbaikan rilis perdana.'],
        ['Low (Trivial)', 'Saran perubahan warna, redaksi panduan kurang jelas, permintaan fitur baru.', 'Dicatat dalam dokumen Product Backlog.']
      ]
    ),
    createH1('4. Prosedur Uji Fase 1: Matriks Fungsional Internal (26 Skenario)'),
    createH2('A. Modul Input Transaksi Kas (PIC: Operations)'),
    createBullet('Input pengeluaran normal. Pastikan saldo terpotong dan form ter-reset.', 'TC-INP-01'),
    createBullet('Input pemasukan normal. Pastikan saldo bertambah dan laporan masuk ter-update.', 'TC-INP-02'),
    createBullet('Satu ketukan pada Smart Habit Chip. Pastikan nominal dan kategori terisi otomatis.', 'TC-INP-03'),
    createBullet('Format pemisah ribuan otomatis realtime saat mengetik angka nominal.', 'TC-INP-04'),
    createBullet('Input mutasi dengan tanggal mundur/lampau. Pastikan tanggal tersimpan presisi.', 'TC-INP-05'),
    createH2('B. Modul Akuntansi Kas & Saldo (PIC: Finance)'),
    createBullet('Kalkulasi Kekayaan Bersih (Net Worth) mencerminkan akumulasi saldo seluruh dompet aktif.', 'TC-BAL-01'),
    createBullet('Saldo Awal dompet baru masuk ke Net Worth tanpa menambah arus kas masuk bulan berjalan.', 'TC-BAL-02'),
    createBullet('Mutasi Transfer Antar Dompet memotong dompet asal, menambah dompet tujuan, Net Worth stabil.', 'TC-BAL-03'),
    createBullet('Koreksi Edit Transaksi membatalkan efek transaksi lama dan menerapkan data baru.', 'TC-BAL-04'),
    createBullet('Hapus Transaksi me-rollback saldo dompet asal kembali ke nilai sebelum transaksi dicatat.', 'TC-BAL-05'),
    createH2('C. Modul Ringkasan & Siklus Waktu (PIC: Finance + Operations)'),
    createBullet('Kartu Bulan Ini hanya menghitung mutasi yang jatuh di bulan aktif berjalan.', 'TC-SUM-01'),
    createBullet('Kartu Hari Ini hanya menghitung mutasi yang bertanggal hari ini.', 'TC-SUM-02'),
    createBullet('Pemilih bulan (Month Selector) di Buku Kas Bulanan dapat menampilkan rekapitulasi historis.', 'TC-SUM-03'),
    createBullet('Tampilan Buku Kas Harian menyajikan subtotal kas masuk dan keluar per hari secara rapi.', 'TC-SUM-04'),
    createH2('D. Modul Visualisasi & Grafik Dashboard (PIC: Operations + Finance)'),
    createBullet('Donut chart alokasi belanja kategori menghitung persentase proporsi secara valid (total 100%).', 'TC-DSH-01'),
    createBullet('Donut chart sebaran dompet menggambarkan porsi likuiditas kas tunai vs bank vs e-wallet.', 'TC-DSH-02'),
    createBullet('Bar progress anggaran kategori menghitung (Spent / Limit) * 100 tanpa tulisan undefined%.', 'TC-DSH-03'),
    createBullet('Kategori yang belanjanya melewati limit otomatis berubah menjadi penanda merah (Overbudget).', 'TC-DSH-04'),
    createH2('E. Modul Validasi & Keamanan Data (PIC: Operations + Finance)'),
    createBullet('Sistem menolak nominal transaksi <= 0 dengan pesan: Nominal transaksi harus lebih dari 0.', 'TC-VAL-01'),
    createBullet('Sistem menolak penyimpanan transaksi tanpa kantong dompet terpilih.', 'TC-VAL-02'),
    createBullet('Sistem menolak mutasi transfer jika rekening asal dan tujuan identik.', 'TC-VAL-03'),
    createBullet('Sistem menolak mutasi transfer jika rekening tujuan belum dipilih.', 'TC-VAL-04'),
    createBullet('Sistem menolak pembuatan dompet baru jika nama dompet dikosongkan.', 'TC-VAL-05'),
    createBullet('Sistem memblokir penghapusan dompet yang masih memiliki sisa saldo kas (> 0).', 'TC-VAL-06'),
    createBullet('Sistem menerapkan soft-delete (Aktif = false) jika dompet yang dihapus memiliki riwayat.', 'TC-VAL-07'),
    createH2('F. Modul Verifikasi Salinan Template (PIC: Operations)'),
    createBullet('Tautan /copy membuka halaman resmi konfirmasi Google Make a copy.', 'TC-CPY-01'),
    createBullet('Berkas tersalin secara mandiri ke Google Drive pembeli tanpa merusak Master Template.', 'TC-CPY-02'),
    createBullet('Menu toolbar [ Finance Tracker ] muncul dalam waktu < 5 detik setelah sheet dibuka.', 'TC-CPY-03'),
    createBullet('Dialog otorisasi Google dapat diselesaikan dengan memilih Advanced > Go to Finance Tracker.', 'TC-CPY-04'),
    createBullet('Kelima tab utama terformat sempurna saat pertama kali dibuka.', 'TC-CPY-05'),
    createBullet('Pengguna dapat melakukan deployment Web App mandiri untuk smartphone.', 'TC-CPY-06'),
    createBullet('Fitur Add to Home Screen menghasilkan ikon aplikasi mandiri di ponsel.', 'TC-CPY-07'),
    createH1('5. Prosedur Uji Fase 2: Pengujian Penerimaan Pengguna Asli (UAT)'),
    createP('Setelah seluruh 26 butir Fase 1 bertanda PASS, lakukan pengujian bersama 3–5 orang perwakilan pengguna nyata:'),
    createBullet('Berikan tautan /copy, amati apakah mereka berhasil menyalin dokumen ke Google Drive sendiri.', 'Tugas 1: Akses Mandiri'),
    createBullet('Amati apakah partisipan dapat melewati layar peringatan Google Apps Script dengan panduan User Guide.', 'Tugas 2: Otorisasi Mandiri'),
    createBullet('Minta partisipan mendaftarkan 1 rekening riil dan mengisi saldo awal mereka.', 'Tugas 3: Pengaturan Dompet'),
    createBullet('Minta partisipan mencatat 3 mutasi belanja harian mereka (bensin, makan, kopi) dari HP.', 'Tugas 4: Catat Transaksi'),
    createBullet('Minta partisipan membaca berapa total saldo dan sisa anggaran mereka bulan ini.', 'Tugas 5: Evaluasi Dashboard'),
    createH2('Formulir Evaluasi Pengguna Asli (UAT Feedback Form)'),
    createTable(
      ['Partisipan', 'Latar Belakang', 'Kendala yang Dihadapi', 'Skor Otorisasi (1-5)', 'Skor Input HP (1-5)', 'Keputusan'],
      [
        ['Tester 1', 'Freelancer', '[Catat kendala riil]', '[1 - 5]', '[1 - 5]', '[Puas / Butuh Perbaikan]'],
        ['Tester 2', 'Pemilik Toko UMKM', '[Catat kendala riil]', '[1 - 5]', '[1 - 5]', '[Puas / Butuh Perbaikan]'],
        ['Tester 3', 'Pengguna Awam', '[Catat kendala riil]', '[1 - 5]', '[1 - 5]', '[Puas / Butuh Perbaikan]']
      ]
    ),
    createH1('6. Syarat Ambang Batas Kelulusan (Release Gate Criteria)'),
    createP('Produk Finance Tracker baru dinyatakan SELESAI DIUJI & LAYAK JUAL (READY TO SELL) apabila:'),
    createBullet('26 dari 26 skenario fungsional berstatus PASS (100%).', '1. Fase 1 (Internal QA)'),
    createBullet('Minimal 80% partisipan pengguna asli menyatakan dapat mengoperasikan aplikasi secara mandiri.', '2. Fase 2 (User Testing)'),
    createBullet('Tidak ada bug berkategori Critical atau High yang belum terselesaikan.', '3. Nol Temuan Blocker'),
    createBullet('Lembar sign-off ditandatangani oleh PIC Operations, PIC Finance, dan Product Lead.', '4. Persetujuan Lengkap')
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(__dirname, '..', 'docs', '02_PANDUAN_PENGUJIAN_PRODUK.docx'), buffer);
  console.log('02_PANDUAN_PENGUJIAN_PRODUK.docx berhasil dibuat.');
}

// =========================================================================
// BUILD DOC 3: USER GUIDE (PANDUAN PENGGUNA)
// =========================================================================
async function buildDoc3() {
  const children = [
    createTitle('Panduan Pengguna: Finance Tracker'),
    createSubtitle('Personal & Business Edition — Edisi Rilis Perdana Pasca-Pengembangan'),
    createCallout('Format Dokumen', 'Panduan Pengguna Resmi untuk Pengguna Uji Coba & Pembeli Perdana (Versi 1.7.6).'),
    createDivider(),
    createH1('1. Selamat Datang di Finance Tracker'),
    createP('Selamat atas kepemilikan template Finance Tracker. Sistem ini memadukan kekuatan Google Sheets dengan kemudahan aplikasi web mobile (PWA), memungkinkan Anda mencatat mutasi kas secepat kilat tanpa biaya langganan bulanan (zero-subscription).'),
    createBullet('Berkas tersimpan di Google Drive pribadi Anda, bukan di server asing.', 'Privasi Terjamin 100%'),
    createBullet('Buka dari layar smartphone (Add to Home Screen) maupun dari toolbar Google Sheets komputer Anda.', 'Akses Fleksibel'),
    createBullet('Tabungan awal tercatat sebagai aset tanpa merusak laporan pemasukan bulanan berjalan.', 'Multi-Dompet & Saldo Awal'),
    createH1('2. Cara Membuat Salinan Template ke Google Drive Pribadi'),
    createP('Untuk menggunakan template, Anda cukup menduplikasi berkas Master Template ke akun Google Drive Anda dalam satu langkah mudah:'),
    createBullet('Pastikan Anda telah login ke akun Google di peramban komputer/laptop.', 'Langkah 1'),
    createBullet('Buka tautan akses template resmi berakhiran /copy.', 'Langkah 2'),
    createBullet('Layar peramban membuka konfirmasi resmi Google: Apakah Anda ingin membuat salinan dari Finance Tracker?.', 'Langkah 3'),
    createBullet('Klik tombol biru besar bertuliskan Buat salinan (Make a copy).', 'Langkah 4'),
    createBullet('Spreadsheet beserta seluruh sistem skrip aplikasinya tersalin utuh ke Google Drive Anda.', 'Langkah 5'),
    createH1('3. Otorisasi Keamanan Google Apps Script (Hanya 1 Kali)'),
    createP('Saat pertama kali membuka menu aplikasi di Google Sheets, Google mewajibkan konfirmasi otorisasi izin keamanan. Ini adalah prosedur resmi dan aman:'),
    createBullet('Segarkan halaman Google Sheets (F5) hingga muncul menu [ Finance Tracker ].', 'Langkah 1'),
    createBullet('Klik menu [ Finance Tracker ] > Buka di Panel Samping (Sidebar).', 'Langkah 2'),
    createBullet('Muncul kotak dialog Authorization Required, klik Continue (Lanjutkan).', 'Langkah 3'),
    createBullet('Pilih akun Google Anda.', 'Langkah 4'),
    createBullet('Saat muncul peringatan Google hasnt verified this app, klik tulisan kecil Advanced (Lanjutan) di kiri bawah.', 'Langkah 5'),
    createBullet('Klik tulisan Go to Finance Tracker (unsafe) / Buka Finance Tracker.', 'Langkah 6'),
    createBullet('Gulir ke bawah lalu klik tombol Allow (Izinkan). Seluruh tab sheet otomatis terbentuk.', 'Langkah 7'),
    createH1('4. Pengaturan Awal (Setup 5 Menit)'),
    createH2('A. Mengatur Kantong Dompet & Saldo Awal'),
    createP('Buka tab Dompet pada antarmuka aplikasi. Telah tersedia dompet standar: Dompet Tunai, BCA Tabungan, dan GoPay. Anda dapat menambahkan dompet baru dengan menekan tombol Tambah Dompet.'),
    createP('Masukkan Saldo Awal: Jumlah riil uang di rekening tersebut saat ini. Saldo awal ini otomatis menjadi modal awal di Kekayaan Bersih (Net Worth) tanpa mengotori laporan pemasukan bulanan berjalan.'),
    createH2('B. Menetapkan Batas Anggaran Berulang (Recurring Budgets)'),
    createP('Buka tab Anggaran. Tentukan kategori belanja (misal: Makan & Minum) dan tetapkan batas maksimal nominal bulanan (misal: Rp 1.500.000). Anggaran ini otomatis berulang setiap awal bulan baru.'),
    createH1('5. Cara Memasukkan Transaksi'),
    createBullet('Pilih tab Pengeluaran, isi nominal (titik ribuan muncul otomatis), pilih kategori dan dompet pemotong, lalu klik Simpan.', '1. Pengeluaran'),
    createBullet('Pilih tab Pemasukan, isi nominal pendapatan/gaji, pilih dompet penerima, lalu klik Simpan.', '2. Pemasukan'),
    createBullet('Gunakan saat tarik tunai ATM atau top-up e-wallet. Saldo dompet asal berkurang dan saldo dompet tujuan bertambah tanpa dihitung belanja.', '3. Transfer Kas Antar Dompet'),
    createBullet('Ketuk tombol cepat di bawah form untuk mengisi nominal, kategori, dan catatan secara seketika.', '4. Smart Habit Chips (1-Ketuk)'),
    createH1('6. Cara Membaca Dashboard & Buku Kas'),
    createBullet('Posisi likuiditas uang nyata Anda saat ini dari gabungan seluruh dompet aktif.', 'Total Saldo (Kekayaan Bersih)'),
    createBullet('Membandingkan total uang masuk vs keluar serta sisa kas bersih (Net Savings).', 'Arus Kas Hari Ini & Bulan Ini'),
    createBullet('Bar persentase batas belanja. Berubah menjadi penanda merah jika overbudget.', 'Progress Anggaran Belanja'),
    createBullet('Tampilan Harian (subtotal harian), Tampilan Bulanan (evaluasi bulanan), dan Tampilan Statistik (diagram donat).', 'Buku Kas (3 Tampilan)'),
    createBullet('Salah input? Buka Buku Kas, klik tombol Edit (ubah data) atau Hapus (rollback saldo otomatis).', 'Koreksi Transaksi (Edit & Hapus)'),
    createH1('7. Memasang di Layar Utama Smartphone (Add to Home Screen)'),
    createH2('Langkah 1: Buat Tautan Web App Pribadi'),
    createP('Di spreadsheet komputer, klik Ekstensi > Apps Script > tombol Deploy > New deployment > jenis Web app. Set Execute as = User accessing the web app, Who has access = Anyone with Google account. Klik Deploy dan salin URL Web App yang dihasilkan ke ponsel Anda.'),
    createH2('Langkah 2: Pasang di Layar Utama HP'),
    createBullet('Buka link di Safari > ketuk ikon Share (kotak panah atas) > pilih Add to Home Screen.', 'Pengguna iPhone (Safari)'),
    createBullet('Buka link di Chrome > ketuk Menu Titik Tiga > pilih Add to Home screen / Install app.', 'Pengguna Android (Chrome)'),
    createH1('8. Solusi Masalah Umum (Troubleshooting FAQ)'),
    createTable(
      ['Kendala', 'Penyebab Umum', 'Solusi Cepat'],
      [
        ['Menu [ Finance Tracker ] tidak muncul.', 'Pemuatan skrip berjalan atau dibuka di app spreadsheet mobile.', 'Buka lewat peramban komputer/laptop dan lakukan refresh (F5).'],
        ['Muncul pesan Authorization Required berulang.', 'Lebih dari 1 akun Google aktif di jendela peramban yang sama.', 'Gunakan jendela Incognito, login hanya dengan 1 akun pemilik file, otorisasi ulang.'],
        ['Tombol Hapus Dompet menampilkan galat.', 'Dompet masih memiliki sisa saldo kas (> 0).', 'Pindahkan sisa saldo melalui menu Transfer hingga 0 sebelum dihapus.'],
        ['Rumus spreadsheet terhapus tidak sengaja.', 'Sel formula tertekan atau terhapus manual.', 'Buka menu File > Version history > See version history, pulihkan versi sebelumnya.']
      ]
    ),
    createH1('9. Kontak Bantuan & Formulir Masukan Pengguna (Feedback)'),
    createP('Sebagai produk edisi rilis perdana pasca-pengembangan, kami sangat menghargai masukan pengalaman pengguna:'),
    createBullet('support@financetracker.local (atau kanal resmi toko penyedia).', 'Surel Bantuan'),
    createBullet('WhatsApp Layanan Pelanggan (tertera di nota pesanan digital Anda).', 'Layanan Pesan Cepat'),
    createBullet('Senin – Jumat, pukul 09:00 – 17:00 WIB (Respon maksimal 1 x 24 jam kerja).', 'Jam Operasional')
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(__dirname, '..', 'docs', '03_USER_GUIDE.docx'), buffer);
  console.log('03_USER_GUIDE.docx berhasil dibuat.');
}

// =========================================================================
// BUILD DOC 4: LICENSE & TERMS OF USE
// =========================================================================
async function buildDoc4() {
  const children = [
    createTitle('Surat Perjanjian Lisensi & Ketentuan Penggunaan'),
    createSubtitle('Finance Tracker — Personal & Business Edition (Edisi Rilis Perdana)'),
    createCallout('Nomor Registrasi Lisensi', 'LIC-OPS-FIN-2026-FT-V176 | Tanggal Berlaku Efektif: 26 Oktober 2026.'),
    createDivider(),
    createP('PEMBERITAHUAN HUKUM: DENGAN MEMBELI, MENYALIN, MENGUNDUH, MENGAKSES, ATAU MENGGUNAKAN TEMPLATE FINANCE TRACKER, ANDA SECARA SADAR DAN SUKARELA MENYATAKAN TELAH MEMBACA, MEMAHAMI, DAN SETUJU UNTUK TERIKAT OLEH SELURUH SYARAT DAN KETENTUAN DALAM PERJANJIAN INI.'),
    createH1('Pasal 1: Pemberian Lisensi Penggunaan (Grant of License)'),
    createBullet('Pemilik Hak Cipta memberikan kepada Pembeli suatu lisensi non-eksklusif, berlaku seumur hidup (perpetual), tidak dapat dipindahtangankan, dan terbatas untuk penggunaan tunggal (Single-User Standard License).', '1.1. Sifat Lisensi'),
    createBullet('Pembeli berhak menggunakan salinan Finance Tracker untuk mencatat dan mengelola keuangan perorangan, rumah tangga, atau arus kas usaha mikro (UMKM) yang dimiliki secara langsung oleh Pembeli pada akun Google Drive pribadi.', '1.2. Lingkup Hak Pakai'),
    createH1('Pasal 2: Hak Modifikasi dan Tanggung Jawab Teknis'),
    createBullet('Pembeli berhak penuh untuk mengubah formula spreadsheet, menambah kolom/sheet, atau memodifikasi kode skrip Google Apps Script untuk kebutuhan internal.', '2.1. Hak Modifikasi'),
    createBullet('Segala bentuk kerusakan formula, terhapusnya skrip bawaan, atau inkonsistensi saldo akibat modifikasi mandiri sepenuhnya menjadi tanggung jawab Pembeli.', '2.2. Tanggung Jawab Modifikasi'),
    createH1('Pasal 3: Larangan Distribusi, Penggandaan, dan Pembajakan'),
    createBullet('Dilarang menjual kembali, melisensikan ulang, menyewakan, meminjamkan, atau memperdagangkan template ini baik asli maupun modifikasi.', '3.1. Larangan Penjualan Kembali (No Resale)'),
    createBullet('Dilarang membagikan link /copy, mengunggah template ke forum publik, grup percakapan massal, atau platform sharing terbuka.', '3.2. Larangan Distribusi Massal (No Redistribution)'),
    createBullet('Seluruh hak cipta kode, formula, dan antarmuka dilindungi Undang-Undang Republik Indonesia Nomor 28 Tahun 2014 tentang Hak Cipta.', '3.3. Perlindungan Kekayaan Intelektual'),
    createH1('Pasal 4: Pembaruan Sistem dan Cakupan Bantuan Teknis'),
    createBullet('Pembaruan bug minor akan disediakan melalui portal unduhan resmi tanpa biaya tambahan.', '4.1. Pembaruan Berkas'),
    createBullet('Mencakup panduan duplikasi berkas, penyelesaian kendala otorisasi Google Apps Script standar, dan penjelasan fitur bawaan.', '4.2. Bantuan Teknis Standar'),
    createBullet('Tidak mencakup pembuatan fitur kustom baru sesuai permintaan khusus, integrasi API bank luar, atau perbaikan formula rusak akibat kelalaian pengguna.', '4.3. Pengecualian Layanan'),
    createH1('Pasal 5: Kebijakan Pengembalian Dana (Refund Policy)'),
    createBullet('Mengingat produk berbentuk perangkat lunak digital instan (instant digital download), seluruh transaksi bersifat final dan non-refundable.', '5.1. Sifat Barang Digital'),
    createBullet('Pengembalian dana penuh hanya diproses jika tautan master terbukti rusak permanen dan tim teknis tidak mampu memberikan tautan pengganti dalam 3 x 24 jam kerja.', '5.2. Garansi Kerusakan Permanen'),
    createH1('Pasal 6: Batasan Tanggung Jawab & Sanggahan Finansial (Disclaimer)'),
    createBullet('Produk berfungsi murni sebagai alat bantu administratif pencatatan kas, bukan penasihat keuangan berlisensi atau kantor akuntan publik.', '6.1. Bukan Nasihat Finansial Resmi'),
    createBullet('Akurasi angka saldo riil sepenuhnya bergantung pada ketepatan data yang diinput oleh pengguna.', '6.2. Akurasi Data Input'),
    createBullet('Pembuat produk dibebaskan dari tuntutan atas downtime, perubahan kuota API, atau perubahan kebijakan sepihak oleh Google LLC.', '6.3. Ketergantungan Layanan Google'),
    createH1('Pasal 7: Pengesahan dan Ketentuan Penutup'),
    createTable(
      ['Otoritas Persetujuan', 'Divisi', 'Status Pengesahan'],
      [
        ['Manajer Operasional Produk', 'Operations Team', 'Disahkan Sah (Legally Validated)'],
        ['Manajer Kepatuhan & Keuangan', 'Finance Team', 'Disahkan Sah (Financially Approved)']
      ]
    )
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(__dirname, '..', 'docs', '04_LICENSE_AND_TERMS_OF_USE.docx'), buffer);
  console.log('04_LICENSE_AND_TERMS_OF_USE.docx berhasil dibuat.');
}

async function main() {
  await buildDoc1();
  await buildDoc2();
  await buildDoc3();
  await buildDoc4();
  console.log('Seluruh 4 berkas DOCX berhasil digenerate.');
}

main().catch(err => {
  console.error('Error generator DOCX:', err);
  process.exit(1);
});
