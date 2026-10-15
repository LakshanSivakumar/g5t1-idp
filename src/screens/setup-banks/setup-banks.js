/** Screen: Setup 1 — Connect your bank account (Setup-1.png, Setup-4.jpg) */
(function () {
  var BANKS = [
    { id: 'dbs', name: 'DBS', mark: '<span class="bank-mark dbs">DBS</span>' },
    { id: 'ocbc', name: 'OCBC', mark: '<span class="bank-mark ocbc">OCBC</span>' },
    { id: 'uob', name: 'UOB', mark: '<span class="bank-mark uob">UOB</span>' },
    { id: 'trust', name: 'Trust', mark: '<span class="bank-mark trust">trust</span>' },
    { id: 'sc', name: 'Standard Chartered', mark: '<span class="bank-mark sc"><small>standard</small><small>chartered</small></span>' }
  ];

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
        </div>
        <div class="screen-footer">
          <button class="btn btn-secondary btn-grow" data-back="register">Back</button>
          <button class="btn btn-primary btn-grow" data-goto="setup-2">Continue</button>
        </div>
        <div class="bank-splash" id="bank-splash" role="status" aria-live="polite">
          <div class="bank-banner"><div class="a">DBS</div><div class="b"><span>Live more,</span><span>Bank less</span></div></div>
          <div class="bank-spinner"></div>
          <p id="bank-splash-text">Connecting…</p>
        </div>`;
    },
    init() {
      var splash = document.getElementById('bank-splash');
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
