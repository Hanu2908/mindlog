// MindLog — Life Tracker & Charts
'use strict';

var trackerTab = 'weekly'; // Changed from activeTab to prevent global collision

// ═══════════════════════════════════════════════
// LIFE TRACKER
// ═══════════════════════════════════════════════
function setTab(tab,btn) {
  trackerTab=tab;
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  refreshTracker();
}

function refreshTracker() {
  const entries=getEntries();
  const empty=document.getElementById("tracker-empty");
  if (!entries.length) { empty.style.display="block"; return; }
  empty.style.display="none";
  const cuts={weekly:7,monthly:30,yearly:365};
  const cutDate=new Date(); cutDate.setDate(cutDate.getDate()-cuts[trackerTab]);
  const filtered=entries.filter(e=>new Date(e.timestamp)>=cutDate);
  const streak=calcStreak(entries);
  const realFiltered = filtered.filter(function(e){ return !e.quick_checkin; });
  const avgMood=realFiltered.length?(realFiltered.reduce((a,e)=>a+(e.mood_rating||5),0)/realFiltered.length).toFixed(1):"—";
  const avgStress=realFiltered.length?(realFiltered.reduce((a,e)=>a+(e.stress_level||5),0)/realFiltered.length).toFixed(1):"—";
  document.getElementById("ts-stress").textContent=avgStress;
  document.getElementById("ts-mood").textContent=avgMood;
  document.getElementById("ts-streak").textContent=streak;
  document.getElementById("ts-count").textContent=realFiltered.length;
  document.getElementById("ts-count-sub").textContent="this "+trackerTab.replace("ly","");
  const best=[...realFiltered].sort((a,b)=>b.mood_rating-a.mood_rating)[0];
  if(best){
    const bd=new Date(best.date+'T12:00:00');
    const fmtDate=bd.toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'});
    document.getElementById("bd-date").textContent=fmtDate;document.getElementById("bd-num").textContent=best.mood_rating;document.getElementById("best-day-strip").style.display="flex";}
  else document.getElementById("best-day-strip").style.display="none";
  
  // FIXED: Passed `entries` into buildLineChart to prevent ReferenceError on Yearly view
  buildLineChart(filtered, entries); 
  buildHeatmap(entries); buildDonut(filtered); buildTrackerInsight(filtered); buildStreakHistory(entries); buildEmotionBreakdown(filtered);
}

