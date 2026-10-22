/** Screen: Timeline — spend over 7D / 1M / 1Y as a bar chart you can swipe back through (Insights → Timeline) */
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
  var history = []; // oldest → today
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
  function short(d) { return d.getDate() + ' ' + MO[d.getMonth()]; }

  /* ---------- Periods: each is a run of pages (0 = newest); swiping right-to-left walks back in time ---------- */
  var PERIODS = {
    '7D': { unit: 'day', limit: function () { return App.state.home.dailyLimit; }, pages: 52, build: pageDays(7), cur: 'Past 7 days', prev: 'the week before' },
    '1M': { unit: 'day', limit: function () { return App.state.home.dailyLimit; }, pages: 24, build: pageDays(30), cur: 'Past 30 days', prev: 'the 30 days before' },
    '1Y': { unit: 'month', limit: function () { return App.state.budget.monthly; }, pages: 2, build: pageMonths, cur: 'Past 12 months', prev: 'the year before' }
  };

  function pageDays(n) {
    return function (all, k) {
      var bars = [];
      for (var ago = n - 1; ago >= 0; ago--) {
        var idx = k * n + ago, d = dateAt(idx);
        bars.push({
          v: all[all.length - 1 - idx],
          label: n === 7 ? (idx === 0 ? 'Today' : WD[d.getDay()]) : (ago % 7 === 0 ? short(d) : ''),
          title: idx === 0 ? 'Today' : WD[d.getDay()] + ' ' + short(d),
          tick: n === 7 || ago % 7 === 0
        });
      }
      return { bars: bars, from: dateAt(k * n + n - 1), to: dateAt(k * n) };
    };
  }

  function pageMonths(all, k) { // 12 calendar months; page 0 ends with the current (partial) month
    var bars = [];
    for (var m = 11; m >= 0; m--) {
      var mo = k * 12 + m;
      var first = new Date(today.getFullYear(), today.getMonth() - mo, 1), last = new Date(today.getFullYear(), today.getMonth() - mo + 1, 0);
      var from = Math.round((first - today) / DAY) + all.length - 1, to = Math.min(Math.round((last - today) / DAY), 0) + all.length - 1;
      bars.push({
        v: sum(all.slice(Math.max(from, 0), to + 1)), label: MO[first.getMonth()].charAt(0), tick: first.getMonth() % 3 === 0,
        title: MO[first.getMonth()] + ' ' + first.getFullYear() + (mo === 0 ? ' so far' : ''), partial: mo === 0
      });
    }
    return { bars: bars, from: new Date(today.getFullYear(), today.getMonth() - k * 12 - 11, 1), to: new Date(today.getFullYear(), today.getMonth() - k * 12, 1) };
  }

  /** Round a maximum up to a tidy axis value whose half is also tidy. */
  function niceMax(v) {
    var mag = Math.pow(10, Math.floor(Math.log10(v))), steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * mag >= v) return steps[i] * mag;
    return 10 * mag;
  }

  var period = '7D', model = null, shown = 0, picked = null; // shown = page index in view (0 = newest)

  function compute() {
    var all = daily(), p = PERIODS[period], limit = p.limit(), pages = [], max = limit;
    for (var k = 0; k < p.pages; k++) {
      var pg = p.build(all, k);
      pg.total = sum(pg.bars.map(function (b) { return b.v; }));
      pg.bars.forEach(function (b) { b.limit = limit; max = Math.max(max, b.v); });
      pages.push(pg);
    }
    model = { pages: pages, limit: limit, max: niceMax(max * 1.05) };
  }

  function rangeTitle(pg, k) {
    var p = PERIODS[period];
    if (k === 0) return p.cur;
    if (period === '1Y') return MO[pg.from.getMonth()] + ' ' + pg.from.getFullYear() + ' – ' + MO[pg.to.getMonth()] + ' ' + pg.to.getFullYear();
    return short(pg.from) + ' – ' + short(pg.to);
  }

  function readout() {
    var p = PERIODS[period], pg = model.pages[shown], b = picked === null ? null : pg.bars[picked];
    if (b) {
      var diff = b.v - model.limit;
      return '<div class="eyebrow">' + b.title + '</div><div class="ins-big">' + fmt(b.v) + '</div>' +
        '<div class="ins-cap">' + fmt(Math.abs(diff), 0) + (diff > 0 ? ' over' : ' under') + ' your ' + fmt(model.limit, 0) + ' ' + p.unit + 'ly limit' + (b.partial ? ' · month so far' : '') + '</div>';
    }
    var older = model.pages[shown + 1], avg = pg.total / pg.bars.length, line = fmt(avg) + ' per ' + p.unit;
    if (older) {
      var delta = (pg.total - older.total) / older.total, pct = Math.round(Math.abs(delta) * 100);
      line += ' · <span class="tl-delta ' + (delta > 0 ? 'up' : 'down') + '">' + (delta > 0 ? '+' : '−') + pct + '%</span> vs ' + p.prev;
    }
    return '<div class="eyebrow">' + rangeTitle(pg, shown) + '</div><div class="ins-big">' + fmt(pg.total) + '</div><div class="ins-cap">' + line + '</div>';
  }

  function chart() {
    var max = model.max, dense = model.pages[0].bars.length > 20;
    var axis = [1, 0.5, 0].map(function (f) { return '<div class="tl-grid' + (f === 0 ? ' base' : '') + '" style="bottom:' + f * 100 + '%"><span>' + fmt(max * f, 0) + '</span></div>'; }).join('');
    // Oldest page first so the newest sits at the right edge and a swipe to the right-hand side walks back in time
    var pages = model.pages.map(function (pg, k) {
      var slots = pg.bars.map(function (b, i) {
        return '<div class="tl-slot' + (b.tick ? ' tick' : '') + '" data-i="' + i + '"><div class="tl-bar' + (b.v > b.limit ? ' over' : '') + (b.partial ? ' partial' : '') + '" style="height:' + Math.max(b.v / max * 100, 1.5).toFixed(1) + '%"></div></div>';
      }).join('');
      var labels = pg.bars.map(function (b) { return '<span>' + b.label + '</span>'; }).join('');
      return '<div class="tl-page" data-k="' + k + '"><div class="tl-slots ' + (dense ? 'dense' : period === '1Y' ? 'mid' : '') + '">' + slots + '</div><div class="tl-labels ' + (dense ? 'dense' : '') + '">' + labels + '</div></div>';
    }).reverse().join('');
    return '<div class="tl-axis">' + axis + '<div class="tl-limit" style="bottom:' + model.limit / max * 100 + '%"><span>Limit</span></div></div>' +
      '<div class="tl-scroll" id="tl-scroll" tabindex="0" aria-label="Swipe sideways to see earlier periods">' + pages + '</div>';
  }

  App.timeline = { stats: function () { // last 7 days vs the 7 before, for the Insights card
    var all = daily(), cur = PERIODS['7D'].build(all, 0), prev = PERIODS['7D'].build(all, 1);
    var c = sum(cur.bars.map(function (b) { return b.v; })), p = sum(prev.bars.map(function (b) { return b.v; }));
    return { total: c, delta: p ? (c - p) / p : 0, bars: cur.bars };
  } };

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
          <p class="footnote">Swipe the chart sideways to move through time. Tap a bar for details. Red bars went over your limit.</p>
        </div>`;
    },
    onEnter() { period = '7D'; this.paint(); }, // always opens on the past 7 days
    paint() {
      compute(); shown = 0; picked = null;
      document.querySelectorAll('#tl-range [data-period]').forEach(function (b) {
        var on = b.dataset.period === period;
        b.classList.toggle('active', on); b.setAttribute('aria-selected', on);
      });
      document.getElementById('tl-readout').innerHTML = readout();
      var c = document.getElementById('tl-chart');
      c.innerHTML = chart();
      var sc = document.getElementById('tl-scroll');
      sc.scrollLeft = sc.scrollWidth; // start on the newest page
    },
    init() {
      var self = this, timer = null;
      document.getElementById('tl-range').addEventListener('click', function (e) {
        var b = e.target.closest('[data-period]');
        if (b) { period = b.dataset.period; self.paint(); }
      });
      var setPick = function (i) {
        picked = i;
        document.getElementById('tl-readout').innerHTML = readout();
        document.querySelectorAll('#tl-chart .tl-page').forEach(function (pg) {
          var on = i !== null && +pg.dataset.k === shown;
          pg.classList.toggle('has-pick', on);
          pg.querySelectorAll('.tl-bar').forEach(function (b, k) { b.classList.toggle('picked', on && k === i); });
        });
      };
      document.getElementById('tl-chart').addEventListener('click', function (e) {
        var s = e.target.closest('.tl-slot'); if (!s) return;
        var i = +s.dataset.i;
        setPick(i === picked ? null : i);
      });
      document.getElementById('tl-readout').addEventListener('click', function () { if (picked !== null) setPick(null); });
      // Follow the page in view: header shows its range, total and change vs the page before it
      document.getElementById('tl-chart').addEventListener('scroll', function (e) {
        var sc = e.target; if (sc.id !== 'tl-scroll') return;
        clearTimeout(timer);
        timer = setTimeout(function () {
          var n = model.pages.length, idx = Math.round(sc.scrollLeft / sc.clientWidth), k = Math.max(0, Math.min(n - 1, n - 1 - idx));
          if (k === shown) return;
          shown = k; setPick(null);
        }, 60);
      }, true);
      App.state.on('budget', function () { if (App.router.current === 'timeline') self.paint(); });
    }
  });
})();
