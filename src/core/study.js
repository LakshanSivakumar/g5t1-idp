/**
 * Savenow Core — in-app usability study ("study mode"). Replaces Maze for the edit/delete A/B test.
 *
 * Turn on with ?study=1 (the ab.html link does this). A tester sees a short intro, then one task: edit an expense. We record
 * time to finish, taps (every press while the task runs), misses (taps on nothing interactive), the steps taken with
 * timestamps and the outcome (success / gave up). Either way they then rate how easy it was to work out (1–5), say whether they
 * prefer tapping or swiping to reveal actions and why. Before the task they give their university and course. Rows go to a Google Sheet (docs/study-sheet.gs).
 */
(function () {
  var q = new URLSearchParams(location.search);
  var on = q.get('study') === '1';
  try { if (on) sessionStorage.setItem('savenow_study', '1'); else on = sessionStorage.getItem('savenow_study') === '1'; } catch (e) { /* private mode */ }
  var noop = { active: false, note: function () {}, step: function () {} };
  if (!on) { window.App = window.App || {}; window.App.study = null; return; }

  var cfg = function () { return window.App.config || {}; };
  var variant = function () { return window.App.state.mazeVariant; };
  var pid = (function () {
    var id = null;
    try { id = localStorage.getItem('savenow_pid'); } catch (e) { /* ignore */ }
    if (!id) { id = Math.random().toString(36).slice(2, 8); try { localStorage.setItem('savenow_pid', id); } catch (e) { /* ignore */ } }
    return id;
  })();

  /* ---------- Tasks ---------- */
  function find(title) { return App.state.home.latestExpenses.filter(function (e) { return e.title === title; })[0]; }
  var TASKS = [
    { id: 'edit', text: 'You entered “Vending snacks” as $2.50, but it was really $3.00. Change the amount.', done: function () { var e = find('Vending snacks'); return !!e && Math.abs(e.amount - 3) < 0.005; } }
  ];

  /* ---------- Logging (Google Sheet via Apps Script; queued locally if offline) ---------- */
  var QKEY = 'savenow_study_rows', queue = [];
  try { queue = JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch (e) { queue = []; }
  function persist() { try { localStorage.setItem(QKEY, JSON.stringify(queue)); } catch (e) { /* ignore */ } }
  function flush() {
    var url = cfg().STUDY_ENDPOINT;
    if (!url || !queue.length) return;
    var batch = queue.splice(0, queue.length); persist();
    batch.forEach(function (row) {
      // text/plain keeps this a "simple" request, so the Apps Script endpoint needs no CORS preflight
      fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(row) })
        .catch(function () { queue.push(row); persist(); });
    });
  }
  function send(kind, data) {
    var row = Object.assign({ kind: kind, ts: new Date().toISOString(), pid: pid, course: course, uni: uni, variant: variant(), device: /Mobi|iPhone|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop', viewport: innerWidth + 'x' + innerHeight }, data);
    queue.push(row); persist();
    if (!cfg().STUDY_ENDPOINT && window.console) console.info('[study]', row);
    flush();
  }

  /* ---------- State ---------- */
  var uni = '', course = '';
  var idx = -1, run = null, pending = null; // idx: current task; run: live metrics; pending: finished task row awaiting its feedback
  function newRun() { return { t0: Date.now(), taps: 0, misses: 0, steps: [] }; }
  function ms() { return Date.now() - run.t0; }

  window.App.study = {
    active: true,
    /** App.maze.track(step) lands here. */
    step: function (step) {
      if (!run || !step) return;
      run.steps.push(step + ':' + ms());
      send('event', { task: TASKS[idx].id, type: 'step', detail: step, ms: ms() });
      setTimeout(function () { if (run && TASKS[idx].done()) finish('success'); }, 60); // state changes land just after the step is tracked
    }
  };

  /* ---------- UI ---------- */
  var root, banner;
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function card(inner, cls) { root.innerHTML = '<div class="study-card ' + (cls || '') + '" role="dialog" aria-modal="true">' + inner + '</div>'; root.hidden = false; }

  function intro() {
    card('<p class="study-eyebrow">Savenow study</p><h2>One quick task</h2>' +
      '<p>You’ll try one thing in a budgeting app, like you would on your own phone. There are no wrong answers: we’re testing the app, not you.</p>' +
      '<p>It takes about a minute. We record taps and timing, never anything personal.</p>' +
      '<button class="btn btn-primary btn-block" id="study-begin">Begin</button>');
    document.getElementById('study-begin').onclick = function () { send('event', { type: 'begin' }); askUni(); };
  }

  var UNIS = ['SMU', 'NUS', 'NTU', 'SIT', 'SUTD', 'SIM', 'SUSS'];
  function askUni() {
    card('<p class="study-eyebrow">Before we start</p><h2>Which university are you in?</h2>' +
      '<select class="study-input" id="study-uni" aria-label="Your university"><option value="" selected disabled>Select one</option>' +
      UNIS.map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select>' +
      '<button class="btn btn-primary btn-block" id="study-uni-go" disabled>Continue</button>');
    var sel = document.getElementById('study-uni'), go = document.getElementById('study-uni-go');
    sel.onchange = function () { go.disabled = !sel.value; };
    go.onclick = function () { uni = sel.value; send('event', { type: 'uni', detail: uni }); askCourse(); };
  }

  function askCourse() {
    card('<p class="study-eyebrow">Before we start</p><h2>What course are you studying?</h2>' +
      '<input class="study-input" id="study-course" type="text" autocomplete="off" placeholder="e.g. Business Analytics" aria-label="Your course">' +
      '<button class="btn btn-primary btn-block" id="study-course-go" disabled>Continue</button>');
    var inp = document.getElementById('study-course'), go = document.getElementById('study-course-go');
    inp.oninput = function () { go.disabled = !inp.value.trim(); };
    go.onclick = function () { course = inp.value.trim(); send('event', { type: 'course', detail: course }); next(); };
  }

  function next() {
    idx++;
    if (idx >= TASKS.length) return done();
    var t = TASKS[idx];
    card('<p class="study-eyebrow">Task ' + (idx + 1) + ' of ' + TASKS.length + '</p><h2>' + t.text + '</h2>' +
      '<p>Press Start, then do it in the app. The task ends on its own when you’re done.</p>' +
      '<button class="btn btn-primary btn-block" id="study-start">Start</button>');
    document.getElementById('study-start').onclick = start;
  }

  function start() {
    root.hidden = true; root.innerHTML = '';
    run = newRun();
    App.router.go('home', { root: true, instant: true });
    banner.innerHTML = '<span class="study-task"><b>Task ' + (idx + 1) + ':</b> ' + TASKS[idx].text + '</span><button class="study-giveup" id="study-giveup">I can’t do it</button>';
    banner.hidden = false;
    document.getElementById('study-giveup').onclick = function () { finish('gave_up'); };
    send('event', { task: TASKS[idx].id, type: 'start', ms: 0 });
  }

  function finish(outcome) {
    if (!run) return;
    var r = run; run = null; banner.hidden = true; App.overlay.close();
    pending = { task: TASKS[idx].id, outcome: outcome, ms: Date.now() - r.t0, taps: r.taps, misses: r.misses, steps: r.steps.join(' ') };
    var scale = [1, 2, 3, 4, 5].map(function (n) { return '<button class="study-rate" data-n="' + n + '" aria-label="' + n + '">' + n + '</button>'; }).join('');
    card('<p class="study-eyebrow">' + (outcome === 'success' ? 'Done' : 'No problem') + '</p><h2>How easy was it to work out how to change the amount, without any help?</h2>' +
      '<div class="study-scale">' + scale + '</div><div class="study-ends"><span>1 = very hard to work out</span><span>5 = very easy to work out</span></div>');
    root.querySelectorAll('.study-rate').forEach(function (b) {
      b.onclick = function () { pending.rating = +b.dataset.n; prefer(); };
    });
  }

  function prefer() {
    var used = variant() === 'B' ? 'swiping' : 'tapping', mark = ' (the version you used)';
    card('<p class="study-eyebrow">Almost done</p><h2>Between tapping and swiping to reveal the edit and delete actions, which would you prefer?</h2>' +
      '<div class="study-choices"><button class="btn btn-secondary" data-pref="tapping">Tapping' + (used === 'tapping' ? mark : '') + '</button>' +
      '<button class="btn btn-secondary" data-pref="swiping">Swiping' + (used === 'swiping' ? mark : '') + '</button></div>');
    root.querySelectorAll('[data-pref]').forEach(function (b) {
      b.onclick = function () { pending.preference = b.dataset.pref; why(); };
    });
  }

  function why() {
    card('<p class="study-eyebrow">One last question</p><h2>Why do you prefer ' + pending.preference + '?</h2>' +
      '<p>A short sentence is fine.</p><textarea class="study-input" id="study-why" rows="3" aria-label="Why you prefer ' + pending.preference + '"></textarea>' +
      '<button class="btn btn-primary btn-block" id="study-why-go" disabled>Finish</button>');
    var inp = document.getElementById('study-why'), go = document.getElementById('study-why-go');
    inp.oninput = function () { go.disabled = !inp.value.trim(); };
    go.onclick = function () { pending.why = inp.value.trim(); sendTask(); next(); };
  }

  function sendTask() {
    if (!pending) return;
    send('task', pending); pending = null; // a tester who leaves early still saves what they answered
  }

  function done() {
    card('<p class="study-eyebrow">All done</p><h2>Thank you!</h2><p>That’s everything. You can close this tab now.</p>');
    send('event', { type: 'complete' });
  }

  /* ---------- Tap counting while a task is running ---------- */
  var INTERACTIVE = 'button, a, input, select, textarea, label, [role="button"], [data-goto], [data-tab], [data-back], .swipe-front, .scrim';
  document.addEventListener('pointerdown', function (e) {
    if (!run || e.target.closest('.study-banner, .study-root')) return;
    run.taps++;
    if (!e.target.closest(INTERACTIVE)) run.misses++;
  }, true);

  // Leaving mid-task or before rating still saves what we have
  window.addEventListener('pagehide', function () {
    if (run) finish('abandoned');
    sendTask();
    flush();
  });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  document.addEventListener('DOMContentLoaded', function () {
    var app = document.getElementById('app');
    root = el('<div class="study-root" hidden></div>'); app.appendChild(root);
    banner = el('<div class="study-banner" hidden></div>'); app.appendChild(banner);
    flush();
    intro();
  });
})();
