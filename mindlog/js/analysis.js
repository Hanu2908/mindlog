// MindLog — Gemini AI Analysis
"use strict";

// ═══════════════════════════════════════════════
// ANALYSIS
// ═══════════════════════════════════════════════
async function runAnalysis() {
  const journal =
    typeof getCurrentText === "function"
      ? getCurrentText().trim()
      : (document.getElementById("j-text") || { value: "" }).value.trim();
  const mood = null; // AI infers mood from text — see schema below
  const errEl =
    document.getElementById("err-notice") ||
    document.getElementById("error-notice");
  if (errEl) errEl.style.display = "none";
  if (journal.length < 10) return;

  // Crisis check
  const lower = journal.toLowerCase();
  if (CRISIS_KEYWORDS.some((k) => lower.includes(k))) {
    errEl.style.display = "block";
    errEl.innerHTML = `<strong>Your wellbeing matters.</strong> If you are struggling right now, please reach out to Tele-MANAS:: <strong>1-800-891-4416</strong> — free, confidential, and available Monday to Saturday. You do not have to navigate this alone.`;
    return;
  }

  // Rate limit
  const now = Date.now();
  if (now - lastCall < 6000) {
    showToast(
      `Please wait ${Math.ceil((6000 - (now - lastCall)) / 1000)} seconds before trying again.`,
    );
    return;
  }
  lastCall = now;

  showScreen("loading");
  startLoader();

  let result;
  let apiError = null;

  try {
    const key = getApiKey();
    if (!key) throw new Error("no_key");
    result = await Promise.race([
      callGemini(journal, mood, key),
      new Promise((_, r) =>
        setTimeout(
          () =>
            r(
              new Error(
                "Request timed out. Please check your internet connection and try again.",
              ),
            ),
          15000,
        ),
      ),
    ]);
  } catch (e) {
    console.error("Gemini API error:", e.message);
    apiError = e.message;
    result = null;
  }

  stopLoader();

  // If API failed — go back to journal screen and show the real error
  if (!result) {
    navTo("journal");
    const errEl =
      document.getElementById("err-notice") ||
      document.getElementById("error-notice");
    let msg = apiError || "An unexpected error occurred.";

    // Friendly translations for common Gemini errors
    if (msg === "no_key") {
      msg =
        "No API key configured. Please tap the 🔑 button in the top navigation to set your Gemini API key.";
    } else if (
      msg.includes("API_KEY_INVALID") ||
      msg.includes("not valid") ||
      msg.includes("API key not valid")
    ) {
      msg =
        "Your API key appears to be invalid. Please verify it at aistudio.google.com and re-enter it using the 🔑 button.";
    } else if (msg.includes("PERMISSION_DENIED") || msg.includes("403")) {
      msg =
        "API key permission denied. Ensure your key has access to the Gemini API at aistudio.google.com.";
    } else if (
      msg.includes("QUOTA") ||
      msg.includes("429") ||
      msg.includes("quota")
    ) {
      msg =
        "API quota exceeded. You have reached your free tier limit. Please wait a few minutes and try again.";
    } else if (msg.includes("timed out")) {
      msg =
        "Request timed out. Please check your internet connection and try again.";
    } else if (
      msg.includes("could not be parsed") ||
      msg.includes("unexpected format")
    ) {
      msg =
        "The AI returned an unexpected response format. Please try again — this is usually a one-off issue.";
    }

    if (errEl) {
      errEl.style.display = "block";
      errEl.innerHTML =
        "<strong>Analysis could not be completed.</strong><br>" + msg;
      errEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  result.needs = sanitiseNeeds(result.needs);

  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split("T")[0],
    journal_text: journal.slice(0, 600),
    mood_rating: result.mood_rating || 5,
    stress_level: result.stress_level,
    dominant_emotion: result.dominant_emotion,
    root_cause: result.root_cause_tag,
    energy_level: result.energy_level,
    energy_pct: result.energy_pct,
    summary: result.summary,
    ai_result: result,
  };
  saveEntry(entry);
  currentResult = result;
  renderInsights(result);
  navTo("insights");
}

// Try a list of models in order — stop at first success
const GEMINI_MODELS = ["gemini-2.5-flash"];

async function callGemini(journal, mood, key) {
  const BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

  // Build personalised prompt from user profile
  const _u = typeof getUser === "function" ? getUser() || {} : {};
  const _year = _u.year || "";
  const _branch = _u.branch || "";
  const _living =
    _u.living === "hostel"
      ? "hostel resident"
      : _u.living === "day"
        ? "day scholar"
        : _u.living === "pg"
          ? "PG/rented accommodation"
          : "";
  const _interests = (_u.interests || []).length
    ? "Interests: " + _u.interests.join(", ") + "."
    : "";
  const _stressors = (_u.stressors || []).length
    ? "Known stressors: " + _u.stressors.join(", ") + "."
    : "";
  const _context = [_year, _branch, _living, _interests, _stressors]
    .filter(Boolean)
    .join(" ");

 // In analysis.js
const fullPrompt = `You are a mental wellness AI for engineering college students.

STUDENT PROFILE: ${_context || "Engineering college student."}
Use this profile to personalise your analysis — reference their specific stressors and interests when recommending actions and needs.

Analyse the journal entry and return ONLY a raw JSON object — no markdown, no code fences, no explanation. Do NOT return the same generic result regardless of content.

ANALYSIS GUIDELINES & CRITICAL RULES:
- Read the full entry carefully — students often feel multiple emotions at once.
- A productive/happy entry: stress_level MUST be 1-3.
- A lonely/sad entry: stress_level MUST be 4-6.
- A stressed/overwhelmed entry: stress_level MUST be 7-10.
- dominant_emotion: pick what is MOST present in the tone and words, not what you expect from the situation.
- mood_rating: infer from the overall positivity and energy of the entry (1=very negative, 10=very positive).
- summary & action_desc: MUST reference specific details from what the student wrote — names, events, feelings they mentioned. Tailor action_desc to their profile.
- positive_signal: find something genuine, even in a very hard entry — effort, awareness, honesty counts.
- needs: pick 2-3 that genuinely match what you read, in order of importance.


Return ONLY this exact JSON — no text before or after, no markdown:
{
  "stress_level": <integer 1-10>,
  "stress_reasoning": "<one sentence grounded in what they wrote>",
  "dominant_emotion": "<one of: anxious, overwhelmed, lonely, burnt_out, motivated, neutral, sad, frustrated, hopeful, calm>",
  "emotion_reasoning": "<one sentence explaining why this emotion fits>",
  "root_cause_tag": "<one of: academic, social, family, health, financial, multiple, unclear>",
  "energy_level": "<one of: low, medium, high>",
  "energy_pct": <integer 0-100>,
  "mood_rating": <integer 1-10>,
  "summary": "<2 warm, specific sentences addressing the student directly about their day>",
  "positive_signal": "<one genuine strength or observation from the entry>",
  "needs": ["<need1>", "<need2>", "<need3>"],
  "personal_insight": "<2 sentences of honest, personalised reflection based on this single entry>",
  "action_title": "<4 words max>",
  "action_desc": "<one concrete, specific, actionable sentence tailored to their profile>"
}

needs only from: relaxation, social_connection, academic_support, physical_movement, creative_outlet, sleep, emotional_validation, focus_reset, family_contact, professional_support

---
Journal entry: "${journal}"`;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = BASE + model + ":generateContent?key=" + key;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
        }),
      });

      const data = await res.json();
      console.log("Gemini raw data:", JSON.stringify(data).slice(0, 300));

      if (data.error) {
        lastError = new Error(data.error.message || "API error " + res.status);
        if (res.status === 401 || res.status === 403 || res.status === 400)
          throw lastError;
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn("No text in response:", JSON.stringify(data));
        lastError = new Error("Empty response from model " + model);
        continue;
      }

      console.log("Raw text from Gemini:", text);
      const parsed = extractJSON(text);
      console.log("Parsed result:", parsed);
      return parsed;
    } catch (err) {
      console.error("callGemini error:", err.message);
      lastError = err;
      // Only rethrow auth errors — parse errors should not stop the flow
      if (
        err.message &&
        (err.message.includes("API_KEY") ||
          err.message.includes("PERMISSION") ||
          err.message.includes("not valid"))
      )
        throw err;
    }
  }

  throw lastError || new Error("All models failed.");
}

