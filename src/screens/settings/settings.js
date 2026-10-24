/** Screens: Settings tab and its sub-pages (Settings · Print.png and Settings — * screens) */
(function () {
  var fmt = App.fmt.money, ui = App.ui, esc = App.escapeHTML;

  function page(name, o) {
    var mod = Object.assign({}, o, {
      tab: 'settings',
      render() { return '<div class="screen-body">' + ui.back('settings') + ui.head(o.title, o.sub) + '<div id="sp-' + name + '">' + (o.html ? o.html() : '') + '</div></div>'; }
    });
    App.registerScreen(name, mod);
  }

  /** Banks the user has linked, in setup order. */
  function connectedBanks() {
    return App.BANKS.filter(function (b) { return App.state.connectedBanks[b.id]; });
  }

  function section(label, rows) { return '<p class="section-label">' + label + '</p><div class="list">' + rows.join('') + '</div>'; }

  /* ---------- Settings root ---------- */
  App.registerScreen('settings', {
    tab: 'settings',
    title: 'Settings',

    render() {
      var u = App.state.user;
      return `
        <div class="screen-body">
          ${ui.head('Settings', 'Your account and preferences')}
          <div class="card profile-card"><span class="avatar">BT</span><div><div class="profile-name">${esc(u.name)}</div><div class="profile-sub">@${esc(u.handle)} · ${u.currency} · ${u.country}</div></div></div>
          <div id="settings-money"></div>
          ${section('Preferences', [
            ui.row({ title: 'Privacy &amp; sharing', sub: 'You choose what friends see', goto: 'settings-privacy' }),
            ui.row({ title: 'Notifications', sub: 'Near-limit alerts on', goto: 'settings-notifications' }),
            ui.row({ title: 'Help &amp; support', sub: 'How Savenow works', goto: 'settings-help' })
          ])}
          <p class="section-label proto proto-only">Developer settings</p>
          <div class="list proto-grid proto-only">
            <div class="eyebrow">Budget state today</div>
            <div class="segmented" id="state-seg" role="radiogroup" aria-label="Budget state">
              <button role="radio" data-state="12">Within</button><button role="radio" data-state="17.4">Near limit</button><button role="radio" data-state="21.2">Over</button></div>
            <button class="btn btn-secondary" id="proto-warning">Preview budget warning</button>
            <button class="btn btn-secondary" data-goto="lock">Preview lock-screen alert</button>
            <div class="eyebrow" style="margin-top:6px">Maze A/B testing <span id="maze-status-badge" class="maze-status">Not connected</span></div>
            <div class="maze-variants"><button class="btn btn-secondary maze-variant-btn" id="btn-var-a">Variant A</button><button class="btn btn-secondary maze-variant-btn" id="btn-var-b">Variant B</button></div>
            <label class="field"><span class="label">Maze API key</span><input id="maze-api-key-input" placeholder="Paste key" autocomplete="off"></label>
            <button class="btn btn-secondary" id="btn-save-maze-key">Save key</button>
            <button class="btn btn-secondary" id="btn-copy-maze-url">Copy test link</button>
          </div>
          <button class="btn btn-ghost btn-block logout" data-goto="onboarding">Log out</button>
        </div>`;
    },

    init() {
      document.getElementById('state-seg').addEventListener('click', function (e) {
        var b = e.target.closest('[data-state]'); if (!b) return;
        var h = App.state.home; h.spentToday = parseFloat(b.dataset.state); h.week[h.week.length - 1].v = h.spentToday;
        App.state.emit('budget'); App.screens.settings.paint();
      });
      document.getElementById('proto-warning').onclick = function () { App.overlay.open('alert-warning'); };
      document.getElementById('btn-var-a').onclick = function () { App.maze.switchVariant('A'); };
      document.getElementById('btn-var-b').onclick = function () { App.maze.switchVariant('B'); };
      App.state.on('recurring', function () { App.screens.settings.paint(); });
    },
    onEnter() { this.paint(); },

    paint() {
      var s = App.state, banks = connectedBanks();
      var rec = s.recurringExpenses, recTot = rec.reduce(function (a, e) { return a + e.amount; }, 0);
      document.getElementById('settings-money').innerHTML = section('Your money', [
        ui.row({ title: 'Goal &amp; budget', sub: esc(s.goal.purpose) + ' · ' + fmt(s.budget.daily, 0) + ' daily limit', goto: 'settings-goal' }),
        ui.row({ title: 'Connected accounts', sub: banks.length ? banks.map(function (b) { return b.name; }).join(', ') + ' connected' : 'No accounts connected', goto: 'settings-accounts' }),
        ui.row({ title: 'Recurring expenses', sub: rec.length + ' expense' + (rec.length === 1 ? '' : 's') + ' · ' + fmt(recTot) + ' / month', goto: 'settings-recurring' })
      ]);
      var pct = s.home.spentToday;
      document.querySelectorAll('[data-state]').forEach(function (b) {
        var on = Math.abs(parseFloat(b.dataset.state) - pct) < 0.005;
        b.classList.toggle('active', on); b.setAttribute('aria-checked', on);
      });
    }
  });

  /* ---------- Sub-pages ---------- */
  // Confirm sheet for saving goal & budget (mounted on #app so it centres over the screen, not the scrolling list)
  App.overlays = App.overlays || [];
  App.overlays.push({
    mount(app) {
      var el = document.createElement('div');
      el.className = 'alert-wrap'; el.id = 'sg-confirm';
      el.innerHTML = '<div class="alert" role="alertdialog" aria-modal="true" aria-labelledby="sg-confirm-title">' +
        '<h2 id="sg-confirm-title">Save these changes?</h2><p>Your goal and spending limits will be updated. New limits apply from tomorrow.</p>' +
        '<div class="stack"><button class="btn btn-primary" id="sg-confirm-ok">Save changes</button><button class="btn btn-secondary" data-close-overlay>Keep editing</button></div></div>';
      app.appendChild(el);
    }
  });

  App.overlays.push({
    mount(app) {
      var el = document.createElement('div');
      el.className = 'alert-wrap'; el.id = 'sg-discard';
      el.innerHTML = '<div class="alert" role="alertdialog" aria-modal="true" aria-labelledby="sg-discard-title">' +
        '<h2 id="sg-discard-title">You haven’t saved your changes</h2><p>If you leave now, your goal and budget edits will be lost.</p>' +
        '<div class="stack"><button class="btn btn-primary" data-close-overlay>Keep editing</button><button class="btn btn-secondary btn-destructive" id="sg-discard-ok">Discard changes</button></div></div>';
      app.appendChild(el);
    }
  });

  page('settings-goal', {
    title: 'Goal & budget', sub: 'Your target and your limits',
    html() {
      var s = App.state;
      var pen = '<span class="edit-pen">' + App.icon('pencil', 14) + '</span>';
      var vf = function (id, t, v, pre) { return '<label class="val-field" for="' + id + '"><span class="t">' + t + '</span><span class="val-edit">' + (pre || '') + '<input id="' + id + '" inputmode="decimal" enterkeyhint="done" value="' + v + '">' + pen + '</span></label>'; };
      return '<p class="section-label" style="margin-top:0">Your goal</p><div class="list">' +
        '<label class="val-field" for="sg-purpose"><span class="t">Goal</span><span class="val-edit"><input id="sg-purpose" value="' + esc(s.goal.purpose) + '" style="width:150px">' + pen + '</span></label>' +
        vf('sg-amount', 'Amount', s.goal.amount, '$') + '</div>' +
        '<p class="section-label">Your limits</p><div class="list">' +
        vf('sg-daily', 'Daily limit', s.budget.daily, '$') + vf('sg-weekly', 'Any 7 consecutive days', s.budget.weekly, '$') + vf('sg-monthly', 'Any 30 days', s.budget.monthly, '$') + '</div>' +
        '<p class="section-label">Your income</p><div class="list">' + vf('sg-income', 'Monthly income', s.budget.incomeMonthly || '', '$') + '</div>' +
        '<button class="btn btn-secondary btn-block" id="sg-save" style="margin-top:20px">Save changes</button>' +
        '<p class="save-note">Changing your daily limit does not reset your streak. New limits apply from tomorrow.</p>';
    },
    // Saved values, keyed by input id
    saved() {
      var s = App.state;
      return { 'sg-purpose': s.goal.purpose, 'sg-amount': s.goal.amount, 'sg-daily': s.budget.daily, 'sg-weekly': s.budget.weekly, 'sg-monthly': s.budget.monthly, 'sg-income': s.budget.incomeMonthly || '' };
    },
    reset() {
      var v = this.saved();
      Object.keys(v).forEach(function (id) { document.getElementById(id).value = v[id]; });
    },
    dirty() {
      var v = this.saved();
      return Object.keys(v).some(function (id) { return document.getElementById(id).value.trim() !== String(v[id]); });
    },
    onEnter() { this.reset(); }, // never show edits that were not saved

    init() {
      var self = this;
      // Leaving with unsaved edits asks first
      document.querySelector('#screen-settings-goal .nav-back').addEventListener('click', function (e) {
        if (!self.dirty()) return;
        e.stopPropagation(); e.preventDefault();
        App.overlay.open('sg-discard');
      });
      document.getElementById('sg-discard-ok').onclick = function () { App.overlay.close(); App.router.back('settings'); };
      var n = function (id) { return parseFloat(document.getElementById(id).value.replace(/[^0-9.]/g, '')) || 0; };
      document.getElementById('sg-save').onclick = function () {
        var d = n('sg-daily');
        if (!d) { App.showToast('Enter a daily limit'); return; }
        var err = App.budgetError(d, n('sg-weekly'), n('sg-monthly'));
        if (err) { App.showToast(err); return; }
        App.overlay.open('sg-confirm');
      };
      document.getElementById('sg-confirm-ok').onclick = function () {
        App.overlay.close();
        var s = App.state, d = n('sg-daily');
        s.goal.purpose = document.getElementById('sg-purpose').value.trim() || s.goal.purpose;
        s.goal.amount = n('sg-amount') || s.goal.amount;
        s.budget.daily = d; s.budget.weekly = n('sg-weekly') || d * 7; s.budget.monthly = n('sg-monthly') || d * 30;
        s.budget.incomeMonthly = n('sg-income'); // optional: empty clears it
        s.home.dailyLimit = d; s.emit('budget');
        App.showToast('Changes saved'); App.router.back('settings');
      };
    }
  });

  page('settings-accounts', {
    title: 'Connected accounts', sub: 'Where your spending is read from',
    html() { return '<div id="acc-connected"></div>' +
        section('Add', [ui.row({ title: 'Add an account', sub: 'Bank or card', goto: 'setup-1', param: 'settings' }), ui.row({ title: 'Enter expenses manually', sub: 'Use the Add tab instead', id: 'acc-manual' })]) +
        '<p class="footnote">Savenow can read transactions so it can track spending for you. It can never move money or make payments.</p>';
    },
    init() {
      document.getElementById('acc-manual').onclick = function () { App.overlay.open('add-sheet'); };
      // Disconnect asks first; one alert is reused for whichever bank was tapped
      var pending = null;
      var alert = document.createElement('div');
      alert.className = 'alert-wrap'; alert.id = 'alert-disconnect';
      alert.innerHTML = '<div class="alert" role="alertdialog" aria-modal="true" aria-labelledby="dc-title">' +
        '<h2 id="dc-title"></h2><p>Savenow will stop importing your spending from this account. You can reconnect any time, or add expenses manually.</p>' +
        '<div class="stack"><button class="btn btn-danger" id="dc-confirm">Disconnect</button><button class="btn btn-secondary" data-close-overlay>Cancel</button></div></div>';
      document.getElementById('app').appendChild(alert);
      document.getElementById('acc-connected').addEventListener('click', function (e) {
        var b = e.target.closest('[data-disconnect]'); if (!b) return;
        pending = App.BANKS.filter(function (x) { return x.id === b.dataset.disconnect; })[0];
        document.getElementById('dc-title').textContent = 'Disconnect ' + pending.name + '?';
        App.overlay.open('alert-disconnect');
      });
      document.getElementById('dc-confirm').onclick = function () {
        if (!pending) return;
        App.state.connectedBanks[pending.id] = false;
        App.overlay.close();
        App.showToast(pending.name + ' disconnected');
        pending = null;
        App.screens['settings-accounts'].paint();
      };
    },
    onEnter() { this.paint(); },
    paint() {
      var banks = connectedBanks();
      var rows = banks.length
        ? banks.map(function (b) { return ui.row({ title: b.name, sub: 'Connected · updates daily', toggle: '<button class="btn btn-danger-tint" data-disconnect="' + b.id + '" aria-label="Disconnect ' + b.name + '">Disconnect</button>' }); })
        : [ui.row({ title: 'No accounts connected', sub: 'Add one below, or enter expenses manually' })];
      document.getElementById('acc-connected').innerHTML = section('Connected', rows).replace('<p class="section-label">', '<p class="section-label" style="margin-top:0">');
    }
  });

  page('settings-recurring', {
    title: 'Recurring expenses', sub: 'Bills and subscriptions',
    html() { return '<p class="section-label" style="margin-top:0">This month</p><div class="card exp-list" id="sr-list"></div>' +
      '<div class="list" style="margin-top:12px">' + ui.row({ title: 'Add a recurring expense', sub: 'Rent, subscriptions, bills', goto: 'setup-3', param: 'settings' }) + '</div>' +
      '<p class="section-label">Total</p><div class="list" id="sr-total"></div>' +
      '<p class="footnote">Recurring expenses count towards your 30-day cap, not your $20 daily limit, so a bill day will not end your streak.</p>'; },
    init() { App.state.on('recurring', function () { App.screens['settings-recurring'].paint(); }); },
    onEnter() { this.paint(); },
    paint() {
      App.renderRecurring(document.getElementById('sr-list'));
      var r = App.state.recurringExpenses, t = r.reduce(function (a, e) { return a + e.amount; }, 0);
      document.getElementById('sr-total').innerHTML = ui.row({ title: r.length + ' recurring expense' + (r.length === 1 ? '' : 's'), sub: 'Charged each month', value: fmt(t) });
    }
  });
  // the recurring list uses delegated remove buttons
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('#sr-list [data-remove]');
    if (rm) App.removeRecurring(rm.dataset.remove);
    var ed = e.target.closest('#sr-list [data-edit]');
    if (ed) { App.router.go('setup-3', { param: 'settings' }); setTimeout(function () { var b = document.querySelector('#rec-list [data-edit="' + ed.dataset.edit + '"]'); if (b) b.click(); }, 50); }
  });

  page('settings-privacy', {
    title: 'Privacy & sharing', sub: 'Choose what others can see',
    html() {
      var s = App.state.settings;
      return '<div class="list">' + ui.row({ title: 'Allow friend requests', sub: 'People can find your username', toggle: ui.switchEl('pv-req', s.friendRequests) }) +
        ui.row({ title: 'Share financial information', sub: 'Your friends can see your exact budget, savings and balances.', toggle: ui.switchEl('pv-fin', s.shareFinancial) }) + '</div>';
    },
    init() {
      document.getElementById('pv-req').onchange = function (e) { App.state.settings.friendRequests = e.target.checked; };
      document.getElementById('pv-fin').onchange = function (e) { App.state.settings.shareFinancial = e.target.checked; };
    }
  });

  page('settings-notifications', {
    title: 'Notifications', sub: 'What Savenow tells you, and when',
    html() {
      var n = App.state.settings.notif;
      var r = function (id, t, s) { return ui.row({ title: t, sub: s, toggle: ui.switchEl(id, n[id.replace('nt-', '')]) }); };
      return '<p class="section-label" style="margin-top:0">Budget</p><div class="list">' + r('nt-nearLimit', 'Near-limit alert', 'When about 15% of today’s budget is left') + r('nt-daily', 'Daily summary', 'A short recap at 9:00 pm') + '</div>' +
        '<p class="section-label">Streak &amp; friends</p><div class="list">' + r('nt-milestones', 'Streak milestones', 'At 7, 30 and 100 days') + r('nt-friends', 'Friend activity', 'When a friend reaches a milestone') + '</div>' +
        '<button class="btn btn-secondary btn-block" style="margin-top:20px" data-goto="lock">Preview near-limit alert</button>' +
        '<p class="footnote">Savenow sends at most one budget alert a day, so a run of small purchases will not keep interrupting you.</p>';
    },
    init() {
      document.querySelectorAll('[id^="nt-"]').forEach(function (el) {
        el.onchange = function () { App.state.settings.notif[el.id.replace('nt-', '')] = el.checked; };
      });
    }
  });

  page('settings-help', {
    title: 'Help & support', sub: 'How Savenow works',
    html() {
      var t = function (x, s, k) { return ui.row({ title: x, sub: s, id: k }); };
      return '<p class="section-label" style="margin-top:0">The basics</p><div class="list">' +
        t('How your daily limit works', 'Your $20 a day, and the 7-day and 30-day caps', 'h1') + t('How streaks are counted', 'A day over your limit ends the streak', 'h2') + t('How spending is tagged', 'Everyday, recurring and discretionary', 'h3') + '</div>' +
        '<p class="section-label">Get in touch</p><div class="list">' + t('Contact support', 'We reply within one working day', 'h4') + t('Privacy and your data', 'What we store and what friends can see', 'h5') + '</div>' +
        '<p class="footnote">Savenow reads transactions from the accounts you connect. It never moves money and never shares amounts with friends.</p>';
    },
    init() { document.querySelectorAll('#sp-settings-help [id^="h"]').forEach(function (b) { b.onclick = function () { App.showToast('Help articles are not part of this prototype'); }; }); }
  });
})();
