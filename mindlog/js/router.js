// MindLog — Screen Router
"use strict";

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function showScreen(id) {
  // For loading screen — show directly without going through navTo
  if (id === "loading") {
    allOff();
    const el = document.getElementById("screen-loading");
    if (el) el.classList.add("active");
    return;
  }
  if (typeof navTo === "function") navTo(id);
}

// ═══════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════
function openModal() {
  if (typeof openApiModal === "function") openApiModal();
}
function closeModal() {
  if (typeof closeApiModal === "function") closeApiModal();
}
function handleOverlayClick(e) {
  if (e.target.id === "api-modal") closeModal();
}
async function saveApiKey() {
  const k = document.getElementById("api-key-input").value.trim();
  const resultBox = document.getElementById("modal-test-result");
  const btn = document.getElementById("modal-save-btn");

  if (!k) {
    resultBox.style.display = "block";
    resultBox.style.background = "#FDF5F2";
    resultBox.style.border = "1px solid #E07A5F";
    resultBox.style.color = "#C9614A";
    resultBox.textContent = "Please paste your API key above.";
    return;
  }

  // Save first
  sessionStorage.setItem("mindlog_key", k);

  // Test it with a minimal API call
  btn.textContent = "Testing key...";
  btn.disabled = true;
  resultBox.style.display = "block";
  resultBox.style.background = "#FEF8EC";
  resultBox.style.border = "1px solid #F2CC8F";
  resultBox.style.color = "#9A7A2E";
  resultBox.textContent = "Verifying API key — please wait...";

  try {
    const testUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      k;
    const res = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: "Reply with the single word: OK" }] },
        ],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });
    const data = await res.json();

    if (data.error) {
      const msg = data.error.message || "Unknown error";
      resultBox.style.background = "#FDF5F2";
      resultBox.style.border = "1px solid #E07A5F";
      resultBox.style.color = "#C9614A";
      resultBox.textContent = "Key error: " + msg;
      btn.textContent = "Save and Continue";
      btn.disabled = false;
      return;
    }

    // Success
    resultBox.style.background = "#E8F4EE";
    resultBox.style.border = "1px solid #81B29A";
    resultBox.style.color = "#5F9580";
    resultBox.textContent = "✓ API key verified and working!";
    btn.textContent = "Save and Continue";
    btn.disabled = false;
    checkApiNotice();

    setTimeout(() => {
      closeModal();
      showToast("API key saved — you are ready to begin.");
    }, 1200);
  } catch (err) {
    resultBox.style.background = "#FDF5F2";
    resultBox.style.border = "1px solid #E07A5F";
    resultBox.style.color = "#C9614A";
    resultBox.textContent =
      "Network error — check your internet connection and try again.";
    btn.textContent = "Save and Continue";
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("visible");
  setTimeout(() => t.classList.remove("visible"), 2800);
}

// ═══════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════
function refreshHome() {
  if (typeof renderHome === "function") renderHome();
}

function setGreeting() {
  /* no-op: greeting handled in renderHome() */
}

function calcStreak(entries) {
  if (!entries.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = d.toISOString().split("T")[0];
    if (entries.some((e) => e.date === k)) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

function buildSparkline(e) {
  /* handled by renderHome() */
}

function buildRecentList(e) {
  /* handled by renderHome() */
}

// ── ROUTING ──────────────────────────────────────────────
function allOff() {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
}
function showAppNav(on) {
  const nb = document.getElementById("app-navbar");
  if (nb) nb.style.display = on ? "block" : "none";
  const bn = document.getElementById("bot-nav");
  if (bn) bn.classList.toggle("on", on);
  const fb = document.getElementById("fab");
  if (fb) fb.classList.toggle("on", on);
  const mn = document.querySelector("main.app-main");
  if (mn) mn.style.display = on ? "block" : "none";
}
function navTo(id) {
  allOff();
  const el = document.getElementById("screen-" + id);
  if (el) el.classList.add("active");
  window.scrollTo(0, 0);
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  const dl = document.querySelector(`.nav-link[onclick*="'${id}'"]`);
  if (dl) dl.classList.add("active");
  document
    .querySelectorAll(".bot-item")
    .forEach((b) => b.classList.remove("on"));
  const bl = document.getElementById("bn-" + id);
  if (bl) bl.classList.add("on");
  if (id === "home") {
    renderHome();
  }
  if (id !== "insights") {
    if (typeof cancelInsTimers === "function") cancelInsTimers();
  }
  if (id === "tracker") {
    if (typeof refreshTracker === "function") refreshTracker();
  }
  if (id === "experts") {
    if (typeof renderExperts === "function") renderExperts("all");
    else if (typeof buildExperts === "function") buildExperts("all");
  }
  if (id === "account") {
    renderAccount();
  }
  if (id === "journal") {
    if (typeof initJournal === "function") initJournal();
  }
}
function enterApp() {
  showAppNav(true);
  navTo("home");
}

// ── LANDING ──────────────────────────────────────────────
function goToOnboard() {
  allOff();
  const o = document.getElementById("screen-onboard");
  if (o) o.classList.add("active");
  showAppNav(false);
  window.scrollTo(0, 0);
}
function checkReturningUser() {
  getUser()
    ? enterApp()
    : (showToast("No account found — please create one."), goToOnboard());
}
