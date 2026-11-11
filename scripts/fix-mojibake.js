// Fix mojibake: teks UTF-8 yang salah dibaca sebagai latin-1 lalu disimpan ulang.
// Jalankan sekali dari root repo: node scripts/fix-mojibake.js
"use strict";
const fs = require("fs");
const path = require("path");

const REPAIRS = [
  ["—", "—"], // em dash
  ["–", "–"], // en dash
  ["→", "→"], // panah kanan
  ["│", "│"], // garis tegak pohon direktori
  ["├──", "├──"], // cabang pohon
  ["└──", "└──"], // cabang akhir pohon
  ["─", "─"], // garis mendatar pohon (sisa yang terpisah)
  ["'", "'"], // apostrof
  [""", "\""], // kutip buka
  ["â€\u009d", "\""], // kutup tutup
  ["€", "€"], // euro
];

const SKIP = new Set(["node_modules", ".git", "test-results", ".frontend-slides"]);
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(md|js|html|json)$/.test(e.name)) files.push(p);
  }
})(process.cwd());

let changed = 0;
for (const f of files) {
  const before = fs.readFileSync(f, "utf8");
  let after = before;
  for (const [bad, good] of REPAIRS) after = after.split(bad).join(good);
  if (after !== before) {
    fs.writeFileSync(f, after, "utf8");
    changed++;
    console.log("diperbaiki:", f);
  }
}
console.log(`Selesai. ${changed} berkas diperbaiki dari ${files.length} berkas diperiksa.`);
