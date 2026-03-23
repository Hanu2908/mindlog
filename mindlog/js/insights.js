// MindLog — Insights Page (Full Rebuild)
'use strict';

// Timer IDs for cancellation on navigation
var _insTimerIds = [];

function _insTimer(ms, fn) {
  var id = setTimeout(fn, ms);
  _insTimerIds.push(id);
  return id;
}

function cancelInsTimers() {
  _insTimerIds.forEach(function(id) { clearTimeout(id); });
  _insTimerIds = [];
}

function renderInsights(r) {
  if (!r) return;
  cancelInsTimers(); // cancel any pending timers from previous render

  const em        = EMOTIONS[r.dominant_emotion] || EMOTIONS.neutral;
  const stressCol = r.stress_level >= 7 ? '#E07A5F' : r.stress_level >= 5 ? '#F2CC8F' : '#81B29A';
  const energyCol = r.energy_pct < 35   ? '#E07A5F' : r.energy_pct < 65  ? '#F2CC8F' : '#81B29A';

  // ── 1. Emotion Hero — uses static scaffold, no innerHTML injection
  const heroEl = document.getElementById('ins-emotion-hero');
  if (heroEl) {
    heroEl.style.display = 'flex';
    const emojiEl  = document.getElementById('ins-hero-emoji');
    const nameEl   = document.getElementById('ins-hero-emotion-name');
    const reasonEl = document.getElementById('ins-hero-reason');
    if (emojiEl)  { emojiEl.textContent  = em.emoji; }
    if (nameEl)   { nameEl.textContent   = em.label; nameEl.style.color = em.color || 'var(--primary)'; }
    if (reasonEl) { reasonEl.textContent = r.emotion_reasoning || ''; }
    // Bounce emoji — element guaranteed to exist
    _insTimer(400, () => {
      if (emojiEl && typeof bounceEmoji === 'function') bounceEmoji(emojiEl);
    });
  }



  // ── 2. AI Summary typewriter ──────────────────
  const summaryEl = document.getElementById('empathy-body');
  if (summaryEl) typeEffect(summaryEl, r.summary || '', 22, () => {
    const pill = document.getElementById('positive-pill');
    if (pill && r.positive_signal) {
      pill.textContent = '✨ ' + r.positive_signal;
      pill.style.display = 'inline-block';
      pill.style.animation = 'fadeUp .4s ease';
    }
  });

  // ── 3. Vitals 2-column ────────────────────────
  // Left: Mood score
  _insTimer(350, () => {
    const moodScore = document.getElementById('ins-mood-score');
    const moodLbl   = document.getElementById('ins-mood-lbl');
    const moodReasn = document.getElementById('ins-mood-reason');

    // Get mood from latest saved entry (just written)
    const entries  = getEntries();
    const latest   = entries[0];
    const mood     = latest ? latest.mood_rating : null;
    const avgMood  = entries.length > 1
      ? (entries.slice(0, 7).reduce((a, e) => a + (e.mood_rating||5), 0) / Math.min(entries.length, 7)).toFixed(1)
      : null;

    if (moodScore && mood !== null) {
      moodScore.textContent = mood;
      moodScore.style.color = mood >= 7 ? 'var(--accent)'
        : mood >= 5 ? 'var(--warn)' : 'var(--primary)';
    }
    if (moodLbl) {
      var dayLabel = !mood ? '—' : mood >= 7 ? 'Good day' : mood >= 5 ? 'Average day' : 'Tough day';
      moodLbl.textContent = dayLabel;
    }
    if (moodReasn) {
      if (avgMood && mood) {
        const diff = (mood - parseFloat(avgMood)).toFixed(1);
        moodReasn.textContent = (diff > 0 ? '+' : '') + diff + ' vs your 7-day avg of ' + avgMood;
      } else {
        moodReasn.textContent = 'Self-rated mood for today';
      }
    }
  });

  // Right top: stress ring
  const CIRC_SM = 2 * Math.PI * 26;
  _insTimer(450, () => {
    const sr = document.getElementById('ins-stress-ring');
    if (sr) sr.setAttribute('stroke-dasharray',
      `${(r.stress_level / 10) * CIRC_SM} ${CIRC_SM}`);
    const snum = document.getElementById('ins-stress-num');
    if (snum) snum.textContent = r.stress_level || '—';
    const slbl = document.getElementById('ins-stress-lbl');
    if (slbl) {
      slbl.textContent = r.stress_level >= 7 ? 'High' : r.stress_level >= 5 ? 'Moderate' : 'Low';
      slbl.style.color = stressCol;
    }
    const ssub = document.getElementById('ins-stress-sub');
    if (ssub) ssub.textContent = r.stress_reasoning || '';
  });

  // Right bottom: energy ring
  _insTimer(550, () => {
    const er2 = document.getElementById('ins-energy-ring');
    if (er2) er2.setAttribute('stroke-dasharray',
      `${(r.energy_pct / 100) * CIRC_SM} ${CIRC_SM}`);
    const enum2 = document.getElementById('ins-energy-num');
    if (enum2) enum2.textContent = (r.energy_pct || 0) + '%';
    const elbl = document.getElementById('ins-energy-lbl');
    if (elbl) {
      elbl.textContent = (r.energy_level || 'medium') + ' energy';
      elbl.style.color = energyCol;
    }
    const esub = document.getElementById('ins-energy-sub');
    if (esub) esub.textContent = 'Source: ' + (r.root_cause_tag || 'unclear');
  });

  // ── 4. Action banner ──────────────────────────
  const atEl = document.getElementById('action-title');
  const abEl = document.getElementById('action-body');
  if (atEl) atEl.textContent = r.action_title || '—';
  if (abEl) abEl.textContent = r.action_desc  || '—';

  // ── 5. Needs stack ────────────────────────────
  buildNeedsStack(sanitiseNeeds(r.needs));

  // ── 6. Personalised insight quote ─────────────
  const insEl = document.getElementById('insight-body');
  if (insEl) insEl.textContent = r.personal_insight || r.weekly_insight || '';

  // ── 7. Share data prep
  window._lastInsightData = r;

  // ── 8. Contextual recommendation (async, non-blocking)
  _insTimer(800, function() {
    if (typeof runContextualRecommendation === 'function') runContextualRecommendation();
  });
}

