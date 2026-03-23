// MindLog — Expert Directory
'use strict';

// ═══════════════════════════════════════════════
// EXPERT DIRECTORY
// ═══════════════════════════════════════════════
function filterExperts(cat,btn) {
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  buildExperts(cat);
}

function buildExperts(cat) {
  const container=document.getElementById("experts-container");
  const CAT_LABELS={
    therapists: "🎓 Clinical Therapists & Psychologists",
    science:    "🔬 Neuroscience & Science-Backed",
    psychiatry: "🧠 Psychiatry & Specialised",
    animated:   "🎬 Accessible & Animated",
    niche:      "⚡ Niche & Specialty Focus",
  };
  if(cat==="all"){
    container.innerHTML=Object.entries(CAT_LABELS).map(([k,label])=>`
      <div class="cat-heading"><div class="cat-line"></div>${label}<div class="cat-line"></div></div>
      <div class="experts-grid">${EXPERT_CATS[k].map(id=>buildExpertCard(id)).join("")}</div>
    `).join("");
  } else {
    container.innerHTML=`<div class="experts-grid">${(EXPERT_CATS[cat]||[]).map(id=>buildExpertCard(id)).join("")}</div>`;
  }
}

function buildExpertCard(id) {
  const d=DOCTORS[id];if(!d)return"";
  return `<div class="expert-card" onclick="window.open('${d.url}','_blank')">
    <div class="ec-top">
      <div class="ec-avatar" style="background:${d.bg}">${d.emoji}</div>
      <div><div class="ec-name">${d.name}</div><span class="ec-tag" style="background:${d.bg};color:${d.color}">${d.tag}</span><span class="ec-subs">&middot; ${d.subs}</span></div>
    </div>
    <div class="ec-cred" style="color:${d.color}">${d.cred}</div>
    <div class="ec-spec">${d.specialty}</div>
    <div class="ec-watch" style="background:${d.bg};color:${d.color}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="${d.color}"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
      Watch on YouTube
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
// Old DOMContentLoaded removed — new init below handles startup