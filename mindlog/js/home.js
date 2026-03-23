// MindLog — Home Dashboard
'use strict';

function calcWellbeingScore(entries) {
  // Needs at least 1 real entry
  const real = entries.filter(function(e){ return !e.quick_checkin; });
  if (!real.length) return { score: 0, label: 'No data yet', sub: 'Start journaling to see your score', color: 'var(--text-l)', dash: 0 };

  const last7 = real.slice(0, 7);

  // Component 1: Mood (40pts) — avg mood last 7 entries scaled to 40
  const avgMood = last7.reduce(function(a,e){ return a + (e.mood_rating||5); }, 0) / last7.length;
  const moodScore = Math.round(((avgMood - 1) / 9) * 40);

  // Component 2: Stress (30pts) — inverted (low stress = high score)
  const avgStress = last7.reduce(function(a,e){ return a + (e.stress_level||5); }, 0) / last7.length;
  const stressScore = Math.round(((10 - avgStress) / 9) * 30);

  // Component 3: Consistency (30pts) — streak / 7 days capped at 30
  const streak = calcStreak(entries);
  const consistencyScore = Math.min(30, Math.round((streak / 7) * 30));

  const total = Math.min(100, Math.max(0, moodScore + stressScore + consistencyScore));
  const CIRC = 2 * Math.PI * 22;
  const dash = Math.round((total / 100) * CIRC);

  var label, sub, color;
  if (total >= 75) {
    label = 'Thriving'; sub = "You're in a good place"; color = 'var(--accent)';
  } else if (total >= 55) {
    label = 'Stable'; sub = 'Steady progress'; color = 'var(--warn)';
  } else if (total >= 35) {
    label = 'Struggling'; sub = 'Keep going — it gets better'; color = '#E07A5F';
  } else {
    label = 'Needs care'; sub = 'Reach out for support'; color = 'var(--primary)';
  }

  return { score: total, label: label, sub: sub, color: color, dash: dash };
}

// ── Stressor → writing prompt map ────────────────
const STRESSOR_PROMPTS = {
  exams:       'What exam or test is weighing on you most right now?',
  placements:  'How is the placement season affecting your day-to-day mood?',
  assignments: 'What assignment or deadline is taking up the most mental space?',
  family:      'How have your family expectations been feeling lately?',
  social:      'How are your friendships and social life feeling right now?',
  finance:     'How is financial stress showing up in your daily life?',
};

const INTEREST_ACTIONS = {
  music:   '🎵 Play or listen to music for 15 minutes',
  gaming:  '🎮 Take a short gaming break to reset',
  art:     '🎨 Sketch or doodle freely for 10 minutes',
  fitness: '🏃 Do a quick 7-minute bodyweight workout',
  reading: '📚 Read something you enjoy for 20 minutes',
  coding:  '💻 Work on a small personal project you enjoy',
  cooking: '🍳 Cook or make something you enjoy eating',
  travel:  '✈️ Plan or dream about your next trip',
};

