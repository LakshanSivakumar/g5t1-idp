/**
 * Savenow Core — deployment config. Loaded first.
 *
 * MAZE_API_KEY: the key from Maze → Team settings → Connected websites → Code snippet (the apiKey= value).
 *               It is public by design (it ships in the page). While it says YOUR_MAZE_API_KEY, Maze is not loaded.
 * STUDY_ENDPOINT: URL of the Google Apps Script web app that receives study results (see docs/study-sheet.gs). Empty = results
 *               are only logged to the console and kept in localStorage ('savenow_study_rows').
 * USE_MAZE:     load the Maze snippet. Off: website tests need a paid Maze plan; the in-app study mode replaces it.
 * VARIANT:      which version this deployment serves. 'A' = tap a card to edit (current app).
 *               On design-b this is 'B' = swipe left to Edit / Delete. A ?variant=A|B URL parameter overrides it (for QA only).
 */
window.App = window.App || {};
(function () {
  var cfg = { MAZE_API_KEY: '87406acd-2d6a-4fcf-a6e7-bfd193b49d4b', USE_MAZE: false, STUDY_ENDPOINT: '', VARIANT: 'A' };
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
