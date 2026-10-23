# Running the edit/delete A/B study (no Maze)

Testers open one link, get version A or B at random, do two tasks, and every result lands in a Google Sheet.

## One-time setup
1. **Google Sheet**: create a new sheet → Extensions → Apps Script → paste `docs/study-sheet.gs` → Save.
2. **Deploy**: Deploy → New deployment → Web app → Execute as *Me* → Access *Anyone* → Deploy → authorize → copy the **Web app URL**.
   Open that URL in a browser: it should say "Savenow study endpoint is running".
3. **Config**: put the URL in `STUDY_ENDPOINT` in `src/core/config.js` on **both** `design-a`/`main` and `design-b`. Commit and push.
4. **Netlify**: branch deploys on for `design-b`. A = `https://<site>.netlify.app`, B = `https://design-b--<site>.netlify.app`.
   Check the two `SITE` URLs at the top of `ab.html`.
5. **Dry run**: open `ab.html?force=A&reset=1`, finish both tasks, check the `tasks` and `events` tabs fill in. Repeat with `force=B`.
   Then `ab.html?reset=1` before sending the real link.

## Sending it
Send `https://<site>.netlify.app/ab.html`. Assignment is random and remembered per device.

## What you get
`tasks` tab, one row per task per tester: `variant, task (edit|delete), outcome (success|gave_up|abandoned), ms, taps, misses, deadTaps, swipes, rating (1-7), steps`.
`events` tab: every step with its timestamp, for drill-downs.
Compare A vs B on success rate, median `ms`, `taps`, `misses`, `deadTaps`, `swipes`, and `rating`.
