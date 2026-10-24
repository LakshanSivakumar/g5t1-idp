/** Screens: Budget recovery, Plan applied (non-punitive catch-up, indigo) */
(function () {
  var fmt = App.fmt.money;

  var MIN_DAYS = 2, MAX_DAYS = 14, FLOOR = 0.5; // daily guide never drops below 50% of the limit

  /** Smallest number of days that keeps the daily guide at or above the floor. */
  function minDays(extra, limit) {
    return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.ceil(extra / (limit * (1 - FLOOR)) - 1e-9)));
  }

  function plan() {
    var h = App.state.home, r = App.state.recovery;
    var extra = Math.max(Math.round((h.spentToday - h.dailyLimit) * 100) / 100, 0);
    var min = minDays(extra, h.dailyLimit);
    var days = Math.min(MAX_DAYS, Math.max(r.days || min, min));
    // Even at the longest plan the guide stays at the floor; a huge overspend is only partly recovered.
    var perDay = Math.min(Math.round(extra / days * 100) / 100, h.dailyLimit * (1 - FLOOR));
    return { extra: extra, recovered: Math.round(perDay * days * 100) / 100, days: days, min: min, perDay: perDay, guide: Math.round((h.dailyLimit - perDay) * 100) / 100 };
  }

  /** "Fri 11 Sep": the plan starts tomorrow (Mon 7 Sep in the prototype week) and runs for `days` days. */
  function endLabel(days) {
    return new Date(2026, 8, 7 + days).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function how(p) {
    var h = App.state.home;
    return '<h2 class="how-title">How the adjustment works</h2><div class="list">' +
      App.ui.row({ title: 'Daily guide', sub: 'Previously ' + fmt(h.dailyLimit) + ' per day', value: fmt(p.guide) }) +
      App.ui.row({ title: 'Recovered over ' + p.days + ' days', sub: fmt(p.perDay) + ' × ' + p.days + ' days', value: fmt(p.recovered) }) + '</div>';
  }

  App.registerScreen('recovery', {
    tab: 'home',
    title: 'Budget recovery',
    render() { return '<div class="screen-body">' + App.ui.back('home') + '<div id="rec-body"></div></div>'; },
    onEnter() {
      if (!App.state.recovery.applied) App.state.recovery.days = null; // start from the recommended length
      this.paint();
    },
    paint() {
      var p = plan();
      document.getElementById('rec-body').innerHTML =
        App.ui.head('Budget recovery', 'A small adjustment for the days ahead') +
        '<div class="card rec-card"><h2>' + fmt(p.extra) + ' extra today</h2><p class="sub">Spread across the next ' + p.days + ' days</p>' +
        '<p class="body">Trimming ' + fmt(p.perDay) + ' a day for the next ' + p.days + ' days makes up ' + (p.recovered < p.extra ? fmt(p.recovered) + ' of today’s ' : 'today’s ') + fmt(p.extra) + '.</p>' +
        '<div class="rec-stepper" role="group" aria-label="Plan length"><span class="rec-stepper-label">Plan length</span>' +
        '<button class="rec-step" id="rec-minus" aria-label="Fewer days"' + (p.days <= p.min ? ' disabled' : '') + '>−</button>' +
        '<span class="rec-days" aria-live="polite"><b>' + p.days + '</b> days</span>' +
        '<button class="rec-step" id="rec-plus" aria-label="More days"' + (p.days >= MAX_DAYS ? ' disabled' : '') + '>+</button></div>' +
        '<p class="rec-hint">' + (p.days === p.min ? 'Shortest plan that keeps your guide above ' + fmt(App.state.home.dailyLimit * FLOOR) + ' a day.' : 'Longer plans trim less each day.') + '</p>' +
        '<p class="guide">Suggested daily guide: ' + fmt(p.guide) + '</p>' +
        '<button class="btn btn-primary btn-block" id="rec-use">Use this plan</button></div>' +
        how(p) +
        '<p class="footnote">This is a suggestion, not an automatic change. If you use a plan, your streak is protected but will not grow while it runs. If you go over your daily guide during the plan, the streak is lost — your ' + App.state.home.bestStreak + '-day best is saved.</p>' +
        '<button class="btn btn-secondary btn-block" style="margin-top:20px" data-back="home" id="rec-keep">Keep my current plan</button>';
      var self = this;
      var step = function (d) { App.state.recovery.days = p.days + d; self.paint(); };
      document.getElementById('rec-minus').onclick = function () { step(-1); };
      document.getElementById('rec-plus').onclick = function () { step(1); };
      document.getElementById('rec-use').onclick = function () { App.state.recovery.applied = true; App.router.go('plan-applied'); };
    }
  });

  App.registerScreen('plan-applied', {
    tab: 'home',
    title: 'Plan applied',
    render() { return '<div class="screen-body">' + App.ui.back('home') + '<div id="pa-body"></div></div>'; },
    onEnter() {
      var p = plan(), h = App.state.home;
      document.getElementById('pa-body').innerHTML =
        App.ui.head('Plan applied', 'Your guide for the next ' + p.days + ' days') +
        '<div class="card rec-card"><div class="eyebrow rec-eyebrow">' + App.icon('checkmark.circle.fill', 14) + ' Catch-up plan applied</div>' +
        '<div class="rec-big">' + fmt(p.guide) + ' a day</div><p class="sub">Until Friday 11 Sep</p>' +
        '<p class="body" style="font-size:16px">Savenow will use ' + fmt(p.guide) + ' as today’s guide for the next ' + p.days + ' days, then go back to ' + fmt(h.dailyLimit, 0) + '.</p>' +
        '<p class="guide">Your ' + fmt(h.dailyLimit, 0) + ' daily limit is unchanged.</p>' +
        '<button class="btn btn-primary btn-block" data-tab="home">Done</button></div>' +
        how(p) +
        '<p class="footnote">Your streak is protected but will not grow during these ' + p.days + ' days. If you go over your daily guide, the streak is lost — your ' + h.bestStreak + '-day best is saved. You can undo this plan at any time.</p>' +
        '<button class="btn btn-secondary btn-block" style="margin-top:20px" id="pa-undo">Undo this plan</button>';
      document.getElementById('pa-undo').onclick = function () { App.state.recovery.applied = false; App.showToast('Plan removed'); App.router.back('recovery'); };
    }
  });
})();
