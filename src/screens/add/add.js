/** Overlay: Add Transaction sheet with numeric keypad (Add Transaction · Print.png) */
(function () {
  var fmt = App.fmt.money;
  var amount = '';
  var cat = 'food';

  function show() {
    var v = document.getElementById('add-val');
    v.textContent = amount || '0.00';
    v.classList.toggle('empty', !amount);
    document.getElementById('add-submit').classList.toggle('is-disabled', !(parseFloat(amount) > 0));
  }

  function press(k) {
    if (k === 'del') amount = amount.slice(0, -1);
    else if (k === '.') { if (amount.indexOf('.') < 0) amount = (amount || '0') + '.'; }
    else {
      var parts = (amount + k).split('.');
      if (parts[1] && parts[1].length > 2) return;
      if (parts[0].length > 5) return;
      amount = (amount === '0' ? '' : amount) + k;
    }
    show();
  }

  function submit() {
    var amt = parseFloat(amount);
    if (!(amt > 0)) return;
    var s = App.state, h = s.home, before = s.budgetStatus().pct;
    var c = App.CATEGORIES.filter(function (x) { return x.id === cat; })[0];
    h.spentToday = Math.round((h.spentToday + amt) * 100) / 100;
    h.week[h.week.length - 1].v = h.spentToday;
    var descEl = document.getElementById('add-desc');
    var title = descEl.value.trim() || c.name;
    descEl.value = '';
    h.latestExpenses.unshift({ id: 'exp_' + Date.now(), title: title, sub: c.name + ' · Just now', initials: App.initialsOf(title), amount: amt, category: cat, time: 'Just now', where: '', logged: true });
    amount = '';
    show();
    App.overlay.close();
    s.emit('budget');
    var after = s.budgetStatus();
    App.showToast('Added ' + fmt(amt) + ' · ' + c.name);
    if (after.pct >= 0.8 && before < 0.8 && !after.over) setTimeout(function () { App.overlay.open('alert-warning'); }, 450);
  }

  App.overlays = App.overlays || [];
  App.overlays.push({
    mount(app) {
      var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
      var sheet = document.createElement('div');
      sheet.className = 'sheet add-sheet'; sheet.id = 'add-sheet';
      sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Add transaction');
      sheet.innerHTML =
        '<div class="grabber"></div>' +
        '<div class="add-top"><span class="label">Category</span></div>' +
        '<div class="add-chips" id="add-chips" role="group" aria-label="Category">' + App.CATEGORIES.map(function (c) { return '<button class="chip" data-cat="' + c.id + '" aria-pressed="' + (c.id === cat) + '">' + c.name + '</button>'; }).join('') + '</div>' +
        '<label class="field add-desc" for="add-desc"><span class="label">Description (optional)</span>' +
        '<input id="add-desc" type="text" autocomplete="off" maxlength="40" enterkeyhint="done" placeholder="e.g. Bubble tea"></label>' +
        '<div class="add-top"><span class="label">Amount</span></div>' +
        '<div class="add-entry"><div class="add-amount" aria-live="polite"><span class="sym">$</span><span class="val empty" id="add-val">0.00</span><span class="caret"></span></div>' +
        '<button class="btn btn-primary is-disabled" id="add-submit">Add expense</button></div>' +
        '<div class="keypad" role="group" aria-label="Amount keypad">' + keys.map(function (k) {
          return '<button class="key" data-key="' + k + '" aria-label="' + (k === 'del' ? 'Delete' : k === '.' ? 'Decimal point' : k) + '">' + (k === 'del' ? App.icon('delete.left', 26) : k) + '</button>';
        }).join('') + '</div>';
      app.appendChild(sheet);

      sheet.addEventListener('click', function (e) {
        var k = e.target.closest('[data-key]');
        if (k) { press(k.dataset.key); return; }
        var c = e.target.closest('[data-cat]');
        if (c) {
          cat = c.dataset.cat;
          sheet.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', b === c); });
          show();
        }
      });
      document.getElementById('add-submit').addEventListener('click', submit);
      document.getElementById('tab-add').addEventListener('click', function () { show(); App.overlay.open('add-sheet'); });
      document.addEventListener('keydown', function (e) {
        if (!sheet.classList.contains('open')) return;
        if (e.target.id === 'add-desc') { if (e.key === 'Enter') e.target.blur(); return; } // typing a description, not the keypad
        if (/^[0-9.]$/.test(e.key)) press(e.key);
        else if (e.key === 'Backspace') press('del');
        else if (e.key === 'Enter') submit();
        else if (e.key === 'Escape') App.overlay.close();
      });
      show();
    }
  });
})();