// FIXED: Added `entries` parameter
function buildLineChart(filtered, entries) {
  var svg = document.getElementById('line-svg');
  if (!svg) return;
  var W=900,H=200,PL=44,PR=24,PT=20,PB=36,gW=W-PL-PR,gH=H-PT-PB;
  var pts = [];

  if (trackerTab === 'weekly') {
    for (var i=0; i<7; i++) {
      var d = new Date(); d.setDate(d.getDate()-6+i);
      var k = d.toISOString().split('T')[0];
      var e = filtered.find(function(x){return x.date===k;});
      var days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
      pts.push({
        x: PL + (i/6)*gW,
        y: e ? PT + (1-(e.mood_rating-1)/9)*gH : null,
        label: days[d.getDay()],
        val: e ? e.mood_rating : null,
      });
    }
  } else if (trackerTab === 'monthly') {
    var weeks = ['W1','W2','W3','W4'];
    weeks.forEach(function(w,i) {
      var wk = filtered.slice(Math.floor(i*filtered.length/4), Math.floor((i+1)*filtered.length/4));
      var avg = wk.length ? wk.reduce(function(a,e){return a+e.mood_rating;},0)/wk.length : null;
      pts.push({ x: PL+(i/3)*gW, y: avg ? PT+(1-(avg-1)/9)*gH : null, label: w, val: avg ? avg.toFixed(1) : null });
    });
  } else {
    // Yearly — last 12 actual calendar months
    var now = new Date();
    var monthPts = [];
    for (var mi = 11; mi >= 0; mi--) {
      var mDate = new Date(now.getFullYear(), now.getMonth() - mi, 1);
      var mYear = mDate.getFullYear();
      var mMonth = mDate.getMonth();
      var mLabel = mDate.toLocaleDateString('en-IN', {month:'short'});
      // Get all entries in this calendar month
      var mEntries = entries.filter(function(e) {
        var ed = new Date(e.date);
        return ed.getFullYear() === mYear && ed.getMonth() === mMonth && !e.quick_checkin;
      });
      var mAvg = mEntries.length
        ? mEntries.reduce(function(a,e){ return a+(e.mood_rating||5); }, 0) / mEntries.length
        : null;
      var xPos = PL + ((11-mi)/11) * gW;
      monthPts.push({
        x: xPos,
        y: mAvg ? PT + (1-(mAvg-1)/9)*gH : null,
        label: mLabel,
        val: mAvg ? mAvg.toFixed(1) : null
      });
    }
    pts = monthPts;
  }

  var vp = pts.filter(function(p){return p.val !== null;});
  var primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#D4617E';
  var accent  = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()  || '#81B29A';

  // Build smooth bezier path
  function bezierPath(points) {
    if (points.length < 2) return '';
    var d = 'M' + points[0].x + ',' + points[0].y;
    for (var i=1; i<points.length; i++) {
      var prev = points[i-1], curr = points[i];
      var cpx1 = prev.x + (curr.x - prev.x) * 0.45;
      var cpx2 = curr.x - (curr.x - prev.x) * 0.45;
      d += ' C' + cpx1+','+prev.y + ' ' + cpx2+','+curr.y + ' ' + curr.x+','+curr.y;
    }
    return d;
  }

  var path = vp.length > 1 ? bezierPath(vp) : '';
  var areaPath = path ? path
    + ' L' + vp[vp.length-1].x + ',' + (H-PB)
    + ' L' + vp[0].x + ',' + (H-PB) + ' Z' : '';

  var h = '<defs>'
    + '<linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">'
    + '<stop offset="0%" stop-color="' + primary + '"/>'
    + '<stop offset="100%" stop-color="' + accent + '"/>'
    + '</linearGradient>'
    + '<linearGradient id="ag" x1="0%" y1="0%" x2="0%" y2="100%">'
    + '<stop offset="0%" stop-color="' + primary + '" stop-opacity="0.15"/>'
    + '<stop offset="100%" stop-color="' + primary + '" stop-opacity="0"/>'
    + '</linearGradient>'
    + '</defs>';

  // Grid lines
  [2,4,6,8,10].forEach(function(v) {
    var y = PT + (1-(v-1)/9)*gH;
    h += '<line x1="'+PL+'" y1="'+y+'" x2="'+(W-PR)+'" y2="'+y+'" stroke="#e0ddf0" stroke-width="1"/>';
    h += '<text x="'+(PL-8)+'" y="'+(y+4)+'" text-anchor="end" fill="#c0bcd8" font-size="10" font-family="Nunito">'+v+'</text>';
  });

  // Area fill + line
  if (areaPath) h += '<path d="'+areaPath+'" fill="url(#ag)"/>';
  if (path)     h += '<path d="'+path+'" fill="none" stroke="url(#lg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';

  // Day labels + dots + tooltips
  var tips = '';
  pts.forEach(function(p,i) {
    h += '<text x="'+p.x+'" y="'+(H-8)+'" text-anchor="middle" fill="#c0bcd8" font-size="10" font-family="Nunito">'+p.label+'</text>';
    if (p.val !== null) {
      var cx = p.x, cy = p.y, tv = p.val;
      h += '<circle cx="'+cx+'" cy="'+cy+'" r="8" fill="'+primary+'" opacity="0.15"/>';
      h += '<circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+primary+'" stroke="white" stroke-width="2.5" style="cursor:pointer" class="cdot" data-i="'+i+'"/>';
      tips += '<g id="tip'+i+'" style="display:none">'
        + '<rect x="'+(cx-24)+'" y="'+(cy-36)+'" width="48" height="22" rx="6" fill="#2D1F2B"/>'
        + '<text x="'+cx+'" y="'+(cy-21)+'" text-anchor="middle" fill="white" font-size="11" font-weight="700" font-family="Nunito">'+tv+'/10</text>'
        + '</g>';
    }
  });

  svg.innerHTML = h + tips;
  // Attach hover via delegation (avoids inline quote issues)
  svg.querySelectorAll('.cdot').forEach(function(dot) {
    var id = dot.getAttribute('data-i');
    dot.addEventListener('mouseenter', function(){ var t=document.getElementById('tip'+id); if(t)t.style.display='block'; });
    dot.addEventListener('mouseleave', function(){ var t=document.getElementById('tip'+id); if(t)t.style.display='none'; });
  });
}

