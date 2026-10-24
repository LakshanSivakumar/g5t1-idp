/** Screen: Setup 2 — Goal & budget (Setup 2 — Goal & budget · Empty / Filled) */
App.registerScreen('setup-2', {
  title: 'Goal & budget',

  render() {
    var ui = App.ui, b = App.state.budget;
    return `
      <div class="screen-body">
        ${App.setupHead('Set your goal & budget', 'Set a goal and spending limits. You can edit these later in Settings.')}
        <p class="section-label" style="margin-top:4px">Goal</p>
        <div class="field-stack">
          ${ui.field({ id: 'g-purpose', label: 'Purpose', placeholder: 'e.g. MacBook Pro' })}
          <div class="field-row">
            ${ui.field({ id: 'g-amount', label: 'Goal amount', prefix: '$', inputmode: 'decimal', placeholder: '2,000' })}
            ${ui.field({ id: 'g-date', label: 'Goal date', placeholder: 'MM/YYYY', inputmode: 'numeric', maxlength: 7 })}
          </div>
        </div>
        <p class="section-label">Budget</p>
        <div class="field-stack">
          <div class="goal-hint">${ui.field({ id: 'b-daily', label: 'Daily', prefix: '$', inputmode: 'decimal' })}<span class="hint">Daily spending limit</span></div>
          <div class="goal-hint">${ui.field({ id: 'b-weekly', label: 'Weekly', prefix: '$', inputmode: 'decimal' })}<span class="hint">Any 7 consecutive days</span></div>
          <div class="goal-hint">${ui.field({ id: 'b-monthly', label: 'Monthly', prefix: '$', inputmode: 'decimal' })}<span class="hint">30-day spending limit</span></div>
        </div>
        <p class="section-label">Income</p>
        <div class="goal-hint">${ui.field({ id: 'b-income', label: 'Monthly', prefix: '$', inputmode: 'decimal' })}<span class="hint"></span></div>
        <p class="goal-note" id="goal-note">Enter your daily limit to continue.</p>
      </div>
      <div class="screen-footer">
        <button class="btn btn-secondary btn-grow" data-back="setup-1">Back</button>
        <button class="btn btn-primary btn-grow is-disabled" id="goal-continue" aria-disabled="true">Continue</button>
      </div>`;
  },

  init() {
    var $ = function (id) { return document.getElementById(id); };
    var num = function (el) { return parseFloat(String(el.value).replace(/[^0-9.]/g, '')) || 0; };
    var daily = $('b-daily'), weekly = $('b-weekly'), monthly = $('b-monthly');
    var cont = $('goal-continue');

    // Goal date is optional, but if given it must be a real MM/YYYY this month or later
    function dateOk() {
      var v = $('g-date').value;
      if (!v) return true;
      var m = /^(\d{2})\/(\d{4})$/.exec(v);
      if (!m || m[1] < 1 || m[1] > 12) return false;
      var now = new Date();
      return +m[2] * 12 + +m[1] >= now.getFullYear() * 12 + now.getMonth() + 1;
    }

    function sync() {
      var d = num(daily), ok = dateOk();
      $('g-date').closest('.field').classList.toggle('invalid', !ok);
      weekly.placeholder = d ? String(d * 7) : '';
      monthly.placeholder = d ? String(d * 30) : '';
      cont.classList.toggle('is-disabled', !d || !ok);
      cont.setAttribute('aria-disabled', d && ok ? 'false' : 'true');
      $('goal-note').textContent = !ok ? 'Enter a goal date as MM/YYYY (this month or later), or leave it blank.' : 'Enter your daily limit to continue.';
      $('goal-note').hidden = !!d && ok;
    }
    daily.addEventListener('input', sync);

    // MM/YYYY helper
    $('g-date').addEventListener('input', function (e) {
      var v = e.target.value.replace(/\D/g, '').slice(0, 6);
      e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
      sync();
    });

    // Tapping an empty goal field fills in sample content
    var next = new Date(); next.setFullYear(next.getFullYear() + 1);
    var samples = { 'g-purpose': 'MacBook Pro', 'g-amount': '2000', 'g-date': ('0' + (next.getMonth() + 1)).slice(-2) + '/' + next.getFullYear() };
    Object.keys(samples).forEach(function (id) {
      $(id).addEventListener('focus', function (e) { if (!e.target.value) { e.target.value = samples[id]; e.target.select(); sync(); } });
    });

    cont.addEventListener('click', function () {
      var d = num(daily);
      if (!d || !dateOk()) { (d ? $('g-date') : daily).focus(); return; }
      var err = App.budgetError(d, num(weekly), num(monthly));
      if (err) { App.showToast(err); return; }
      var s = App.state;
      s.budget.daily = d;
      s.budget.weekly = num(weekly) || d * 7;
      s.budget.monthly = num(monthly) || d * 30;
      s.budget.incomeMonthly = num($('b-income'));
      s.home.dailyLimit = d;
      if ($('g-purpose').value.trim()) s.goal.purpose = $('g-purpose').value.trim();
      if (num($('g-amount'))) s.goal.amount = num($('g-amount'));
      App.router.go('setup-3');
    });
    sync();
  }
});
