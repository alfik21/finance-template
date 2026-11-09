/**
 * tests/backend/harness.js
 * Harness uji backend GAS (D-21): menjalankan src/backend/*.js apa adanya
 * di dalam vm Node dengan tiruan SpreadsheetApp / Session / LockService /
 * HtmlService / PropertiesService, sehingga logika produk asli (bukan mock
 * frontend) yang diuji tanpa dependensi eksternal.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const BACKEND_FILES = ["Code.js", "SetupService.js", "TransactionService.js"];

/* -------------------------------------------------------------------------- */
/* Tiruan sheet                                                               */
/* -------------------------------------------------------------------------- */

function makeSheet(name, rows) {
  const sheet = {
    name,
    rows: rows.map((r) => r.slice()),
    _tabColor: null,
    _frozen: 0,
    getDataRange() {
      return {
        getValues: () => sheet.rows.map((r) => r.slice()),
      };
    },
    getLastRow() {
      return sheet.rows.length;
    },
    appendRow(row) {
      sheet.rows.push(row.slice());
    },
    deleteRow(idx1) {
      sheet.rows.splice(idx1 - 1, 1);
    },
    deleteRows(fromRow1, count) {
      sheet.rows.splice(fromRow1 - 1, count);
      return sheet;
    },
    insertRowAfter(idx1) {
      sheet.rows.splice(idx1, 0, []);
    },
    setFrozenRows(n) {
      sheet._frozen = n;
      return sheet;
    },
    setTabColor(c) {
      sheet._tabColor = c;
      return sheet;
    },
    getRange(row, col, numRows = 1, numCols = 1) {
      const readValues = () => {
        const out = [];
        for (let r = 0; r < numRows; r++) {
          const line = sheet.rows[row - 1 + r] || [];
          const outLine = [];
          for (let c = 0; c < numCols; c++) {
            const idx = col - 1 + c;
            outLine.push(idx < line.length ? line[idx] : "");
          }
          out.push(outLine);
        }
        return out;
      };
      const writeValues = (values) => {
        values.forEach((rowVals, i) => {
          const targetRow = row - 1 + i;
          while (sheet.rows.length <= targetRow) sheet.rows.push([]);
          const line = sheet.rows[targetRow];
          rowVals.forEach((v, j) => {
            const targetCol = col - 1 + j;
            while (line.length <= targetCol) line.push("");
            line[targetCol] = v;
          });
        });
      };
      const range = {
        getValues: readValues,
        getValue: () => readValues()[0][0],
        setValues: (values) => {
          writeValues(values);
          return range;
        },
        setValue: (v) => {
          writeValues([[v]]);
          return range;
        },
        setNumberFormat: () => range,
        setFontWeight: () => range,
        setBackground: () => range,
        setFontColor: () => range,
        setFontSize: () => range,
      };
      return range;
    },
  };
  return sheet;
}

/* -------------------------------------------------------------------------- */
/* Harness                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * @param {object} options
 *   options.sheets       : objek { NAMA: rows[] } (baris pertama = header)
 *   options.email        : Session.getActiveUser().getEmail()
 *   options.ownerEmail   : Session.getEffectiveUser().getEmail()
 *   options.properties   : Script Properties { KEY: value }
 *   options.templateFiles: daftar nama file template HTML yang "terpasang"
 *                          (mis. ['Index','Styles','App'] atau ['frontend/Index', ...])
 *   options.lockMode     : 'ok' | 'busy' | 'missing' (default 'ok')
 *   options.promptResponse: { button: 'ok' | 'cancel', text: string } untuk
 *                          mock ui.prompt (default: 'cancel')
 */
