/** Screen: Lock screen — Time Sensitive near-limit alert (Lock screen — Time Sensitive alert · Print.png) */
App.registerScreen('lock', {
  title: 'Lock screen alert',
  render() {
    return `
      <div class="screen-body lock-body">
        <button class="nav-back" data-back="settings" style="align-self:flex-start;color:#fff;margin-left:-8px">${App.icon('chevron.left', 12)}<span>Back</span></button>
        <span style="margin-top:6px">${App.icon('lock.fill', 18)}</span>
        <div class="date">Monday 7 September</div>
        <div class="time">5:45</div>
        <button class="lock-notif" data-goto="home" aria-label="Open Savenow">
          <div class="top"><span class="app-ico">S</span>Savenow <span class="ts">Time Sensitive</span><span class="now">now</span></div>
          <h2 id="lock-title"></h2>
          <p id="lock-text"></p>
        </button>
        <div class="lock-slide">Slide to open ›</div>
        <div class="lock-btns"><span>${App.icon('flashlight.fill', 22)}</span><span>${App.icon('camera.fill', 22)}</span></div>
      </div>`;
  },
  init() { document.getElementById('screen-lock').classList.add('lock'); },

  /** Wording follows today's budget state: within / near limit / over */
  onEnter() {
    var h = App.state.home, t = App.state.budgetStatus(), fmt = App.fmt.money, title, text;
    if (t.over) {
      title = fmt(h.spentToday - h.dailyLimit) + ' over today';
      text = 'You’ve passed your ' + fmt(h.dailyLimit, 0) + ' limit. Open Savenow for a catch-up plan; your best streak was ' + h.bestStreak + ' days.';
    } else if (t.tone === 'amber') {
      title = fmt(t.left) + ' left today';
      text = 'Dinner usually runs about $6. You have ' + fmt(t.left) + ' left — a light one keeps your ' + h.streakDays + '-day streak.';
    } else {
      title = fmt(t.left) + ' left today';
      text = 'You’re on pace — ' + fmt(h.spentToday) + ' of your ' + fmt(h.dailyLimit, 0) + ' limit used. Keep it up to protect your ' + h.streakDays + '-day streak.';
    }
    document.getElementById('lock-title').textContent = title;
    document.getElementById('lock-text').textContent = text;
  }
});
