# Savenow — Mobile Web App (Phase 1: Setup to Home)

High-fidelity mobile web application for **Savenow ("Finance Made Easy")**, implementing the complete user journey from **Setup** through to the **Home Page**, crafted directly according to the low-fidelity wireframes and the high-fidelity color palette design system.

---

## 📱 How to Test in Google Chrome (Mobile Device Emulation)

This application is engineered specifically for **mobile phone viewports** (`375px` to `430px` width, e.g., iPhone 14/15/16 Pro, Galaxy Z Fold 6).

### Step 1: Open the App
You can either:
- **Directly in Google Chrome**: Double-click `index.html` or open `file:///Volumes/X9/idp-iter2/index.html` in Chrome.
- **Via Local Server**:
  ```bash
  cd /Volumes/X9/idp-iter2
  npx serve .
  # or
  python3 -m http.server 8080
  ```
  Then open `http://localhost:8080` in Google Chrome.

### Step 2: Switch Chrome to Phone Mode
1. In Google Chrome, press `Cmd + Option + I` (on Mac) or `F12` to open Chrome DevTools.
2. Press `Cmd + Shift + M` (or click the **"Toggle device toolbar"** mobile phone icon at the top left of DevTools).
3. In the device dropdown menu at the top of the viewport, select **"iPhone 14 Pro"**, **"iPhone 15 Pro"**, or **"Responsive"** (e.g., width: `393px`, height: `852px`).
4. Set zoom to `100%`.

---

## 🎨 Living Component & Asset Library (`asset.html`)

