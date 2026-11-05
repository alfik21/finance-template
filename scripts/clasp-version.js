/**
 * scripts/clasp-version.js
 * R-19: samakan nomor versi deployment Apps Script dengan versi package.json.
 * Dipakai oleh `npm run deploy` setelah `clasp push`.
 */
"use strict";

const { spawnSync } = require("child_process");
const pkg = require("../package.json");

const version = String(pkg.version || "").trim();
if (!version) {
  console.error("Versi package.json tidak ditemukan.");
  process.exit(1);
}

const result = spawnSync("clasp", ["version", "v" + version], {
  stdio: "inherit",
  shell: true,
});

if (result.error) {
  console.error("Gagal menjalankan clasp: " + result.error.message);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
