/** Screen: Setup 1 — Connect your bank account (Setup-1.png, Setup-4.jpg) */
(function () {
  // Logos are the banks' own SVGs (icons/banks/); each sits on a white chip so navy/black marks stay legible in dark mode
  function logo(id, name) { return '<span class="bank-logo ' + id + '"><img src="icons/banks/' + id + '.svg" alt="' + name + '"></span>'; }
  var BANKS = [
    { id: 'dbs', name: 'DBS' },
    { id: 'ocbc', name: 'OCBC' },
    { id: 'uob', name: 'UOB' },
    { id: 'trust', name: 'Trust' },
    { id: 'sc', name: 'Standard Chartered' }
  ];
  BANKS.forEach(function (b) { b.mark = logo(b.id, b.name); });

  App.BANKS = BANKS;

  App.setupHead = function (title, sub) {
    return '<header class="setup-head"><p class="eyebrow">Setup</p><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</header>';
  };

  App.registerScreen('setup-1', {
    title: 'Connect your bank',
    render() {
      var rows = BANKS.map(function (b) {
        return '<div class="card bank-row">' + b.mark +
          '<button class="btn btn-secondary bank-btn" data-bank="' + b.id + '" aria-label="Connect ' + b.name + '">Connect</button></div>';
      }).join('');
      return `
        <div class="screen-body">
          ${App.setupHead('Connect your bank account', 'Savenow only reads transactions. It can never move money.')}
          <div class="bank-list">${rows}</div>
          <button class="btn btn-ghost btn-block" id="bank-skip">I don’t have a bank account / Skip for now</button>
        </div>
        <div class="screen-footer" id="bank-footer-setup">
          <button class="btn btn-secondary btn-grow" data-back="register">Back</button>
          <button class="btn btn-primary btn-grow" id="bank-continue">Continue</button>
        </div>
        <div class="screen-footer" id="bank-footer-settings" hidden>
          <button class="btn btn-primary btn-grow" data-back="settings-accounts">Save changes</button>
        </div>
        <div class="alert-wrap" id="bank-skip-alert">
          <div class="alert" role="alertdialog" aria-modal="true" aria-labelledby="bank-skip-title">
            <h2 id="bank-skip-title">Continue without a bank?</h2>
            <p>Without a linked account, Savenow can’t import your spending, so you’ll need to track every expense manually. You can connect a bank later in Settings.</p>
            <div class="stack">
              <button class="btn btn-primary" id="bank-skip-confirm">Track manually</button>
              <button class="btn btn-secondary" data-close-overlay>Go back</button>
            </div>
          </div>
        </div>
        </div>
        <div class="bank-splash" id="bank-splash" role="status" aria-live="polite">
          <div id="bank-splash-logo"></div>
          <div class="bank-spinner"></div>
          <p id="bank-splash-text">Connecting…</p>
        </div>`;
    },
    // Reflect banks already linked (e.g. when arriving from Settings → Add an account)
    // Opened from Settings (param 'settings'): save back to Connected accounts instead of continuing the setup flow
    onEnter(param) {
      var fromSettings = param === 'settings';
      document.getElementById('bank-footer-setup').hidden = fromSettings;
      document.getElementById('bank-footer-settings').hidden = !fromSettings;
      document.getElementById('bank-skip').hidden = fromSettings;
      document.querySelectorAll('[data-bank]').forEach(function (btn) {
        var on = !!App.state.connectedBanks[btn.getAttribute('data-bank')];
        btn.textContent = on ? 'Connected' : 'Connect';
        btn.classList.toggle('connected', on);
      });
    },
    init() {
      var splash = document.getElementById('bank-splash');

      // Continue straight through if a bank is linked; otherwise confirm manual tracking first
      var proceedOrPrompt = function () {
        var linked = Object.keys(App.state.connectedBanks).some(function (k) { return App.state.connectedBanks[k]; });
        if (linked) App.router.go('setup-2');
        else App.overlay.open('bank-skip-alert');
      };
      document.getElementById('bank-continue').addEventListener('click', proceedOrPrompt);
      document.getElementById('bank-skip').addEventListener('click', proceedOrPrompt);
      document.getElementById('bank-skip-confirm').addEventListener('click', function () {
        App.overlay.close();
        App.router.go('setup-2');
      });
      document.querySelectorAll('[data-bank]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-bank');
          var bank = BANKS.filter(function (b) { return b.id === id; })[0];
          var on = !App.state.connectedBanks[id];
          if (!on) {
            App.state.connectedBanks[id] = false;
            btn.textContent = 'Connect'; btn.classList.remove('connected');
            return;
          }
          document.getElementById('bank-splash-logo').innerHTML = bank.mark.replace('bank-logo', 'bank-logo big');
          document.getElementById('bank-splash-text').textContent = 'Connecting to ' + bank.name + '…';
          splash.classList.add('open');
          setTimeout(function () {
            splash.classList.remove('open');
            App.state.connectedBanks[id] = true;
            btn.textContent = 'Connected';
            btn.classList.add('connected');
            App.showToast(bank.name + ' connected');
          }, 1500);
        });
      });
    }
  });
})();
