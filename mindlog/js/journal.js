// MindLog — Journal Canvas (Full Rebuild)
'use strict';

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════
const DAILY_PROMPTS_J = [
  'What has been the heaviest thing on your mind today?',
  'Describe one moment today that made you feel something — anything.',
  'What are you carrying right now that you haven\'t told anyone?',
  'If your day were a weather report, what would it say?',
  'What challenged you today, and how did you show up for it?',
  'Who or what gave you energy today — and what drained it?',
  'What do you wish had gone differently today?',
];

const GUIDED_SECTIONS = [
  { emoji: '🌅', label: 'How was your day overall?',       placeholder: 'Give your day a quick summary — high points, low points, how it felt...' },
  { emoji: '😓', label: 'What stressed or challenged you?', placeholder: 'Exams, deadlines, a conversation, a feeling — anything that weighed on you...' },
  { emoji: '🌱', label: 'What went well or felt good?',    placeholder: 'Even something small counts — a message from home, finishing a task, a good meal...' },
  { emoji: '💭', label: 'Anything else on your mind?',     placeholder: 'Thoughts, worries, questions, or things you\'re looking forward to...' },
];

const SK_JMODE = 'mindlog_jmode';  // 'free' or 'guided'
const SK_JGOAL = 'mindlog_jgoal';  // word count goal (number)

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
let jMode         = 'free';
let jGoal         = 0;        // 0 = no goal
let jStartTime    = null;     // when user started typing
let jDraftTimer   = null;
let voiceRecog    = null;
let voiceActive   = false;

// ═══════════════════════════════════════════════
// INIT JOURNAL PAGE
// ═══════════════════════════════════════════════
function initJournal() {
  // Load preferences
  jMode = localStorage.getItem(SK_JMODE) || 'free';
  jGoal = parseInt(localStorage.getItem(SK_JGOAL) || '0');

  // Set daily prompt
  const prompt = DAILY_PROMPTS_J[new Date().getDay() % DAILY_PROMPTS_J.length];
  const el = document.getElementById('j-prompt-text');
  if (el) el.textContent = '"' + prompt + '"';

  // Update goal display
  updateGoalDisplay();

  // Set mode
  setJournalMode(jMode, true);

  // Show returning user context bar
  showContextBar();

  // Check API key notice
  checkApiNoticeJ();

  // Restore draft
  restoreDraft();

  // jStartTime set on first keystroke — not on page load

  // Set correct goal button as selected
  highlightGoalBtn(jGoal);
}

// ═══════════════════════════════════════════════
// CONTEXT BAR (returning users)
// ═══════════════════════════════════════════════
function showContextBar() {
  const entries = getEntries();
  if (!entries.length) return;

  const bar = document.getElementById('j-context-bar');
  if (!bar) return;
  bar.style.display = 'block';

  // Streak
  const streak = calcStreak(entries);
  const streakWrap = document.getElementById('j-ctx-streak-wrap');
  if (streak > 0 && streakWrap) {
    streakWrap.style.display = 'flex';
    const sv = document.getElementById('j-ctx-streak');
    if (sv) sv.textContent = streak;
  }

  // Last emotion
  const last = entries[0];
  const lastWrap = document.getElementById('j-ctx-last-wrap');
  if (last && last.dominant_emotion && lastWrap) {
    lastWrap.style.display = 'flex';
    const em = EMOTIONS[last.dominant_emotion] || EMOTIONS.neutral;
    const eel = document.getElementById('j-ctx-emotion');
    if (eel) eel.textContent = em.emoji + ' ' + em.label;
  }
}

// ═══════════════════════════════════════════════
// MODE TOGGLE
// ═══════════════════════════════════════════════
function setJournalMode(mode, silent) {
  jMode = mode;
  if (!silent) localStorage.setItem(SK_JMODE, mode);

  const freeBtn    = document.getElementById('mode-free');
  const guidedBtn  = document.getElementById('mode-guided');
  const freeMode   = document.getElementById('j-free-mode');
  const guidedMode = document.getElementById('j-guided-mode');

  if (!freeBtn || !guidedBtn) return;

  if (mode === 'free') {
    freeBtn.classList.add('active');
    guidedBtn.classList.remove('active');
    if (guidedMode) { guidedMode.style.opacity = '0'; setTimeout(function(){ guidedMode.style.display = 'none'; }, 180); }
    if (freeMode)   { freeMode.style.display = 'block'; setTimeout(function(){ freeMode.style.opacity = '1'; }, 10); }
  } else {
    guidedBtn.classList.add('active');
    freeBtn.classList.remove('active');
    if (freeMode)   { freeMode.style.opacity = '0'; setTimeout(function(){ freeMode.style.display = 'none'; }, 180); }
    if (guidedMode) {
      buildGuidedSections();
      guidedMode.style.display = 'block';
      setTimeout(function(){ guidedMode.style.opacity = '1'; }, 10);
    }
  }

  updateAnalyseBtn();
  updatePreAnalyse();
}