function buildHeatmap(entries) {
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;

  const col = v => {
    if (!v) return 'var(--muted)';
    if (v <= 3) return '#E8A090';
    if (v <= 5) return '#F2CC8F';
    if (v <= 7) return '#A8D4BE';
    return '#81B29A';
  };

  const days = ['M','T','W','T','F','S','S'];
  const monthName = today.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const totalCells = startOffset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  let h = '<p style="font-size:.75rem;font-weight:700;color:var(--text-m);margin-bottom:8px">' + monthName + '</p>';
  h += '<div class="heatmap-days">' + days.map(function(d){ return '<div class="hm-day-lbl">'+d+'</div>'; }).join('') + '</div>';
  h += '<div class="hm-grid">';

  for (var row = 0; row < rows; row++) {
    h += '<div class="hm-row">';
    for (var c = 0; c < 7; c++) {
      var cellIdx = row*7 + c;
      var dayNum  = cellIdx - startOffset + 1;
      if (cellIdx < startOffset || dayNum > daysInMonth) {
        h += '<div class="hm-cell hm-cell-empty"></div>';
      } else {
        var k = year + '-' + String(month+1).padStart(2,'0') + '-' + String(dayNum).padStart(2,'0');
        var e = entries.find(function(x){ return x.date === k; });
        var val = e ? e.mood_rating : 0;
        var fmt = k.split('-').reverse().slice(0,2).reverse().join(' ');
        var title = e ? 'Mood: ' + val + '/10 — ' + fmt : fmt + ' — no entry';
        h += '<div class="hm-cell" style="background:' + col(val) + '" title="' + title + '"></div>';
      }
    }
    h += '</div>';
  }

  h += '</div><div class="hm-legend"><span class="hm-leg-lbl">Low</span>' +
    [0,2,5,7,9].map(function(v){ return '<div class="hm-leg-cell" style="background:'+col(v)+'"></div>'; }).join('') +
    '<span class="hm-leg-lbl">High</span></div>';
  document.getElementById('heatmap').innerHTML = h;
}