For fast iteration and consistent UI, open [`asset.html`](file:///Volumes/X9/idp-iter2/asset.html) in your browser:
- **Interactive Previews**: Test buttons, floating input boxes, cards, and SVG gauges in real-time.
- **One-Click Copy**: Copy HTML snippets, SVG vectors, and color token variables straight into your clipboard.
- **Live State Testing**: Use the interactive slider on the circular gauge to preview Healthy, Warning (<85%), and Over Limit (>100%) states.
- **Search & Filter**: Search components by keyword (`button`, `bank`, `input`, `gauge`, `modal`, etc.).
- **Dark/Light Mode**: Toggle themes to see how every component adapts.

---

## 📁 Conflict-Free Modular Architecture

To enable team members to prototype and build UI features in parallel without Git merge conflicts, the codebase is decomposed into independent modules:

```text
idp-iter2/
├── index.html                   # HTML entry point (loads stylesheets & scripts)
├── manifest.json                # PWA manifest
├── css/
│   ├── variables.css            # Design tokens (Obsidian, Emerald, Amber, Rose, etc.)
│   ├── base.css                 # Reset, mobile 100dvh root layout, typography, animations
│   └── components.css           # Shared buttons, form boxes, bottom navigation, modals
├── src/
│   ├── main.js                  # App bootstrap, global modals (+ Add Transaction), toasts
│   ├── core/
│   │   ├── state.js             # Central state store + pub/sub event emitter (window.App.state)
│   │   ├── router.js            # Screen manager, navigation transitions & Maze hash sync
│   │   └── maze.js              # Maze A/B testing & usability tracking integration
│   └── screens/
│       ├── onboarding/          # Screen 0: Welcome screen (big touch buttons)
│       │   ├── onboarding.css
│       │   └── onboarding.js
│       ├── setup-banks/         # Step 1: Connect bank accounts + DBS splash
│       │   ├── setup-banks.css
│       │   └── setup-banks.js
│       ├── setup-goal/          # Step 2: Goal ($2,000 MacBook) & Budget ($20/day)
│       │   ├── setup-goal.css
│       │   └── setup-goal.js
│       ├── setup-recurring/     # Step 3: Recurring expenses + category sheet + swipe delete
│       │   ├── setup-recurring.css
│       │   └── setup-recurring.js
│       ├── setup-socials/       # Step 4: Social buddies & group circles
│       │   ├── setup-socials.css
│       │   └── setup-socials.js
│       ├── home/                # Tab 1: Daily gauge, streak, limit states & expenses
│       │   ├── home.css
│       │   └── home.js
│       ├── insights/            # Tab 2: 5-category donut chart, 7-day bar chart
│       │   ├── insights.css
│       │   └── insights.js
│       ├── social/              # Tab 3: Accountability streak & friend cheer interactions
│       │   ├── social.css
│       │   └── social.js
│       └── settings/            # Tab 4: Account settings & Maze A/B testing controls
│           ├── settings.css
│           └── settings.js
```

### How to Create or Modify a Screen (Without Conflicts)
1. **Each screen is isolated**: To work on a screen, you only touch its dedicated folder under `src/screens/<screen-name>/`.
2. **Screen Module Template**:
   ```javascript
   window.App.registerScreen('my-feature', {
     id: 'screen-my-feature',
     title: 'Feature Title',
     render() {
       return `
         <section class="screen" id="screen-my-feature">
           <!-- Screen HTML here -->
         </section>
       `;
     },
     init() {
       // Bind click handlers, forms, etc.
     },
     onEnter() {
       // Lifecycle hook called whenever this screen becomes active
     }
   });
   ```
3. **Navigating between screens**: Use `data-goto="screen-<name>"` on any button or element, or call `window.App.router.navigateTo('screen-<name>')`.
4. **Shared State & Reactivity**:
   - Access state via `window.App.state.<property>`.
   - Subscribe to events: `window.App.state.on('eventName', callback)`.
   - Dispatch events: `window.App.state.emit('eventName', data)`.

---

## 🧪 Maze A/B Testing Integration

The app includes built-in integration with **Maze** usability testing:
- **Universal Tracking Snippet**: Embedded in `<head>` and dynamically configured via API key.
- **Hash-based URL routing**: Synchronizes `#onboarding`, `#setup-1`, `#setup-2`, `#setup-3`, `#setup-4`, `#home`, `#insights`, `#social`, `#settings` to enable Maze heatmaps, click paths, and mission step completion without full page reloads.
- **A/B Variant Testing**: Set via URL parameter `?variant=A` or `?variant=B`, or switch live in the **Settings** tab.
- **Quick Test Link Generation**: Tap **"Copy Test URL for Maze"** inside the Settings screen to copy the exact URL for your Maze mission setup.

---

## 🎨 Design System & Color Palette Integration

All CSS tokens and color semantics are derived from `Savenow-High-Fidelity-Color-Palette.html`:

- **Brand Primary**: Obsidian Slate 900 (`#0F172A`), Emerald 500 (`#10B981`), Emerald 600 (`#059669`).
- **Surfaces & Neutrals**: Pure Canvas (`#F8FAFC`), Cards (`#FFFFFF`), Hairline Borders (`#E2E8F0`), Strong Borders (`#CBD5E1`).
- **Semantic Budget Ring States**:
  - **Healthy / Within Limit (<85%)**: Savenow Emerald 500 (`#10B981`)
  - **Warning State (85%–100%)**: Amber 500 (`#F59E0B`)
  - **Over Limit (>100%)**: Rose 500 (`#F43F5E`) & Indigo Recovery Mode (`#6366F1`)
- **Gamification**: 98-Day Streak Orange (`#F97316` / `#EA580C`).
- **Dark Mode**: Toggleable anytime via the pill button at the top-right.

---

## 🧭 Phase 1 Screen Walkthrough

### 1. Onboarding (`Onboarding.png`)
- Custom Save Now geometric monogram and coin symbol.
- Value proposition chips: Live Bank Sync, $20 Daily Pace, Social Streaks.
- **Prominent Touch Targets**: 68px tall, non-wide hero buttons (`max-width: 295px`) designed for effortless one-handed thumb tapping on any phone width.

### 2. Setup Step 1: Connect Bank Account (`Setup-1.png`, `Setup-3.jpg`, `Setup-4.jpg`)
- Bank options with authentic SVG brand logos: **DBS**, **OCBC**, **UOB**, **Trust**, **Standard Chartered**.
- **Interactive Auth Flow**: Tapping "CONNECT" triggers an authentic DBS splash screen (`Setup-4.jpg`: *"Live more, Bank less"*), runs a verification animation, and switches the button to `✓ CONNECTED` with obsidian fill.

### 3. Setup Step 2: Set Goal & Budget (`Setup 2 — Goal & budget · Filled · Print.jpg`)
- Goal: *"Buy a MacBook Pro"*, Amount: *"$2,000"*, Date: *"12/2026"*.
- Spending Limits: Daily *"$20"*, Weekly *"$140"*, Monthly *"$600"*.
- Income: Monthly *"$800"*.

### 4. Setup Step 3: Add Recurring Expenses (`Setup-2.jpg`, `recurring expenses — Category Open.jpg`)
- Form inputs for Purpose, Amount, Day of Month, Calendar (`MONTH`).
- **Interactive Category Picker**: Opens bottom sheet containing `MUSIC`, `RENT`, `TV & STREAMING`, `SUBSCRIPTIONS`, `UTILITIES`, `GYM`, `OTHER`.
- **Expense List**: Preloaded with Spotify ($6.48, 17th / MONTH).
- **Interactive Actions**: Supports clicking **"Edit"** / **"Remove"**, or **swiping left** on mobile touch to delete item.

### 5. Setup Step 4: Add Socials (`Setup.png`)
- **`+ JOIN GROUP`**: Interactive modal to join community saving circles.
- **`+ CONTACTS`**: Simulates syncing address book buddies.
- **`+ USERNAME`**: Connects accountability partners.

### 6. Home Page (`Within Limit · Print.png`)
- **Brand Header**: "Save Now" with live emerald pulse indicator + **98-DAY STREAK** pill.
- **Dynamic Circular Budget Gauge**: Live SVG ring gauge with circumference math ($17.40 / $20 limit).
- **Live State Simulator**: Tap `Within Limit`, `Warning`, or `Over Limit` pills in the simulator strip to observe ring animations and dynamic alert banners.
- **Bottom Navigation Bar**: Fixed iOS bottom navigation (`Home`, `Insights`, `Add (+)`, `Social`, `Settings`).
- **Center Add Button**: Tapping `+` opens a quick-log sheet to add a purchase and watch the $20 daily gauge update instantly.

hi