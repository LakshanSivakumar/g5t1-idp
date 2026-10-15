/** Screen: Onboarding (Onboarding.png) */
App.registerScreen('onboarding', {
  title: 'Welcome',

  render() {
    return `
      <div class="screen-body onb-body">
        <svg class="onb-mark" viewBox="0 0 120 150" fill="none" role="img" aria-label="Savenow logo">
          <path d="M14 148V40C14 20 30 4 50 4V148H14Z" fill="var(--sn-text-primary)"/>
          <path d="M50 54c22 0 28 18 28 40" stroke="var(--sn-text-primary)" stroke-width="3" stroke-linecap="round"/>
          <circle cx="78" cy="124" r="22" fill="var(--sn-emerald-500)"/>
          <circle cx="92" cy="26" r="18" fill="var(--sn-bg-canvas)" stroke="var(--sn-text-primary)" stroke-width="4"/>
          <text x="92" y="33" text-anchor="middle" font-size="21" font-weight="800" fill="var(--sn-text-primary)" font-family="-apple-system, system-ui, sans-serif">$</text>
        </svg>
        <h1 class="onb-title">Save Now</h1>
        <p class="onb-tag">Finance made easy</p>
      </div>
      <div class="onb-actions">
        <button class="btn btn-primary btn-block" data-goto="register">Get Started</button>
        <button class="btn btn-secondary btn-block" data-goto="login">Login</button>
      </div>`;
  }
});
