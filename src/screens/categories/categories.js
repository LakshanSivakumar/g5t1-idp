/** Screens: Categories, Category detail, Small purchases, Goal trade-off */
(function () {
  var fmt = App.fmt.money, esc = App.escapeHTML;
  var WEEK = 'This week · 31 Aug – 6 Sep';

  function catOptions(sel) {
    return App.CATEGORIES.map(function (c) { return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + c.name + '</option>'; }).join('');
  }

  App.registerScreen('categories', {
    tab: 'insights',
    title: 'Categories',
    render() {
      var cats = App.CATEGORIES;
      return `
        <div class="screen-body">
          ${App.ui.back('insights')}
          ${App.ui.head('Categories', 'Your spending, broken down')}
          <div class="card cat-card">
            <div class="eyebrow">Last month · August 2026</div>
            <div class="ins-big">$584.00</div>
            <div class="ins-split">
              ${App.pie(cats.map(function (c) { return { pct: c.pct, color: c.color }; }), 'lg')}
              <div class="legend cat-legend">${cats.map(function (c) {
                return '<div><span class="dot" style="background:' + c.color + '"></span><span><b>' + c.name + '</b> · ' + c.pct + '%<br><span class="muted">' + fmt(c.last) + '</span></span></div>';
              }).join('')}</div>
            </div>
          </div>
          <p class="section-label">This week · 31 Aug – 6 Sep</p>
          <label class="cat-select"><span>Choose a category</span><select id="cat-choose" aria-label="Choose a category"><option value="" disabled selected>Choose a category</option>${catOptions()}</select>${App.icon('chevron.down', 16, 'chev')}</label>
          <p class="footnote">Pick a category above to see every expense counted in it between 31 Aug and 6 Sep.</p>
        </div>`;
    },
    init() {
      document.getElementById('cat-choose').addEventListener('change', function (e) {
        App.router.go('category', { param: e.target.value });
        e.target.selectedIndex = 0;
      });
    }
  });

  App.registerScreen('category', {
    tab: 'insights',
    title: 'Category',
    render() {
      return `<div class="screen-body">${App.ui.back('categories')}<div id="cat-detail"></div></div>`;
    },
    onEnter(id) {
      var c = App.CATEGORIES.filter(function (x) { return x.id === id; })[0] || App.CATEGORIES[0];
      var list = App.weekExpenses().filter(function (e) { return e.cat === c.id; });
      var total = list.reduce(function (s, e) { return s + e.amount; }, 0);
      var item = function (e, withDay) {
        var sub = (withDay ? e.day + ' · ' : '') + e.time + (e.where && !withDay ? ' · ' + c.name : '') + (e.where && withDay ? ' · ' + e.where : '');
        return '<div class="ledger-item"><div><div class="row-title">' + esc(e.title) + (e.where && !withDay ? ' · ' + esc(e.where) : '') + '</div><div class="row-sub">' + esc(sub) + '</div></div><span class="row-value">' + fmt(e.amount) + '</span></div>';
      };
      var body = '';
      if (c.id === 'food') {
        var days = [];
        list.forEach(function (e) {
          var d = days.filter(function (x) { return x.day === e.day; })[0];
          if (!d) days.push(d = { day: e.day, items: [], sum: 0 });
          d.items.push(e); d.sum += e.amount;
        });
        body = days.map(function (d) {
          return '<div class="ledger-day"><span>' + d.day + '</span><span class="num">' + fmt(d.sum) + '</span></div><div class="ledger">' + d.items.map(function (e) { return item(e, false); }).join('') + '</div>';
        }).join('');
      } else {
        body = '<div class="ledger" style="margin-top:12px">' + list.map(function (e) { return item(e, true); }).join('') + '</div>';
      }
      document.getElementById('cat-detail').innerHTML =
        App.ui.head(c.name, WEEK) +
        '<label class="cat-select"><span>' + c.name + '</span><small>Change</small><select id="cat-change" aria-label="Change category">' + catOptions(c.id) + '</select>' + App.icon('chevron.down', 16, 'chev') + '</label>' +
        '<p class="cat-summary">' + list.length + ' expense' + (list.length === 1 ? '' : 's') + ' · ' + fmt(total) + '</p>' + body +
        (list.length < 3 ? '<p class="footnote">Only this category is shown. Use Change to switch categories.</p>' : '');
      document.getElementById('cat-change').addEventListener('change', function (e) {
        App.router.go('category', { param: e.target.value });
      });
    }
  });

  App.registerScreen('small-purchases', {
    tab: 'insights',
    title: 'Small purchases',
    render() { return '<div class="screen-body">' + App.ui.back('insights') + '<div id="sp-body"></div></div>'; },
    onEnter() {
      var w = App.weekStats(), pct = Math.round(w.smallTotal / w.total * 100);
      var g = function (ids) { return w.small.filter(function (e) { return ids.indexOf(e.cat) > -1; }); };
      var rows = [
        { n: 'Food', l: 'vending and cheaper lunches', a: g(['food']) },
        { n: 'Transport', l: 'MRT and bus fares', a: g(['transport']) },
        { n: 'Everything else', l: 'laundry, stationery, top-ups', a: g(['bills', 'other', 'shopping']) }
      ];
      document.getElementById('sp-body').innerHTML =
        App.ui.head('Small purchases', 'The under-$5 buys, added up') +
        '<div class="card"><div class="card-head"><span class="eyebrow">' + App.icon('bag.fill', 14) + ' This week</span><span class="muted" style="font-size:13px">31 Aug – 6 Sep</span></div>' +
        '<div class="ins-big">' + fmt(w.smallTotal) + '</div><div class="ins-cap">' + w.small.length + ' of ' + w.all.length + ' purchases were under $5</div>' +
        '<div class="prog-row"><div class="progress"><i style="width:' + pct + '%"></i></div><b>' + pct + '%</b></div>' +
        '<div class="ins-cap" style="margin-top:8px">' + pct + '% of everything you spent this week · ' + fmt(w.total) + ' total</div></div>' +
        '<p class="section-label">Where it went</p><div class="list">' + rows.map(function (r) {
          var t = r.a.reduce(function (s, e) { return s + e.amount; }, 0);
          return '<div class="where-row"><div class="t"><span>' + r.n + '</span><span class="num">' + fmt(t) + '</span></div><div class="s">' + r.a.length + ' purchases · ' + r.l + '</div></div>';
        }).join('') + '</div>' +
        '<p class="footnote">Counts every purchase under $5 from 31 Aug to 6 Sep. Bigger buys — dinners, groceries, a phone case — are left out.</p>' +
        '<button class="btn btn-secondary btn-block" style="margin-top:20px" data-goto="categories">See this week’s expenses</button>';
    }
  });

  /** August's discretionary extras plus anything the user has logged under Food or Shopping since (live) */
  var AUGUST_EXTRAS = [['Bubble tea & coffee', 16, 38.40], ['Vending drinks & snacks', 16, 30.60], ['Convenience-store snacks', 14, 21.00]];
  App.goalExtras = function () {
    var items = AUGUST_EXTRAS.slice(), total = 90;
    var logged = App.state.home.latestExpenses.filter(function (e) { return e.logged && (e.category === 'food' || e.category === 'shopping'); });
    if (logged.length) {
      var sum = logged.reduce(function (a, e) { return a + e.amount; }, 0);
      items.push(['Logged since August', logged.length, sum, true]);
      total += sum;
    }
    return { items: items, total: total };
  };
  /** Share of the current goal those extras would cover, e.g. "4.5" */
  App.goalExtrasPct = function () { return (App.goalExtras().total / App.state.goal.amount * 100).toFixed(1); };

  App.registerScreen('goal-tradeoff', {
    tab: 'insights',
    title: 'Goal trade-off',
    render() { return '<div class="screen-body">' + App.ui.back('insights') + '<div id="gt-body"></div></div>'; },
    onEnter() {
      var s = App.state.goal;
      var ex = App.goalExtras(), items = ex.items, tot = ex.total;
      var pct = App.goalExtrasPct();
      document.getElementById('gt-body').innerHTML =
        App.ui.head('Goal trade-off', 'What last month’s extras cost your goal') +
        '<div class="card"><div class="card-head"><span class="eyebrow">' + App.icon('lightbulb', 14) + ' Discretionary</span><span class="muted" style="font-size:13px">August 2026</span></div>' +
        '<div class="ins-big" style="color:var(--sn-indigo-500)">' + pct + '%</div>' +
        '<div class="ins-cap">' + fmt(tot) + ' of your ' + fmt(s.amount, 0) + ' ' + esc(s.purpose) + ' goal. Put toward the goal instead, these extras would cover ' + pct + '% of it.</div></div>' +
        '<p class="section-label">What’s counted</p><div class="list">' + items.map(function (i) {
          return App.ui.row({ title: i[0], sub: i[1] + (i[3] ? ' new purchase' + (i[1] === 1 ? '' : 's') : ' purchases in August'), value: fmt(i[2]) });
        }).join('') + App.ui.row({ title: 'Edit what counts', sub: 'Move anything back to everyday spending', goto: 'goal-tradeoff', action: 'edit-counts' }) + '</div>' +
        '<p class="footnote">Transport, bills and groceries are not counted here. Anything you log under Food or Shopping is. Savenow tags these extras automatically and you can change any of them.</p>';
      document.querySelector('#gt-body [data-action="edit-counts"]').onclick = function (e) { e.stopPropagation(); App.showToast('Editing tags is coming soon'); };
    }
  });
})();
