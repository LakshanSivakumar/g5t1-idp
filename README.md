# Savenow — Mobile Web Prototype

High-fidelity, iOS-style web prototype of **Savenow ("Finance Made Easy")**, built from the low-fidelity export in `low-fidel export/` and the design tokens in `Savenow-High-Fidelity-Color-Palette.html`. Deployed on Netlify (`netlify.toml`, no build step).

## Test it

- **Chrome:** open the site, DevTools → device toolbar → iPhone 14/15 Pro (393×852) or Pro Max (430×932). A decorative 9:41 status bar and home indicator are drawn in desktop Chrome only (`?statusbar=0` hides them).
- **iPhone:** Safari → Share → *Add to Home Screen*. It launches standalone and uses the real safe areas.
- **Deep links:** `#home`, `#insights`, `#category/food`, `#recovery`, `#lock` … (any registered screen name; used by Maze missions).
- **Prototype tools:** Settings → *Prototype tools* switches the day between Within / Near limit / Over, previews the warning alert and lock-screen alert, and holds the Maze controls.

## Structure

```text
index.html                 shell: PWA meta, tab bar, overlay hosts, script order
manifest.json, icons/      standalone manifest + apple-touch-icon / PNG icons
css/variables.css          tokens (palette values, light + dark)
css/base.css               reset, safe areas, screen stack, typography
css/components.css         buttons, fields, lists, cards, switch, tab bar, sheets, keypad
src/core/                  icons (SF-style SVG registry), state + data, ui helpers, router, maze
src/screens/<name>/        one folder per screen group (css + js), each self-registering
```

Screens register with `App.registerScreen(name, { tab, render(), init(), onEnter(param) })`. Navigate declaratively with `data-goto="name"`, `data-param`, `data-back="fallback"` and `data-tab="name"`.

## Screens (from the low-fi export)

Onboarding · Login · Register · Forgot password · Setup 1–4 (bank, goal & budget, recurring with swipe, socials) · Home (Today ring / 7-day graph; within, near-limit, over) · Budget warning alert · Add transaction keypad · Insights · Categories · Category detail ×5 · Small purchases · Goal trade-off · Budget recovery · Plan applied · Social (+ streak broken) · Find friends · Settings + Goal & budget, Connected accounts, Recurring expenses, Privacy, Notifications, Help · Lock-screen alert.

## Design rules

- Colors come only from `css/variables.css`; budget ring: <80% emerald, 80–100% amber, >100% rose; recovery uses indigo.
- Controls are at least 44×44pt; inputs are 16px so iOS never zooms; `viewport-fit=cover` with `env(safe-area-inset-*)`.
- Dark mode follows the system by default and can be forced in Settings → Appearance.