// ── Needs stack ───────────────────────────────────
function buildNeedsStack(needs) {
  const stack = document.getElementById('needs-stack');
  if (!stack) return;
  stack.innerHTML = needs.map(key => {
    const n = NEEDS_DB[key]; if (!n) return '';
    const actionChipsHTML = n.items.slice(0, 3).map(item =>
      `<span class="need-chip">${item}</span>`
    ).join('');
    const docsHTML = n.doctors.map(id => {
      const d = DOCTORS[id]; if (!d) return '';
      return `<div class="doc-mini" onclick="window.open('${d.url}','_blank')">
        <div class="doc-mini-top">
          <div class="doc-mini-av" style="background:${d.bg}">${d.emoji}</div>
          <div>
            <p class="doc-mini-name">${d.name}</p>
            <p class="doc-mini-cred">${d.cred}</p>
          </div>
        </div>
        <span class="doc-tag" style="background:${d.bg};color:${d.color || d.c || 'var(--primary)'}">${d.tag}</span>
        <p class="doc-mini-spec">${d.specialty || d.spec || ""}</p>
        <p class="doc-mini-subs">📊 ${d.subs} subscribers</p>
        <div class="doc-yt-btn" style="background:${d.bg};color:${d.color || d.c || 'var(--primary)'}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          Watch on YouTube
        </div>
      </div>`;
    }).join('');

    return `<div class="need-item" id="ni-${key}" style="--need-color:${n.color};--need-bg:${n.bg}">
      <div class="need-header" onclick="toggleNeed('${key}')">
        <div class="need-color-strip"></div>
        <div class="need-icon-wrap">
          <div class="need-icon" style="background:${n.bg};font-size:1.3rem">${n.emoji}</div>
        </div>
        <div class="need-info">
          <p class="need-name">${n.label}</p>
          <div class="need-chips-preview">
            ${n.items.slice(0,2).map(i => `<span class="need-chip-preview">${i}</span>`).join('')}
          </div>
        </div>
        <div class="need-meta-right">
          <div class="need-stacked-docs">
            ${n.doctors.slice(0,3).map(id => DOCTORS[id] ? `<span>${DOCTORS[id].emoji}</span>` : '').join('')}
          </div>
          <span class="need-chev" id="nc-${key}">▾</span>
        </div>
      </div>
      <div class="need-body" id="nb-${key}" style="display:none">
        <div class="need-actions">
          <p class="need-actions-label">Recommended Actions</p>
          <div class="need-chips-row">${actionChipsHTML}</div>
        </div>
        <div class="need-experts">
          <p class="need-experts-label">Expert Channels</p>
          <div class="doc-scroll">${docsHTML}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleNeed(key) {
  const body = document.getElementById('nb-' + key);
  const chev = document.getElementById('nc-' + key);
  const item = document.getElementById('ni-' + key);
  if (!body) return;
  const open = body.style.display === 'none';
  body.style.display = open ? 'block' : 'none';
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
  if (item) item.classList.toggle('open', open);
  if (open) body.style.animation = 'fadeUp .25s ease';
}

function toggleDocRow(key) {
  const row = document.getElementById('drow-' + key);
  if (row) row.style.display = row.style.display === 'none' ? 'block' : 'none';
}

// ── Share analysis ─────────────────────────────────
function shareAnalysis() {
  const r = window._lastInsightData;
  if (!r) { showToast('No analysis to share.'); return; }
  const em = EMOTIONS[r.dominant_emotion] || EMOTIONS.neutral;
  const text = em.emoji + ' Today I was feeling ' + em.label + '.\n\n' +
    '\u2728 ' + (r.positive_signal || '') + '\n\n' +
    '\u2014 Reflected with MindLog';
  if (navigator.share) {
    navigator.share({ title: 'My MindLog Analysis', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Analysis copied to clipboard ✓'))
      .catch(() => showToast('Could not copy — try manually'));
  }
}

// ── Typewriter effect ─────────────────────────────
function typeEffect(el, text, speed, cb) {
  let i = 0;
  el.innerHTML = '';
  function step() {
    if (i <= text.length) {
      el.innerHTML = text.slice(0, i) +
        (i < text.length ? '<span class="cursor-blink"></span>' : '');
      i++;
      setTimeout(step, speed);
    } else {
      el.innerHTML = text;
      if (cb) cb();
    }
  }
  step();
}
