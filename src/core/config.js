/**
 * Savenow Core — deployment config. Loaded first.
 *
 * MAZE_API_KEY: paste the key from Maze → Team settings → Connected websites → Code snippet
 *               (the value after "apiKey=" in the snippet URL). While it still says YOUR_MAZE_API_KEY, Maze is not loaded.
 * VARIANT:      which version this deployment serves. 'A' = tap a card to edit (current app).
 *               On design-b this is 'B' = swipe left to Edit / Delete. A ?variant=A|B URL parameter overrides it (for QA only).
 */
window.App = window.App || {};
(function () {
  var cfg = { MAZE_API_KEY: 'YOUR_MAZE_API_KEY', VARIANT: 'B' };
  var q = new URLSearchParams(location.search).get('variant');
  cfg.variant = q === 'A' || q === 'B' ? q : cfg.VARIANT;
  window.App.config = cfg;
  document.documentElement.setAttribute('data-variant', cfg.variant);
  // ?proto=1 reveals Settings → Prototype tools for the team (testers never see them)
  try {
    if (new URLSearchParams(location.search).get('proto') === '1') sessionStorage.setItem('savenow_proto', '1');
    if (sessionStorage.getItem('savenow_proto') === '1') document.documentElement.classList.add('proto-on');
  } catch (e) { /* private mode */ }
})();