function buildDonut(filtered) {
  // Emotion frequency — more meaningful and data-rich than root cause tags
  const real = filtered.filter(e => !e.quick_checkin);
  const counts = {};
  real.forEach(e => {
    const em = e.dominant_emotion || 'neutral';
    counts[em] = (counts[em] || 0) + 1;
  });

  // Sort by frequency, take top 5
  const sorted = Object.entries(counts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,5);
  const total = sorted.reduce((a,[,v]) => a+v, 0) || 1;

  const PALETTE = {
    anxious:'#E07A5F', overwhelmed:'#C48B7A', lonely:'#7BA7BC',
    burnt_out:'#C48B7A', motivated:'#81B29A', neutral:'#A8AAC0',
    sad:'#7BA7BC', frustrated:'#E07A5F', hopeful:'#81B29A', calm:'#A8C5B5',
  };

  const data = sorted.map(([key, count]) => ({
    key, count,
    label: (EMOTIONS[key] || {label: key}).label,
    emoji: (EMOTIONS[key] || {emoji: '😐'}).emoji,
    color: PALETTE[key] || '#A8AAC0',
    pct: Math.round(count/total*100),
  }));

  // Donut SVG
  const CIRC = 2*Math.PI*60; let offset = 0;
  let segs = '<circle cx="80" cy="80" r="60" fill="none" stroke="var(--muted)" stroke-width="20"/>';
  data.forEach((d,i) => {
    const len = (d.pct/100)*CIRC;
    segs += `<circle cx="80" cy="80" r="60" fill="none" stroke="${d.color}" stroke-width="20"
      stroke-linecap="round"
      stroke-dasharray="${Math.max(0,len-3)} ${CIRC}"
      stroke-dashoffset="${-offset}"
      style="transition:stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1) ${i*0.15}s"/>`;
    offset += len+3;
  });

  // Centre label — most frequent emotion
  // Emoji rendered as HTML overlay — see renderContextualReco

  const svgEl = document.getElementById('donut-svg');
  if (svgEl) svgEl.innerHTML = segs;

  // Update the static emoji placeholder in HTML
  var emojiEl = document.getElementById('donut-center-emoji');
  if (emojiEl && data.length > 0) {
    emojiEl.textContent = data[0].emoji;
  }

  const legEl = document.getElementById('donut-legend');
  if (legEl) legEl.innerHTML = data.length === 0
    ? '<p style="font-size:.78rem;color:var(--text-l);padding:8px 0">No entries yet in this period.</p>'
    : data.map(d =>
        `<div class="donut-legend">
          <div class="dln-row">
            <span class="dln-name">
              <span class="dln-dot" style="background:${d.color}"></span>
              ${d.emoji} ${d.label}
            </span>
            <span class="dln-pct" style="color:${d.color}">${d.count}x · ${d.pct}%</span>
          </div>
          <div class="dln-bar">
            <div class="dln-fill" style="width:${d.pct}%;background:${d.color}"></div>
          </div>
        </div>`
      ).join('');
}

function buildTrackerInsight(filtered) {
  const el = document.getElementById('tracker-insight');
  if (!el) return;
  const real = filtered.filter(e => !e.quick_checkin);
  if (!real.length) {
    el.textContent = 'Keep journaling to unlock personalised insights — even 3 entries reveal meaningful patterns. 🌱';
    return;
  }
  const avgMood  = (real.reduce((a,e) => a + (e.mood_rating||5), 0) / real.length).toFixed(1);
  const avgStress= (real.reduce((a,e) => a + (e.stress_level||5), 0) / real.length).toFixed(1);
  const period   = trackerTab === 'weekly' ? 'week' : trackerTab === 'monthly' ? 'month' : 'year';

  // Top emotion
  const emCounts = {};
  real.forEach(e => { const em = e.dominant_emotion||'neutral'; emCounts[em]=(emCounts[em]||0)+1; });
  const topEm = Object.entries(emCounts).sort((a,b)=>b[1]-a[1])[0];
  const topEmLabel = topEm ? ((EMOTIONS[topEm[0]]||{label:topEm[0]}).label + ' (' + topEm[1] + 'x)') : 'mixed';

  // Mood trend
  const sorted = [...real].sort((a,b) => new Date(a.date)-new Date(b.date));
  const firstHalf = sorted.slice(0, Math.ceil(sorted.length/2));
  const secondHalf= sorted.slice(Math.ceil(sorted.length/2));
  const avg1 = firstHalf.reduce((a,e)=>a+(e.mood_rating||5),0)/firstHalf.length;
  const avg2 = secondHalf.length ? secondHalf.reduce((a,e)=>a+(e.mood_rating||5),0)/secondHalf.length : avg1;
  const trend = avg2 > avg1 + 0.5 ? 'improving' : avg2 < avg1 - 0.5 ? 'declining' : 'stable';

  el.textContent = `This ${period}: avg mood ${avgMood}/10, avg stress ${avgStress}/10. `
    + `Your most frequent feeling was ${topEmLabel}. `
    + `Your mood has been ${trend} over the ${period}. `
    + (parseFloat(avgStress) >= 7 ? 'High stress detected — consider reaching out for support.' : 'Keep reflecting daily to build deeper awareness.');
}

