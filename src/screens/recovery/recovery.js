/** Screens: Budget recovery, Plan applied (non-punitive catch-up, indigo) */
(function () {
  var fmt = App.fmt.money;

  function plan() {
    var h = App.state.home;
    var extra = Math.max(Math.round((h.spentToday - h.dailyLimit) * 100) / 100, 0);
    var perDay = Math.round(extra / 4 * 100) / 100;
    return { extra: extra, perDay: perDay, guide: Math.round((h.dailyLimit - perDay) * 100) / 100 };
  }

  function how(p) {
    var h = App.state.home;
    return '<h2 class="how-title">How the adjustment works</h2><div class="list">' +
      App.ui.row({ title: 'Daily guide', sub: 'Previously ' + fmt(h.dailyLimit) + ' per day', value: fmt(p.guide) }) +
      App.ui.row({ title: 'Recovered over 4 days', sub: fmt(p.perDay) + ' × 4 days', value: fmt(p.extra) }) + '</div>';
  }

  App.registerScreen('recovery', {
    tab: 'home',
    title: 'Budget recovery',
    render() { return '<div class="screen-body">' + App.ui.back('home') + '<div id="rec-body"></div></div>'; },
    onEnter() {
      var p = plan();
      document.getElementById('rec-body').innerHTML =
        App.ui.head('Budget recovery', 'A small adjustment for the days ahead') +
        '<div class="card rec-card"><h2>' + fmt(p.extra) + ' extra today</h2><p class="sub">Spread across the next 4 days</p>' +
        '<p class="body">Trimming ' + fmt(p.perDay) + ' a day for the next 4 days makes up today’s ' + fmt(p.extra) + '.</p>' +
        '<p class="guide">Suggested daily guide: ' + fmt(p.guide) + '</p>' +
        '<button class="btn btn-primary btn-block" id="rec-use">Use this plan</button></div>' +
        how(p) +
        '<p class="footnote">This is a suggestion, not an automatic change. Today’s overspend still ends your streak — your ' + App.state.home.bestStreak + '-day best is saved.</p>' +
        '<button class="btn btn-secondary btn-block" style="margin-top:20px" data-back="home" id="rec-keep">Keep my current plan</button>';
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
        App.ui.head('Plan applied', 'Your guide for the next 4 days') +
        '<div class="card rec-card"><div class="eyebrow rec-eyebrow">' + App.icon('checkmark.circle.fill', 14) + ' Catch-up plan applied</div>' +
        '<div class="rec-big">' + fmt(p.guide) + ' a day</div><p class="sub">Until Friday 11 Sep</p>' +
        '<p class="body" style="font-size:16px">Savenow will use ' + fmt(p.guide) + ' as today’s guide for the next 4 days, then go back to ' + fmt(h.dailyLimit, 0) + '.</p>' +
        '<p class="guide">Your ' + fmt(h.dailyLimit, 0) + ' daily limit is unchanged.</p>' +
        '<button class="btn btn-primary btn-block" data-tab="home">Done</button></div>' +
        how(p) +
        '<p class="footnote">You can undo this at any time. Today’s overspend still ended your streak — your ' + h.bestStreak + '-day best is saved.</p>' +
        '<button class="btn btn-secondary btn-block" style="margin-top:20px" id="pa-undo">Undo this plan</button>';
      document.getElementById('pa-undo').onclick = function () { App.state.recovery.applied = false; App.showToast('Plan removed'); App.router.back('recovery'); };
    }
  });
})();
