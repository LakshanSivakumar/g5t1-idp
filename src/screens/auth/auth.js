/** Screens: Login, Register, Forgot password (Login.png, Register.png, Forgot password) */
(function () {
  var ui = App.ui;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var laptop = `
    <svg class="auth-art" viewBox="0 0 220 150" fill="none" aria-hidden="true">
      <ellipse cx="116" cy="140" rx="86" ry="7" fill="var(--sn-bg-subtle)"/>
      <rect x="54" y="38" width="124" height="82" rx="8" fill="var(--sn-text-primary)"/>
      <rect x="62" y="46" width="108" height="66" rx="4" fill="var(--sn-obsidian-700)"/>
      <rect x="74" y="64" width="84" height="12" rx="6" fill="var(--sn-bg-card)" opacity=".92"/>
      <rect x="74" y="84" width="60" height="8" rx="4" fill="var(--sn-emerald-500)"/>
      <path d="M40 126h152l-8 8H48z" fill="var(--sn-border-strong)"/>
      <circle cx="170" cy="40" r="17" fill="var(--sn-bg-card)" stroke="var(--sn-text-primary)" stroke-width="3"/>
      <rect x="162" y="38" width="16" height="12" rx="3" fill="var(--sn-text-primary)"/>
      <path d="M165 38v-3a5 5 0 0 1 10 0v3" stroke="var(--sn-text-primary)" stroke-width="2.5" fill="none"/>
      <circle cx="34" cy="56" r="9" fill="var(--sn-text-primary)"/>
      <path d="M26 70c4-4 12-4 16 0l6 54H20z" fill="var(--sn-text-primary)"/>
    </svg>`;

  var card = `
    <svg class="auth-art" viewBox="0 0 220 150" fill="none" aria-hidden="true">
      <ellipse cx="112" cy="140" rx="90" ry="7" fill="var(--sn-bg-subtle)"/>
      <rect x="36" y="30" width="148" height="86" rx="10" fill="var(--sn-text-primary)"/>
      <rect x="36" y="48" width="148" height="18" fill="var(--sn-emerald-500)"/>
      <rect x="50" y="84" width="46" height="8" rx="4" fill="var(--sn-bg-card)" opacity=".85"/>
      <rect x="50" y="98" width="30" height="6" rx="3" fill="var(--sn-bg-card)" opacity=".5"/>
      <rect x="150" y="82" width="22" height="16" rx="3" fill="var(--sn-amber-500)"/>
      <path d="M190 130c-2-30-2-48 8-70M190 108c10-4 14-10 14-18M190 90c-9-3-13-9-13-17" stroke="var(--sn-emerald-600)" stroke-width="3" stroke-linecap="round"/>
    </svg>`;

  var close = '<button class="auth-close" data-goto="onboarding" aria-label="Close">' + App.icon('xmark', 18) + '</button>';

  function validate(emailEl, passEl, errEl) {
    var msg = '';
    if (!EMAIL.test(emailEl.value.trim())) msg = 'Enter a valid email address.';
    else if (passEl && passEl.value.length < 6) msg = 'Password must be at least 6 characters.';
    emailEl.closest('.field').classList.toggle('invalid', msg.indexOf('email') > -1);
    if (passEl) passEl.closest('.field').classList.toggle('invalid', msg.indexOf('Password') > -1);
    errEl.textContent = msg;
    errEl.hidden = !msg;
    return !msg;
  }

  App.registerScreen('login', {
    title: 'Login',
    render() {
      return `
        <div class="screen-body auth-body">
          <p class="eyebrow auth-eyebrow">Login</p>
          ${laptop}
          <form class="auth-form" id="login-form" novalidate>
            ${ui.field({ id: 'login-email', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@example.com' })}
            ${ui.field({ id: 'login-pass', label: 'Password', type: 'password', autocomplete: 'current-password' })}
            <p class="field-error" id="login-error" role="alert" hidden></p>
            <button type="button" class="auth-forgot" data-goto="forgot">Forgot Password</button>
            <button type="submit" class="btn btn-primary btn-block">Login</button>
          </form>
          <p class="auth-switch">Don’t have an account yet? <button data-goto="register">Register</button></p>
          ${close}
        </div>`;
    },
    init() {
      document.getElementById('login-form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (validate(document.getElementById('login-email'), document.getElementById('login-pass'), document.getElementById('login-error'))) {
          App.router.go('home', { root: true });
        }
      });
    }
  });

  App.registerScreen('register', {
    title: 'Register',
    render() {
      return `
        <div class="screen-body auth-body">
          <p class="eyebrow auth-eyebrow">Register</p>
          ${card}
          <form class="auth-form" id="register-form" novalidate>
            ${ui.field({ id: 'reg-email', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@example.com' })}
            ${ui.field({ id: 'reg-pass', label: 'Password', type: 'password', autocomplete: 'new-password' })}
            <p class="field-error" id="reg-error" role="alert" hidden></p>
            <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px">Register</button>
          </form>
          <p class="auth-switch">Registered already? <button data-goto="login">Login</button></p>
          ${close}
        </div>`;
    },
    init() {
      document.getElementById('register-form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (validate(document.getElementById('reg-email'), document.getElementById('reg-pass'), document.getElementById('reg-error'))) {
          App.router.go('setup-1');
        }
      });
    }
  });

  App.registerScreen('forgot', {
    title: 'Reset password',
    render() {
      return `
        <div class="screen-body">
          ${ui.back('login')}
          ${ui.head('Reset password', 'We’ll email you a reset link')}
          <form class="auth-form" id="forgot-form" novalidate>
            ${ui.field({ id: 'forgot-email', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@example.com' })}
            <p class="field-error" id="forgot-error" role="alert" hidden></p>
            <button type="submit" class="btn btn-secondary btn-block" id="forgot-send" style="margin-top:8px">Send reset link</button>
          </form>
          <p class="footnote" id="forgot-note">The link expires in 30 minutes. If the email does not arrive, check your spam folder.</p>
        </div>`;
    },
    init() {
      document.getElementById('forgot-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var em = document.getElementById('forgot-email');
        if (validate(em, null, document.getElementById('forgot-error'))) {
          document.getElementById('forgot-send').textContent = 'Link sent';
          document.getElementById('forgot-note').textContent = 'Check ' + em.value.trim() + ' for your reset link. It expires in 30 minutes.';
          App.showToast('Reset link sent');
        }
      });
    },
    onEnter() {
      document.getElementById('forgot-send').textContent = 'Send reset link';
    }
  });
})();