// ── Streak History ────────────────────────────────────────────────
function buildStreakHistory(entries) {
  var el = document.getElementById('streak-history');
  if (!el) return;
  // Last 30 days — one bar per day
  var today = new Date();
  var days = [];
  for (var i = 29; i >= 0; i--) {
    var d = new Date(today);
    d.setDate(today.getDate() - i);
    var k = d.toISOString().split('T')[0];
    var e = entries.find(function(x){ return x.date === k; });
    var dayLabel = (i % 7 === 0 || i === 29)
      ? d.toLocaleDateString('en-IN',{month:'short',day:'numeric'})
      : '';
    days.push({ k: k, has: !!e, mood: e ? e.mood_rating : 0, label: dayLabel });
  }

  var col = function(mood) {
    if (!mood) return 'var(--muted)';
    if (mood >= 7) return 'var(--accent)';
    if (mood >= 5) return 'var(--warn)';
    return 'var(--primary)';
  };

  // Dots row — flat, no labels inside
  var dotsRow = '<div class="streak-dots-row">'
    + days.map(function(day) {
        return '<div class="streak-day-dot" style="background:' + col(day.mood) + ';opacity:' + (day.has ? 1 : 0.25) + '"'
          + ' title="' + day.k + (day.has ? ': mood ' + day.mood + '/10' : ': no entry') + '"></div>';
      }).join('')
    + '</div>';

  // Labels row — only where label exists, positioned to match
  var labelsRow = '<div class="streak-labels-row">'
    + days.map(function(day) {
        return '<div class="streak-day-lbl-cell">'
          + (day.label ? '<span class="streak-day-lbl">' + day.label + '</span>' : '')
          + '</div>';
      }).join('')
    + '</div>';

  el.innerHTML = dotsRow + labelsRow
    + '<div class="streak-day-legend">'
    + '<span class="streak-leg-dot" style="background:var(--primary)"></span><span>Low</span>'
    + '<span class="streak-leg-dot" style="background:var(--warn);margin-left:8px"></span><span>Mid</span>'
    + '<span class="streak-leg-dot" style="background:var(--accent);margin-left:8px"></span><span>High</span>'
    + '<span style="margin-left:8px;opacity:.5">○ No entry</span>'
    + '</div>';
}

// ── Emotion Breakdown (sidebar version) ──────────────────────────
function buildEmotionBreakdown(filtered) {
  const el = document.getElementById('emotion-breakdown');
  if (!el) return;
  const real = filtered.filter(e => !e.quick_checkin);
  if (!real.length) { el.innerHTML = '<p style="font-size:.75rem;color:var(--text-l)">No entries yet.</p>'; return; }

  const counts = {};
  real.forEach(e => { const em = e.dominant_emotion||'neutral'; counts[em]=(counts[em]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const max = sorted[0][1];

  el.innerHTML = sorted.map(([key, count]) => {
    const em    = EMOTIONS[key] || { emoji:'😐', label: key };
    const PALETTE = { anxious:'#E07A5F', overwhelmed:'#C48B7A', lonely:'#7BA7BC', burnt_out:'#C48B7A', motivated:'#81B29A', neutral:'#A8AAC0', sad:'#7BA7BC', frustrated:'#E07A5F', hopeful:'#81B29A', calm:'#A8C5B5' };
    const col   = PALETTE[key] || '#A8AAC0';
    const pct   = Math.round(count/max*100);
    return `<div class="em-bdown-row">
      <span class="em-bdown-emoji">${em.emoji}</span>
      <div class="em-bdown-right">
        <div class="em-bdown-top">
          <span class="em-bdown-label">${em.label}</span>
          <span class="em-bdown-count" style="color:${col}">${count}x</span>
        </div>
        <div class="em-bdown-bar"><div style="width:${pct}%;height:100%;background:${col};border-radius:99px;transition:width 1s ease"></div></div>
      </div>
    </div>`;
  }).join('');
}
