/** Screen: Setup 3 — Add recurring expenses (+ shared list used by Settings) */
(function () {
  var CATS = ['MUSIC', 'RENT', 'TV & STREAMING', 'SUBSCRIPTIONS', 'UTILITIES', 'GYM', 'OTHER'];
  var esc = App.escapeHTML;

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  App.ordinal = ordinal;

  /** Renders the swipe-to-remove expense rows into `host`. */
  App.renderRecurring = function (host, opts) {
    opts = opts || {};
    var list = App.state.recurringExpenses;
    if (!list.length) {
      host.innerHTML = '<div class="exp-empty"><div class="empty"><strong>No recurring expenses yet</strong><span>Add one above when you’re ready</span></div></div>';
      return;
    }
    host.innerHTML = list.map(function (e) {
      return '<div class="swipe" data-id="' + e.id + '">' +
        '<div class="swipe-action" aria-hidden="true">Remove</div>' +
        '<div class="swipe-front">' +
        '<div class="swipe-top"><div><div class="swipe-name">' + esc(e.name) + '</div><div class="swipe-meta">' + esc(titleCase(e.category)) + '</div></div>' +
        '<div><div class="swipe-amt">' + App.fmt.money(e.amount) + '</div><div class="swipe-meta" style="text-align:right">' + ordinal(e.day) + ' / ' + (e.cal || 'month').toLowerCase() + '</div></div></div>' +
        '<div class="swipe-acts"><button class="link-btn" data-edit="' + e.id + '">Edit</button><button class="link-btn rm" data-remove="' + e.id + '">Remove</button></div>' +
        '</div></div>';
    }).join('');
    bindSwipe(host);
  };

  function titleCase(s) { return s.charAt(0) + s.slice(1).toLowerCase().replace(/\b(tv)\b/, 'TV'); }

  function bindSwipe(host) {
    host.querySelectorAll('.swipe').forEach(function (row) {
      var front = row.querySelector('.swipe-front'), startX = 0, dx = 0, drag = false;
      row.querySelector('.swipe-action').addEventListener('click', function () { remove(row.dataset.id); });
      front.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        drag = true; startX = e.clientX; dx = 0; front.classList.add('dragging');
        front.setPointerCapture(e.pointerId);
      });
      front.addEventListener('pointermove', function (e) {
        if (!drag) return;
        dx = Math.max(-96, Math.min(0, e.clientX - startX));
        front.style.transform = 'translateX(' + dx + 'px)';
      });
      function end() {
        if (!drag) return;
        drag = false; front.classList.remove('dragging');
        front.style.transform = dx < -48 ? 'translateX(-96px)' : '';
      }
      front.addEventListener('pointerup', end);
      front.addEventListener('pointercancel', end);
    });
  }

  function remove(id) {
    var list = App.state.recurringExpenses;
    var i = list.findIndex(function (e) { return e.id === id; });
    if (i > -1) {
      var name = list[i].name;
      list.splice(i, 1);
      App.state.emit('recurring');
      App.showToast(name + ' removed');
    }
  }
  App.removeRecurring = remove;

  App.registerScreen('setup-3', {
    title: 'Recurring expenses',
    editing: null,
    cat: null,

    render() {
      var ui = App.ui;
      return `
        <div class="screen-body">
          ${App.setupHead('Add recurring expenses', 'Rent, subscriptions, regular expenses, etc.')}
          <form class="rec-form" id="rec-form" novalidate>
            ${ui.field({ id: 'rec-name', label: 'Purpose / name', placeholder: 'e.g. Spotify' })}
            <div class="field-row">
              ${ui.field({ id: 'rec-amt', label: 'Amount', prefix: '$', inputmode: 'decimal' })}
              <div class="dd" id="rec-dd">
                <label class="field" style="padding-top:22px">
                  <span class="label">Category</span>
                  <button type="button" class="dd-btn placeholder" id="rec-cat-btn" aria-haspopup="listbox" aria-expanded="false"><span>Select</span>${App.icon('chevron.down', 16)}</button>
                </label>
                <div class="dd-list" role="listbox" id="rec-cat-list">${CATS.map(function (c) { return '<button type="button" class="dd-opt" role="option" data-cat="' + c + '">' + esc(c) + '</button>'; }).join('')}</div>
              </div>
            </div>
            <div class="rec-day">
              ${ui.field({ id: 'rec-day', label: 'Day', inputmode: 'numeric', maxlength: 2 })}
              <span class="of"><span id="rec-ord">th</span> day of the</span>
              <label class="field"><span class="label">Calendar</span>
                <select id="rec-cal" aria-label="Calendar"><option>Month</option><option>Year</option></select></label>
            </div>
            <button type="submit" class="btn btn-secondary btn-block" id="rec-add">Add</button>
          </form>
          <p class="section-label">Expense list</p>
          <div class="card exp-list" id="rec-list"></div>
          <p class="footnote" style="text-align:center">Swipe left, or use Edit / Remove</p>
        </div>
        <div class="screen-footer" id="rec-footer-setup">
          <button class="btn btn-secondary btn-grow" data-back="setup-2">Back</button>
          <button class="btn btn-primary btn-grow" data-goto="setup-4">Continue</button>
        </div>
        <div class="screen-footer" id="rec-footer-settings" hidden>
          <button class="btn btn-primary btn-grow" data-back="settings-recurring">Done</button>
        </div>`;
    },

    // Opened from Settings (param 'settings'): finish back to the list instead of continuing the setup flow
    onEnter(param) {
      var fromSettings = param === 'settings';
      document.getElementById('rec-footer-setup').hidden = fromSettings;
      document.getElementById('rec-footer-settings').hidden = !fromSettings;
    },

    init() {
      var self = this, $ = function (id) { return document.getElementById(id); };
      var dd = $('rec-dd'), btn = $('rec-cat-btn');
      var list = $('rec-list');

      function setCat(c) {
        self.cat = c;
        btn.firstElementChild.textContent = c || 'Select';
        btn.classList.toggle('placeholder', !c);
      }
      btn.addEventListener('click', function () {
        var open = dd.classList.toggle('open');
        btn.setAttribute('aria-expanded', open);
      });
      $('rec-cat-list').addEventListener('click', function (e) {
        var o = e.target.closest('[data-cat]');
        if (!o) return;
        setCat(o.dataset.cat);
        dd.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
      document.addEventListener('click', function (e) { if (!e.target.closest('#rec-dd')) dd.classList.remove('open'); });

      $('rec-day').addEventListener('input', function (e) {
        var n = parseInt(e.target.value.replace(/\D/g, ''), 10);
        if (n > 31) n = 31;
        e.target.value = n ? String(n) : '';
        $('rec-ord').textContent = n ? ordinal(n).replace(/^\d+/, '') : 'th';
      });

      $('rec-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var name = $('rec-name').value.trim();
        var amt = parseFloat($('rec-amt').value.replace(/[^0-9.]/g, ''));
        var day = parseInt($('rec-day').value, 10);
        if (!name || !amt || !self.cat || !day) {
          App.showToast('Fill in every field to add an expense');
          return;
        }
        App.state.recurringExpenses.push({ id: 'rec_' + Date.now(), name: name, category: self.cat, amount: amt, day: day, cal: $('rec-cal').value.toUpperCase() });
        ['rec-name', 'rec-amt', 'rec-day'].forEach(function (id) { $(id).value = ''; });
        setCat(null);
        $('rec-ord').textContent = 'th';
        $('rec-add').textContent = 'Add';
        App.state.emit('recurring');
      });

      list.addEventListener('click', function (e) {
        var rm = e.target.closest('[data-remove]');
        var ed = e.target.closest('[data-edit]');
        if (rm) remove(rm.dataset.remove);
        if (ed) {
          var item = App.state.recurringExpenses.filter(function (x) { return x.id === ed.dataset.edit; })[0];
          if (!item) return;
          $('rec-name').value = item.name; $('rec-amt').value = item.amount; $('rec-day').value = item.day;
          $('rec-ord').textContent = ordinal(item.day).replace(/^\d+/, '');
          setCat(item.category);
          App.state.recurringExpenses = App.state.recurringExpenses.filter(function (x) { return x.id !== item.id; });
          $('rec-add').textContent = 'Save';
          App.state.emit('recurring');
          $('rec-name').focus();
        }
      });
      App.state.on('recurring', function () { App.renderRecurring(list); });
      App.renderRecurring(list);
    }
  });
})();