// ═══════════════════════════════════════════════
// GUIDED MODE — build sections
// ═══════════════════════════════════════════════
function buildGuidedSections() {
  const container = document.getElementById('j-guided-sections');
  if (!container) return;

  // Only build once
  if (container.children.length > 0) return;

  container.innerHTML = GUIDED_SECTIONS.map(function(s, i) {
    var wordCountId = 'j-g-wc-' + i;
    return '<div class="j-guided-section" id="j-gs-' + i + '">' +
      '<div class="j-guided-label">' +
        '<span class="j-guided-emoji">' + s.emoji + '</span>' +
        '<span>' + s.label + '</span>' +
        '<span class="j-g-wc" id="' + wordCountId + '"></span>' +
      '</div>' +
      '<textarea class="j-guided-ta" id="j-guided-' + i + '" ' +
        'placeholder="' + s.placeholder.replace(/"/g, '&quot;') + '" ' +
        'oninput="onGuidedInput(this)" rows="2"></textarea>' +
    '</div>';
  }).join('');
}

function getGuidedText() {
  return GUIDED_SECTIONS.map(function(s, i) {
    var ta = document.getElementById('j-guided-' + i);
    if (!ta || !ta.value.trim()) return '';
    return s.label + '\n' + ta.value.trim();
  }).filter(Boolean).join('\n\n');
}

function onGuidedInput(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px'; // uncapped — let it grow
  // Per-section word count
  var idNum = el.id.replace('j-guided-', '');
  var wcEl = document.getElementById('j-g-wc-' + idNum);
  if (wcEl) {
    var w = countWords(el.value);
    wcEl.textContent = w > 0 ? w + 'w' : '';
  }
  saveDraft();
  updateAnalyseBtn();
  updatePreAnalyse();
  updateGuidedWordCount();
  if (!jStartTime && !_jRestoring) jStartTime = Date.now();
}

function updateGuidedWordCount() {
  const text = getGuidedText();
  const words = countWords(text);
  const el = document.getElementById('j-guided-wc');
  if (el) el.textContent = words + (words === 1 ? ' word' : ' words') + ' total';
  const dok = document.getElementById('j-guided-draft-ok');
  if (dok) { dok.classList.add('show'); clearTimeout(jDraftTimer); jDraftTimer = setTimeout(function() { dok.classList.remove('show'); }, 1800); }
}

// ═══════════════════════════════════════════════
// FREE WRITE — input handler
// ═══════════════════════════════════════════════
function onJInput(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 400) + 'px';
  if (!jStartTime && !_jRestoring) jStartTime = Date.now();
  const words = countWords(el.value);
  updateWordCount(words);
  updateGoalProgress(words);
  saveDraft();
  updateAnalyseBtn();
  updatePreAnalyse();
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
}

function updateWordCount(words) {
  var el = document.getElementById('j-wc');
  if (el) el.textContent = words + (words === 1 ? ' word' : ' words');
}

function updateGoalProgress(words) {
  var el = document.getElementById('j-goal-progress');
  if (!el) return;
  if (jGoal === 0) { el.style.display = 'none'; return; }
  el.style.display = 'inline-block';
  var pct = Math.min(100, Math.round(words / jGoal * 100));
  if (words >= jGoal) {
    el.textContent = '🎯 Goal reached!';
    el.className = 'j-goal-progress reached';
  } else {
    el.textContent = pct + '% of ' + jGoal + ' word goal';
    el.className = 'j-goal-progress ' + (pct >= 60 ? 'on-track' : 'below');
  }
}

// ═══════════════════════════════════════════════
// GOAL PICKER
// ═══════════════════════════════════════════════
function openGoalPicker() {
  var picker = document.getElementById('j-goal-picker');
  if (!picker) return;
  picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
  highlightGoalBtn(jGoal);
}

