// MindLog — App Initialisation
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();

  if (user) {
    enterApp();
  } else {
    allOff();
    const l = document.getElementById('screen-landing');
    if (l) l.classList.add('active');
    showAppNav(false);
  }

  // Init experts panel (runs in background)
  setTimeout(() => {
    if      (typeof renderExperts  === 'function') renderExperts('all');
    else if (typeof buildExperts   === 'function') buildExperts('all');
  }, 100);

  // Data integrity + backup reminder check
  runDataIntegrityCheck();

  // Show privacy notice ONCE on very first visit
  if (!localStorage.getItem('mindlog_privacy_shown')) {
    setTimeout(() => {
      showToast('🔒 Your data stays on this device only — fully private.', 4000);
      localStorage.setItem('mindlog_privacy_shown', '1');
    }, 2000);
  }
});
