/* ===========================================
   PEACHY PLUMBERS — SITE SCRIPT
   =========================================== */

/* ---- Sticky header (lazy init) ---- */
let headerInitialized = false;
function initHeader() {
  if (headerInitialized) return;
  headerInitialized = true;
  const header = document.getElementById('site-header');
  if (header) {
    function updateHeader() {
      header.classList.toggle('scrolled', window.scrollY > 12);
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }
}
// Defer header init until user scrolls or after delay
if ('requestIdleCallback' in window) {
  requestIdleCallback(initHeader, { timeout: 2000 });
} else {
  setTimeout(initHeader, 1000);
}

/* ---- FAQ accordion ---- */
const faqBtns = document.querySelectorAll('.faq-btn');
// Open first item by default
if (faqBtns.length) {
  faqBtns[0].setAttribute('aria-expanded', 'true');
  const firstPanel = document.getElementById(faqBtns[0].getAttribute('aria-controls'));
  if (firstPanel) firstPanel.classList.add('open');
}

faqBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    // Close all
    faqBtns.forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      const p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.classList.remove('open');
    });

    // Re-open if it was closed
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.classList.add('open');
    }
  });
});

/* ---- Testimonials carousel ---- */
const testimonials = [
  {
    name: 'JoanneT-2261',
    quote: 'Mike repaired our shower and diagnosed another fault quickly. Everything was sorted on the same visit and left working properly.'
  },
  {
    name: 'LydiaA-85',
    quote: 'The boiler issue was explained clearly and fixed professionally. Reliable service and easy communication throughout.'
  },
  {
    name: 'JoanneT-2260',
    quote: 'Emergency call-out was fast and efficient, with clear advice and a tidy finish. Very happy with the work.'
  }
];

let currentIdx = 0;
let pendingIdx = null;

const fig      = document.getElementById('testimonial-figure');
const quoteEl  = document.getElementById('testimonial-quote');
const nameEl   = document.getElementById('testimonial-name');
const dots     = document.querySelectorAll('.testimonial-dot');

if (fig) {
  function syncDotsA11y() {
    dots.forEach((dot, i) => {
      const isActive = i === currentIdx;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
      dot.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  function goTo(next) {
    if (next === currentIdx) return;
    pendingIdx = next;
    fig.classList.add('fade-out');
  }

  fig.addEventListener('transitionend', () => {
    if (pendingIdx !== null && fig.classList.contains('fade-out')) {
      currentIdx = pendingIdx;
      pendingIdx = null;
      quoteEl.textContent = '\u201c' + testimonials[currentIdx].quote + '\u201d';
      nameEl.textContent  = testimonials[currentIdx].name;
      syncDotsA11y();
      fig.classList.remove('fade-out');
    }
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
    dot.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo((currentIdx + 1) % dots.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo((currentIdx - 1 + dots.length) % dots.length);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(dots.length - 1);
      }
    });
  });

  syncDotsA11y();
  
  // Start auto-rotation only when user sees testimonials section (Intersection Observer)
  const testimonialBox = document.querySelector('.testimonial-box');
  if ('IntersectionObserver' in window && testimonialBox) {
    let autoRotateInterval;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !autoRotateInterval) {
          autoRotateInterval = setInterval(() => goTo((currentIdx + 1) % testimonials.length), 5000);
        } else if (!entry.isIntersecting && autoRotateInterval) {
          clearInterval(autoRotateInterval);
          autoRotateInterval = null;
        }
      });
    }, { threshold: 0.5 });
    observer.observe(testimonialBox);
  } else {
    // Fallback for browsers without IntersectionObserver
    setInterval(() => goTo((currentIdx + 1) % testimonials.length), 5000);
  }
}

/* ---- Quote form submission ---- */
const form       = document.getElementById('quote-form');
const successMsg = document.getElementById('form-success');
const submitErrorMsg = document.getElementById('form-submit-error');

