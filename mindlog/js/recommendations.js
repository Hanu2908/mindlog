// MindLog — Contextual Recommendation Engine
'use strict';

const RECO_CACHE_KEY = 'mindlog_reco_cache';

function buildSignals(entries) {
  const last7    = entries.slice(0, 7);
  const today    = entries[0];
  if (!today) return null;
  const moods    = last7.map(e => e.mood_rating || 5);
  const emotions = last7.map(e => e.dominant_emotion || 'neutral');
  const avg7     = (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1);
  const prev3avg = last7.length > 1
    ? (last7.slice(1,4).reduce((a,e)=>a+(e.mood_rating||5),0)/Math.min(last7.length-1,3)).toFixed(1)
    : avg7;
  const moodDrop = parseFloat(prev3avg) - (today.mood_rating||5);
  const negatives = ['anxious','overwhelmed','lonely','burnt_out','sad','frustrated'];
  let streak = 0;
  for (const e of last7) { if (negatives.includes(e.dominant_emotion)) streak++; else break; }
  let pattern = 'stable';
  if      (moodDrop >= 3)   pattern = 'significant drop from recent average';
  else if (moodDrop >= 1.5) pattern = 'gradual decline over recent days';
  else if (streak >= 3)     pattern = streak + ' consecutive days of negative emotion';
  else if ((today.mood_rating||5) >= 7 && parseFloat(avg7) >= 6.5) pattern = 'consistently positive recently';
  return {
    today_mood:    today.mood_rating || 5,
    today_emotion: today.dominant_emotion || 'neutral',
    avg_7d: avg7, prev3_avg: prev3avg,
    mood_drop: parseFloat(moodDrop.toFixed(1)),
    streak, emotions_7d: emotions, pattern,
    entry_count: last7.length,
  };
}

async function fetchGeminiReco(signals, key) {
  var lines = [
    'You are a wellness recommendation engine for an engineering college student.',
    '',
    'Based on their emotional pattern, recommend 1-2 YouTube expert channels that would help them most right now.',
    '',
    'STUDENT DATA:',
    '- Today: mood ' + signals.today_mood + '/10, feeling ' + signals.today_emotion,
    '- 7-day average mood: ' + signals.avg_7d + '/10',
    '- Recent pattern: ' + signals.pattern,
    '- Recent emotions (newest first): ' + signals.emotions_7d.join(', '),
  ];
  if (signals.streak >= 2) lines.push('- Consecutive negative days: ' + signals.streak);
  if (signals.mood_drop >= 2) lines.push('- Mood dropped ' + signals.mood_drop + ' points from recent average');
  lines = lines.concat([
    '',
    'AVAILABLE EXPERTS (return their id):',
    'kati (anxiety/depression therapy), nicole (holistic healing, trauma), huberman (neuroscience, stress/sleep),',
    'emma (CBT tools, anxiety), matthias (burnout, relationships), ali (psychology explained simply),',
    'kirk (deep mental health), psych2go (animated beginner-friendly), adhd (focus, ADHD),',
    'anxiety (panic, stress management), psychhub (professional education), teded (psychology concepts),',
    'healthygamer (psychiatry, gaming mental health, identity), drjulie (journaling, emotional regulation),',
    'braincraft (neuroscience, brain performance), apa (evidence-based research), drramani (narcissism, toxic relationships)',
    '',
    'Return ONLY this JSON, nothing else:',
    '{"experts": ["id1", "id2"], "reason": "<one sentence why these fit this student right now>"}',
  ]);
  var prompt = lines.join('\n');
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=' + key;
  var res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
    }),
  });
  var data = await res.json();
  if (data.error) throw new Error(data.error.message);
  var text = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || '';
  var clean = text.replace(/```json|```/gi, '').trim();
  var start = clean.indexOf('{'), end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in response');
  var parsed = JSON.parse(clean.slice(start, end+1));
  var validIds = Object.keys(DOCTORS);
  parsed.experts = (parsed.experts || []).filter(function(id){ return validIds.includes(id); }).slice(0,2);
  if (parsed.experts.length === 0) throw new Error('No valid expert IDs returned');
  return parsed;
}

