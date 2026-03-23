// MindLog — API Key Modal
"use strict";

// ── API MODAL ────────────────────────────────────────────
function openApiModal() {
  const i = document.getElementById("api-key-input");
  const r = document.getElementById("api-result");
  const b = document.getElementById("api-save-btn");

  if (i) i.value = getApiKey();

  if (r) {
    r.style.display = "none";
    r.className = "result-box";
  }

  if (b) {
    b.textContent = "Save and Continue";
    b.disabled = false;
  }

  const modal = document.getElementById("modal-api");
  modal.style.display = "flex";

  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  setTimeout(() => i?.focus(), 80);
}

function closeApiModal() {
  const modal = document.getElementById("modal-api");

  modal.classList.remove("show");

  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}
async function saveApiKey() {
  const key = document.getElementById("api-key-input").value.trim();
  const rb = document.getElementById("api-result");
  const btn = document.getElementById("api-save-btn");
  if (!key) {
    rb.className = "result-box rbox-err";
    rb.style.display = "block";
    rb.textContent = "Please enter your API key.";
    return;
  }
  sessionStorage.setItem(ML_KEY, key);
  btn.textContent = "Testing...";
  btn.disabled = true;
  rb.className = "result-box";
  rb.style.cssText =
    "background:var(--warn-l);border:1px solid var(--warn);color:#9A7A2E;display:block;margin-top:8px;padding:10px 12px;border-radius:var(--r-sm);font-size:.79rem;";
  rb.textContent = "Verifying key...";
  try {
    const res = await fetch(GBASE + GMODEL + ":generateContent?key=" + key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Say: OK" }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    rb.className = "result-box rbox-ok";
    rb.style.display = "block";
    rb.textContent = "✓ API key verified!";
    btn.textContent = "Save and Continue";
    btn.disabled = false;
    updateApiMasked();
    setTimeout(() => closeApiModal(), 950);
  } catch (e) {
    let msg = e.message || "Error";
    if (msg.includes("API_KEY_INVALID") || msg.includes("not valid"))
      msg = "Invalid key — check at aistudio.google.com.";
    rb.className = "result-box rbox-err";
    rb.style.display = "block";
    rb.textContent = msg;
    btn.textContent = "Save and Continue";
    btn.disabled = false;
  }
}
function updateApiMasked() {
  const k = getApiKey();
  const el = document.getElementById("acct-api-masked");
  if (el)
    el.textContent = k
      ? k.slice(0, 8) + "•".repeat(Math.max(0, k.length - 8))
      : "Not configured";
}
function checkApiNoticeJ() {
  const el = document.getElementById("api-notice");
  if (el) el.style.display = getApiKey() ? "none" : "flex";
}
