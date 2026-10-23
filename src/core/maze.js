/**
 * Savenow Core — Maze A/B testing & usability tracking
 *
 * - Loads the Maze snippet whenever a key is configured (src/core/config.js, or ?mazeKey=… once per device).
 * - Variant comes from src/core/config.js (A on main/design-a, B on design-b); ?variant=A|B overrides it for QA.
 * - App.maze.track(step) writes the current step into the URL (?step=…). Maze counts URL/query changes as path steps,
 *   so edit/delete flows show up in Maze's path analysis even though they happen inside one page.
 */

window.App = window.App || {};

window.App.maze = {
  loadSnippet(key) {
    if (!key || key === 'YOUR_MAZE_API_KEY' || window.mazeUniversalSnippetApiKey) return;
    (function (m, a, z, e) {
      try { if (!m.sessionStorage.getItem('maze-us')) m.sessionStorage.setItem('maze-us', new Date().getTime()); } catch (err) { /* private mode */ } // same session marker Maze's own snippet sets
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
    let storedKey = null;
    try { storedKey = localStorage.getItem('savenow_maze_api_key'); } catch (e) { /* private mode */ }
    const cfgKey = window.App.config && window.App.config.MAZE_API_KEY;
    const mazeKey = urlKey || (cfgKey && cfgKey !== 'YOUR_MAZE_API_KEY' ? cfgKey : storedKey) || 'YOUR_MAZE_API_KEY';

    if (urlKey) { try { localStorage.setItem('savenow_maze_api_key', urlKey); } catch (e) { /* private mode */ } }
    window.__MAZE_API_KEY__ = mazeKey;
    if (window.App.config && window.App.config.USE_MAZE) this.loadSnippet(mazeKey);

    // Tag the session so Maze recordings / filters can tell the versions apart
    document.documentElement.setAttribute('data-variant', window.App.state.mazeVariant);
    this.bindSettingsPanel();
  },

  /** Record a step in the URL (?step=edit-open). No-op if unchanged. */
  track(step) {
    if (window.App.study) window.App.study.step(step);
    try {
      const u = new URL(window.location.href);
      if (step) u.searchParams.set('step', step); else u.searchParams.delete('step');
      if (u.href !== window.location.href) history.pushState(null, '', u.href);
    } catch (e) { /* file:// or sandboxed */ }
  },

  bindSettingsPanel() {
    const keyInput = document.getElementById('maze-api-key-input');
    const saveBtn = document.getElementById('btn-save-maze-key');
    const copyBtn = document.getElementById('btn-copy-maze-url');
    const statusBadge = document.getElementById('maze-status-badge');
    const key = window.__MAZE_API_KEY__;
    const live = key && key !== 'YOUR_MAZE_API_KEY';

    if (live && keyInput) keyInput.value = key;
    if (statusBadge) {
      statusBadge.textContent = live ? 'Active · Variant ' + window.App.state.mazeVariant : 'Not connected';
      statusBadge.style.color = live ? 'var(--sn-accent)' : '';
    }
    document.querySelectorAll('.maze-variant-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('btn-var-' + window.App.state.mazeVariant.toLowerCase());
    if (activeBtn) activeBtn.classList.add('active');

    if (saveBtn && keyInput) {
      saveBtn.addEventListener('click', () => {
        const keyVal = keyInput.value.trim();
        if (!keyVal) return;
        try { localStorage.setItem('savenow_maze_api_key', keyVal); } catch (e) { /* private mode */ }
        if (statusBadge) { statusBadge.textContent = 'Key saved ✓'; statusBadge.style.color = 'var(--sn-accent)'; }
        window.App.showToast('Maze key saved on this device. Refresh to load tracking.');
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const baseUrl = window.location.origin + window.location.pathname;
        const testUrl = `${baseUrl}?variant=${window.App.state.mazeVariant}#home`;
        navigator.clipboard.writeText(testUrl).then(() => {
          window.App.showToast('Copied test link');
        }).catch(() => {
          prompt('Copy this test URL:', testUrl);
        });
      });
    }
  },

  switchVariant(variantCode) {
    window.App.state.mazeVariant = variantCode;
    document.documentElement.setAttribute('data-variant', variantCode);
    document.querySelectorAll('.maze-variant-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('btn-var-' + variantCode.toLowerCase());
    if (activeBtn) activeBtn.classList.add('active');
    window.App.state.emit('budget'); // repaint Home so the variant takes effect
    window.App.showToast(`Switched to Variant ${variantCode}`);
  }
};