function createHarness(options = {}) {
  const {
    sheets = {},
    email = "owner@example.com",
    ownerEmail = "owner@example.com",
    properties = {},
    templateFiles = ["Index", "Styles", "App"],
    lockMode = "ok",
    promptResponse = { button: "cancel", text: "" },
  } = options;

  const sheetsObj = {};
  Object.keys(sheets).forEach((name) => {
    sheetsObj[name] = makeSheet(name, sheets[name]);
  });

  const warnings = [];
  const lockLog = { acquired: 0, released: 0 };
  const uiLog = { alerts: [], modals: [], sidebars: [], menus: [], prompts: [] };

  const ss = {
    getSheetByName: (n) => sheetsObj[n] || null,
    insertSheet: (n) => {
      sheetsObj[n] = makeSheet(n, []);
      return sheetsObj[n];
    },
    toast: () => {},
  };

  const lock = {
    tryLock: () => {
      if (lockMode === "busy") return false;
      lockLog.acquired++;
      return true;
    },
    releaseLock: () => {
      lockLog.released++;
    },
  };

  const ui = {
    // alert() bisa dipanggil sebagai alert(msg) atau alert(title, body, buttons);
    // keduanya dicatat sebagai satu string agar mudah di-assert.
    alert: (a, b) => uiLog.alerts.push(b !== undefined ? String(a) + ": " + String(b) : String(a)),
    showModalDialog: (html, title) => uiLog.modals.push({ html, title }),
    showSidebar: (html) => uiLog.sidebars.push(html),
    prompt: (title, message) => {
      uiLog.prompts.push({ title, message });
      return {
        getSelectedButton: () => promptResponse.button,
        getResponseText: () => promptResponse.text,
      };
    },
    Button: { OK: "ok", CANCEL: "cancel", CLOSE: "close" },
    ButtonSet: { OK: "ok", OK_CANCEL: "ok_cancel" },
    createMenu: (caption) => {
      const items = [];
      let separators = 0;
      const menu = {
        addItem: (itemCaption, funcName) => {
          items.push({ caption: itemCaption, functionName: funcName });
          return menu;
        },
        addSeparator: () => {
          separators++;
          return menu;
        },
        addToUi: () => {
          uiLog.menus.push({ caption, items: items.slice(), separators });
          return menu;
        },
      };
      return menu;
    },
  };

  const makeOutput = (file, kind) => {
    const output = {
      __file: file,
      __kind: kind,
      _width: null,
      _height: null,
      _title: null,
      setTitle(t) { output._title = t; return output; },
      setWidth(w) { output._width = w; return output; },
      setHeight(h) { output._height = h; return output; },
      setXFrameOptionsMode() { return output; },
      addMetaTag() { return output; },
      getContent: () => `<html data-file="${file}"></html>`,
    };
    return {
      __file: file,
      __kind: kind,
      evaluate() {
        return output;
      },
    };
  };

  const sandbox = {
    console: {
      log: () => {},
      warn: (...args) => warnings.push(args.join(" ")),
      error: (...args) => warnings.push(args.join(" ")),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getUi: () => ui,
    },
    Session: {
      getActiveUser: () => ({ getEmail: () => email }),
      getEffectiveUser: () => ({ getEmail: () => ownerEmail }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (Object.prototype.hasOwnProperty.call(properties, k) ? properties[k] : null),
      }),
    },
    LockService: lockMode === "missing" ? undefined : { getScriptLock: () => lock },
    Utilities: {
      getUuid: () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : ((r & 0x3) | 0x8);
          return v.toString(16);
        }),
    },
    HtmlService: {
      XFrameOptionsMode: { DEFAULT: "DEFAULT", ALLOWALL: "ALLOWALL" },
      createTemplateFromFile: (name) => {
        if (templateFiles.indexOf(name) === -1) {
          throw new Error("File template '" + name + "' tidak ditemukan");
        }
        return makeOutput(name, "template");
      },
      createHtmlOutputFromFile: (name) => {
        if (templateFiles.indexOf(name) === -1) {
          throw new Error("File '" + name + "' tidak ditemukan");
        }
        return { getContent: () => `<!-- ${name} -->` };
      },
    },
    JSON,
    Math,
    Date,
    String,
    Number,
    Array,
    Object,
    Error,
    isFinite,
    isNaN,
    parseInt,
    parseFloat,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  for (const file of BACKEND_FILES) {
    const full = path.join(ROOT, "src", "backend", file);
    const code = fs.readFileSync(full, "utf8");
    vm.runInContext(code, sandbox, { filename: `src/backend/${file}` });
  }

  return { sandbox, sheetsObj, warnings, lockLog, uiLog, makeSheet };
}

const HEADERS = {
  DASHBOARD: ["RINGKASAN FINANCE TRACKER", "Nilai", "Keterangan", "Diperbarui"],
  TRANSAKSI: ["ID", "Tanggal", "Tipe", "Dompet_ID", "Dompet_Tujuan_ID", "Kategori_ID", "Nominal", "Catatan", "Dibuat_Pada"],
  DOMPET: ["ID", "Nama_Dompet", "Tipe", "Saldo_Awal", "Ikon", "Aktif"],
  KATEGORI: ["ID", "Nama_Kategori", "Tipe", "Ikon"],
  ANGGARAN: ["ID", "Kategori_ID", "Periode", "Limit_Nominal"],
};

/** Set sheet standar lengkap dengan header (opsional baris data). */
function baseSheets(extra = {}) {
  const out = {
    DASHBOARD: [HEADERS.DASHBOARD],
    TRANSAKSI: [HEADERS.TRANSAKSI],
    DOMPET: [HEADERS.DOMPET],
    KATEGORI: [HEADERS.KATEGORI],
    ANGGARAN: [HEADERS.ANGGARAN],
  };
  Object.keys(extra).forEach((k) => {
    out[k] = [out[k][0], ...extra[k]];
  });
  return out;
}

function localDateStr(d) {
  const dt = d || new Date();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${day}`;
}

module.exports = { createHarness, makeSheet, baseSheets, HEADERS, localDateStr };
