/**
 * Savenow Core — State & prototype data
 * One shared store (window.App.state) + a tiny pub/sub. Money is stored in dollars.
 * Data below mirrors the low-fidelity wireframes so every screen tells one story.
 */

window.App = window.App || {};

window.App.fmt = {
  money(n, dp) {
    var d = dp === undefined ? 2 : dp;
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
};

/** Limits must nest: daily <= weekly <= monthly. Blank weekly/monthly fall back to daily x 7 / x 30. Returns an error message or ''. */
window.App.budgetError = function (daily, weekly, monthly) {
  var w = weekly || daily * 7, m = monthly || daily * 30;
  if (w < daily) return 'Your weekly limit can’t be lower than your daily limit';
  if (m < w) return 'Your monthly limit can’t be lower than your weekly limit';
  return '';
};

/* Categories (palette: Food 34 / Transport 22 / Shopping 20 / Bills 14 / Other 10) */
window.App.CATEGORIES = [
  { id: 'food',      name: 'Food',      pct: 34, last: 198.56, color: 'var(--sn-cat-food)',      icon: 'cup.and.saucer' },
  { id: 'transport', name: 'Transport', pct: 22, last: 128.48, color: 'var(--sn-cat-transport)', icon: 'tram.fill' },
  { id: 'shopping',  name: 'Shopping',  pct: 20, last: 116.80, color: 'var(--sn-cat-shopping)',  icon: 'bag.fill' },
  { id: 'bills',     name: 'Bills',     pct: 14, last: 81.76,  color: 'var(--sn-cat-bills)',     icon: 'bolt.fill' },
  { id: 'other',     name: 'Other',     pct: 10, last: 58.40,  color: 'var(--sn-cat-other)',     icon: 'ellipsis.circle' }
];

/* Week of 31 Aug – 6 Sep. [day label, time, title, venue, amount, category] */
(function () {
  var D = {
    sun: 'Sun 6 Sep', sat: 'Sat 5 Sep', fri: 'Fri 4 Sep', thu: 'Thu 3 Sep',
    wed: 'Wed 2 Sep', tue: 'Tue 1 Sep', mon: 'Mon 31 Aug'
  };
  var rows = [
    // Food: 18 expenses, $76.00 (10 under $5 = $27.30)
    [D.sun, '7:10 pm', 'Dinner', 'Hawker centre', 6.10, 'food'],
    [D.sun, '3:20 pm', 'Drink', 'Vending machine', 1.20, 'food'],
    [D.sun, '12:35 pm', 'Lunch', 'Food court', 4.90, 'food'],
    [D.sat, '7:40 pm', 'Dinner', 'Noodle shop', 6.80, 'food'],
    [D.sat, '4:05 pm', 'Snack', 'Vending machine', 1.80, 'food'],
    [D.fri, '7:00 pm', 'Dinner', 'Rice bowl', 6.50, 'food'],
    [D.fri, '12:15 pm', 'Lunch', 'Campus canteen', 4.60, 'food'],
    [D.fri, '10:20 am', 'Drink', 'Vending machine', 1.30, 'food'],
    [D.thu, '7:30 pm', 'Dinner', 'Ramen bar', 5.90, 'food'],
    [D.thu, '1:00 pm', 'Lunch', 'Kopitiam', 3.80, 'food'],
    [D.thu, '10:10 am', 'Drink', 'Vending machine', 1.50, 'food'],
    [D.wed, '7:20 pm', 'Dinner', 'Hawker centre', 6.20, 'food'],
    [D.wed, '12:40 pm', 'Lunch', 'Food court', 4.30, 'food'],
    [D.wed, '3:30 pm', 'Snack', 'Vending machine', 2.10, 'food'],
    [D.tue, '7:50 pm', 'Dinner', 'Zi char stall', 5.50, 'food'],
    [D.tue, '4:00 pm', 'Drink', 'Vending machine', 1.80, 'food'],
    [D.mon, '7:45 pm', 'Dinner', 'Bak kut teh', 5.70, 'food'],
    [D.mon, '1:10 pm', 'Lunch', 'Campus canteen', 6.00, 'food'],
    // Transport: 12 expenses, $21.60
    [D.sun, '9:10 am', 'Bus', '', 1.30, 'transport'],
    [D.sun, '11:20 am', 'Bus', '', 1.30, 'transport'],
    [D.fri, '6:35 pm', 'MRT', '', 1.90, 'transport'],
    [D.fri, '8:05 am', 'MRT', '', 1.90, 'transport'],
    [D.thu, '6:40 pm', 'MRT', '', 1.90, 'transport'],
    [D.thu, '8:10 am', 'MRT', '', 1.90, 'transport'],
    [D.wed, '6:30 pm', 'MRT', '', 1.90, 'transport'],
    [D.wed, '8:00 am', 'MRT', '', 1.90, 'transport'],
    [D.tue, '6:45 pm', 'MRT', '', 1.90, 'transport'],
    [D.tue, '8:05 am', 'MRT', '', 1.90, 'transport'],
    [D.mon, '6:35 pm', 'MRT', '', 1.90, 'transport'],
    [D.mon, '8:15 am', 'MRT', '', 1.90, 'transport'],
    // Shopping: 1 expense, $5.40
    [D.wed, '3:00 pm', 'Phone case', '', 5.40, 'shopping'],
    // Bills: 1 expense, $4.00
    [D.sun, '11:00 am', 'Mobile top-up', 'Singtel', 4.00, 'bills'],
    // Other: 5 expenses, $20.80
    [D.sun, '4:40 pm', 'Print credits', '', 2.00, 'other'],
    [D.sat, '10:30 am', 'Groceries', 'FairPrice', 9.60, 'other'],
    [D.thu, '7:50 pm', 'Laundry', '', 3.00, 'other'],
    [D.wed, '1:10 pm', 'Stationery', '', 2.80, 'other'],
    [D.tue, '8:40 pm', 'Convenience store', '', 3.40, 'other']
  ];
  window.App.WEEK_EXPENSES = rows.map(function (r, i) {
    return { id: 'wk' + i, day: r[0], time: r[1], title: r[2], where: r[3], amount: r[4], cat: r[5] };
  });
})();

window.App.state = {
  currentScreen: 'screen-onboarding',
  theme: 'light',
  themePref: 'system', // 'system' | 'light' | 'dark'
  mazeVariant: 'A',

  user: { name: 'Bob Tan', handle: 'bobsaves', currency: 'SGD', country: 'Singapore', email: 'bob@savenow.app' },

  /* Setup */
  connectedBanks: { dbs: false, ocbc: false, uob: false, trust: false, sc: false },
  goal: { purpose: 'MacBook Pro', amount: 2000, date: 'December 2026' },
  budget: { daily: 20, weekly: 140, monthly: 800, incomeMonthly: 0 },
  recurringExpenses: [], // starts empty: users add their own during onboarding
  socials: [],

  /* Home */
  home: {
    view: 'ring',          // 'ring' | 'graph'
    spentToday: 17.40,
    dailyLimit: 20,
    streakDays: 98,
    bestStreak: 98,
    monthlySaved: 190,
    week: [ // Thu → Today, spend per day
      { d: 'Thu', v: 15.8 }, { d: 'Fri', v: 18.9 }, { d: 'Sat', v: 11.2 },
      { d: 'Sun', v: 19.4 }, { d: 'Mon', v: 14.1 }, { d: 'Tue', v: 17.2 }, { d: 'Today', v: 17.40 }
    ],
    latestExpenses: [
      { id: 'exp_1', title: 'Bubble tea', sub: 'Grab · 6:40pm', initials: 'BT', amount: 3.40, category: 'food', time: '6:40 pm', where: 'Grab' },
      // Seeded so today's list adds up to spentToday; `seed` keeps them out of the week ledger, which already counts them
      { id: 'exp_5', seed: true, title: 'Vending snacks', sub: 'Food · 3:20pm', initials: 'VS', amount: 2.50, category: 'food', time: '3:20 pm', where: '' },
      { id: 'exp_2', seed: true, title: 'Lunch', sub: 'Food court · 12:35pm', initials: 'LU', amount: 4.90, category: 'food', time: '12:35 pm', where: 'Food court' },
      { id: 'exp_3', seed: true, title: 'Mobile top-up', sub: 'Singtel · 11:00am', initials: 'MT', amount: 4.00, category: 'bills', time: '11:00 am', where: 'Singtel' },
      { id: 'exp_4', seed: true, title: 'Bus', sub: 'Transport · 9:10am', initials: 'BU', amount: 2.60, category: 'transport', time: '9:10 am', where: '' }
    ]
  },

  recovery: { applied: false, days: null }, // days: null = use the recommended length

  settings: { friendRequests: true, shareFinancial: false,
    notif: { nearLimit: true, daily: true, milestones: true, friends: true } },

  /* Pub/sub */
  _listeners: {},
  on(event, fn) { (this._listeners[event] = this._listeners[event] || []).push(fn); },
  emit(event, data) { (this._listeners[event] || []).forEach(function (fn) { fn(data); }); },

  /* Budget status derived from palette thresholds: <80% ok, 80–100% near, >100% over */
  budgetStatus() {
    var h = this.home, pct = h.spentToday / h.dailyLimit;
    var tone = pct > 1 ? 'rose' : pct >= 0.8 ? 'amber' : 'emerald';
    return {
      pct: pct,
      tone: tone,
      left: h.dailyLimit - h.spentToday,
      over: h.spentToday > h.dailyLimit
    };
  }
};
