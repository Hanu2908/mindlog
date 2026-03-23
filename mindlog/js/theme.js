// MindLog — Theme System
'use strict';

const THEME_KEY      = 'mindlog_theme';
const DEFAULT_THEME  = 'warm';
const VALID_THEMES   = ['warm', 'cool', 'dark'];

// ── Apply theme instantly ─────────────────────
function applyTheme(name) {
  if (!VALID_THEMES.includes(name)) name = DEFAULT_THEME;
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem(THEME_KEY, name);
  updateThemeSwatchUI(name);
}

// ── Load saved theme on startup ───────────────
function loadSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
  applyTheme(saved);
}
// ── Landing Page Dropdown Logic ────────────────
function toggleLandingTheme(e) {
  if (e) e.stopPropagation(); // Prevents the click from immediately triggering the close listener
  const menu = document.getElementById('l-theme-menu');
  if (menu) menu.classList.toggle('show');
}

// Close the dropdown when clicking anywhere else on the screen
document.addEventListener('click', function(e) {
  const menu = document.getElementById('l-theme-menu');
  if (menu && menu.classList.contains('show') && !e.target.closest('.theme-dropdown-container')) {
    menu.classList.remove('show');
  }
});

// ── Update swatch selection in account page ───
function updateThemeSwatchUI(name) {
  document.querySelectorAll('.theme-swatch').forEach(function(el) {
    el.classList.toggle('active', el.dataset.theme === name);
  });
}

// ── Current theme getter ──────────────────────
function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
}

// ── Confetti for streak milestones ────────────
function triggerConfetti() {
  const colors = {
    warm: ['#D4617E','#C084B8','#E8A87C','#FFB8C8'],
    cool: ['#6C7FD8','#70B8C8','#9B8FD8','#B8C8FF'],
    dark: ['#5DBF8A','#70B8A8','#C4A84A','#A0E0B8'],
  };
  const palette = colors[getCurrentTheme()] || colors.warm;
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999;overflow:hidden';
  document.body.appendChild(container);

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    const color = palette[Math.floor(Math.random() * palette.length)];
    const size  = Math.random() * 8 + 5;
    const left  = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const dur   = Math.random() * 1.5 + 1.5;
    const rot   = Math.random() * 360;
    piece.style.cssText = `
      position:absolute;top:-20px;left:${left}%;
      width:${size}px;height:${size}px;
      background:${color};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation:confettiFall ${dur}s ${delay}s ease-in forwards;
      transform:rotate(${rot}deg);
    `;
    container.appendChild(piece);
  }

  // Inject animation once
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confettiFall {
        0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(function() { container.remove(); }, 3500);
}

// ── Emoji bounce animation ────────────────────
function bounceEmoji(el) {
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'emojiPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  setTimeout(function() { el.style.animation = ''; }, 500);
}

// Expose for use in insights render
window.bounceEmoji = bounceEmoji;
window.triggerConfetti = triggerConfetti;

// Load theme immediately (before DOM ready for no flash)
loadSavedTheme();