function extractJSON(raw) {
  if (!raw || typeof raw !== "string")
    throw new Error("Empty response from AI.");

  // Pre-clean common Gemini response patterns
  raw = raw
    .replace(/^[\s\S]*?(?=\{)/, "") // strip any text before first {
    .replace(/\}[\s\S]*$/, "}") // strip any text after last }
    .trim();

  const attempt = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  // Method 1: direct
  let r = attempt(raw.trim());
  if (r) return validate(r);

  // Method 2: strip code fences (```json ... ``` or ``` ... ```)
  let stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  r = attempt(stripped);
  if (r) return validate(r);

  // Method 3: find first { to last }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    r = attempt(raw.slice(start, end + 1));
    if (r) return validate(r);
  }

  // Method 4: try each line that starts with {
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (t.startsWith("{")) {
      r = attempt(t);
      if (r) return validate(r);
    }
  }

  console.error("extractJSON could not parse:", raw);
  throw new Error(
    "The AI response could not be parsed. Please try submitting your entry again.",
  );
}

function validate(obj) {
  // Ensure required fields exist — fill safe defaults if missing
  const emotions = [
    "anxious",
    "overwhelmed",
    "lonely",
    "burnt_out",
    "motivated",
    "neutral",
    "sad",
    "frustrated",
    "hopeful",
    "calm",
  ];
  const needs = [
    "relaxation",
    "social_connection",
    "academic_support",
    "physical_movement",
    "creative_outlet",
    "sleep",
    "emotional_validation",
    "focus_reset",
    "family_contact",
    "professional_support",
  ];

  if (typeof obj.stress_level !== "number") obj.stress_level = 5;
  obj.stress_level = Math.max(1, Math.min(10, Math.round(obj.stress_level)));

  if (!emotions.includes(obj.dominant_emotion))
    obj.dominant_emotion = "neutral";
  if (!["low", "medium", "high"].includes(obj.energy_level))
    obj.energy_level = "medium";
  if (typeof obj.energy_pct !== "number")
    obj.energy_pct =
      obj.energy_level === "low" ? 25 : obj.energy_level === "high" ? 75 : 50;

  if (
    typeof obj.mood_rating !== "number" ||
    obj.mood_rating < 1 ||
    obj.mood_rating > 10
  ) {
    // Infer from stress level if missing
    obj.mood_rating = Math.max(
      1,
      Math.min(10, Math.round(11 - obj.stress_level)),
    );
  }
  obj.mood_rating = Math.round(obj.mood_rating);

  if (!obj.root_cause_tag) obj.root_cause_tag = "unclear";
  if (!obj.summary) obj.summary = "Your entry has been recorded.";
  if (!obj.positive_signal)
    obj.positive_signal = "You took a moment to reflect — that matters.";
  if (!obj.action_title) obj.action_title = "Take one small step";
  if (!obj.action_desc)
    obj.action_desc =
      "Focus on just one thing you can do in the next 30 minutes.";
  if (!obj.personal_insight)
    obj.personal_insight =
      obj.weekly_insight ||
      "Keep journaling consistently to build meaningful insights over time.";

  if (!Array.isArray(obj.needs) || obj.needs.length === 0) {
    obj.needs = ["relaxation", "emotional_validation"];
  } else {
    obj.needs = obj.needs.filter((n) => needs.includes(n)).slice(0, 3);
    if (obj.needs.length === 0)
      obj.needs = ["relaxation", "emotional_validation"];
  }

  return obj;
}

function sanitiseNeeds(raw) {
  const valid = Object.keys(NEEDS_DB);
  if (!Array.isArray(raw)) return ["relaxation", "emotional_validation"];
  const f = raw.filter((n) => valid.includes(n));
  return f.length ? f.slice(0, 3) : ["relaxation", "emotional_validation"];
}

// ═══════════════════════════════════════════════
// LOADER
// ═══════════════════════════════════════════════
const LOADER_MSGS = [
  "Reading your entry...",
  "Identifying emotional patterns...",
  "Mapping stress indicators...",
  "Preparing your analysis...",
];
let loaderIdx = 0;
function startLoader() {
  loaderIdx = 0;
  document.getElementById("loading-msg").textContent = LOADER_MSGS[0];
  loadInterval = setInterval(() => {
    loaderIdx = (loaderIdx + 1) % LOADER_MSGS.length;
    document.getElementById("loading-msg").textContent = LOADER_MSGS[loaderIdx];
  }, 1600);
}
function stopLoader() {
  clearInterval(loadInterval);
}
