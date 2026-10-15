/**
 * Savenow Core — Maze A/B Testing & Usability Tracking
 */

window.App = window.App || {};

window.App.maze = {
  loadSnippet(key) {
    if (!key || key === 'YOUR_MAZE_API_KEY' || window.mazeUniversalSnippetApiKey) return;
    (function (m, a, z, e) {
      var s = a.createElement('script');
      s.src = z + '?apiKey=' + e;
      s.async = true;
      a.getElementsByTagName('head')[0].appendChild(s);
      m.mazeUniversalSnippetApiKey = e;
    })(window, document, 'https://snippet.maze.co/maze-universal-loader.js', key);
  },

  init() {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('mazeKey');
    const storedKey = localStorage.getItem('savenow_maze_api_key');
    const mazeKey = urlKey || storedKey || 'YOUR_MAZE_API_KEY';

    if (urlKey) {
      localStorage.setItem('savenow_maze_api_key', urlKey);
    }
    window.__MAZE_API_KEY__ = mazeKey;
    this.loadSnippet(mazeKey);

    // A/B Variant Parameter check
    const variantParam = params.get('variant');
    if (variantParam === 'A' || variantParam === 'B') {
      window.App.state.mazeVariant = variantParam;
    }

    this.bindSettingsPanel();
  },

  bindSettingsPanel() {
    const keyInput = document.getElementById('maze-api-key-input');
    const saveBtn = document.getElementById('btn-save-maze-key');
    const copyBtn = document.getElementById('btn-copy-maze-url');
    const statusBadge = document.getElementById('maze-status-badge');

    const savedKey = localStorage.getItem('savenow_maze_api_key');
    if (savedKey && keyInput) {
      keyInput.value = savedKey;
      if (statusBadge) {
        statusBadge.textContent = 'Active (Live)';
        statusBadge.style.color = 'var(--sn-accent)';
      }
    }

    if (saveBtn && keyInput) {
      saveBtn.addEventListener('click', () => {
        const keyVal = keyInput.value.trim();
        if (keyVal) {
          localStorage.setItem('savenow_maze_api_key', keyVal);
          if (statusBadge) {
            statusBadge.textContent = 'Key Saved ✓';
            statusBadge.style.color = 'var(--sn-accent)';
          }
          window.App.showToast('Maze API Key saved! Refresh to load tracking.');
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const baseUrl = window.location.origin + window.location.pathname;
        const testUrl = `${baseUrl}?variant=${window.App.state.mazeVariant}#onboarding`;
        navigator.clipboard.writeText(testUrl).then(() => {
          window.App.showToast('Copied test link for Maze!');
        }).catch(() => {
          prompt('Copy this Maze test URL:', testUrl);
        });
      });
    }
  },

  switchVariant(variantCode) {
    window.App.state.mazeVariant = variantCode;
    document.querySelectorAll('.maze-variant-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('btn-var-' + variantCode.toLowerCase());
    if (activeBtn) activeBtn.classList.add('active');
    window.App.showToast(`Switched to A/B Test Variant ${variantCode}`);
  }
};
