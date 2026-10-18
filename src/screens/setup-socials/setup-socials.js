/** Screen: Setup 4 — Add socials (Setup.png) */
App.registerScreen('setup-4', {
  title: 'Add socials',

  render() {
    return `
      <div class="screen-body">
        ${App.setupHead('Add socials', 'Contacts or users')}
        <div class="soc-actions">
          <button class="btn btn-secondary btn-block" id="soc-group">+ Join group</button>
          <div class="pair">
            <button class="btn btn-secondary" id="soc-contacts">+ Contacts</button>
            <button class="btn btn-secondary" id="soc-user">+ Username</button>
          </div>
        </div>
        <div class="soc-added" id="soc-added"></div>
      </div>
      <div class="screen-footer">
        <button class="btn btn-secondary btn-grow" data-back="setup-3">Back</button>
        <button class="btn btn-primary btn-grow" id="soc-continue">Continue</button>
      </div>
      <div class="sheet" id="soc-sheet" role="dialog" aria-modal="true" aria-labelledby="soc-sheet-title">
        <div class="grabber"></div>
        <h2 class="sheet-title" id="soc-sheet-title">Add</h2>
        <p class="sheet-sub" id="soc-sheet-sub"></p>
        <div class="soc-sheet-field">${App.ui.field({ id: 'soc-input', label: 'Name' })}</div>
        <button class="btn btn-primary btn-block" id="soc-save" style="margin-top:16px">Add</button>
      </div>`;
  },

  init() {
    var $ = function (id) { return document.getElementById(id); };
    var mode = 'group';
    var cfg = {
      group: { t: 'Join a group', s: 'Enter a group code or name to join a saving circle.', l: 'Group' },
      contacts: { t: 'Add from contacts', s: 'Savenow never messages anyone without your say-so.', l: 'Contact name' },
      user: { t: 'Add by username', s: 'Friends only see shared streaks, never amounts.', l: '@username' }
    };
    function show(m) {
      mode = m;
      $('soc-sheet-title').textContent = cfg[m].t;
      $('soc-sheet-sub').textContent = cfg[m].s;
      $('soc-input').previousElementSibling.textContent = cfg[m].l;
      $('soc-input').value = '';
      App.overlay.open('soc-sheet');
    }
    function renderAdded() {
      var list = App.state.socials;
      $('soc-added').innerHTML = list.length
        ? '<p class="section-label" style="margin-top:0">Added</p><div class="list">' + list.map(function (s, i) {
            return App.ui.row({ title: App.escapeHTML(s.name), sub: s.type, tile: { text: s.name.slice(0, 2).toUpperCase(), cls: 'emerald' },
              toggle: '<button class="soc-remove" data-remove="' + i + '" aria-label="Remove ' + App.escapeHTML(s.name) + '">Remove</button>' });
          }).join('') + '</div>'
        : '';
    }
    $('soc-added').addEventListener('click', function (e) {
      var b = e.target.closest('[data-remove]');
      if (!b) return;
      var gone = App.state.socials.splice(+b.dataset.remove, 1)[0];
      renderAdded();
      App.showToast('Removed ' + gone.name);
    });
    $('soc-group').onclick = function () { show('group'); };
    $('soc-contacts').onclick = function () { show('contacts'); };
    $('soc-user').onclick = function () { show('user'); };
    $('soc-save').onclick = function () {
      var v = $('soc-input').value.trim();
      if (!v) { $('soc-input').focus(); return; }
      App.state.socials.push({ name: v, type: mode === 'group' ? 'Group' : mode === 'user' ? 'Username' : 'Contact' });
      App.overlay.close();
      renderAdded();
      App.showToast('Added ' + v);
    };
    $('soc-continue').onclick = function () { App.router.go('home', { root: true }); };
  }
});
