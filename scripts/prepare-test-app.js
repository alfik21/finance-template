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

// 4. Evaluasi tag dinamis GAS seperti <?= userEmail ?>, <?= mode ?>, dan tanggal hari ini
const todayStr = new Date().toISOString().substring(0, 10);
indexContent = indexContent.replace(/<\?=\s*typeof\s+userEmail[^>]*\?>/g, 'test@example.com');
indexContent = indexContent.replace(/<\?=\s*typeof\s+mode[^>]*\?>/g, 'FULL');
indexContent = indexContent.replace(/<\?=\s*new\s+Date\(\)\.toISOString\(\)\.substring\(0,\s*10\)\s*\?>/g, todayStr);

// 5. Simpan standalone web app ke tests/fixtures/app-test.html
const fixtureDir = path.join(rootDir, 'tests', 'fixtures');
if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });

const targetPath = path.join(fixtureDir, 'app-test.html');
fs.writeFileSync(targetPath, indexContent, 'utf-8');
console.log('Test fixture berhasil digenerate di: ' + targetPath);

// 6. Simpan WebApp.html di root dan di demo/
const rootWebAppPath = path.join(rootDir, 'WebApp.html');
fs.writeFileSync(rootWebAppPath, indexContent, 'utf-8');
console.log('Root WebApp.html berhasil diperbarui di: ' + rootWebAppPath);

const demoDir = path.join(rootDir, 'demo');
if (!fs.existsSync(demoDir)) fs.mkdirSync(demoDir, { recursive: true });

const demoWebAppPath = path.join(demoDir, 'WebApp.html');
fs.writeFileSync(demoWebAppPath, indexContent, 'utf-8');
console.log('Demo WebApp HTML berhasil disinkronkan di: ' + demoWebAppPath);

// 7. Simpan preview.html sebagai Halaman Showcase Interaktif (sinkron dengan demo/index.html)
const demoIndexPath = path.join(demoDir, 'index.html');
if (fs.existsSync(demoIndexPath)) {
  const showcaseContent = fs.readFileSync(demoIndexPath, 'utf-8');
  const previewPath = path.join(rootDir, 'preview.html');
  fs.writeFileSync(previewPath, showcaseContent, 'utf-8');
  console.log('Showcase preview.html berhasil diperbarui di: ' + previewPath);
}
