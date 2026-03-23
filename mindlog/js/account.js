// MindLog — Account & Settings
'use strict';

function renderAccount() {
  const u = getUser(); if (!u) return;
  const ne = document.getElementById('acct-name');    if (ne) ne.textContent = u.name;
  const de = document.getElementById('acct-detail');
  if (de) de.textContent = u.year + ' · ' + u.branch + ' · ' +
    (u.living === 'hostel' ? 'Hostel' : u.living === 'day' ? 'Day Scholar' : 'PG/Rented') +
    ' · ' + u.city;
  const flds = [
    ['acct-f-name',   u.name],
    ['acct-f-year',   u.year],
    ['acct-f-branch', u.branch],
    ['acct-f-living', u.living],
    ['acct-f-city',   u.city],
  ];
  flds.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val || ''; });

  // Show interests and stressors as read-only chips
  renderProfileChips('acct-interests', u.interests || [], '🎵 Music,🎮 Gaming,🎨 Art & Drawing,🏃 Fitness,📚 Reading,💻 Coding,🍳 Cooking,✈️ Travel'.split(','));
  renderProfileChips('acct-stressors', u.stressors || [], '📝 Exams,💼 Placements,📋 Assignments,🏠 Family,👥 Social,💸 Financial'.split(','));
  updateApiMasked();
  renderBackupStatus();
  renderThemePicker();
}

// ── Theme Picker ──────────────────────────────
function renderThemePicker() {
  const el = document.getElementById('theme-picker-container');
  if (!el) return;
  const current = getCurrentTheme();
  const themes = [
    { id:'warm', name:'Warm Blossom', tag:'Rose · Cream', cls:'ts-warm' },
    { id:'cool', name:'Cool Periwinkle', tag:'Indigo · Blue', cls:'ts-cool' },
    { id:'dark', name:'Dark Forest', tag:'Green · Deep', cls:'ts-dark' },
  ];
  el.innerHTML = '<div class="theme-picker-row">' +
    themes.map(t =>
      '<button class="theme-swatch ' + t.cls + (current === t.id ? ' active' : '') + '" ' +
        'data-theme="' + t.id + '" onclick="applyTheme(this.dataset.theme)">' +
        '<div class="theme-swatch-dot"></div>' +
        '<div class="theme-swatch-name">' + t.name + '</div>' +
        '<div class="theme-swatch-tag">' + t.tag + '</div>' +
        '<span class="theme-swatch-check">✓</span>' +
      '</button>'
    ).join('') +
  '</div>';
}

// ── Backup status in account page ────────────────────────
function renderBackupStatus() {
  const el = document.getElementById('acct-backup-status');
  if (!el) return;
  const lastBackup  = localStorage.getItem(SK_BACKUP);
  const entries     = getEntries();
  const backupCount = parseInt(localStorage.getItem(SK_BCOUNT) || '0');
  const newSince    = entries.length - backupCount;

  if (!lastBackup) {
    el.innerHTML = `<span style="color:var(--primary);font-weight:700">⚠ Never backed up</span> — ${entries.length} entries at risk`;
  } else {
    const days = Math.floor((Date.now() - parseInt(lastBackup)) / 86400000);
    const daysLabel = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
    const newLabel  = newSince > 0 ? ` · <strong>${newSince} new entries</strong> since last export` : ' · Up to date ✓';
    el.innerHTML = `Last exported <strong>${daysLabel}</strong>${newLabel}`;
  }
}

// ── Profile ───────────────────────────────────────────────
function saveProfile() {
  const u = getUser() || {};
  const n = document.getElementById('acct-f-name')?.value.trim();
  if (!n) { showToast('Name cannot be empty.'); return; }
  u.name   = n;
  u.year   = document.getElementById('acct-f-year')?.value;
  u.branch = document.getElementById('acct-f-branch')?.value.trim();
  u.living = document.getElementById('acct-f-living')?.value;
  u.city   = document.getElementById('acct-f-city')?.value.trim();
  localStorage.setItem(SK_USER, JSON.stringify(u));
  renderAccount();
  showToast('Profile updated ✓');
}

// ── Export ────────────────────────────────────────────────
function exportData() {
  const entries  = getEntries();
  const user     = getUser() || {};
  const upcoming = getUpcoming();
  const payload  = {
    exported_at: new Date().toISOString(),
    entry_count: entries.length,
    user,
    entries,
    upcoming,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `mindlog_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  // Record backup
  localStorage.setItem(SK_BACKUP, Date.now().toString());
  localStorage.setItem(SK_BCOUNT, entries.length.toString());

  showToast(`✓ ${entries.length} entries exported successfully.`);
  renderBackupStatus();
}

// ── Delete all data ────────────────────────────────────────
function clearAllData() {
  const entries = getEntries();
  if (entries.length > 0) {
    const confirmed = confirm(
      `You are about to permanently delete ${entries.length} journal entries and all your data.\n\n` +
      `This cannot be undone.\n\n` +
      `Have you exported your data first?\n\nClick OK only if you are absolutely sure.`
    );
    if (!confirmed) return;
  }

  ['mindlog_entries', 'mindlog_v2_entries', SK_USER, SK_UP, SK_BACKUP, SK_BCOUNT]
    .forEach(k => localStorage.removeItem(k));
  [ML_KEY, 'ml_draft', 'ml_mood'].forEach(k => sessionStorage.removeItem(k));

  showToast('All data cleared.');
  setTimeout(() => {
    showAppNav(false);
    allOff();
    const l = document.getElementById('screen-landing');
    if (l) l.classList.add('active');
    window.scrollTo(0, 0);
  }, 700);
}

// ── Profile chip display ──────────────────────
function renderProfileChips(containerId, selected) { // Removed allLabels
  const el = document.getElementById(containerId);
  if (!el) return;
  // Map label display to values
  const labelMap = {
    'music':'🎵 Music','gaming':'🎮 Gaming','art':'🎨 Art & Drawing',
    'fitness':'🏃 Fitness','reading':'📚 Reading','coding':'💻 Coding',
    'cooking':'🍳 Cooking','travel':'✈️ Travel',
    'exams':'📝 Exams','placements':'💼 Placements','assignments':'📋 Assignments',
    'family':'🏠 Family','social':'👥 Social','finance':'💸 Financial',
  };
  if (!selected.length) {
    el.innerHTML = '<span style="font-size:.78rem;color:var(--text-l)">None selected</span>';
    return;
  }
  el.innerHTML = selected.map(v =>
    '<span style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:99px;' +
    'background:var(--primary-l);color:var(--primary);font-size:.78rem;font-weight:600;' +
    'border:1px solid var(--primary);margin:3px 3px 3px 0">' +
    (labelMap[v] || v) + '</span>'
  ).join('');
}
