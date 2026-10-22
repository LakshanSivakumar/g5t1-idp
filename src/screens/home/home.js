/** Screen: Home — daily budget ring / graph (Within Limit, Over Limit, Graph) + warning alert */
(function () {
  var fmt = App.fmt.money;
  var C = 2 * Math.PI * 100; // ring circumference for r=100

  function tone() { return App.state.budgetStatus(); }

  App.registerScreen('home', {
    tab: 'home',
    title: 'Home',

    render() {
      return `
        <div class="screen-body">
          <header class="home-top">
            <button class="pill pill-streak" data-tab="social" id="home-streak"></button>
          </header>
          <div class="home-toggle">
            <div class="segmented" role="tablist" aria-label="Home view">
              <button role="tab" class="active" data-view="ring">Today</button>
              <button role="tab" data-view="graph">7 days</button>
            </div>
          </div>
          <div id="home-hero"></div>
          <div class="home-nudge" id="home-nudge"></div>
          <button class="card saved-card" data-tab="insights" aria-label="Saved this month">
            <div class="eyebrow">Saved · Month</div>
            <div class="saved-row"><span class="saved-val" id="home-saved"></span><span class="pill pill-ontrack" id="home-saved-pill"></span></div>
          </button>
          <p class="section-label">Today’s expenses</p>
          <div id="home-latest"></div>
        </div>`;
    },

    init() {
      var self = this;
      document.querySelectorAll('[data-view]').forEach(function (b) {
        b.addEventListener('click', function () { App.state.home.view = b.dataset.view; self.paint(); });
      });
      document.getElementById('home-nudge').addEventListener('click', function (e) {
        var b = e.target.closest('[data-nudge]');
        if (!b) return;
        var t = tone();
        if (t.over) App.router.go('recovery');
        else App.overlay.open('alert-warning');
      });
      App.state.on('budget', function () { self.paint(); });
    },

    onEnter(param) {
      if (param === 'graph' || param === 'ring') App.state.home.view = param;
      this.paint();
    },

    paint() {
      var h = App.state.home, t = tone();
      document.querySelectorAll('[data-view]').forEach(function (b) {
        var on = b.dataset.view === h.view;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on);
      });

      var streak = document.getElementById('home-streak');
      streak.innerHTML = App.icon('flame.fill', 14) + (t.over ? h.bestStreak + '-day best' : h.streakDays + '-day streak');

      document.getElementById('home-hero').innerHTML = h.view === 'ring' ? this.ring(h, t) : this.graph(h, t);
      if (h.view === 'ring') {
        var f = document.getElementById('ring-fill');
        requestAnimationFrame(function () { f.style.strokeDashoffset = C * (1 - Math.min(t.pct, 1)); });
      }

      var n = document.getElementById('home-nudge');
      var msg, link = true, ico = t.tone === 'emerald' ? 'checkmark.circle.fill' : 'info.circle';
      if (t.over) msg = fmt(h.spentToday - h.dailyLimit) + ' over today. ' + (h.view === 'graph' ? 'Start fresh tomorrow.' : 'See a catch-up plan');
      else if (t.tone === 'amber') msg = fmt(t.left) + ' left today. Plan your dinner';
      else msg = fmt(t.left) + ' left today. You’re on pace';
      if (t.tone === 'emerald' || (h.view === 'graph' && t.over)) link = false; // healthy budget: nothing to open yet
      var inner = '<span class="nudge-text">' + App.icon(ico, 18) + msg + '</span>' + (link ? App.icon('chevron.right', 8) : '');
      n.innerHTML = link
        ? '<button class="nudge ' + t.tone + '" data-nudge>' + inner + '</button>'
        : '<div class="nudge ' + t.tone + '">' + inner + '</div>';

      // Saved this month = earlier savings + today's headroom under the limit (negative when over)
      var saved = h.savedBeforeToday + t.left;
      document.getElementById('home-saved').textContent = (saved < 0 ? '−' : '') + fmt(Math.abs(saved), 0);
      var pill = document.getElementById('home-saved-pill');
      pill.className = 'pill pill-ontrack ' + t.tone;
      pill.innerHTML = t.over ? App.icon('info.circle', 12) + ' over budget' : t.tone === 'amber' ? App.icon('info.circle', 12) + ' near limit' : App.icon('arrow.up', 12) + ' on track';
      document.getElementById('home-latest').innerHTML = !h.latestExpenses.length ? '<p class="footnote">No expenses yet. Tap + to add one.</p>' : h.latestExpenses.map(function (e, i) {
        return '<div class="card latest-card ' + (i === 0 ? 'accent-edge' : '') + '"><button class="latest-item is-editable" data-edit-expense="' + App.escapeHTML(e.id) + '" aria-label="Edit or delete ' + App.escapeHTML(e.title) + ', ' + fmt(e.amount) + '">' +
          '<span class="tile ' + e.category + '">' + App.escapeHTML(e.initials) + '</span>' +
          '<span class="row-main"><span class="row-title" style="display:block">' + App.escapeHTML(e.title) + '</span><span class="row-sub" style="display:block">' + App.escapeHTML(e.sub) + ' · Tap to edit</span></span>' +
          '<span class="amt">' + fmt(e.amount) + '</span><span class="edit-hint">' + App.icon('chevron.right', 8) + '</span></button></div>';
      }).join('');
    },

    ring(h, t) {
      var sub = t.over ? fmt(h.spentToday - h.dailyLimit) + ' over your ' + fmt(h.dailyLimit, 0) + ' limit' : fmt(t.left) + ' under your ' + fmt(h.dailyLimit, 0) + ' limit';
      return '<div class="ring-wrap" role="img" aria-label="Spent today ' + fmt(h.spentToday) + ', ' + sub + '">' +
        '<svg viewBox="0 0 220 220"><circle class="ring-track" cx="110" cy="110" r="100"/>' +
        '<circle class="ring-fill ' + t.tone + '" id="ring-fill" cx="110" cy="110" r="100" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"/></svg>' +
        '<div class="ring-center"><div class="eyebrow">Spent today</div><div class="ring-amount">' + fmt(h.spentToday) + '</div><div class="ring-sub">' + sub + '</div></div></div>';
    },

    graph(h, t) {
      var week = h.week.slice(0, 6).concat([{ d: 'Today', v: h.spentToday }]);
      var max = Math.max.apply(null, week.map(function (w) { return w.v; }).concat([h.dailyLimit * 1.15]));
      var limitPct = (h.dailyLimit / max) * 100;
      var bars = week.map(function (w, i) {
        var cls = i === week.length - 1 ? t.tone === 'emerald' ? 'accent' : t.tone : (w.v > h.dailyLimit ? 'rose' : '');
        return '<div class="bar ' + cls + '" style="height:' + (w.v / max * 100) + '%" title="' + w.d + ' ' + fmt(w.v) + '"></div>';
      }).join('');
      var sub = t.over ? fmt(h.spentToday - h.dailyLimit) + ' over your ' + fmt(h.dailyLimit, 0) + ' limit' : fmt(t.left) + ' under your ' + fmt(h.dailyLimit, 0) + ' limit';
      return '<div class="graph-head"><div class="eyebrow">Spent today</div><div><span class="amt">' + fmt(h.spentToday) + '</span><span class="sub">' + sub + '</span></div></div>' +
        '<button class="graph-link" data-tab="insights" aria-label="Open Insights"><div class="graph-box"><div class="graph-limit" style="bottom:' + limitPct + '%"><span>' + fmt(h.dailyLimit, 0) + ' LIMIT</span></div><div class="bars">' + bars + '</div></div>' +
        '<div class="graph-days">' + week.map(function (w) { return '<span>' + w.d + '</span>'; }).join('') + '</div></button>' +
        '<p class="graph-hint">Tap the graph for insights</p>';
    }
  });

  /* Daily budget warning alert (Daily budget warning · Print.png) */
  App.overlays = App.overlays || [];
  App.overlays.push({
    mount(app) {
      var el = document.createElement('div');
      el.className = 'alert-wrap'; el.id = 'alert-warning';
      el.innerHTML = '<div class="alert" role="alertdialog" aria-modal="true" aria-labelledby="aw-title">' +
        '<h2 id="aw-title">You’re nearing today’s budget</h2><div class="alert-big num" id="aw-left"></div>' +
        '<p id="aw-used"></p><p>Your recent dinners average about $6. You have <span id="aw-left2"></span> left today, so tonight needs to be a light one to stay within budget.</p>' +
        '<div class="stack"><button class="btn btn-primary" id="aw-view">View today’s budget</button><button class="btn btn-secondary" data-close-overlay>Dismiss</button></div></div>';
      app.appendChild(el);
      var refresh = function () {
        var h = App.state.home, t = tone();
        document.getElementById('aw-left').textContent = fmt(Math.max(t.left, 0)) + ' left today';
        document.getElementById('aw-left2').textContent = fmt(Math.max(t.left, 0));
        document.getElementById('aw-used').textContent = fmt(h.spentToday) + ' of your ' + fmt(h.dailyLimit, 0) + ' budget used · ' + Math.round(t.pct * 100) + '%';
      };
      var open = App.overlay.open.bind(App.overlay);
      App.overlay.open = function (id) { if (id === 'alert-warning') refresh(); open(id); };
      document.getElementById('aw-view').addEventListener('click', function () {
        App.overlay.close(); App.router.go('home', { root: true, param: 'graph' });
      });
    }
  });
})();