function staticFallback(signals) {
  var map = {
    anxious:    { experts: ['kati','emma'],      reason: 'These channels offer practical tools for managing anxiety.' },
    overwhelmed:{ experts: ['emma','huberman'],   reason: 'These focus on reducing overwhelm and restoring calm.' },
    lonely:     { experts: ['matthias','kati'],   reason: 'These address isolation and building emotional connection.' },
    burnt_out:  { experts: ['nicole','matthias'], reason: 'These specialise in recovery from burnout and exhaustion.' },
    sad:        { experts: ['kati','nicole'],     reason: 'These offer compassionate support for difficult emotional periods.' },
    frustrated: { experts: ['ali','emma'],        reason: 'These help reframe frustration and build coping strategies.' },
    motivated:  { experts: ['huberman','teded'],  reason: 'Build on your momentum with science-backed insights.' },
    hopeful:    { experts: ['huberman','teded'],  reason: 'Channel your positive energy with evidence-based growth content.' },
    calm:       { experts: ['teded','psych2go'],  reason: 'Deepen your self-awareness while you are in a good headspace.' },
    neutral:    { experts: ['psych2go','ali'],    reason: 'Explore psychology and build resilience for whatever comes next.' },
  };
  return map[signals.today_emotion] || map.neutral;
}

function renderContextualReco(reco) {
  var container = document.getElementById('contextual-reco-container');
  if (!container || !reco || !reco.experts) return;
  var expertCards = reco.experts.map(function(id) {
    var d = DOCTORS[id]; if (!d) return '';
    return '<div class="ctx-expert-card" onclick="window.open(\'' + d.url + '\',\'_blank\')">' +
      '<div class="ctx-expert-av" style="background:' + d.bg + '">' + d.emoji + '</div>' +
      '<div class="ctx-expert-info">' +
        '<p class="ctx-expert-name">' + d.name + '</p>' +
        '<p class="ctx-expert-cred">' + d.cred + '</p>' +
        '<span class="ctx-expert-tag" style="background:' + d.bg + ';color:' + d.color + '">' + d.tag + '</span>' +
      '</div>' +
      '<div class="ctx-expert-arrow">→</div>' +
    '</div>';
  }).join('');
  container.innerHTML =
    '<div class="ctx-reco-card">' +
      '<div class="ctx-reco-header">' +
        '<span class="ctx-reco-icon">🎯</span>' +
        '<div>' +
          '<p class="ctx-reco-title">Recommended for You Right Now</p>' +
          '<p class="ctx-reco-reason">' + (reco.reason || '') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="ctx-expert-list">' + expertCards + '</div>' +
    '</div>';
  container.style.display = 'block';
}

async function runContextualRecommendation() {
  var entries = getEntries();
  if (entries.length === 0) return;
  var signals = buildSignals(entries);
  if (!signals) return;
  var cacheKey = signals.today_emotion + '_' + signals.today_mood;
  var cached = getCachedReco(cacheKey);
  if (cached) { renderContextualReco(cached); return; }
  var key = getApiKey();
  if (!key) { renderContextualReco(staticFallback(signals)); return; }
  try {
    var reco = await fetchGeminiReco(signals, key);
    if (reco && reco.experts && reco.experts.length > 0) {
      setCachedReco(cacheKey, reco);
      renderContextualReco(reco);
    } else {
      renderContextualReco(staticFallback(signals));
    }
  } catch(e) {
    console.warn('Recommendation engine fallback:', e.message);
    renderContextualReco(staticFallback(signals));
  }
}

function getCachedReco(key) {
  try {
    var raw = sessionStorage.getItem(RECO_CACHE_KEY); if (!raw) return null;
    var cache = JSON.parse(raw);
    if (cache.key !== key) return null;
    if (Date.now() - cache.ts > 86400000) return null;
    return cache.data;
  } catch { return null; }
}

function setCachedReco(key, data) {
  try { sessionStorage.setItem(RECO_CACHE_KEY, JSON.stringify({ key: key, data: data, ts: Date.now() })); } catch {}
}
