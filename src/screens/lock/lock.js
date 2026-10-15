/** Screen: Lock screen — Time Sensitive near-limit alert (Lock screen — Time Sensitive alert · Print.png) */
App.registerScreen('lock', {
  title: 'Lock screen alert',
  render() {
    var h = App.state.home;
    return `
      <div class="screen-body lock-body">
        <button class="nav-back" data-back="settings" style="align-self:flex-start;color:#fff;margin-left:-8px">${App.icon('chevron.left', 12)}<span>Back</span></button>
        <span style="margin-top:6px">${App.icon('lock.fill', 18)}</span>
        <div class="date">Monday 7 September</div>
        <div class="time">5:45</div>
        <button class="lock-notif" data-goto="home" data-param="graph" aria-label="Open Savenow">
          <div class="top"><span class="app-ico">S</span>Savenow <span class="ts">Time Sensitive</span><span class="now">now</span></div>
          <h2>${App.fmt.money(Math.max(h.dailyLimit - h.spentToday, 2.6))} left today</h2>
          <p>Dinner usually runs about $6. You have $2.60 left — a light one keeps your ${h.streakDays}-day streak.</p>
        </button>
        <div class="lock-slide">Slide to open ›</div>
        <div class="lock-btns"><span>${App.icon('flashlight.fill', 22)}</span><span>${App.icon('camera.fill', 22)}</span></div>
      </div>`;
  },
  init() { document.getElementById('screen-lock').classList.add('lock'); }
});
