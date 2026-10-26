/**
 * Code.js (Container-Bound Edition)
 * Menghubungkan Google Sheets dengan antarmuka web app kustom.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Finance Tracker")
    .addItem("Buka Finance Tracker (Jendela Pop-up)", "openAppDialog")
    .addItem("Buka Finance Tracker (Sidebar Kanan)", "openAppSidebar")
    .addSeparator()
    .addItem("Periksa / Inisialisasi Database", "runManualSetup")
    .addToUi();
}

function getUserEmailSafe() {
  try {
    const email = Session.getActiveUser().getEmail();
    if (email) return email;
  } catch (e) {}
  try {
    const effective = Session.getEffectiveUser().getEmail();
    if (effective) return effective;
  } catch (e) {}
  return "Pengguna";
}

function openAppDialog() {
  ensureDatabaseStructure();
  const template = HtmlService.createTemplateFromFile("frontend/Index");
  template.userEmail = getUserEmailSafe();
  template.mode = "DIALOG";

  const html = template.evaluate()
    .setWidth(1080)
    .setHeight(720);

  SpreadsheetApp.getUi().showModalDialog(html, "Finance Tracker");
}

function openAppSidebar() {
  ensureDatabaseStructure();
  const template = HtmlService.createTemplateFromFile("frontend/Index");
  template.userEmail = getUserEmailSafe();
  template.mode = "SIDEBAR";

  const html = template.evaluate()
    .setTitle("Finance Tracker");

  SpreadsheetApp.getUi().showSidebar(html);
}

function doGet(e) {
  ensureDatabaseStructure();
  const template = HtmlService.createTemplateFromFile("frontend/Index");
  template.userEmail = getUserEmailSafe();
  template.mode = "FULL";

  return template.evaluate()
    .setTitle("Finance Tracker")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1");
}

function runManualSetup() {
  ensureDatabaseStructure();
  SpreadsheetApp.getActiveSpreadsheet().toast("Database berhasil disinkronkan!", "Finance Tracker", 3);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiDispatcher(action, payload) {
  try {
    switch (action) {
      case "getDashboard":
        return { success: true, data: getDashboardData() };
      case "createTransaction":
        return { success: true, data: createTransaction(payload) };
      case "updateTransaction":
        return { success: true, data: updateTransaction(payload) };
      case "deleteTransaction":
        return { success: true, data: deleteTransaction(payload.id) };
      case "saveBudget":
        return { success: true, data: saveBudget(payload) };
      case "deleteBudget":
        return { success: true, data: deleteBudget(payload.id) };
      case "saveWallet":
        return { success: true, data: saveWallet(payload) };
      case "deleteWallet":
        return { success: true, data: deleteWallet(payload.id) };
      default:
        throw new Error("Aksi API '" + action + "' tidak dikenali.");
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