function setGoal(n) {
  jGoal = n;
  localStorage.setItem(SK_JGOAL, n.toString());
  updateGoalDisplay();
  highlightGoalBtn(n);
  // Re-trigger progress update
  var ta = document.getElementById('j-text');
  if (ta) updateGoalProgress(countWords(ta.value));
  // Hide picker after 400ms
  setTimeout(function() {
    var picker = document.getElementById('j-goal-picker');
    if (picker) picker.style.display = 'none';
  }, 400);
}

function updateGoalDisplay() {
  // Sidebar goal buttons — highlight the active one
  highlightGoalBtn(jGoal);
}

function highlightGoalBtn(val) {
  document.querySelectorAll('.j-goal-opt').forEach(function(btn) {
    btn.classList.remove('selected');
  });
  var target = val === 50 ? 0 : val === 100 ? 1 : val === 200 ? 2 : 3;
  var opts = document.querySelectorAll('.j-goal-opt');
  if (opts[target]) opts[target].classList.add('selected');
}

// ═══════════════════════════════════════════════
// DRAFT SAVE / RESTORE
// ═══════════════════════════════════════════════
function saveDraft() {
  var freeText = '';
  var ta = document.getElementById('j-text');
  if (ta) freeText = ta.value;

  var guidedTexts = GUIDED_SECTIONS.map(function(_, i) {
    var g = document.getElementById('j-guided-' + i);
    return g ? g.value : '';
  });

  sessionStorage.setItem('ml_draft_free',   freeText);
  sessionStorage.setItem('ml_draft_guided', JSON.stringify(guidedTexts));
  sessionStorage.setItem('ml_draft_mode',   jMode);

  var ok = document.getElementById(jMode === 'free' ? 'j-draft-ok' : 'j-guided-draft-ok');
  if (ok) { ok.classList.add('show'); clearTimeout(jDraftTimer); jDraftTimer = setTimeout(function() { ok.classList.remove('show'); }, 1800); }
}

var _jRestoring = false;

function restoreDraft() {
  _jRestoring = true;
  var savedMode = sessionStorage.getItem('ml_draft_mode');
  if (savedMode && savedMode !== jMode) {
    setJournalMode(savedMode, true);
  }

  var freeText = sessionStorage.getItem('ml_draft_free');
  if (freeText) {
    var ta = document.getElementById('j-text');
    if (ta) { ta.value = freeText; onJInput(ta); }
  }

  var guidedRaw = sessionStorage.getItem('ml_draft_guided');
  if (guidedRaw) {
    try {
      var guidedTexts = JSON.parse(guidedRaw);
      buildGuidedSections();
      guidedTexts.forEach(function(text, i) {
        var g = document.getElementById('j-guided-' + i);
        if (g && text) { g.value = text; onGuidedInput(g); }
      });
    } catch(e) {}
  }
  _jRestoring = false;
  jStartTime = null; // reset — user hasn't typed yet
}

// ═══════════════════════════════════════════════
// PROMPT CHIPS (free mode)
// ═══════════════════════════════════════════════
function addChip(text) {
  var ta = document.getElementById('j-text');
  if (!ta) return;
  ta.value += (ta.value ? '\n\n' : '') + text + '\n';
  onJInput(ta);
  ta.focus();
}

// ═══════════════════════════════════════════════
// PRE-ANALYSE STATS
// ═══════════════════════════════════════════════
function updatePreAnalyse() {
  var text  = getCurrentText();
  var words = countWords(text);
  var panel = document.getElementById('j-pre-analyse');
  if (!panel) return;

  // Show stats sidebar from first word
  if (words < 1) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  // Words
  var wEl = document.getElementById('j-stat-words');
  if (wEl) wEl.textContent = words;

  // Time
  var mins = jStartTime ? Math.max(1, Math.round((Date.now() - jStartTime) / 60000)) : 1;
  var tEl = document.getElementById('j-stat-time');
  if (tEl) tEl.textContent = mins + (mins === 1 ? ' min' : ' mins');

  // Entry number today
  var todayKey = new Date().toISOString().split('T')[0];
  var todayCount = getEntries().filter(function(e) { return e.date === todayKey; }).length + 1;
  var eEl = document.getElementById('j-stat-entry-num');
  if (eEl) eEl.textContent = todayCount;

  // Preview — first 120 chars
  var pvEl = document.getElementById('j-preview-text');
  if (pvEl) {
    var preview = text.trim().slice(0, 130);
    pvEl.textContent = preview + (text.length > 130 ? '...' : '');
  }
}

