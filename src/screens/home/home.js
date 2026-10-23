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
            <div class="eyebrow">Saved · Month</div>
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
      this.initSwipe(); // harmless in variant A: no .swipe-front elements are rendered there
    },

    /** Variant B: horizontal drag on a card reveals Edit / Delete (delegated; cards are re-rendered on every paint). */
    initSwipe() {
      var list = document.getElementById('home-latest'), W = 148, cur = null, openCard = null, track = function (s) { if (App.maze) App.maze.track(s); };
      var setX = function (card, x, animate) {
        var f = card.querySelector('.swipe-front'); f.style.transition = animate ? '' : 'none'; f.style.transform = x ? 'translateX(' + x + 'px)' : '';
      };
      var close = function (card) { if (!card) return; card.classList.remove('open'); setX(card, 0, true); if (openCard === card) openCard = null; };
      var open = function (card) {
        if (openCard && openCard !== card) close(openCard);
        card.classList.add('open'); setX(card, -W, true); openCard = card; track('swipe-revealed');
      };
      list.addEventListener('pointerdown', function (e) {
        var front = e.target.closest('.swipe-front'); if (!front) return;
        var card = front.closest('[data-swipe]');
        if (openCard && openCard !== card) close(openCard);
        cur = { card: card, x0: e.clientX, y0: e.clientY, base: card.classList.contains('open') ? -W : 0, dx: 0, drag: false, id: e.pointerId };
      });
      list.addEventListener('pointermove', function (e) {
        if (!cur || e.pointerId !== cur.id) return;
        var dx = e.clientX - cur.x0, dy = e.clientY - cur.y0;
        if (!cur.drag) {
          if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { cur = null; return; } // vertical scroll wins
          if (Math.abs(dx) < 8) return;
          cur.drag = true; try { cur.card.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        cur.dx = dx; setX(cur.card, Math.max(-W - 24, Math.min(0, cur.base + dx)), false);
      });
      var end = function (e) {
        if (!cur || e.pointerId !== cur.id) return;
        var c = cur; cur = null;
        if (!c.drag) { if (c.card.classList.contains('open')) close(c.card); return; } // a tap closes an open card
        (c.base + c.dx < -W / 2 ? open : close)(c.card);
        c.card.dataset.dragged = '1'; setTimeout(function () { delete c.card.dataset.dragged; }, 0);
      };
      list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
      list.addEventListener('keydown', function (e) {
        var front = e.target.closest('.swipe-front'); if (!front || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault(); var card = front.closest('[data-swipe]'); card.classList.contains('open') ? close(card) : open(card);
      });
      list.addEventListener('click', function (e) {
        var ed = e.target.closest('[data-sw-edit]'), del = e.target.closest('[data-sw-del]');
        if (!ed && !del) return;
        var card = (ed || del).closest('[data-swipe]'); close(card);
        if (ed) App.expense.edit(ed.dataset.swEdit); else App.expense.askDelete(del.dataset.swDel);
      });
      document.addEventListener('pointerdown', function (e) { if (openCard && !e.target.closest('[data-swipe]')) close(openCard); });
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
        var edge = i === 0 ? 'accent-edge' : '', id = App.escapeHTML(e.id), title = App.escapeHTML(e.title);
        if (App.state.mazeVariant === 'B') { // B: swipe the card left to reveal Edit / Delete
          return '<div class="card latest-card swipe-card ' + edge + '" data-swipe>' +
            '<div class="swipe-actions"><button class="swipe-btn edit" data-sw-edit="' + id + '" aria-label="Edit ' + title + '">Edit</button>' +
            '<button class="swipe-btn del" data-sw-del="' + id + '" aria-label="Delete ' + title + '">Delete</button></div>' +
            '<div class="swipe-front" role="button" tabindex="0" aria-label="' + title + ', ' + fmt(e.amount) + '. Press Enter for Edit and Delete">' +
            '<span class="latest-item"><span class="tile ' + e.category + '">' + App.escapeHTML(e.initials) + '</span>' +
            '<span class="row-main"><span class="row-title" style="display:block">' + title + '</span><span class="row-sub" style="display:block">' + App.escapeHTML(e.sub) + '</span></span>' +
            '<span class="amt">' + fmt(e.amount) + '</span></span></div></div>';
        }
        return '<div class="card latest-card ' + edge + '"><button class="latest-item is-editable" data-edit-expense="' + id + '" aria-label="Edit or delete ' + title + ', ' + fmt(e.amount) + '">' +
          '<span class="tile ' + e.category + '">' + App.escapeHTML(e.initials) + '</span>' +
          '<span class="row-main"><span class="row-title" style="display:block">' + title + '</span><span class="row-sub" style="display:block">' + App.escapeHTML(e.sub) + ' · Tap to edit</span></span>' +
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
