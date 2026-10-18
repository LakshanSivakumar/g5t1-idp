/** Screen: Insights tab (Insights · Print.png) + shared pie chart builder */
(function () {
  var fmt = App.fmt.money;

  /** Pie chart from [{pct, color}] — returns SVG markup. */
  App.pie = function (segs, cls) {
    var r = 50, cx = 60, cy = 60, a0 = -Math.PI / 2, total = segs.reduce(function (s, x) { return s + x.pct; }, 0);
    var out = '';
    segs.forEach(function (s) {
      var a1 = a0 + (s.pct / total) * Math.PI * 2;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      out += '<path d="M' + cx + ' ' + cy + ' L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + (s.pct / total > 0.5 ? 1 : 0) + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'Z" fill="' + s.color + '" stroke="var(--sn-bg-card)" stroke-width="2"/>';
      a0 = a1;
    });
    return '<svg class="pie ' + (cls || '') + '" viewBox="0 0 120 120" role="img" aria-label="Spending by category">' + out + '</svg>';
  };

  /** The week's ledger plus today's expenses the user logged (newest first, shown under today). */
  App.weekExpenses = function () {
    var today = App.WEEK_EXPENSES[0].day;
    return App.state.home.latestExpenses.map(function (e) {
      return { id: e.id, day: today, time: e.time || 'Just now', title: e.title, where: e.where || '', amount: e.amount, cat: e.category };
    }).concat(App.WEEK_EXPENSES);
  };

  /** Week aggregates derived from the expense ledger. */
  App.weekStats = function () {
    var all = App.weekExpenses(), small = all.filter(function (e) { return e.amount < 5; });
    var sum = function (a) { return a.reduce(function (s, e) { return s + e.amount; }, 0); };
    return { all: all, small: small, total: sum(all), smallTotal: sum(small), sum: sum };
  };

  App.registerScreen('insights', {
    tab: 'insights',
    title: 'Insights',

    render: body,
    onEnter() { document.getElementById('screen-insights').innerHTML = body(); } // repaint so new expenses show up
  });

  function body() {
    {
      var cats = App.CATEGORIES;
      var w = App.weekStats();
      var pct = Math.round(w.smallTotal / w.total * 100);
      var wk = App.state.home.week, top = Math.max.apply(null, wk.map(function (d) { return d.v; }).concat(App.state.home.dailyLimit));
      var timeline = wk.map(function (d, i, a) {
        return '<div class="bar ' + (i === a.length - 1 ? 'ink' : '') + '" style="height:' + Math.max(4, d.v / top * 100).toFixed(0) + '%"></div>';
      }).join('');
      return `
        <div class="screen-body">
          <div class="ins-top"><span class="brand">Savenow</span><span class="pill">Sep 2026</span></div>
          ${App.ui.head('Insights', 'Learn more about how you spend')}

          <button class="card ins-card" data-goto="categories">
            <div class="card-head"><span class="eyebrow">${App.icon('chart.pie.fill', 14)} Categories</span><span class="go">View all ${App.icon('chevron.right', 7)}</span></div>
            <div class="ins-split">
              <div><div class="ins-big">$584</div><div class="ins-cap">spent last month · August</div>
                <div class="legend" style="margin-top:10px"><div><span class="dot" style="background:${cats[0].color}"></span><b>Food</b> 34%</div><div><span class="dot" style="background:${cats[1].color}"></span><b>Transport</b> 22%</div></div></div>
              ${App.pie(cats.map(function (c) { return { pct: c.pct, color: c.color }; }))}
            </div>
          </button>

          <button class="card ins-card" data-goto="home" data-param="graph">
            <div class="card-head"><span class="eyebrow">${App.icon('chart.pie.fill', 14)} Timeline</span><span class="go" style="color:var(--sn-text-secondary)">7 days</span></div>
            <div class="ins-split"><div><div class="ins-big delta">−18%</div><div class="ins-cap">less than last week</div></div><div class="bars mini-bars" aria-hidden="true">${timeline}</div></div>
          </button>

          <button class="card ins-card" data-goto="small-purchases">
            <div class="card-head"><span class="eyebrow">${App.icon('bag.fill', 14)} Small purchases</span><span class="go">Details ${App.icon('chevron.right', 7)}</span></div>
            <div class="ins-big">${fmt(w.smallTotal)}</div>
            <div class="ins-cap">${w.small.length} purchases under $5 this week</div>
            <div class="prog-row"><div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>
          </button>

          <button class="card ins-card" data-goto="goal-tradeoff">
            <div class="card-head"><span class="eyebrow">${App.icon('lightbulb', 14)} Goal trade-off</span><span class="go">Details ${App.icon('chevron.right', 7)}</span></div>
            <div class="ins-big" style="color:var(--sn-indigo-500)">4.5%</div>
            <div class="ins-cap">$90.00 of your $2,000 ${App.escapeHTML(App.state.goal.purpose)} goal · August</div>
          </button>
        </div>`;
    }
  }
})();
