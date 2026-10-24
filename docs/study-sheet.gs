/**
 * Google Apps Script that receives Savenow study results and writes them into the spreadsheet it is attached to.
 *
 * Setup: see docs/study-setup.md. Short version:
 *   1. Create a Google Sheet. Extensions → Apps Script. Paste this file. Save.
 *   2. Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 *   3. Copy the Web app URL into STUDY_ENDPOINT in src/core/config.js.
 * Two tabs are created automatically: "tasks" (one row per task) and "events" (every step/start/begin/complete).
 */
var HEADERS = {
  tasks:  ['ts', 'pid', 'variant', 'device', 'viewport', 'task', 'outcome', 'ms', 'taps', 'misses', 'rating', 'preference', 'steps'],
  events: ['ts', 'pid', 'variant', 'device', 'viewport', 'task', 'type', 'detail', 'ms']
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var name = d.kind === 'task' ? 'tasks' : 'events';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS[name]);
    sh.appendRow(HEADERS[name].map(function (h) { return d[h] === undefined ? '' : d[h]; }));
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// Open the Web app URL in a browser to check that it is deployed.
function doGet() { return ContentService.createTextOutput('Savenow study endpoint is running'); }
