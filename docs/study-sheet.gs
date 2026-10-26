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
  tasks:  ['ts', 'pid', 'variant', 'device', 'viewport', 'task', 'outcome', 'ms', 'taps', 'misses', 'rating', 'preference', 'steps', 'course', 'why', 'uni'],
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

// Max testers per version. ab.html asks for a version here (?assign=1&id=<device id>) so A and B each stop at CAP.
var CAP = 20;

function assign(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('assignments') || ss.insertSheet('assignments');
    if (sh.getLastRow() === 0) sh.appendRow(['ts', 'id', 'variant']);
    var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues() : [];
    var n = { A: 0, B: 0 };
    rows.forEach(function (r) { if (r[1] === id) n.mine = r[2]; if (n[r[2]] !== undefined) n[r[2]]++; });
    if (n.mine) return n.mine; // same device asking again keeps its version
    var open = ['A', 'B'].filter(function (v) { return n[v] < CAP; });
    if (!open.length) return null;
    // fewer testers first, coin flip on a tie
    var v = open.length === 1 ? open[0] : n.A === n.B ? (Math.random() < 0.5 ? 'A' : 'B') : (n.A < n.B ? 'A' : 'B');
    sh.appendRow([new Date().toISOString(), id, v]);
    return v;
  } finally {
    lock.releaseLock();
  }
}

// Open the Web app URL in a browser to check that it is deployed.
function doGet(e) {
  if (e && e.parameter && e.parameter.assign) {
    return ContentService.createTextOutput(JSON.stringify({ variant: assign(String(e.parameter.id || '')) })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('Savenow study endpoint is running');
}
