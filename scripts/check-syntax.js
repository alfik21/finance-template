/**
 * scripts/check-syntax.js
 * Menguji sintaks seluruh script inline pada artefak hasil generate:
 *   WebApp.html, preview.html, demo/index.html, demo/WebApp.html
 *
 * Dipakai lokal (`npm run test:syntax`) dan di CI sebagai gerbang mutu,
 * agar perubahan `src/frontend` yang menghasilkan script rusak tertangkap
 * sebelum file di-commit.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.join(__dirname, "..");
const targets = [
  "WebApp.html",
  "preview.html",
  "demo/index.html",
  "demo/WebApp.html",
  "tests/fixtures/app-test.html",
];

const SCRIPT_RE = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;

let totalScripts = 0;
let failures = 0;

for (const rel of targets) {
  const abs = path.join(rootDir, rel);
  if (!fs.existsSync(abs)) {
    console.error("GAGAL: berkas tidak ditemukan: " + rel);
    failures++;
    continue;
  }
  const html = fs.readFileSync(abs, "utf8");
  let match;
  let index = 0;
  while ((match = SCRIPT_RE.exec(html)) !== null) {
    index++;
    totalScripts++;
    try {
      new vm.Script(match[1], { filename: rel + "#script" + index });
    } catch (err) {
      failures++;
      console.error("GAGAL: sintaks script rusak di " + rel + " blok #" + index + ": " + err.message);
    }
  }
  console.log(rel + ": " + index + " script inline diperiksa");
}

if (failures > 0) {
  console.error("Pemeriksaan sintaks GAGAL (" + failures + " masalah).");
  process.exit(1);
}
console.log("Pemeriksaan sintaks LULUS: " + totalScripts + " script inline, 0 galat.");
