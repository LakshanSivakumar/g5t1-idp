/**
 * Savenow Core — UI helpers (markup builders shared by screens)
 */

window.App = window.App || {};

/** "Bubble tea" → "BT", "Food" → "FO" */
window.App.initialsOf = function (t) {
  var w = t.trim().split(/\s+/);
  return (w.length > 1 ? w[0][0] + w[1][0] : t.trim().slice(0, 2)).toUpperCase();
};
window.App.escapeHTML = function (str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

window.App.ui = {
  esc: window.App.escapeHTML,

  /** "‹ Back" nav row. `fallback` is used when there is no history. */
  back(fallback, label) {
    return '<div class="nav-row"><button class="nav-back" data-back="' + (fallback || '') + '" aria-label="' + (label || 'Back') + '">' +
      App.icon('chevron.left', 12) + '<span>' + (label || 'Back') + '</span></button></div>';
  },

  /** Large title + optional subtitle (iOS large-title navigation bar). */
  head(title, sub, cls) {
    return '<header class="screen-head ' + (cls || '') + '"><h1 class="large-title">' + title + '</h1>' +
      (sub ? '<p class="page-sub">' + sub + '</p>' : '') + '</header>';
  },

  /** Grouped list row. opts: title, sub, value, goto, param, icon, tile, onclick id, chevron */
  row(o) {
    var tag = o.goto || o.id ? 'button' : 'div';
    var attrs = '';
    if (o.goto) attrs += ' data-goto="' + o.goto + '"' + (o.param ? ' data-param="' + o.param + '"' : '');
    if (o.id) attrs += ' id="' + o.id + '"';
    if (o.action) attrs += ' data-action="' + o.action + '"';
    var cls = 'row' + (o.goto || o.id || o.action ? ' is-link' : '');
    var lead = o.tile ? '<span class="tile ' + (o.tile.cls || '') + '">' + (o.tile.icon ? App.icon(o.tile.icon, 18) : App.ui.esc(o.tile.text || '')) + '</span>' : '';
    var tail = o.value !== undefined ? '<span class="row-value ' + (o.valueCls || '') + '">' + o.value + '</span>' : '';
    if (o.toggle) tail = o.toggle;
    var chev = o.chevron || (o.goto && o.value === undefined && !o.toggle) ? '<span class="chev">' + App.icon('chevron.right', 8) + '</span>' : '';
    return '<' + tag + ' class="' + cls + '"' + attrs + '>' + lead +
      '<span class="row-main"><span class="row-title" style="display:block">' + o.title + '</span>' +
      (o.sub ? '<span class="row-sub" style="display:block">' + o.sub + '</span>' : '') + '</span>' + tail + chev + '</' + tag + '>';
  },

  /** Float-label outlined field. */
  field(o) {
    var input = '<input id="' + o.id + '" type="' + (o.type || 'text') + '"' +
      (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') +
      (o.placeholder ? ' placeholder="' + o.placeholder + '"' : '') +
      (o.value !== undefined ? ' value="' + App.ui.esc(o.value) + '"' : '') +
      (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : ' autocomplete="off"') +
      (o.maxlength ? ' maxlength="' + o.maxlength + '"' : '') + '>';
    var pre = o.prefix ? '<span class="sym">' + o.prefix + '</span>' : '';
    var eye = o.type === 'password' ? '<button type="button" class="eye" data-eye="' + o.id + '" aria-label="Show password">' + App.icon('eye', 20) + '</button>' : '';
    return '<label class="field ' + (o.prefix ? 'prefix' : '') + '" for="' + o.id + '"><span class="label">' + o.label + '</span>' + pre + input + eye + '</label>';
  },

  switchEl(id, on) {
    return '<label class="switch"><input type="checkbox" id="' + id + '" role="switch"' + (on ? ' checked' : '') + '><span class="track"></span></label>';
  },

  money: function (n, dp) { return App.fmt.money(n, dp); }
};

/* Password visibility toggle (delegated) */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-eye]');
  if (!b) return;
  var input = document.getElementById(b.getAttribute('data-eye'));
  if (!input) return;
  var show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  b.innerHTML = App.icon(show ? 'eye.slash' : 'eye', 20);
  b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

/* Amount fields (inputmode="decimal"): digits and one decimal point, max two decimals */
document.addEventListener('input', function (e) {
  var el = e.target;
  if (!el.matches || !el.matches('input[inputmode="decimal"]')) return;
  var p = el.value.replace(/[^0-9.]/g, '').split('.');
  var v = p.length > 1 ? p[0] + '.' + p.slice(1).join('').slice(0, 2) : p[0];
  if (v !== el.value) el.value = v;
});

/* Toast */
(function () {
  var t = null;
  window.App.showToast = function (message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(t);
    t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  };
})();

/* Sheets & alerts: App.overlay.open('sheet-id') */
window.App.overlay = {
  open(id) {
    var el = document.getElementById(id);
    if (!el) return;
    this.close();
    document.getElementById('scrim').classList.add('open');
    el.classList.add('open');
    this.active = el;
  },
  close() {
    if (this.active) this.active.classList.remove('open');
    document.getElementById('scrim').classList.remove('open');
    this.active = null;
  }
};
