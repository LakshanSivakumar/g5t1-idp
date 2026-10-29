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
    // An abandoned tester should not use up a slot; finishing later (success / gave_up) takes the slot back.
    if (d.kind === 'task' && d.aid) setAssignmentStatus(String(d.aid), d.outcome === 'abandoned' ? 'abandoned' : 'done');
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// A new assignment is 'pending' until its tester submits a result ('done') or leaves ('abandoned').
// A pending assignment that is still unfinished after PENDING_HOURS stops counting towards CAP, so people who opened the link and never
// started do not keep the study "full". Rows with a blank status (from before this existed) always count.
var PENDING_HOURS = 2;

// Max testers per version. ab.html asks for a version here (?assign=1&id=<device id>) so A and B each stop at CAP.
var CAP = 20;

function assignmentsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('assignments') || ss.insertSheet('assignments');
  if (sh.getLastRow() === 0) sh.appendRow(['ts', 'id', 'variant', 'status']);
  else if (sh.getRange(1, 4).getValue() === '') sh.getRange(1, 4).setValue('status');
  return sh;
}

// status 'abandoned' means the tester left without finishing: kept in the tab for the record, but not counted towards CAP.
// status 'done' means they submitted a result and always counts.
function setAssignmentStatus(id, status) {
  var sh = assignmentsSheet();
  if (sh.getLastRow() < 2) return;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();
  rows.forEach(function (r, i) {
    if (r[1] === id && r[3] !== status) sh.getRange(i + 2, 4).setValue(status);
  });
}

function assign(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = assignmentsSheet();
    var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues() : [];
    var n = { A: 0, B: 0 };
    rows.forEach(function (r) {
      if (r[1] === id) n.mine = r[2];
      var stale = r[3] === 'pending' && Date.now() - new Date(r[0]).getTime() > PENDING_HOURS * 3600000;
      if (n[r[2]] !== undefined && r[3] !== 'abandoned' && !stale) n[r[2]]++;
    });
    if (n.mine) return n.mine; // same device asking again keeps its version
    var open = ['A', 'B'].filter(function (v) { return n[v] < CAP; });
    if (!open.length) return null;
    // fewer testers first, coin flip on a tie
    var v = open.length === 1 ? open[0] : n.A === n.B ? (Math.random() < 0.5 ? 'A' : 'B') : (n.A < n.B ? 'A' : 'B');
    sh.appendRow([new Date().toISOString(), id, v, 'pending']);
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
