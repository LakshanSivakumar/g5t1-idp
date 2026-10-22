/** Overlay: Add Transaction sheet; the amount uses the system decimal keyboard (Add Transaction · Print.png) */
(function () {
  var fmt = App.fmt.money;
  var cat = 'food';

  function amountEl() { return document.getElementById('add-amt'); }
  function show() {
    document.getElementById('add-submit').classList.toggle('is-disabled', !(parseFloat(amountEl().value) > 0));
  }

  function submit() {
    var amt = parseFloat(amountEl().value);
    if (!(amt > 0)) return;
    var s = App.state, h = s.home, before = s.budgetStatus().pct;
    var c = App.CATEGORIES.filter(function (x) { return x.id === cat; })[0];
    h.spentToday = Math.round((h.spentToday + amt) * 100) / 100;
    h.week[h.week.length - 1].v = h.spentToday;
    var descEl = document.getElementById('add-desc');
    var title = descEl.value.trim() || c.name;
    descEl.value = '';
    h.latestExpenses.unshift({ id: 'exp_' + Date.now(), title: title, sub: c.name + ' · Just now', initials: App.initialsOf(title), amount: amt, category: cat, time: 'Just now', where: '', logged: true });
    amountEl().value = '';
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
      var sheet = document.createElement('div');
      sheet.className = 'sheet add-sheet'; sheet.id = 'add-sheet';
      sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Add transaction');
      sheet.innerHTML =
        '<div class="grabber"></div>' +
        '<div class="add-top"><span class="label">Category</span></div>' +
        '<div class="add-chips" id="add-chips" role="group" aria-label="Category">' + App.CATEGORIES.map(function (c) { return '<button class="chip" data-cat="' + c.id + '" aria-pressed="' + (c.id === cat) + '">' + c.name + '</button>'; }).join('') + '</div>' +
        '<label class="field add-desc" for="add-desc"><span class="label">Description (optional)</span>' +
        '<input id="add-desc" type="text" autocomplete="off" maxlength="40" enterkeyhint="done" placeholder="e.g. Bubble tea"></label>' +
        '<div class="add-entry"><label class="field prefix add-amount" for="add-amt"><span class="label">Amount</span><span class="sym">$</span>' +
        '<input id="add-amt" type="text" inputmode="decimal" autocomplete="off" maxlength="8" enterkeyhint="done" placeholder="0.00"></label>' +
        '<button class="btn btn-primary is-disabled" id="add-submit">Add expense</button></div>';
      app.appendChild(sheet);

      sheet.addEventListener('click', function (e) {
        var c = e.target.closest('[data-cat]');
        if (c) {
          cat = c.dataset.cat;
          sheet.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', b === c); });
          show();
        }
      });
      document.getElementById('add-submit').addEventListener('click', submit);
      document.getElementById('tab-add').addEventListener('click', function () { show(); App.overlay.open('add-sheet'); amountEl().focus({ preventScroll: true }); }); // focus inside the tap so iOS raises the keyboard; preventScroll keeps #app from scrolling to the still off-screen sheet
      amountEl().addEventListener('input', show);
      amountEl().addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      document.getElementById('add-desc').addEventListener('keydown', function (e) { if (e.key === 'Enter') e.target.blur(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('open')) App.overlay.close(); });
      show();
    }
  });
})();
