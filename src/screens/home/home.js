/** Screen: Home — daily budget ring (Within Limit, Over Limit) + warning alert */
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
          <div id="home-hero"></div>
          <div class="home-nudge" id="home-nudge"></div>
          <button class="card saved-card" data-tab="insights" aria-label="Saved this month">
            <div class="eyebrow">Saved · Month (So Far)</div>
            <div class="saved-row"><span class="saved-val" id="home-saved"></span><span class="pill pill-ontrack" id="home-saved-pill"></span></div>
          </button>
          <p class="section-label">Today’s expenses</p>
          <div id="home-latest" data-maze-unmask="True"></div>
        </div>`;
    },

    init() {
      var self = this;
      document.getElementById('home-nudge').addEventListener('click', function (e) {
        var b = e.target.closest('[data-nudge]');
        if (!b) return;
        var t = tone();
        if (t.over) App.router.go('recovery');
        else App.overlay.open('alert-warning');
      });
      App.state.on('budget', function () { self.paint(); });
    },

    onEnter() { this.paint(); },

    paint() {
      var h = App.state.home, t = tone();
      var streak = document.getElementById('home-streak');
      streak.innerHTML = App.icon('flame.fill', 14) + (t.over ? h.bestStreak + '-day best' : h.streakDays + '-day streak');

      document.getElementById('home-hero').innerHTML = this.ring(h, t);
      var f = document.getElementById('ring-fill');
      requestAnimationFrame(function () { f.style.strokeDashoffset = C * (1 - Math.min(t.pct, 1)); });

      var n = document.getElementById('home-nudge');
      var msg, link = true, ico = t.tone === 'emerald' ? 'checkmark.circle.fill' : 'info.circle';
      if (t.over) msg = fmt(h.spentToday - h.dailyLimit) + ' over today. ' + 'See a catch-up plan';
      else if (t.tone === 'amber') msg = fmt(t.left) + ' left today. Plan your dinner';
      else msg = fmt(t.left) + ' left today. You’re on pace';
      if (t.tone === 'emerald') link = false; // healthy budget: nothing to open yet
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
        App.overlay.close(); App.router.go('home', { root: true });
      });
    }
  });
})();
