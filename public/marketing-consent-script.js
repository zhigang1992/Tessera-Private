// ===== Tessera Cross-Domain Consent Script for Marketing Site =====
// This script should be included in the marketing site (tessera.pe)
// Modals should have display: none by default in CSS

(function() {
  'use strict';

  // ===== Cross-Domain Storage Utility =====

  function setCrossDomainStorage(key, value, expiryDays = 365) {
    // Store in localStorage as backup
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('localStorage error:', e);
    }

    // Set cookie
    const hostname = window.location.hostname;
    let domain = '';

    // Use .tessera.pe for tessera.pe domains only
    if (hostname.endsWith('.tessera.pe') || hostname === 'tessera.pe') {
      domain = '; domain=.tessera.pe';
      console.log('✓ Using cross-domain cookie: .tessera.pe');
    } else {
      console.log('✓ Using domain-specific cookie:', hostname);
    }

    const maxAge = expiryDays * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; secure; samesite=lax${domain}`;
  }

  function getCrossDomainStorage(key) {
    // Try cookie first
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      const [name, value] = cookie.split('=');
      if (decodeURIComponent(name) === key) {
        return decodeURIComponent(value);
      }
    }

    // Fallback to localStorage
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  // ===== Animation Utilities =====

  function fadeIn(element, duration = 300) {
    element.style.display = 'flex';
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;

    // Force reflow
    element.offsetHeight;

    element.style.opacity = '1';
  }

  function fadeOut(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;

    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  }

  // ===== Terms & Conditions =====

  function checkTermsAcceptance() {
    const accepted = getCrossDomainStorage('tessera_terms_accepted');
    const tosOverlay = document.getElementById('tos_modal_overlay');

    if (!accepted && tosOverlay) {
      console.log('📋 Terms not accepted - showing modal');
      // Show with fade animation after a small delay
      setTimeout(() => {
        fadeIn(tosOverlay, 300);
      }, 100);
    } else if (accepted) {
      console.log('✓ Terms already accepted - modal will stay hidden');
    }
  }

  function acceptTerms() {
    console.log('✓ Accepting terms...');
    setCrossDomainStorage('tessera_terms_accepted', 'true');

    const tosOverlay = document.getElementById('tos_modal_overlay');
    if (tosOverlay) {
      fadeOut(tosOverlay, 300);
    }

    console.log('✓ Terms accepted and saved!');
  }

  // ===== Cookie Consent =====

  function checkCookieConsent() {
    const consent = getCrossDomainStorage('tessera_cookie_consent');
    const cookieOverlay = document.getElementById('cookie_modal_overlay');

    if (!consent && cookieOverlay) {
      console.log('🍪 Cookie consent not given - showing banner');
      // Show with fade animation after terms modal appears
      setTimeout(() => {
        fadeIn(cookieOverlay, 300);
      }, 500);
    } else if (consent) {
      console.log('✓ Cookie consent already given - banner will stay hidden');
    }
  }

  function acceptCookies() {
    console.log('✓ Accepting cookies...');
    const consent = { accepted: true };
    setCrossDomainStorage('tessera_cookie_consent', JSON.stringify(consent));

    const cookieOverlay = document.getElementById('cookie_modal_overlay');
    if (cookieOverlay) {
      fadeOut(cookieOverlay, 300);
    }

    console.log('✓ Cookies accepted and saved!');
  }

  function rejectCookies() {
    console.log('✓ Rejecting cookies...');
    const consent = { accepted: false };
    setCrossDomainStorage('tessera_cookie_consent', JSON.stringify(consent));

    const cookieOverlay = document.getElementById('cookie_modal_overlay');
    if (cookieOverlay) {
      fadeOut(cookieOverlay, 300);
    }

    console.log('✓ Cookies rejected and saved!');
  }

  // ===== Attach Event Listeners =====

  function attachListeners() {
    // Terms button
    const tosButton = document.getElementById('tos_modal_button');
    if (tosButton) {
      tosButton.addEventListener('click', (e) => {
        e.preventDefault();
        acceptTerms();
      });
      console.log('✓ Attached listener to TOS button');
    }

    // Cookie accept button
    const acceptBtn = document.getElementById('cookie_btn_accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', (e) => {
        e.preventDefault();
        acceptCookies();
      });
      console.log('✓ Attached listener to cookie accept button');
    }

    // Cookie reject button
    const rejectBtn = document.getElementById('cookie_btn_reject');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        rejectCookies();
      });
      console.log('✓ Attached listener to cookie reject button');
    }
  }

  // ===== Initialize =====

  function init() {
    console.log('🚀 Initializing Tessera Cross-Domain Consent...');
    console.log('🌍 Domain:', window.location.hostname);

    // Ensure modals start hidden
    const tosOverlay = document.getElementById('tos_modal_overlay');
    const cookieOverlay = document.getElementById('cookie_modal_overlay');

    if (tosOverlay) tosOverlay.style.display = 'none';
    if (cookieOverlay) cookieOverlay.style.display = 'none';

    // Check and show modals with animation if needed
    checkTermsAcceptance();
    checkCookieConsent();

    // Attach event listeners
    attachListeners();

    console.log('✓ Consent system initialized!');
  }

  // Run on DOMContentLoaded or immediately if DOM already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== Debug Helpers (expose to window) =====

  window.tesseraConsent = {
    clearAll: function() {
      localStorage.removeItem('tessera_terms_accepted');
      localStorage.removeItem('tessera_cookie_consent');
      document.cookie = 'tessera_terms_accepted=; max-age=0; path=/; domain=.tessera.pe';
      document.cookie = 'tessera_cookie_consent=; max-age=0; path=/; domain=.tessera.pe';
      document.cookie = 'tessera_terms_accepted=; max-age=0; path=/';
      document.cookie = 'tessera_cookie_consent=; max-age=0; path=/';
      console.log('✓ Cleared all consent data');
      location.reload();
    },
    check: function() {
      console.log({
        terms: getCrossDomainStorage('tessera_terms_accepted'),
        cookies: getCrossDomainStorage('tessera_cookie_consent'),
        domain: window.location.hostname,
        allCookies: document.cookie
      });
    },
    showTerms: function() {
      const tosOverlay = document.getElementById('tos_modal_overlay');
      if (tosOverlay) fadeIn(tosOverlay, 300);
    },
    showCookies: function() {
      const cookieOverlay = document.getElementById('cookie_modal_overlay');
      if (cookieOverlay) fadeIn(cookieOverlay, 300);
    }
  };

  console.log('💡 Debug commands available:');
  console.log('  tesseraConsent.check() - Check current consent status');
  console.log('  tesseraConsent.clearAll() - Clear all consent and reload');
  console.log('  tesseraConsent.showTerms() - Force show terms modal');
  console.log('  tesseraConsent.showCookies() - Force show cookie banner');

})();
