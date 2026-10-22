/** Screen: Timeline — spend over 7D / 1M / 3M / 1Y as a bar chart (opened from Insights → Timeline) */
(function () {
  var fmt = App.fmt.money;
  var DAY = 864e5;
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- Prototype data: two years of daily spend, deterministic so charts never change between visits ---------- */
  var DAYS = 730;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var rand = rng(2026);
  var history = []; // oldest → today, plain numbers
  for (var i = DAYS - 1; i >= 0; i--) {
    var d = new Date(today.getTime() - i * DAY), wk = d.getDay();
    var v = 9 + rand() * 12 + (wk === 5 || wk === 6 ? 4 : 0) + (d.getDate() <= 2 ? 3 : 0); // weekends and month starts run higher
    if (rand() < 0.07) v += 8 + rand() * 10;                                                  // the odd splurge
    history.push(Math.round(v * 100) / 100);
  }

  /** Daily series, oldest → today. The last 7 days come from the Home screen so Today stays live. */
  function daily() {
    var h = App.state.home, out = history.slice(), n = h.week.length;
    for (var k = 0; k < n; k++) out[out.length - n + k] = k === n - 1 ? h.spentToday : h.week[k].v;
    return out;
  }
  function dateAt(daysAgo) { return new Date(today.getTime() - daysAgo * DAY); }
  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }

  /* ---------- Periods → bars ---------- */
  // Each period: bars for the window, the previous window's total (for the delta), and a reference limit per bar.
  var PERIODS = {
    '7D': { name: 'Past 7 days', prev: 'previous 7 days', build: function (all) { return byDay(all, 7, function (d, ago) { return ago === 0 ? 'Today' : WD[d.getDay()]; }, 'full'); } },
    '1M': { name: 'Past 30 days', prev: 'previous 30 days', build: function (all) { return byDay(all, 30, function (d, ago) { return ago % 7 === 0 ? d.getDate() + ' ' + MO[d.getMonth()] : ''; }, 'sparse'); } },
    '3M': { name: 'Past 3 months', prev: 'previous 3 months', build: weekly },
    '1Y': { name: 'Past 12 months', prev: 'previous 12 months', build: monthly }
  };

  function byDay(all, n, label) {
    var bars = [];
    for (var ago = n - 1; ago >= 0; ago--) {
      var d = dateAt(ago);
      bars.push({ v: all[all.length - 1 - ago], label: label(d, ago), title: ago === 0 ? 'Today' : WD[d.getDay()] + ' ' + d.getDate() + ' ' + MO[d.getMonth()], limit: App.state.home.dailyLimit });
    }
    return { bars: bars, prevTotal: sum(all.slice(all.length - 2 * n, all.length - n)), unit: 'day' };
  }

  function weekly(all) { // 13 weeks, each the 7 days ending on a weekly boundary counted back from today
    var bars = [];
    for (var w = 12; w >= 0; w--) {
      var end = all.length - w * 7, seg = all.slice(end - 7, end), start = dateAt(w * 7 + 6);
      bars.push({ v: sum(seg), label: w % 4 === 0 ? start.getDate() + ' ' + MO[start.getMonth()] : '', title: 'Week of ' + start.getDate() + ' ' + MO[start.getMonth()], limit: App.state.budget.weekly });
    }
    return { bars: bars, prevTotal: sum(all.slice(all.length - 182, all.length - 91)), unit: 'week' };
  }

  function monthly(all) { // 12 calendar months ending with the current (partial) month
    var bars = [], prevTotal = 0;
    for (var m = 23; m >= 0; m--) {
      var first = new Date(today.getFullYear(), today.getMonth() - m, 1), last = new Date(today.getFullYear(), today.getMonth() - m + 1, 0);
      var from = Math.round((first - today) / DAY) + all.length - 1, to = Math.min(Math.round((last - today) / DAY), 0) + all.length - 1;
      var total = sum(all.slice(Math.max(from, 0), to + 1));
      if (m >= 12) { prevTotal += total; continue; }
      bars.push({ v: total, label: MO[first.getMonth()].charAt(0), title: MO[first.getMonth()] + ' ' + first.getFullYear() + (m === 0 ? ' so far' : ''), limit: App.state.budget.monthly, partial: m === 0 });
    }
    return { bars: bars, prevTotal: prevTotal, unit: 'month' };
  }

  /** Round a maximum up to a tidy axis value. */
  function niceMax(v) {
    var mag = Math.pow(10, Math.floor(Math.log10(v))), steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * mag >= v) return steps[i] * mag;
    return 10 * mag;
  }

  var period = '7D', picked = null, model = null;

  function compute() {
    var all = daily(), p = PERIODS[period];
    model = p.build(all);
    model.total = sum(model.bars.map(function (b) { return b.v; }));
    model.max = niceMax(Math.max.apply(null, model.bars.map(function (b) { return b.v; }).concat(model.bars[0].limit)) * 1.05);
  }

  function readout() {
    var p = PERIODS[period], b = picked === null ? null : model.bars[picked];
    if (b) {
      var diff = b.v - b.limit, per = model.unit;
      return '<div class="eyebrow">' + b.title + '</div><div class="ins-big">' + fmt(b.v) + '</div>' +
        '<div class="ins-cap">' + (b.partial ? 'Month so far · ' : '') + fmt(Math.abs(diff), 0) + (diff > 0 ? ' over' : ' under') + ' your ' + fmt(b.limit, 0) + ' ' + ({ day: 'daily', week: 'weekly', month: 'monthly' })[per] + ' limit</div>';
    }
    var delta = model.prevTotal ? (model.total - model.prevTotal) / model.prevTotal : 0, pct = Math.round(Math.abs(delta) * 100);
    var avg = model.total / model.bars.length;
    return '<div class="eyebrow">' + p.name + '</div><div class="ins-big">' + fmt(model.total) + '</div>' +
      '<div class="ins-cap">' + fmt(avg) + ' per ' + model.unit + ' · <span class="tl-delta ' + (delta > 0 ? 'up' : 'down') + '">' + (delta > 0 ? '+' : '−') + pct + '%</span> vs ' + p.prev + '</div>';
  }

  function chart() {
    var n = model.bars.length, limit = model.bars[0].limit, max = model.max;
    var grid = [1, 0.5, 0].map(function (f) {
      return '<div class="tl-grid" style="bottom:' + f * 100 + '%"><span>' + fmt(max * f, 0) + '</span></div>';
    }).join('');
    var bars = model.bars.map(function (b, i) {
      var cls = 'tl-bar' + (b.v > b.limit ? ' over' : '') + (picked === i ? ' picked' : '') + (picked !== null && picked !== i ? ' dim' : '') + (b.partial ? ' partial' : '');
      return '<div class="' + cls + '" data-i="' + i + '" style="height:' + Math.max(b.v / max * 100, 1.5).toFixed(1) + '%"></div>';
    }).join('');
    var labels = model.bars.map(function (b) { return '<span>' + b.label + '</span>'; }).join('');
    return '<div class="tl-plot">' + grid +
      '<div class="tl-limit" style="bottom:' + limit / max * 100 + '%"><span>Limit</span></div>' +
      '<div class="tl-bars n' + (n > 20 ? 'dense' : 'sparse') + '" id="tl-bars">' + bars + '</div></div>' +
      '<div class="tl-labels ' + (n > 20 ? 'dense' : '') + '">' + labels + '</div>';
  }

  App.timeline = { stats: function () { var m = PERIODS['7D'].build(daily()); var cur = sum(m.bars.map(function (b) { return b.v; })); return { total: cur, delta: m.prevTotal ? (cur - m.prevTotal) / m.prevTotal : 0, bars: m.bars }; } };

  App.registerScreen('timeline', {
    tab: 'insights',
    title: 'Timeline',
    render() {
      return `
        <div class="screen-body">
          ${App.ui.back('insights')}
          ${App.ui.head('Timeline', 'Your spending over time')}
          <div class="segmented tl-range" id="tl-range" role="tablist" aria-label="Time period">
            ${Object.keys(PERIODS).map(function (k) { return '<button role="tab" data-period="' + k + '">' + k + '</button>'; }).join('')}
          </div>
          <div class="card tl-card">
            <div id="tl-readout" aria-live="polite"></div>
            <div id="tl-chart" class="tl-chart"></div>
          </div>
          <p class="footnote">Tap or drag across the chart to see one bar. Red bars went over your limit.</p>
        </div>`;
    },
    onEnter() { period = '7D'; picked = null; this.paint(); }, // always opens on the past 7 days
    paint() {
      compute();
      document.querySelectorAll('#tl-range [data-period]').forEach(function (b) {
        var on = b.dataset.period === period;
        b.classList.toggle('active', on); b.setAttribute('aria-selected', on);
      });
      document.getElementById('tl-readout').innerHTML = readout();
      var c = document.getElementById('tl-chart');
      c.innerHTML = chart();
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', PERIODS[period].name + ': ' + fmt(model.total) + ' spent, ' + model.bars.length + ' bars');
    },
    init() {
      var self = this;
      document.getElementById('tl-range').addEventListener('click', function (e) {
        var b = e.target.closest('[data-period]');
        if (b) { period = b.dataset.period; picked = null; self.paint(); }
      });
      // Pick the bar under the finger/pointer; dragging scrubs across bars
      var chartEl = document.getElementById('tl-chart'), down = false;
      var select = function (i) {
        picked = i;
        document.getElementById('tl-readout').innerHTML = readout();
        document.querySelectorAll('#tl-bars .tl-bar').forEach(function (b, k) {
          b.classList.toggle('picked', k === i);
          b.classList.toggle('dim', i !== null && k !== i);
        });
      };
      var indexAt = function (e) {
        var bars = document.getElementById('tl-bars'), r = bars.getBoundingClientRect();
        return Math.max(0, Math.min(model.bars.length - 1, Math.floor((e.clientX - r.left) / r.width * model.bars.length)));
      };
      chartEl.addEventListener('pointerdown', function (e) { down = true; var i = indexAt(e); select(i === picked ? null : i); });
      chartEl.addEventListener('pointermove', function (e) { if (down) { var i = indexAt(e); if (i !== picked) select(i); } });
      window.addEventListener('pointerup', function () { down = false; });
      document.getElementById('tl-readout').addEventListener('click', function () { if (picked !== null) select(null); });
      App.state.on('budget', function () { if (App.router.current === 'timeline') self.paint(); });
    }
  });
})();
