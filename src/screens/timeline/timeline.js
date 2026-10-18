/** Screen: Timeline — spending line graph with a trend line (opened from Insights → Timeline) */
(function () {
  var fmt = App.fmt.money;

  // Past weeks and months are prototype fixtures; the 7-day view and the latest week are live
  var PAST_WEEKS = [{ d: '10 Aug', v: 150 }, { d: '17 Aug', v: 142 }, { d: '24 Aug', v: 136 }, { d: '31 Aug', v: 129 }];
  var MONTHS = [{ d: 'Mar', v: 620 }, { d: 'Apr', v: 598 }, { d: 'May', v: 641 }, { d: 'Jun', v: 603 }, { d: 'Jul', v: 612 }, { d: 'Aug', v: 584 }];
  var RANGES = {
    '7d': { label: '7 days', unit: 'day', points: function () { return App.state.home.week; } },
    '5w': { label: 'Weeks', unit: 'week', points: function () { return PAST_WEEKS.concat([{ d: 'This wk', v: App.weekStats().total }]); } },
    '6m': { label: 'Months', unit: 'month', points: function () { return MONTHS; } }
  };

  /** Least-squares line through the points → { slope, y0 } where y = y0 + slope * i */
  function trend(pts) {
    var n = pts.length, sx = 0, sy = 0, sxy = 0, sxx = 0;
    pts.forEach(function (p, i) { sx += i; sy += p.v; sxy += i * p.v; sxx += i * i; });
    var slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return { slope: slope, y0: (sy - slope * sx) / n };
  }

  function chart(pts, tr) {
    var W = 340, H = 190, L = 20, R = 20, T = 14, B = 26;
    var max = Math.max.apply(null, pts.map(function (p) { return p.v; })) * 1.1;
    var x = function (i) { return L + i * (W - L - R) / (pts.length - 1); };
    var y = function (v) { return T + (1 - v / max) * (H - T - B); };
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1); }).join(' ');
    var dots = pts.map(function (p, i) {
      return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.v).toFixed(1) + '" r="' + (i === pts.length - 1 ? 5 : 3.5) + '" fill="var(--sn-accent)"><title>' + p.d + ' · ' + fmt(p.v) + '</title></circle>';
    }).join('');
    var labels = pts.map(function (p, i) {
      return '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="tl-axis">' + p.d + '</text>';
    }).join('');
    var last = pts.length - 1;
    return '<svg class="tl-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Spending over time with trend line">' +
      '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '" stroke="var(--sn-border-hairline)" />' +
      '<line x1="' + x(0) + '" y1="' + y(tr.y0).toFixed(1) + '" x2="' + x(last) + '" y2="' + y(tr.y0 + tr.slope * last).toFixed(1) + '" stroke="var(--sn-text-muted)" stroke-width="2" stroke-dasharray="6 5" />' +
      '<path d="' + line + '" fill="none" stroke="var(--sn-accent)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />' + dots + labels + '</svg>';
  }

  App.registerScreen('timeline', {
    tab: 'insights',
    title: 'Timeline',
    range: '7d',

    render() {
      return '<div class="screen-body">' + App.ui.back('insights') + App.ui.head('Timeline', 'How your spending is trending') +
        '<div class="segmented" id="tl-seg" role="tablist" aria-label="Range">' +
        Object.keys(RANGES).map(function (k) { return '<button role="tab" data-range="' + k + '">' + RANGES[k].label + '</button>'; }).join('') + '</div>' +
        '<div id="tl-body"></div></div>';
    },
    init() {
      var self = this;
      document.getElementById('tl-seg').addEventListener('click', function (e) {
        var b = e.target.closest('[data-range]');
        if (b) { self.range = b.dataset.range; self.paint(); }
      });
    },
    onEnter() { this.paint(); },

    paint() {
      var r = RANGES[this.range], pts = r.points(), tr = trend(pts);
      var avg = pts.reduce(function (s, p) { return s + p.v; }, 0) / pts.length;
      var down = tr.slope < 0, pct = Math.abs(tr.slope / avg * 100);
      var verdict = pct < 1 ? 'Holding steady' : (down ? 'Trending down' : 'Trending up');
      document.querySelectorAll('#tl-seg [data-range]').forEach(function (b) {
        var on = b.dataset.range === this.range;
        b.classList.toggle('active', on); b.setAttribute('aria-selected', on);
      }, this);
      document.getElementById('tl-body').innerHTML =
        '<div class="card tl-card"><div class="eyebrow">' + verdict + '</div>' +
        '<div class="ins-big ' + (down ? 'delta' : '') + '">' + (pct < 1 ? '' : down ? '−' : '+') + fmt(Math.abs(tr.slope), r.unit === 'day' ? 2 : 0) + ' <span class="tl-unit">per ' + r.unit + '</span></div>' +
        '<div class="ins-cap">Average ' + fmt(avg, 0) + ' per ' + r.unit + '</div>' + chart(pts, tr) +
        '<div class="tl-legend"><span><i class="tl-key line"></i>Spending</span><span><i class="tl-key dash"></i>Trend</span></div></div>';
    }
  });
})();