function renderHome() {
  const user    = getUser(); if (!user) return;
  const entries = getEntries();
  const streak  = calcStreak(entries);
  const lastE   = entries[0] || null;
  const wt      = calcWeekTrend(entries);
  const h       = new Date().getHours();
  const tl      = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const gm      = buildGreetMsg(user, lastE);
  const pr      = DAILY_PROMPTS_H[new Date().getDay() % DAILY_PROMPTS_H.length];
  const ek      = lastE ? EXPERT_MAP_H[lastE.dominant_emotion] || 'huberman' : 'huberman';
  const doc     = DOCS_H[ek] || DOCS_H.huberman;
  const upF     = getUpcoming().filter(u => new Date(u.date) >= new Date(new Date().toDateString()));
  const isNew   = entries.length === 0;

  const ti  = wt === 'up' ? '↑' : wt === 'down' ? '↓' : '→';
  const tl2 = wt === 'up' ? 'Improving' : wt === 'down' ? 'Declining' : 'Stable';
  const tc  = wt === 'up' ? 'trend-up' : wt === 'down' ? 'trend-dn' : 'trend-st';

  const getEm = key => (EMOTIONS[key] || { emoji: '😐', label: 'Neutral' });
  const wb = calcWellbeingScore(entries);
  const wbScore = wb.score || '—';
  const wbLabel = wb.label;
  const wbSub   = wb.sub;
  const wbColor = wb.color;
  const wbDash  = wb.dash;

  // ── Left column bottom: new user vs returning ──
  const leftBottom = isNew ? buildNewUserCard(user) : buildRecentCards(entries, getEm);

  // ── Upcoming HTML ──
  const upHtml = upF.length === 0
    ? '<p class="up-empty">No upcoming events. Add exams or deadlines to stay prepared.</p>'
    : upF.slice(0, 4).map(u =>
        `<div class="up-item">
          <span class="up-db">📅 ${u.date}</span>
          <span class="up-lbl">${u.label}</span>
          <span class="up-del" onclick="deleteUpcoming('${u.id}')">✕</span>
        </div>`
      ).join('');

  document.getElementById('home-content').innerHTML = `
  <div class="h-grid">

    <!-- ══ TOP ROW: Greeting + Stats ══ -->
    <div class="h-top-row">

      <!-- Left: Combined Greeting Card -->
      <div class="h-greet-col">
        <div class="greet-card anim-fade-up">

          <p class="greet-time">${tl}</p>
          <h1 class="greet-name">Hello, ${user.name}.</h1>
          <p class="greet-msg">${gm}</p>

          ${lastE && lastE.journal_text && !lastE.quick_checkin ? `
          <div class="greet-yesterday">
            <p class="greet-yesterday-lbl">✦ Yesterday you wrote</p>
            <p class="greet-yesterday-text">"${(lastE.journal_text || '').slice(0, 90)}${lastE.journal_text && lastE.journal_text.length > 90 ? '...' : ''}"</p>
          </div>
          ` : ''}

          <div class="greet-divider"></div>

          <p class="greet-prompt-lbl">✦ Today's Reflection Prompt</p>
          <p class="greet-prompt">${pr}</p>

          <button class="btn-primary h-cta-btn" onclick="navTo('journal')" style="margin-top:20px">
            Begin Today's Entry →
          </button>

        </div>
      </div>

      <!-- Right: Stats + Mood check-in -->
      <div class="h-stats-col">
        <div class="h-stats-card">
          <p class="h-stats-title">Your Pulse</p>
          <div class="h-stat-item">
            <div class="h-stat-icon">🔥</div>
            <div class="h-stat-body">
              <p class="h-stat-val">${streak > 0 ? streak + ' days' : '—'}</p>
              <p class="h-stat-label">Current Streak</p>
              <p class="h-stat-sub">${streak > 0 ? 'Keep it going' : 'Start today'}</p>
            </div>
          </div>
          <div class="h-stat-divider"></div>
          <div class="h-stat-item">
            <div class="h-stat-icon">${lastE ? getEm(lastE.dominant_emotion).emoji : '📓'}</div>
            <div class="h-stat-body">
              <p class="h-stat-val">${lastE ? getEm(lastE.dominant_emotion).label : '—'}</p>
              <p class="h-stat-label">Last Entry</p>
              <p class="h-stat-sub">${lastE ? lastE.date : 'No entries yet'}</p>
            </div>
          </div>
          <div class="h-stat-divider"></div>
          <div class="h-stat-item">
            <div class="h-stat-icon">${wt === 'up' ? '📈' : wt === 'down' ? '📉' : '➡️'}</div>
            <div class="h-stat-body">
              <p class="h-stat-val ${tc}">${ti} ${tl2}</p>
              <p class="h-stat-label">This Week</p>
              <p class="h-stat-sub">vs previous 3 days</p>
            </div>
          </div>
          <div class="h-stat-divider"></div>
          <div class="h-wellbeing">
            <p class="h-wellbeing-lbl">✦ Wellbeing Score</p>
            <div class="h-wellbeing-row">
              <div class="h-wellbeing-ring-wrap">
                <svg width="56" height="56" viewBox="0 0 56 56" style="transform:rotate(-90deg)">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="var(--muted)" stroke-width="5"/>
                  <circle cx="28" cy="28" r="22" fill="none"
                    stroke="${wbColor}"
                    stroke-width="5"
                    stroke-linecap="round"
                    stroke-dasharray="${wbDash} 138"
                    style="transition:stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1) .5s"/>
                </svg>
                <div class="h-wellbeing-num-wrap">
                  <span class="h-wellbeing-num" style="color:${wbColor}">${wbScore}</span>
                </div>
              </div>
              <div class="h-wellbeing-info">
                <p class="h-wellbeing-val" style="color:${wbColor}">${wbLabel}</p>
                <p class="h-wellbeing-sub">${wbSub}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ══ MOOD CHECK-IN — full width ══ -->
    <div class="card h-checkin-full anim-fade-up" style="animation-delay:.12s">
      <p class="checkin-title">How are you feeling right now?</p>
      <div class="checkin-emojis">
        ${[['😊','Good'],['😐','Okay'],['😔','Low'],['😰','Stressed'],['😤','Frustrated']]
          .map(([e,l]) => `
            <button class="ci-btn" onclick="quickCheckin('${e}','${l}',this)">
              <span class="ci-emoji">${e}</span>
              <span class="ci-lbl">${l}</span>
            </button>`
          ).join('')}
      </div>
    </div>

    <!-- ══ BOTTOM ROW: Entries + Expert/Upcoming ══ -->
    <div class="h-bottom-row">

      <!-- Left: New user card OR Recent entries -->
      <div class="h-recent-col">
        ${leftBottom}
      </div>

      <!-- Right: Expert + Upcoming -->
      <div class="h-right-col">
        <div class="sec-head">
          <p class="sec-title">Recommended for You</p>
          <span class="sec-link" onclick="navTo('experts')">See all →</span>
        </div>
        <div class="card ehc" onclick="window.open('${doc.url}','_blank')" style="margin-bottom:14px">
          <div class="ehc-top">
            <div class="ehc-av" style="background:${doc.bg}">${doc.emoji}</div>
            <div>
              <p style="font-family:var(--font-h);font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:3px">${doc.name}</p>
              <p style="font-size:.7rem;font-weight:600;color:${doc.c};margin-bottom:3px">${doc.cred}</p>
              <span style="font-size:.59rem;font-weight:700;padding:2px 7px;border-radius:99px;background:${doc.bg};color:${doc.c}">${doc.tag}</span>
              <span style="font-size:.6rem;color:var(--text-l);font-weight:600;margin-left:4px">· ${doc.subs}</span>
            </div>
          </div>
          <p class="ehc-spec">${doc.spec}</p>
          <div class="ehc-btn" style="background:${doc.bg};color:${doc.c}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="${doc.c}">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
            Watch on YouTube
          </div>
        </div>

        <div class="card upcoming-card">
          <div class="sec-head" style="margin-bottom:0">
            <p class="sec-title">Upcoming</p>
            <span class="sec-link" onclick="openUpcomingModal()">+ Add</span>
          </div>
          <div class="upcoming-list">${upHtml}</div>
        </div>
      </div>

    </div>

  </div>

  <!-- Privacy notice — single instance -->
  <div style="text-align:center;padding:10px 0 22px">
    <p style="font-size:.69rem;color:var(--text-l);display:inline-flex;align-items:center;gap:5px">
      <span>🔒</span> All your data is stored privately on this device — nothing is sent to any server.
    </p>
  </div>
  `;
}

