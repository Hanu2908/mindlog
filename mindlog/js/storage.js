// MindLog — Storage, Data Safety & Toast
"use strict";

// ═══════════════════════════════════════
// KEYS — SK_USER, SK_UP, ML_KEY, GMODEL, GBASE defined in data.js
// ═══════════════════════════════════════
const SK = "mindlog_v2_entries";
const SK_BACKUP = "mindlog_last_backup";
const SK_BCOUNT = "mindlog_backup_count";

// App state
let currentResult = null;
let lastCall = 0;
let loadInterval = null;
let typingTimer = null;
let activeTab = "weekly";

// ═══════════════════════════════════════════
// CORE GETTERS
// ═══════════════════════════════════════════
const getEntries = () => {
  try {
    return JSON.parse(localStorage.getItem(SK) || "[]");
  } catch {
    return [];
  }
};

// ═══════════════════════════════════════════
// SAVE ENTRY
// ═══════════════════════════════════════════
function saveEntry(entry) {
  persistEntry(entry);
}

function persistEntry(entry) {
  const arr = getEntries();
  arr.unshift(entry);
  if (arr.length > 90) arr.splice(90);
  try {
    localStorage.setItem(SK, JSON.stringify(arr));
    setTimeout(checkDataSafety, 500);
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      try {
        localStorage.setItem(SK, JSON.stringify(arr.slice(0, 50)));
        showStorageWarning(
          "Storage almost full — older entries were trimmed. Export your data now.",
        );
      } catch {
        showStorageWarning(
          "Storage is full. Export your data immediately to avoid data loss.",
        );
      }
    }
  }
}

// ═══════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════
let _toastTimer;
function showToast(msg, duration) {
  duration = duration || 2800;
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () {
    t.classList.remove("show");
  }, duration);
}

// ═══════════════════════════════════════════
// DATA SAFETY — backup reminder
// ═══════════════════════════════════════════
function checkDataSafety() {
  const entries = getEntries();
  if (entries.length === 0) return;
  const lastBackup = localStorage.getItem(SK_BACKUP);
  const backupCount = parseInt(localStorage.getItem(SK_BCOUNT) || "0");
  const newSince = entries.length - backupCount;

  if (!lastBackup && entries.length >= 3) {
    showBackupBanner("first");
  } else if (lastBackup) {
    const days = (Date.now() - parseInt(lastBackup)) / 86400000;
    if (days >= 7) showBackupBanner("overdue", Math.floor(days));
    else if (newSince >= 5) showBackupBanner("entries", newSince);
  }
}

function showBackupBanner(reason, count) {
  count = count || 0;
  if (document.getElementById("backup-banner")) return;
  var total = getEntries().length;
  var msgs = {
    first:
      "You have " +
      total +
      " journal entries stored only in this browser. Clearing your cache deletes them permanently.",
    overdue:
      "It has been " +
      count +
      " days since your last export. You have " +
      total +
      " entries at risk.",
    entries:
      count +
      " new entries since your last export. Back up regularly to keep your data safe.",
  };
  var isMobile = window.innerWidth < 768;
  var bottom = isMobile ? "74px" : "20px";
  var banner = document.createElement("div");
  banner.id = "backup-banner";
  banner.innerHTML =
    '<div style="position:fixed;bottom:' +
    bottom +
    ";left:50%;transform:translateX(-50%);z-index:350;" +
    "max-width:520px;width:calc(100% - 32px);background:#3D405B;color:#fff;border-radius:16px;" +
    "padding:14px 18px;box-shadow:0 8px 32px rgba(61,64,91,.28);animation:fadeUp .35s ease;" +
    'display:flex;align-items:flex-start;gap:12px">' +
    '<span style="font-size:1.25rem;flex-shrink:0;margin-top:1px">💾</span>' +
    '<div style="flex:1">' +
    '<p style="font-size:.82rem;font-weight:700;margin-bottom:4px">Backup Reminder</p>' +
    '<p style="font-size:.76rem;opacity:.85;line-height:1.55;margin-bottom:10px">' +
    msgs[reason] +
    "</p>" +
    '<div style="display:flex;gap:8px">' +
    '<button onclick="triggerExport()" style="padding:6px 14px;border-radius:99px;border:none;background:#E07A5F;color:#fff;font-size:.74rem;font-weight:700;cursor:pointer;font-family:inherit">Export Now</button>' +
    '<button onclick="dismissBackupBanner()" style="padding:6px 14px;border-radius:99px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:.74rem;font-weight:600;cursor:pointer;font-family:inherit">Later</button>' +
    "</div>" +
    "</div>" +
    '<button onclick="dismissBackupBanner()" style="background:transparent;border:none;color:rgba(255,255,255,.55);font-size:.95rem;cursor:pointer;padding:0;flex-shrink:0">✕</button>' +
    "</div>";
  document.body.appendChild(banner);
}

function dismissBackupBanner() {
  var el = document.getElementById("backup-banner");
  if (el) el.remove();
}

function triggerExport() {
  exportData();
  dismissBackupBanner();
  localStorage.setItem(SK_BACKUP, Date.now().toString());
  localStorage.setItem(SK_BCOUNT, getEntries().length.toString());
  showToast("Data exported and backup timestamp saved ✓");
}

// ═══════════════════════════════════════════
// STORAGE WARNING (quota)
// ═══════════════════════════════════════════
function showStorageWarning(msg) {
  var el = document.getElementById("storage-warn");
  if (!el) {
    el = document.createElement("div");
    el.id = "storage-warn";
    el.style.cssText =
      "position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:350;" +
      "background:#FDF5F2;border:1px solid #E07A5F;border-radius:12px;padding:12px 18px;" +
      "font-size:.8rem;color:#C9614A;font-weight:600;max-width:420px;width:calc(100%-32px);" +
      "box-shadow:0 4px 16px rgba(224,122,95,.2);text-align:center;display:none;font-family:inherit";
    document.body.appendChild(el);
  }
  el.textContent = "⚠️ " + msg;
  el.style.display = "block";
  setTimeout(function () {
    if (el) el.style.display = "none";
  }, 9000);
}

// ═══════════════════════════════════════════
// STORAGE HEALTH CHECK
// ═══════════════════════════════════════════
function runDataIntegrityCheck() {
  var entries = getEntries();
  if (!entries.length) return;

  // Remove corrupted entries
  var clean = entries.filter(function (e) {
    return e && e.id && e.date && e.mood_rating;
  });
  if (clean.length < entries.length) {
    localStorage.setItem(SK, JSON.stringify(clean));
  }

  // Check storage usage
  try {
    var used = JSON.stringify(localStorage).length;
    var usedKB = Math.round(used / 1024);
    if (usedKB > 4000) {
      showStorageWarning(
        "Storage is " + usedKB + "KB / ~5000KB limit. Export your data soon.",
      );
    }
  } catch (e) {}

  // Backup reminder check — 3 seconds after load
  setTimeout(checkDataSafety, 3000);
}

// ═══════════════════════════════════════════
// STREAK — shared utility
// ═══════════════════════════════════════════
function calcStreak(entries) {
  if (!entries.length) return 0;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var streak = 0;
  for (var i = 0; i < 60; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() - i);
    var k = d.toISOString().split("T")[0];
    if (
      entries.some(function (e) {
        return e.date === k;
      })
    ) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}
