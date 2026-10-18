/** Overlay: Edit / delete an expense the user added by mistake (opened from Home → Latest expense) */
(function () {
  var fmt = App.fmt.money;
  var editing = null; // the expense object being edited
  var cat = 'food';

  function catOf(id) { return App.CATEGORIES.filter(function (x) { return x.id === id; })[0] || App.CATEGORIES[0]; }

  function amountValue() { return parseFloat(document.getElementById('edit-amount').value); }

  function validate() {
    document.getElementById('edit-save').classList.toggle('is-disabled', !(amountValue() > 0));
  }

  /** Re-apply the change to today's total, keep the 7-day graph in sync, and repaint. */
  function applyDelta(delta) {
    var h = App.state.home;
    h.spentToday = Math.max(0, Math.round((h.spentToday + delta) * 100) / 100);
    h.week[h.week.length - 1].v = h.spentToday;
    App.state.emit('budget');
  }

  function open(id) {
    var e = App.state.home.latestExpenses.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    editing = e;
    cat = e.category;
    document.getElementById('edit-amount').value = e.amount.toFixed(2);
    document.querySelectorAll('#edit-chips .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cat === cat); });
    document.getElementById('edit-sub').textContent = e.title + ' · ' + e.sub;
    validate();
    App.overlay.open('edit-sheet');
  }

  function save() {
    var amt = amountValue();
    if (!editing || !(amt > 0)) return;
    var old = catOf(editing.category), next = catOf(cat);
    var delta = Math.round((amt - editing.amount) * 100) / 100;
    if (editing.title === old.name) { editing.title = next.name; editing.initials = next.name.slice(0, 2).toUpperCase(); }
    editing.amount = Math.round(amt * 100) / 100;
    editing.category = cat;
    editing = null;
    App.overlay.close();
    applyDelta(delta);
    App.showToast('Expense updated');
  }

  function remove() {
    var h = App.state.home;
    if (!editing) return;
    var gone = editing;
    editing = null;
    h.latestExpenses = h.latestExpenses.filter(function (x) { return x !== gone; });
    App.overlay.close();
    applyDelta(-gone.amount);
    App.showToast('Deleted ' + fmt(gone.amount) + ' · ' + catOf(gone.category).name);
  }

  App.overlays = App.overlays || [];
  App.overlays.push({
    mount(app) {
      var sheet = document.createElement('div');
      sheet.className = 'sheet edit-sheet'; sheet.id = 'edit-sheet';
      sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Edit expense');
      sheet.innerHTML =
        '<div class="grabber"></div>' +
        '<h2 class="sheet-title">Edit expense</h2><p class="sheet-sub" id="edit-sub"></p>' +
        '<label class="field prefix" for="edit-amount"><span class="label">Amount</span><span class="sym">$</span>' +
        '<input id="edit-amount" type="text" inputmode="decimal" autocomplete="off" maxlength="8"></label>' +
        '<div class="edit-chips" id="edit-chips">' + App.CATEGORIES.map(function (c) {
          return '<button class="chip" data-cat="' + c.id + '" aria-pressed="false">' + c.name + '</button>';
        }).join('') + '</div>' +
        '<div class="stack"><button class="btn btn-primary" id="edit-save">Save changes</button>' +
        '<button class="btn btn-secondary edit-delete" id="edit-delete">Delete expense</button></div>';
      app.appendChild(sheet);

      var confirmEl = document.createElement('div');
      confirmEl.className = 'alert-wrap'; confirmEl.id = 'alert-delete-expense';
      confirmEl.innerHTML = '<div class="alert" role="alertdialog" aria-modal="true" aria-labelledby="de-title">' +
        '<h2 id="de-title">Delete this expense?</h2><p>It will be removed from today’s spending and your budget will update.</p>' +
        '<div class="stack"><button class="btn btn-primary edit-delete-confirm" id="de-confirm">Delete</button>' +
        '<button class="btn btn-secondary" id="de-cancel">Keep it</button></div></div>';
      app.appendChild(confirmEl);

      var amountEl = document.getElementById('edit-amount');
      amountEl.addEventListener('input', function () {
        // digits plus one decimal point, max two decimals
        var v = amountEl.value.replace(/[^0-9.]/g, '');
        var p = v.split('.');
        if (p.length > 1) v = p[0] + '.' + p.slice(1).join('').slice(0, 2);
        amountEl.value = v;
        validate();
      });
      document.getElementById('edit-chips').addEventListener('click', function (e) {
        var c = e.target.closest('[data-cat]');
        if (!c) return;
        cat = c.dataset.cat;
        document.querySelectorAll('#edit-chips .chip').forEach(function (b) { b.setAttribute('aria-pressed', b === c); });
      });
      document.getElementById('edit-save').addEventListener('click', save);
      document.getElementById('edit-delete').addEventListener('click', function () { App.overlay.open('alert-delete-expense'); });
      document.getElementById('de-confirm').addEventListener('click', remove);
      document.getElementById('de-cancel').addEventListener('click', function () { App.overlay.open('edit-sheet'); });

      // Home "Latest expense" cards (delegated: they are re-rendered on every repaint)
      document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-edit-expense]');
        if (b) open(b.dataset.editExpense);
      });
    }
  });
})();