// ═══════════════════════════════════════════════
// ANALYSE BUTTON STATE
// ═══════════════════════════════════════════════
function updateAnalyseBtn() {
  var btn = document.getElementById('analyse-btn');
  if (!btn) return;
  var text  = getCurrentText();
  var words = countWords(text);
  // Soft minimum: 10 words
  btn.disabled = words < 10;
}

// ═══════════════════════════════════════════════
// GET CURRENT TEXT (mode-aware)
// ═══════════════════════════════════════════════
function getCurrentText() {
  if (jMode === 'guided') return getGuidedText();
  var ta = document.getElementById('j-text');
  return ta ? ta.value : '';
}

// ═══════════════════════════════════════════════
// RESET JOURNAL
// ═══════════════════════════════════════════════
function resetJournal() {
  var ta = document.getElementById('j-text');
  if (ta) { ta.value = ''; ta.style.height = 'auto'; }

  // Clear guided sections
  GUIDED_SECTIONS.forEach(function(_, i) {
    var g = document.getElementById('j-guided-' + i);
    if (g) { g.value = ''; g.style.height = 'auto'; }
  });

  updateWordCount(0);
  updateGoalProgress(0);
  var panel = document.getElementById('j-pre-analyse');
  if (panel) panel.style.display = 'none';
  var errEl = document.getElementById('err-notice');
  if (errEl) errEl.style.display = 'none';
  var btn = document.getElementById('analyse-btn');
  if (btn) btn.disabled = true;

  sessionStorage.removeItem('ml_draft_free');
  sessionStorage.removeItem('ml_draft_guided');
  sessionStorage.removeItem('ml_draft_mode');
  jStartTime = null;
}

// ═══════════════════════════════════════════════
// VOICE INPUT (Web Speech API)
// ═══════════════════════════════════════════════
function toggleVoice() {
  if (voiceActive) { stopVoice(); return; }
  startVoice();
}

function startVoice() {
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    showToast('Voice input is not supported in this browser. Try Chrome.');
    return;
  }

  voiceRecog = new SpeechRec();
  voiceRecog.continuous    = true;
  voiceRecog.interimResults = true;
  voiceRecog.lang          = 'en-IN'; // English India — handles Hinglish better

  var existingText = '';
  var ta = document.getElementById('j-text');
  if (ta) existingText = ta.value;

  voiceRecog.onresult = function(event) {
    var interim = '';
    var final   = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) final   += event.results[i][0].transcript;
      else                           interim += event.results[i][0].transcript;
    }
    if (ta) {
      ta.value = existingText + (existingText ? ' ' : '') + final + interim;
      if (final) existingText = ta.value.replace(/ $/, '');
      onJInput(ta);
    }
  };

  voiceRecog.onerror = function(e) {
    if (e.error !== 'aborted') showToast('Voice error: ' + e.error);
    stopVoice();
  };

  voiceRecog.onend = function() {
    if (voiceActive) voiceRecog.start(); // auto-restart if still active
  };

  voiceRecog.start();
  voiceActive = true;

  // Switch to free mode for voice
  if (jMode !== 'free') setJournalMode('free');

  var vBtn = document.getElementById('j-voice-btn');
  if (vBtn) vBtn.classList.add('listening');
  var vStatus = document.getElementById('j-voice-status');
  if (vStatus) vStatus.style.display = 'flex';
  var vLabel = document.getElementById('j-voice-label');
  if (vLabel) vLabel.textContent = 'Listening — speak freely...';
}

function stopVoice() {
  voiceActive = false;
  if (voiceRecog) { voiceRecog.stop(); voiceRecog = null; }
  var vBtn = document.getElementById('j-voice-btn');
  if (vBtn) vBtn.classList.remove('listening');
  var vStatus = document.getElementById('j-voice-status');
  if (vStatus) vStatus.style.display = 'none';
  showToast('Voice input stopped ✓');
}

// ═══════════════════════════════════════════════
// API KEY NOTICE
// ═══════════════════════════════════════════════
function checkApiNoticeJ() {
  var el = document.getElementById('api-notice');
  if (el) el.style.display = getApiKey() ? 'none' : 'flex';
}

// ═══════════════════════════════════════════════
// LEGACY STUBS (called by router/init)
// ═══════════════════════════════════════════════
function onTextInput(el) { if (el && el.id === 'j-text') onJInput(el); }
function onMoodChange(el) { /* mood removed — AI detects from text */ }
function updateMoodSlider(el) { /* mood removed */ }
