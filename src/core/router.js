/**
 * Savenow Core — Router & screen manager
 *
 * A screen module is registered with App.registerScreen(name, mod):
 *   mod.render()   -> inner HTML (usually a .screen-body and optional .screen-footer)
 *   mod.tab        -> 'home' | 'insights' | 'social' | 'settings' to show the tab bar
 *   mod.init()     -> once, after mount
 *   mod.onEnter(p) -> every time the screen becomes visible (p = route param)
 *
 * Declarative navigation (works anywhere in the DOM):
 *   data-goto="name"  [data-param="x"]   push a screen
 *   data-back[="fallback"]               pop, or go to fallback if there is no history
 *   data-tab="name"                      switch tab root (clears history)
 * Hash routes: #name or #name/param (used by Maze missions and for testing).
 */

window.App = window.App || {};
window.App.screens = {};
window.App.registerScreen = function (name, mod) { window.App.screens[name] = mod; };

window.App.router = {
  stack: [],
  current: null,
  param: null,

  init() {
    var host = document.getElementById('screens');
    var self = this;
    Object.keys(App.screens).forEach(function (name) {
      var mod = App.screens[name];
      var el = document.createElement('section');
      el.className = 'screen' + (mod.tab ? ' has-tabbar' : '');
      el.id = 'screen-' + name;
      el.setAttribute('aria-label', mod.title || name);
      el.innerHTML = mod.render();
      host.appendChild(el);
    });
    Object.keys(App.screens).forEach(function (name) {
      if (typeof App.screens[name].init === 'function') App.screens[name].init();
    });

    document.addEventListener('click', function (e) {
      var back = e.target.closest('[data-back]');
      if (back) { e.preventDefault(); self.back(back.getAttribute('data-back')); return; }
      var tab = e.target.closest('[data-tab]');
      if (tab) { e.preventDefault(); self.go(tab.getAttribute('data-tab'), { root: true }); return; }
      var go = e.target.closest('[data-goto]');
      if (go) {
        e.preventDefault();
        self.go(go.getAttribute('data-goto').replace(/^screen-/, ''), { param: go.getAttribute('data-param') });
      }
    });

    window.addEventListener('hashchange', function () {
      var r = self.parseHash();
      if (r && r.name !== self.current) self.go(r.name, { param: r.param, hash: false, instant: true });
    });

    var start = this.parseHash();
    this.go(start ? start.name : 'onboarding', { param: start && start.param, hash: false, instant: true, root: true });
  },

  parseHash() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (!h) return null;
    var parts = h.split('/');
    return App.screens[parts[0]] ? { name: parts[0], param: parts[1] || null } : null;
  },

  go(name, opts) {
    opts = opts || {};
    var mod = App.screens[name];
    var target = document.getElementById('screen-' + name);
    if (!mod || !target) return;
    var cur = this.current && document.getElementById('screen-' + this.current);

    if (cur && cur !== target) {
      if (opts.root) this.stack = [];
      else this.stack.push({ name: this.current, param: this.param });
      if (opts.instant) { cur.classList.add('instant'); requestAnimationFrame(function () { cur.classList.remove('instant'); }); }
      this.deactivate(cur, !opts.instant && !opts.back);
    }
    this.current = name;
    this.param = opts.param || null;
    App.state.currentScreen = 'screen-' + name;

    target.classList.toggle('instant', !!opts.instant);
    target.classList.remove('leaving');
    target.classList.add('active');
    var body = target.querySelector('.screen-body');
    if (body && !opts.keepScroll) body.scrollTop = 0;
    if (opts.instant) requestAnimationFrame(function () { target.classList.remove('instant'); });

    if (opts.hash !== false) {
      try { history.replaceState(null, '', '#' + name + (this.param ? '/' + this.param : '')); } catch (err) { /* file:// */ }
    }
    document.documentElement.classList.toggle('on-dark', name === 'lock');
    this.syncTabbar(mod);
    if (typeof mod.onEnter === 'function') mod.onEnter(this.param);
    App.state.emit('route', name);
  },

  deactivate(el, forward) {
    el.classList.remove('active');
    if (forward) {
      el.classList.add('leaving');
      setTimeout(function () { el.classList.remove('leaving'); }, 340);
    }
  },

  back(fallback) {
    var prev = this.stack.pop();
    if (prev) {
      var cur = document.getElementById('screen-' + this.current);
      if (cur) this.deactivate(cur, false);
      var stack = this.stack;
      this.current = null;
      this.go(prev.name, { param: prev.param, back: true });
      this.stack = stack;
    } else if (fallback) {
      this.go(fallback.replace(/^screen-/, ''), { root: true });
    }
  },

  syncTabbar(mod) {
    var bar = document.getElementById('tabbar');
    if (!bar) return;
    bar.classList.toggle('visible', !!mod.tab);
    bar.querySelectorAll('[data-tab]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === mod.tab;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
};
