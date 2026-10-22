/** Screens: Social tab (streak + friends) and Find friends */
(function () {
  var fmt = App.fmt.money, esc = App.escapeHTML;
  var FRIENDS = [
    { n: 'Maya', h: 'Reached 30 days', t: 'Within budget · 2 hours ago', cheered: false },
    { n: 'Jon', h: 'Reached 7 days', t: 'Within budget · Yesterday', cheered: false }
  ];

  App.registerScreen('social', {
    tab: 'social',
    title: 'Social',
    render() {
      return `
        <div class="screen-body">
          <div class="ins-top"><span class="brand" style="font-size:15px;font-weight:600;color:var(--sn-text-secondary)">Savenow</span></div>
          ${App.ui.head('Social', '<span id="soc-sub"></span>')}
          <div class="card streak-card">
            <div class="eyebrow">${App.icon('flame.fill', 14)} Current streak</div>
            <div class="streak-num" id="soc-num"></div>
            <div class="streak-sub" id="soc-days"></div>
            <button class="btn btn-secondary btn-block" data-tab="home">View today’s budget</button>
          </div>
          <p class="footnote">Tracked automatically against your <span id="soc-limit"></span> daily limit. A day over your limit breaks the streak.</p>
          <p class="section-label" style="margin-top:28px">Friends’ activity</p>
          <div class="list" id="soc-friends"></div>
          <button class="btn btn-secondary btn-block" style="margin-top:12px" data-goto="find-friends">Find friends ${App.icon('chevron.right', 8)}</button>
          <p class="footnote">Friends see shared streaks, never spending amounts.</p>
        </div>`;
    },
    init() {
      document.getElementById('soc-friends').addEventListener('click', function (e) {
        var b = e.target.closest('[data-cheer]');
        if (!b) return;
        var f = FRIENDS[+b.dataset.cheer];
        f.cheered = true;
        App.showToast('You cheered ' + f.n);
        App.screens.social.paint();
      });
      App.state.on('budget', function () { App.screens.social.paint(); });
    },
    onEnter() { this.paint(); },
    paint() {
      var h = App.state.home, over = App.state.budgetStatus().over;
      document.getElementById('soc-sub').textContent = over ? 'Today went over. Tomorrow starts a new streak.' : 'Stay within budget. Keep your streak.';
      var num = document.getElementById('soc-num');
      num.textContent = over ? 0 : h.streakDays;
      num.classList.toggle('broken', over);
      document.getElementById('soc-days').textContent = over
        ? 'You are ' + fmt(h.spentToday - h.dailyLimit) + ' over your ' + fmt(h.dailyLimit, 0) + ' limit today. Your ' + h.bestStreak + '-day best is saved.'
        : 'days within your daily budget';
      document.getElementById('soc-limit').textContent = fmt(h.dailyLimit, 0);
      document.getElementById('soc-friends').innerHTML = FRIENDS.map(function (f, i) {
        return App.ui.row({
          tile: { text: f.n.slice(0, 2).toUpperCase(), cls: 'emerald' },
          title: f.n + ' ' + f.h.toLowerCase(), sub: f.t,
          toggle: '<button class="cheer ' + (f.cheered ? 'done' : '') + '" data-cheer="' + i + '"' + (f.cheered ? ' disabled' : '') + '>' + (f.cheered ? 'Cheered' : App.icon('hands.clap.fill', 14) + ' Cheer') + '</button>'
        });
      }).join('');
    }
  });

  var PEOPLE = [
    { h: 'mayatan', n: 'Maya Tan', s: '2 mutual friends', friend: true },
    { h: 'jonlim', n: 'Jon Lim', s: '1 mutual friend', friend: true },
    { h: 'testuser', n: 'Test User', s: '3 mutual friends' }
  ];

  App.registerScreen('find-friends', {
    tab: 'social',
    title: 'Find friends',
    render() {
      return `
        <div class="screen-body">
          ${App.ui.back('social')}
          ${App.ui.head('Find friends', 'Add people by username')}
          <label class="field handle-field"><span class="label">Username</span><input id="ff-q" placeholder="@username" autocapitalize="none" autocorrect="off" autocomplete="off"></label>
          <p class="section-label">Results</p>
          <div class="list" id="ff-results"></div>
          <p class="footnote">Friends see only your shared streak. They never see amounts, purchases or balances.</p>
        </div>`;
    },
    init() {
      var q = document.getElementById('ff-q');
      var self = this;
      q.addEventListener('input', function () { self.paint(); });
      document.getElementById('ff-results').addEventListener('click', function (e) {
        var b = e.target.closest('[data-add]');
        if (!b) return;
        PEOPLE.filter(function (p) { return p.h === b.dataset.add; })[0].added = true;
        App.showToast('Friend request sent');
        self.paint();
      });
    },
    onEnter() { this.paint(); },
    paint() {
      var term = document.getElementById('ff-q').value.replace(/^@/, '').trim().toLowerCase();
      var res = PEOPLE.filter(function (p) { return !term || p.h.indexOf(term) > -1 || p.n.toLowerCase().indexOf(term) > -1; });
      document.getElementById('ff-results').innerHTML = res.length ? res.map(function (p) {
        var act = '<button class="add-btn" data-add="' + p.h + '"' + (p.added || p.friend ? ' disabled' : '') + '>' + (p.friend ? 'Friends' : p.added ? 'Added' : 'Add') + '</button>';
        return App.ui.row({ tile: { text: p.n.slice(0, 2).toUpperCase(), cls: 'emerald' }, title: '@' + p.h, sub: p.s, toggle: act });
      }).join('') : '<div class="empty"><strong>No one found</strong><span>Check the username and try again</span></div>';
    }
  });
})();