// ── New user — personalised starter card ──────────
function buildNewUserCard(user) {
  const stressors  = user.stressors  || [];
  const interests  = user.interests  || [];

  // Pick up to 3 personalised prompts from stressors
  const prompts = stressors
    .filter(s => STRESSOR_PROMPTS[s])
    .slice(0, 3)
    .map(s => STRESSOR_PROMPTS[s]);

  // Fallback to generic prompts if no stressors
  if (prompts.length < 2) {
    prompts.push('What has been on your mind the most today?');
    prompts.push('How are you really feeling right now?');
  }

  // Pick one interest-based action
  const interestAction = interests.length
    ? INTEREST_ACTIONS[interests[0]]
    : '🌱 Take 5 minutes to write about your day';

  return `
    <div class="sec-head">
      <p class="sec-title">Start Your Journey</p>
    </div>

    <!-- Personalised prompts to start writing -->
    <div class="card h-starter-card">
      <p class="h-starter-label">✦ Write about something real</p>
      <div class="h-starter-prompts">
        ${prompts.map(p => `
          <button class="h-starter-prompt" onclick="loadPromptAndWrite('${p.replace(/'/g, "\\'")}')">
            <span class="h-starter-icon">💬</span>
            <span>${p}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Interest-based action -->
    <div class="card h-action-card" style="margin-top:12px">
      <p class="h-starter-label">✦ Or try this right now</p>
      <div class="h-action-row">
        <div class="h-action-left">
          <p class="h-action-text">${interestAction}</p>
          <p style="font-size:.75rem;color:var(--text-l);margin-top:4px">Then write about how it felt →</p>
        </div>
        <button class="btn-primary h-action-btn" onclick="navTo('journal')">
          Open Journal →
        </button>
      </div>
    </div>
  `;
}

// ── Returning user — recent entries ──────────────
function buildRecentCards(entries, getEm) {
  return `
    <div class="sec-head">
      <p class="sec-title">Recent Reflections</p>
      <span class="sec-link" onclick="navTo('tracker')">View all →</span>
    </div>
    <div class="rc-cards">
      ${entries.slice(0, 3).map(e => {
        const emx  = getEm(e.dominant_emotion);
        const snip = (e.journal_text || '').slice(0, 118);
        return `<div class="rc-card" onclick="replayEntry('${e.id}')">
          <div class="rc-top">
            <span class="rc-em">${emx.emoji}</span>
            <span class="rc-emotion">${emx.label || e.dominant_emotion}</span>
            <span class="rc-date">${e.date}</span>
          </div>
          <div class="rc-badges">
            <span class="rc-badge rc-mb">Mood ${e.mood_rating}/10</span>
            <span class="rc-badge rc-sb">Stress ${e.stress_level || '?'}/10</span>
          </div>
          <p class="rc-snip">${snip}${snip.length === 118 ? '...' : ''}</p>
        </div>`;
      }).join('')}
    </div>
  `;
}

// ── Load prompt into journal and navigate ─────────
function loadPromptAndWrite(prompt) {
  sessionStorage.setItem('ml_draft_free', prompt + '\n');
  sessionStorage.setItem('ml_draft_mode', 'free');
  navTo('journal');
}

// ── Greeting message ─────────────────────────────
function buildGreetMsg(user, lastE) {
  if (!lastE) return `Your wellness journey is a work in progress, ${user.name}. Today is a good day to start.`;
  const msgs = {
    overwhelmed: n => `Yesterday felt heavy. Today is a new page, ${n} — one small step is enough.`,
    anxious:     n => `It's okay to feel uncertain. You showed up yesterday — you're here again today, ${n}.`,
    lonely:      n => `Reaching out — even in writing — takes courage. You did that, ${n}. That matters.`,
    burnt_out:   n => `Rest is productive too, ${n}. You recognised how you felt — that's the first step.`,
    motivated:   n => `You had a strong day yesterday, ${n}. Let's carry that forward.`,
    hopeful:     n => `Yesterday you found something to hold onto, ${n}. Carry that with you today.`,
    calm:        n => `You carried calm energy yesterday, ${n}. Let that set the tone for today.`,
    sad:         n => `It's okay to have hard days, ${n}. You're here — and that is enough.`,
    frustrated:  n => `Frustration signals you care deeply, ${n}. Channel that energy today.`,
    neutral:     n => `A steady day yesterday, ${n}. Today is another opportunity to check in with yourself.`,
  };
  const fn = msgs[lastE.dominant_emotion];
  return fn ? fn(user.name) : `Welcome back, ${user.name}. Ready to reflect on today?`;
}

