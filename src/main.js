/**
 * Savenow bootstrap — device simulation, theme, tab bar, overlays, routing.
 */

window.App = window.App || {};

/* ---------- Device context ---------- */
(function detectDevice() {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  // Desktop Chrome (device emulation or a window) has no real status bar or home indicator,
  // so we draw them. iOS Safari / Home Screen app never does (no userAgentData there).
  var chromium = !!navigator.userAgentData && !/Android/i.test(navigator.userAgent);
  var sim = !standalone && chromium;
  if (params.get('statusbar') === '1') sim = true;
  if (params.get('statusbar') === '0') sim = false;
  App.device = { standalone: standalone, sim: sim };
  if (sim) {
    root.classList.add('sim-device');
    root.style.setProperty('--sat-sim', '47px');
    root.style.setProperty('--sab-sim', '34px');
  }
  if (standalone) root.classList.add('standalone');
})();

/* ---------- Theme ---------- */
App.theme = {
  mq: window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null,
  // Follows the system appearance only; HIG discourages an app-specific light/dark setting.
  apply() {
    var s = App.state;
    var dark = !!(this.mq && this.mq.matches);
    s.theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', s.theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#000000' : '#F2F2F7');
    s.emit('theme', s.theme);
  },
  init() {
    this.apply();
    if (this.mq && this.mq.addEventListener) this.mq.addEventListener('change', function () { App.theme.apply(); });
  }
};

/* Lift sheets above the iOS keyboard (the layout viewport does not shrink when it opens) */
if (window.visualViewport) {
  var vv = window.visualViewport;
  var lift = function () { document.documentElement.style.setProperty('--kb', Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px'); };
  // iOS can leave the page scrolled after the keyboard closes, which strands the tab bar above the bottom edge
  var settle = function () {
    lift();
    window.scrollTo(0, 0);
    var app = document.getElementById('app'); if (app) app.scrollTop = 0;
  };
  vv.addEventListener('resize', function () { lift(); if (vv.height >= window.innerHeight - 1) settle(); });
  vv.addEventListener('scroll', lift);
  document.addEventListener('focusout', function () { setTimeout(settle, 120); });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', function () {
  App.theme.init();

  var scrim = document.getElementById('scrim');
  scrim.addEventListener('click', function () { App.overlay.close(); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-close-overlay]')) App.overlay.close();
  });

  (App.overlays || []).forEach(function (o) { o.mount(document.getElementById('app')); });
  App.router.init();
  if (App.maze) App.maze.init();
});
