const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'src', 'frontend', 'Index.html');
const stylesPath = path.join(rootDir, 'src', 'frontend', 'Styles.html');
const appPath = path.join(rootDir, 'src', 'frontend', 'App.html');
const mockPath = path.join(rootDir, 'tests', 'mocks', 'google-script-mock.js');

let indexContent = fs.readFileSync(indexPath, 'utf-8');
const stylesContent = fs.readFileSync(stylesPath, 'utf-8');
const appContent = fs.readFileSync(appPath, 'utf-8');
const mockContent = fs.readFileSync(mockPath, 'utf-8');

// 1. Ganti tag template Styles (<?!= include('frontend/Styles'); ?>)
indexContent = indexContent.replace(/<\?!=\s*include\(['"]frontend\/Styles['"]\);\s*\?>/g, stylesContent);

// 2. Siapkan script mock
const injectedMock = `<script>\n${mockContent}\n</script>\n`;

// 3. Ganti tag template App (<?!= include('frontend/App'); ?>) dan sisipkan mock sebelum App.html
indexContent = indexContent.replace(/<\?!=\s*include\(['"]frontend\/App['"]\);\s*\?>/g, injectedMock + appContent);

// 4. Evaluasi tag dinamis GAS seperti <?= userEmail ?> dan <?= mode ?>.
//    D-04: email demo yang netral, bukan test@example.com.
//    D-22: tidak ada tanggal yang ditulis ke artefak, sehingga build deterministik
//    dan `npm test` tidak mengotori git hanya karena tanggal berganti.
indexContent = indexContent.replace(/<\?=\s*typeof\s+userEmail[^>]*\?>/g, 'Pengguna Demo');
indexContent = indexContent.replace(/<\?=\s*typeof\s+mode[^>]*\?>/g, 'FULL');

// Sisa tag scriptlet GAS yang tidak dikenal harus tetap aman ditampilkan sebagai teks.
// (Tidak ada lagi substitusi tanggal di sini - lihat catatan D-22.)

// 5. Simpan standalone web app ke tests/fixtures/app-test.html
const fixtureDir = path.join(rootDir, 'tests', 'fixtures');
if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });

const GENERATED_HEADER =
  '<!-- FILE HASIL GENERATE (scripts/prepare-test-app.js). Jangan edit manual; ubah sumbernya di src/frontend. -->\n';

const targetPath = path.join(fixtureDir, 'app-test.html');
fs.writeFileSync(targetPath, GENERATED_HEADER + indexContent, 'utf-8');
console.log('Test fixture berhasil digenerate di: ' + targetPath);

// 6. Simpan WebApp.html di root dan di demo/
const rootWebAppPath = path.join(rootDir, 'WebApp.html');
fs.writeFileSync(rootWebAppPath, GENERATED_HEADER + indexContent, 'utf-8');
console.log('Root WebApp.html berhasil diperbarui di: ' + rootWebAppPath);

const demoDir = path.join(rootDir, 'demo');
if (!fs.existsSync(demoDir)) fs.mkdirSync(demoDir, { recursive: true });

const demoWebAppPath = path.join(demoDir, 'WebApp.html');
fs.writeFileSync(demoWebAppPath, GENERATED_HEADER + indexContent, 'utf-8');
console.log('Demo WebApp HTML berhasil disinkronkan di: ' + demoWebAppPath);

// 7. Simpan preview.html sebagai Halaman Showcase Interaktif (sinkron dengan demo/index.html)
const demoIndexPath = path.join(demoDir, 'index.html');
if (fs.existsSync(demoIndexPath)) {
  let showcaseContent = fs.readFileSync(demoIndexPath, 'utf-8');
  // D-19: preview.html berada di root, sedangkan aset demo ada di demo/assets.
  // Tanpa penyesuaian ini, preview.html yang dihosting sendiri akan 404 pada
  // tailwindcss.js. Link WebApp.html tetap valid karena root juga punya WebApp.html.
  showcaseContent = showcaseContent.replace(
    /(<script src=")assets\/tailwindcss\.js("><\/script>)/g,
    '$1demo/assets/tailwindcss.js$2'
  );
  // FASE 3: og:image/twitter:image ikut dialihkan ke paket demo (pola yang sama
  // dengan tailwindcss.js) agar preview.html di root tidak 404.
  showcaseContent = showcaseContent.replace(
    /(content=")assets\/og-cover\.png(")/g,
    '$1demo/assets/og-cover.png$2'
  );
  const previewPath = path.join(rootDir, 'preview.html');
  fs.writeFileSync(previewPath, GENERATED_HEADER + showcaseContent, 'utf-8');
  console.log('Showcase preview.html berhasil diperbarui di: ' + previewPath);
}
