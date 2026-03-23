// MindLog — Onboarding Flow (3 steps)
'use strict';

// ── Radio picker ──────────────────────────────
function pickRadio(hid, val, el) {
  document.querySelectorAll('[onclick*="pickRadio(\'' + hid + '\'"]')
    .forEach(r => r.classList.remove('checked'));
  el.classList.add('checked');
  document.getElementById(hid).value = val;
}

// ── Multi-chip toggle ─────────────────────────
function toggleChip(el) {
  el.classList.toggle('selected');
}

function getSelectedChips(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return [];
  return Array.from(grid.querySelectorAll('.ob-multi-chip.selected'))
    .map(el => el.dataset.val);
}

// ── STEP 1 → STEP 2 ───────────────────────────
function obNext() {
  const name   = document.getElementById('ob-name').value.trim();
  const year   = document.getElementById('ob-year').value;
  const branch = document.getElementById('ob-branch').value.trim();
  const living = document.getElementById('ob-living').value;
  const city   = document.getElementById('ob-city').value.trim();

  if (!name || !year || !branch || !living || !city) {
    showToast('Please fill in all fields.');
    return;
  }

  sessionStorage.setItem('ob_tmp', JSON.stringify({ name, year, branch, living, city }));

  document.getElementById('ob-s1').style.display = 'none';
  document.getElementById('ob-s2').style.display = 'block';
  setTimeout(() => document.getElementById('ob-apikey')?.focus(), 80);
}

// ── STEP 2 back → STEP 1 ─────────────────────
function obBack() {
  document.getElementById('ob-s2').style.display = 'none';
  document.getElementById('ob-s1').style.display = 'block';
}

// ── STEP 2 — Verify API key → STEP 3 ─────────
async function obVerify() {
  const key = document.getElementById('ob-apikey').value.trim();
  const rb  = document.getElementById('ob-result');
  const btn = document.getElementById('ob-verify-btn');

  if (!key) {
    rb.className = 'result-box rbox-err';
    rb.style.display = 'block';
    rb.textContent = 'Please paste your API key.';
    return;
  }

  btn.textContent = 'Verifying...';
  btn.disabled = true;
  rb.className = 'result-box';
  rb.style.cssText = 'background:var(--warn-l);border:1px solid var(--warn);color:#9A7A2E;display:block;margin-top:8px;padding:10px 12px;border-radius:var(--r-sm);font-size:.79rem;';
  rb.textContent = 'Verifying — please wait...';

  try {
    const res = await fetch(GBASE + GMODEL + ':generateContent?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply: OK' }] }],
        generationConfig: { maxOutputTokens: 5 }
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Invalid key');

    // Key works — save it and go to step 3
    sessionStorage.setItem(ML_KEY, key);
    rb.className = 'result-box rbox-ok';
    rb.textContent = '✓ API key verified! One more step...';
    btn.textContent = 'Verified ✓';
    btn.disabled = false;

    setTimeout(() => {
      document.getElementById('ob-s2').style.display = 'none';
      document.getElementById('ob-s3').style.display = 'block';
    }, 800);

  } catch(e) {
    let msg = e.message || 'Error';
    if (msg.includes('API_KEY_INVALID') || msg.includes('not valid'))
      msg = 'Invalid API key — please check at aistudio.google.com.';
    else if (msg.includes('PERMISSION') || msg.includes('403'))
      msg = 'Permission denied — ensure your key has Gemini API access.';
    rb.className = 'result-box rbox-err';
    rb.style.display = 'block';
    rb.textContent = msg;
    btn.textContent = 'Verify & Continue →';
    btn.disabled = false;
  }
}

// ── STEP 3 back → STEP 2 ─────────────────────
function obBackToStep2() {
  document.getElementById('ob-s3').style.display = 'none';
  document.getElementById('ob-s2').style.display = 'block';
}

// ── STEP 3 → FINISH ───────────────────────────
function obFinish() {
  const interests = getSelectedChips('ob-interests-grid');
  const stressors = getSelectedChips('ob-stressors-grid');

  // Merge with step 1 data
  const tmp  = JSON.parse(sessionStorage.getItem('ob_tmp') || '{}');
  const user = {
    ...tmp,
    interests,
    stressors,
    joinedAt: new Date().toISOString(),
  };

  localStorage.setItem(SK_USER, JSON.stringify(user));
  sessionStorage.removeItem('ob_tmp');

  enterApp();
}