if (form) {
  const startedAtField = form.querySelector('#form_started_at');
  if (startedAtField) startedAtField.value = String(Date.now());

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (successMsg) successMsg.style.display = 'none';
    if (submitErrorMsg) {
      submitErrorMsg.textContent = 'Could not send your request. Please call us directly on 07752 961456.';
      submitErrorMsg.style.display = 'none';
    }

    const data = new FormData(form);
    const honeypot = (data.get('website') || '').toString().trim();
    const botcheck = (data.get('botcheck') || '').toString().trim();
    const formStartedAt = Number(data.get('form_started_at') || 0);
    const now = Date.now();
    const minFillTimeMs = 2500;
    const submitCooldownMs = 30000;
    const lastSubmittedAt = Number(localStorage.getItem('quote-last-submit-at') || 0);

    if (honeypot || botcheck) {
      return;
    }

    if (!formStartedAt || (now - formStartedAt) < minFillTimeMs) {
      if (submitErrorMsg) {
        submitErrorMsg.textContent = 'Please wait a moment and try again.';
        submitErrorMsg.style.display = 'block';
      }
      return;
    }

    if (lastSubmittedAt && (now - lastSubmittedAt) < submitCooldownMs) {
      if (submitErrorMsg) {
        submitErrorMsg.textContent = 'Please wait 30 seconds before sending another request.';
        submitErrorMsg.style.display = 'block';
      }
      return;
    }

    const phone = (data.get('phone') || '').toString().trim();
    const postcode = (data.get('postcode') || '').toString().trim().toUpperCase();

    const fields = ['name', 'phone', 'postcode', 'issue'];
    let valid = true;

    function setFieldError(field, message) {
      const errEl = document.getElementById('err-' + field);
      const inputEl = form.querySelector('[name="' + field + '"]');
      if (message) {
        if (errEl) {
          errEl.textContent = message;
          errEl.style.display = 'block';
        }
        if (inputEl) inputEl.setAttribute('aria-invalid', 'true');
        valid = false;
        return;
      }
      if (errEl) {
        errEl.textContent = '';
        errEl.style.display = 'none';
      }
      if (inputEl) inputEl.setAttribute('aria-invalid', 'false');
    }

    fields.forEach(field => {
      if (!data.get(field)?.trim()) {
        setFieldError(field, 'This field is required.');
      } else {
        setFieldError(field, '');
      }
    });

    const phoneValid = /^[+\d\s()\-]{10,20}$/.test(phone);
    const postcodeValid = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(postcode);

    if (phone && !phoneValid) {
      setFieldError('phone', 'Enter a valid phone number.');
    }

    if (postcode && !postcodeValid) {
      setFieldError('postcode', 'Enter a valid UK postcode.');
    }

    if (!valid) return;

    data.set('postcode', postcode);
    data.set('email', form.dataset.fallbackEmail || 'peachyplumbers123@gmail.com');
    data.set('message', data.get('issue') || '');
    const photo = form.querySelector('#photo');
    if (photo && (!photo.files || !photo.files.length)) {
      data.delete('photo');
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    function showSubmitError(message) {
      if (!submitErrorMsg) return;
      submitErrorMsg.textContent = message || 'Could not send your request. Please call us directly on 07752 961456.';
      submitErrorMsg.style.display = 'block';
    }

    function openEmailFallback() {
      const fallbackEmail = form.dataset.fallbackEmail || 'peachyplumbers123@gmail.com';
      const subject = data.get('subject') || 'New Quote Request - Peachy Plumbers';
      const bodyLines = [
        'New quote request from the Peachy Plumbers website.',
        '',
        'Name: ' + data.get('name'),
        'Phone: ' + data.get('phone'),
        'Postcode: ' + postcode,
        'Preferred contact time: ' + (data.get('contactTime') || 'Not provided'),
        '',
        'Issue:',
        data.get('issue'),
        '',
        'Note: If you selected a photo, please attach it to this email before sending.'
      ];
      window.location.href = 'mailto:' + encodeURIComponent(fallbackEmail) +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));
      localStorage.setItem('quote-last-submit-at', String(Date.now()));
      if (successMsg) {
        successMsg.textContent = 'Your email app has opened with the message ready to send.';
        successMsg.style.display = 'block';
      }
    }

    const accessKey = (data.get('access_key') || '').toString().trim();
    if (!accessKey || accessKey === 'REPLACE_WITH_REAL_FORM_ACCESS_KEY') {
      openEmailFallback();
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    data.set('access_key', accessKey);

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          localStorage.setItem('quote-last-submit-at', String(Date.now()));
          if (successMsg) {
            successMsg.textContent = 'Thanks - your request was sent successfully. We will contact you shortly.';
            successMsg.style.display = 'block';
          }
          form.reset();
          if (startedAtField) startedAtField.value = String(Date.now());
        } else {
          showSubmitError(json.message || json.error);
        }
      })
      .catch(() => {
        showSubmitError();
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

/* ---- Cookie consent banner ---- */
function initCookieConsent() {
  var banner  = document.getElementById('cookie-banner');
  var btnOk   = document.getElementById('cookie-accept');
  var btnNo   = document.getElementById('cookie-decline');
  var settingsBtn = document.getElementById('cookie-settings-btn');
  var mapFrame = document.getElementById('map-iframe');
  var mapNote  = document.getElementById('map-consent-note');
  if (!banner || !btnOk || !btnNo) return;

  function focusAcceptButton() {
    setTimeout(function () { btnOk.focus(); }, 0);
  }

  function applyConsent(choice) {
    if (!mapFrame) return;
    if (choice === 'declined') {
      mapFrame.setAttribute('data-src', mapFrame.getAttribute('src') || mapFrame.getAttribute('data-src') || '');
      mapFrame.removeAttribute('src');
      mapFrame.style.display = 'none';
      if (mapNote) mapNote.style.display = 'block';
      return;
    }

    var src = mapFrame.getAttribute('src') || mapFrame.getAttribute('data-src');
    if (src && !mapFrame.getAttribute('src')) {
      mapFrame.setAttribute('src', src);
    }
    mapFrame.style.display = 'block';
    if (mapNote) mapNote.style.display = 'none';
  }

  // Hide immediately if already answered
  var existing = localStorage.getItem('cookie-consent');
  if (existing) {
    applyConsent(existing);
    banner.classList.add('hidden');
    return;
  }

  applyConsent('accepted');
  focusAcceptButton();

  function dismiss(choice) {
    localStorage.setItem('cookie-consent', choice);
    applyConsent(choice);
    banner.classList.add('hidden');
  }

  function reopenBanner(event) {
    if (event) event.preventDefault();
    banner.classList.remove('hidden');
    focusAcceptButton();
  }

  banner.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss('declined');
    }
  });

  btnOk.addEventListener('click', function () { dismiss('accepted'); });
  btnNo.addEventListener('click', function () { dismiss('declined'); });
  if (settingsBtn) settingsBtn.addEventListener('click', reopenBanner);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
  initCookieConsent();
}

(function () {
  var photoInput = document.getElementById('photo');
  var fileDrop   = photoInput ? photoInput.previousElementSibling : null;
  var fileLabel  = document.getElementById('file-label');
  if (!photoInput) return;
  photoInput.addEventListener('change', function () {
    var file = photoInput.files[0];
    if (file) {
      fileLabel.textContent = file.name;
      fileDrop.classList.add('has-file');
    } else {
      fileLabel.innerHTML = 'Click to upload or drag &amp; drop';
      fileDrop.classList.remove('has-file');
    }
  });
}());

/* ---- Scroll reveal (IntersectionObserver) ---- */
(function () {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      setTimeout(function () { el.classList.add('is-visible'); }, parseInt(el.dataset.delay || 0, 10));
      io.unobserve(el);
    });
  }, { threshold: 0.08 });

  // Auto-stagger children of .reveal-group
  document.querySelectorAll('.reveal-group').forEach(function (group) {
    Array.from(group.children).forEach(function (child, i) {
      child.classList.add('reveal');
      child.dataset.delay = i * 200;
    });
  });

  // Observe all .reveal elements
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
}());