// ── Week trend ────────────────────────────────────
function calcWeekTrend(entries) {
  const today = new Date();
  const l3 = [], p3 = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const k = d.toISOString().split('T')[0];
    const e = entries.find(x => x.date === k);
    if (e) l3.push(e.mood_rating);
  }
  for (let i = 3; i < 6; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const k = d.toISOString().split('T')[0];
    const e = entries.find(x => x.date === k);
    if (e) p3.push(e.mood_rating);
  }
  if (!l3.length || !p3.length) return 'stable';
  const al = l3.reduce((a, b) => a + b) / l3.length;
  const ap = p3.reduce((a, b) => a + b) / p3.length;
  return al > ap + 0.5 ? 'up' : al < ap - 0.5 ? 'down' : 'stable';
}

// ── Quick check-in ────────────────────────────────
function quickCheckin(emoji, label, btn) {
  document.querySelectorAll('.ci-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  const mMap  = { Good:8, Okay:5, Low:3, Stressed:2, Frustrated:4 };
  const emMap = { Good:'calm', Okay:'neutral', Low:'sad', Stressed:'anxious', Frustrated:'frustrated' };
  const entry = {
    id: Date.now(), timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    journal_text: 'Quick check-in: ' + label,
    mood_rating: mMap[label] || 5,
    stress_level: label === 'Stressed' ? 8 : label === 'Frustrated' ? 7 : 4,
    dominant_emotion: emMap[label] || 'neutral',
    root_cause: 'unclear', energy_level: 'medium', energy_pct: 50,
    summary: 'Quick mood check-in: ' + emoji + ' ' + label + '.',
    quick_checkin: true,
  };
  saveEntry(entry);
  showToast(emoji + ' ' + label + ' — mood logged ✓');
}

// ── Replay past entry insights ────────────────────
function replayEntry(id) {
  const e = getEntries().find(x => String(x.id) === String(id));
  if (!e || !e.ai_result) { showToast('Full analysis not available for this entry.'); return; }
  renderInsights(e.ai_result);
  navTo('insights');
}

// ── Upcoming ──────────────────────────────────────
function openUpcomingModal() {
  const l = document.getElementById('up-label-inp');
  const d = document.getElementById('up-date-inp');
  if (l) l.value = '';
  if (d) d.value = '';
  document.getElementById('modal-upcoming').style.display = 'flex';
  setTimeout(() => l?.focus(), 80);
}
function closeUpcomingModal() { document.getElementById('modal-upcoming').style.display = 'none'; }
function saveUpcoming() {
  const label = document.getElementById('up-label-inp')?.value.trim();
  const date  = document.getElementById('up-date-inp')?.value;
  if (!label || !date) { showToast('Please fill both fields.'); return; }
  const arr = getUpcoming();
  arr.push({ id: Date.now().toString(), label, date });
  arr.sort((a, b) => new Date(a.date) - new Date(b.date));
  localStorage.setItem(SK_UP, JSON.stringify(arr));
  closeUpcomingModal();
  renderHome();
  showToast('Event added ✓');
}
function deleteUpcoming(id) {
  localStorage.setItem(SK_UP, JSON.stringify(getUpcoming().filter(u => u.id !== id)));
  renderHome();
}
