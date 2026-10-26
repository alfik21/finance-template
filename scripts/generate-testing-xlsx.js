const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function createBlankTestingWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Operations & Finance Team';
  workbook.lastModifiedBy = 'Operations Team';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==========================================
  // SHEET 1: DASHBOARD_UJI (BLANK TEMPLATE)
  // ==========================================
  const dashSheet = workbook.addWorksheet('DASHBOARD_UJI', {
    views: [{ showGridLines: true }]
  });

  dashSheet.columns = [
    { width: 38 },
    { width: 34 },
    { width: 22 },
    { width: 24 }
  ];

  // Header Title
  dashSheet.mergeCells('A1:D1');
  const titleCell = dashSheet.getCell('A1');
  titleCell.value = 'DASHBOARD KENDALI MUTU (PRODUK BARU SELESAI PENGEMBANGAN)';
  titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A34' } }; // Sage Dark
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  dashSheet.getRow(1).height = 36;

  // Metadata
  dashSheet.addRow([]);
  dashSheet.addRow(['Status Siklus Produk', 'Baru Selesai Koding (Menunggu Uji Internal & Pengguna Asli)']);
  dashSheet.addRow(['Versi Target Rilis', '1.7.5 (Container-Bound Edition)']);
  dashSheet.addRow(['Divisi Penguji (PIC)', 'Finance + Operations + Pilot Users']);
  dashSheet.addRow(['Dokumen Panduan SOP', 'docs/02_PANDUAN_PENGUJIAN_PRODUK.md']);

  for (let r = 3; r <= 6; r++) {
    dashSheet.getCell(`A${r}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF475569' } };
    dashSheet.getCell(`B${r}`).font = { name: 'Arial', size: 10, color: { argb: 'FF0F172A' } };
  }

  // Metric Section
  dashSheet.addRow([]);
  const metricHeaderRow = dashSheet.addRow(['METRIK PENGUJIAN PRODUK BARU', 'FORMULA SPREADSHEET', 'NILAI SAAT INI', 'TARGET KELULUSAN']);
  metricHeaderRow.height = 24;
  metricHeaderRow.eachCell(cell => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const metricsData = [
    ['Total Kasus Uji Fungsional', '=COUNTA(MATRIKS_UJI!A2:A27)', 26, 26],
    ['Skenario Lulus (PASS)', '=COUNTIF(MATRIKS_UJI!F2:F27, "PASS")', 0, 26],
    ['Skenario Gagal (FAIL)', '=COUNTIF(MATRIKS_UJI!F2:F27, "FAIL")', 0, 0],
    ['Skenario Belum Diuji (PENDING)', '=COUNTIF(MATRIKS_UJI!F2:F27, "PENDING")', 26, 0],
    ['Tingkat Kelulusan (Pass Rate)', '=C10/C9', 0.0, 1.0],
    ['Status Kesiapan Komersial', '=IF(C13=1, "LAYAK JUAL (READY TO SELL)", "DITAHAN (HOLD)")', 'DITAHAN (HOLD)', 'LAYAK JUAL']
  ];

  metricsData.forEach(row => {
    const r = dashSheet.addRow(row);
    r.height = 22;
    r.getCell(1).font = { name: 'Arial', size: 10, bold: true };
    r.getCell(2).font = { name: 'Courier New', size: 9, color: { argb: 'FF475569' } };
    r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Format Pass Rate as %
  dashSheet.getCell('C13').numFmt = '0.0%';
  dashSheet.getCell('D13').numFmt = '0.0%';
  dashSheet.getCell('C14').font = { bold: true, color: { argb: 'FFDC2626' } }; // Red if on hold

  // Sign-off Section
  dashSheet.addRow([]);
  dashSheet.addRow([]);
  const signHeaderRow = dashSheet.addRow(['LEMBAR PERSETUJUAN RILIS BERTAHAP', 'PENANGGUNG JAWAB (PIC)', 'TANGGAL VERIFIKASI', 'STATUS KEPUTUSAN']);
  signHeaderRow.height = 24;
  signHeaderRow.eachCell(cell => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const signOffData = [
    ['Tahap 1: Verifikasi Fungsional Internal', 'Operations Team', '', '[Pending QA]'],
    ['Tahap 1: Verifikasi Rumus & Rekonsiliasi Saldo', 'Finance Team', '', '[Pending QA]'],
    ['Tahap 2: Uji Coba Pengguna Asli (UAT)', '3-5 Pilot Users', '', '[Pending UAT]'],
    ['Persetujuan Akhir Rilis Penjualan Publik', 'Operations Lead', '', '[Pending Sign-Off]']
  ];

  signOffData.forEach(row => {
    const r = dashSheet.addRow(row);
    r.height = 22;
    r.getCell(1).font = { name: 'Arial', size: 10, bold: true };
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(4).font = { italic: true, color: { argb: 'FF64748B' } };
  });

  // ==========================================
  // SHEET 2: MATRIKS_UJI (BLANK TEMPLATE)
  // ==========================================
  const matrixSheet = workbook.addWorksheet('MATRIKS_UJI', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }]
  });

  matrixSheet.columns = [
    { header: 'Test ID', key: 'id', width: 14 },
    { header: 'Modul', key: 'module', width: 15 },
    { header: 'Fitur & Skenario', key: 'scenario', width: 28 },
    { header: 'Expected Result', key: 'expected', width: 55 },
    { header: 'Actual Result', key: 'actual', width: 35 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'PIC', key: 'pic', width: 15 },
    { header: 'Tanggal Uji', key: 'date', width: 14 },
    { header: 'Catatan / Evidence', key: 'notes', width: 45 }
  ];

  const headerRow = matrixSheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell(cell => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A34' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Raw data items with blank results
  const testCases = [
    ['TC-INP-01', 'Input Kas', 'Input Pengeluaran Normal', 'Mutasi tersimpan ke sheet TRANSAKSI, form ter-reset, saldo dompet terpotong sesuai nominal.', '', 'PENDING', 'Operations', '', ''],
    ['TC-INP-02', 'Input Kas', 'Input Pemasukan Normal', 'Mutasi tersimpan bertipe Income, saldo dompet tujuan bertambah, laporan bulanan ter-update.', '', 'PENDING', 'Finance', '', ''],
    ['TC-INP-03', 'Input Kas', 'Pintasan Habit Chip', 'Satu ketukan pada chip mengisi nominal, kategori, dan catatan secara presisi tanpa salah ketik.', '', 'PENDING', 'Operations', '', ''],
    ['TC-INP-04', 'Input Kas', 'Format Ribuan Otomatis', 'Mengetik 150000 otomatis memunculkan titik pemisah ribuan 150.000 realtime.', '', 'PENDING', 'Operations', '', ''],
    ['TC-INP-05', 'Input Kas', 'Input Tanggal Kustom', 'Transaksi bertanggal lampau tersimpan persis sesuai tanggal input, bukan tanggal hari ini.', '', 'PENDING', 'Operations', '', ''],
    ['TC-BAL-01', 'Akuntansi', 'Kalkulasi Net Worth', 'Total Kekayaan Bersih sama dengan total saldo seluruh dompet aktif yang dijumlahkan.', '', 'PENDING', 'Finance', '', ''],
    ['TC-BAL-02', 'Akuntansi', 'Isolasi Saldo Awal Dompet', 'Nilai Saldo Awal menambah Net Worth tanpa menggelembungkan total pemasukan bulanan berjalan.', '', 'PENDING', 'Finance', '', ''],
    ['TC-BAL-03', 'Akuntansi', 'Mutasi Transfer Antar Dompet', 'Dompet asal terpotong, dompet tujuan bertambah, Net Worth stabil, tidak dihitung belanja.', '', 'PENDING', 'Finance', '', ''],
    ['TC-BAL-04', 'Akuntansi', 'Koreksi Transaksi (Edit)', 'Mengubah nominal/dompet membatalkan dampak mutasi lama dan menerapkan mutasi baru.', '', 'PENDING', 'Finance', '', ''],
    ['TC-BAL-05', 'Akuntansi', 'Hapus Transaksi (Rollback)', 'Menghapus mutasi mengembalikan saldo dompet asal secara presisi ke posisi semula.', '', 'PENDING', 'Finance', '', ''],
    ['TC-SUM-01', 'Ringkasan', 'Arus Kas Bulan Aktif', 'Kartu Bulan Ini menghitung hanya transaksi yang terjadi di dalam periode bulan aktif berjalan.', '', 'PENDING', 'Finance', '', ''],
    ['TC-SUM-02', 'Ringkasan', 'Arus Kas Hari Ini', 'Kartu Hari Ini di dashboard hanya menampilkan total mutasi dengan tanggal sistem saat ini.', '', 'PENDING', 'Operations', '', ''],
    ['TC-SUM-03', 'Ringkasan', 'Pemilih Bulan (Selector)', 'Memilih bulan pada Buku Kas menyajikan rekapitulasi masuk, keluar, dan sisa kas bulan terkait.', '', 'PENDING', 'Finance', '', ''],
    ['TC-SUM-04', 'Ringkasan', 'Subtotal Harian', 'Setiap grup tanggal di Buku Kas menampilkan subtotal penerimaan dan pengeluaran per hari.', '', 'PENDING', 'Operations', '', ''],
    ['TC-DSH-01', 'Visual', 'Diagram Donut Belanja', 'Proporsi alokasi belanja kategori terhitung dalam persentase yang valid total 100%.', '', 'PENDING', 'Operations', '', ''],
    ['TC-DSH-02', 'Visual', 'Diagram Sebaran Dompet', 'Proporsi likuiditas saldo kas tunai, bank, dan e-wallet digambarkan secara proporsional.', '', 'PENDING', 'Finance', '', ''],
    ['TC-DSH-03', 'Visual', 'Progress Anggaran Belanja', 'Indikator rasio anggaran (Spent / Limit) * 100 tampil akurat tanpa tulisan undefined%.', '', 'PENDING', 'Finance', '', ''],
    ['TC-DSH-04', 'Visual', 'Status Batas Overbudget', 'Kategori belanja yang melampaui limit anggaran otomatis berubah menjadi indikator batas merah.', '', 'PENDING', 'Operations', '', ''],
    ['TC-VAL-01', 'Validasi', 'Nominal Kosong atau Nol', 'Menolak simpan transaksi bernilai <= 0 dengan pesan Nominal transaksi harus lebih dari 0.', '', 'PENDING', 'Operations', '', ''],
    ['TC-VAL-02', 'Validasi', 'Dompet Asal Kosong', 'Menolak simpan tanpa pemilihan dompet dengan pesan Kantong dompet wajib dipilih.', '', 'PENDING', 'Operations', '', ''],
    ['TC-VAL-03', 'Validasi', 'Transfer Dompet Sama', 'Menolak transfer ke rekening yang sama: Rekening asal dan tujuan tidak boleh sama.', '', 'PENDING', 'Operations', '', ''],
    ['TC-VAL-04', 'Validasi', 'Transfer Tujuan Kosong', 'Menolak transfer tanpa tujuan: Rekening tujuan wajib dipilih untuk transfer kas.', '', 'PENDING', 'Operations', '', ''],
    ['TC-VAL-05', 'Validasi', 'Tambah Dompet Tanpa Nama', 'Menolak pembuatan dompet baru tanpa nama: Nama dompet wajib diisi.', '', 'PENDING', 'Operations', '', ''],
    ['TC-VAL-06', 'Validasi', 'Hapus Dompet Bersaldo', 'Memblokir hapus dompet bersaldo > 0 dan meminta pemindahan dana terlebih dahulu.', '', 'PENDING', 'Finance', '', ''],
    ['TC-VAL-07', 'Validasi', 'Soft Delete Dompet Riwayat', 'Dompet bersaldo 0 yang memiliki riwayat mutasi lampau ditandai status Aktif = false.', '', 'PENDING', 'Finance', '', ''],
    ['TC-CPY-01', 'Distribusi', 'Akses Link Trik /copy', 'Tautan /copy menampilkan laman resmi konfirmasi Google Make a copy tanpa perlu izin akses.', '', 'PENDING', 'Operations', '', ''],
    ['TC-CPY-02', 'Distribusi', 'Isolasi Berkas Pembeli', 'Berkas tersimpan di Google Drive pembeli; perubahan tidak berdampak pada Master Template.', '', 'PENDING', 'Operations', '', ''],
    ['TC-CPY-03', 'Distribusi', 'Kemunculan Menu Toolbar', 'Menu bar [ Finance Tracker ] muncul otomatis di toolbar atas spreadsheet (< 5 detik).', '', 'PENDING', 'Operations', '', ''],
    ['TC-CPY-04', 'Distribusi', 'Otorisasi Script Pengguna', 'Dialog otorisasi keamanan Google berjalan mulus melalui opsi Advanced > Go to Finance Tracker.', '', 'PENDING', 'Operations', '', ''],
    ['TC-CPY-05', 'Distribusi', 'Inisialisasi Otomatis Sheet', 'Berkas otomatis membentuk tab DASHBOARD, TRANSAKSI, DOMPET, KATEGORI, ANGGARAN terformat rapi.', '', 'PENDING', 'Operations', '', ''],
    ['TC-CPY-06', 'Distribusi', 'Deploy Web App Mandiri', 'Pembeli dapat men-deploy Web App pribadi dan mengaksesnya lancar via browser ponsel.', '', 'PENDING', 'Operations', '', ''],
    ['TC-CPY-07', 'Distribusi', 'Pasang ke Layar HP (PWA)', 'Add to Home Screen menghasilkan shortcut mandiri berlayar penuh tanpa bilah URL peramban.', '', 'PENDING', 'Operations', '', '']
  ];

  testCases.forEach((tc, idx) => {
    const row = matrixSheet.addRow(tc);
    row.height = 20;

    // Zebra striping
    if (idx % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });
    }

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF92400E' } };
    row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Light yellow PENDING badge

    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const outputPath = path.join(__dirname, '..', 'docs', '02_PRODUCT_TESTING_CHECKLIST.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log('Workbook XLSX Template Kosong berhasil dibuat di:', outputPath);
}

createBlankTestingWorkbook().catch(err => {
  console.error('Gagal membuat XLSX:', err);
  process.exit(1);
});
