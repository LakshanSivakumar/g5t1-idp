/** Screen: End-of-day "Log today's cash" reminder, shown as a lock-screen notification.
 *  Tapping the notification opens Savenow on Home with the Add expense sheet already up. */
App.registerScreen('cash-reminder', {
  title: 'Cash reminder',
  render() {
    return `
      <div class="screen-body lock-body">
        <button class="nav-back" data-back="settings" style="align-self:flex-start;color:#fff;margin-left:-8px">${App.icon('chevron.left', 12)}<span>Back</span></button>
        <span style="margin-top:6px">${App.icon('lock.fill', 18)}</span>
        <div class="date" id="cr-date"></div>
        <div class="time">9:00</div>
        <button class="lock-notif cash-notif" id="cr-notif" aria-label="Open Savenow to log today’s cash">
          <div class="top"><span class="app-ico">S</span>Savenow <span class="now">now</span></div>
          <h2>Log today’s cash</h2>
          <p id="cr-text"></p>
        </button>
        <div class="lock-slide">Tap the notification to open ›</div>
        <div class="lock-btns"><span>${App.icon('flashlight.fill', 22)}</span><span>${App.icon('camera.fill', 22)}</span></div>
      </div>`;
  },

  init() {
    document.getElementById('screen-cash-reminder').classList.add('lock');
    document.getElementById('cr-notif').addEventListener('click', function () {
      // Open the app on Home, then raise the Add expense sheet inside this tap so the keyboard can come up
      App.router.go('home', { root: true });
      document.getElementById('tab-add').click();
    });
  },

  onEnter() {
    var h = App.state.home, fmt = App.fmt.money;
    document.getElementById('cr-date').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('cr-text').textContent = 'Paid in cash today? Add it now so your ' + fmt(h.dailyLimit, 0) + ' daily budget stays accurate and your ' + h.streakDays + '-day streak is safe.';
    var n = document.getElementById('cr-notif');
    n.classList.remove('arrive'); void n.offsetWidth; n.classList.add('arrive');
  }
});
