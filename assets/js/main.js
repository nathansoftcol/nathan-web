/* Nathan Soft — UI behavior */
(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Header on scroll (coalesce con rAF para reducir trabajo en el hilo principal)
  const header = document.getElementById('siteHeader');
  let anchorHeaderOffset = 80;
  function syncAnchorHeaderOffset() {
    anchorHeaderOffset = (header ? header.offsetHeight : 72) + 8;
  }
  syncAnchorHeaderOffset();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(syncAnchorHeaderOffset);
  });
  window.addEventListener('resize', () => {
    window.requestAnimationFrame(syncAnchorHeaderOffset);
  }, { passive: true });

  let scrollScheduled = false;
  const onScroll = () => {
    if (!header) return;
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(() => {
      scrollScheduled = false;
      header.classList.toggle('scrolled', window.scrollY > 16);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = document.body.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.primary-nav a').forEach((a) => {
      a.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('nav-open')) return;
      if (e.target.closest('.primary-nav')) return;
      if (e.target.closest('#hamburger')) return;
      if (e.target.closest('.lang-switch')) return;
      document.body.classList.remove('nav-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !document.body.classList.contains('nav-open')) return;
      document.body.classList.remove('nav-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.focus();
    });
    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 881px)').matches && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Active link highlight (URLs limpias /servicios y legado .html)
  const pageSlug = (() => {
    const tail = (location.pathname || '').replace(/\/+$/, '').split('/').pop() || '';
    const base = tail.replace(/\.html$/i, '').toLowerCase();
    return base === '' || base === 'index' ? 'home' : base;
  })();
  function hrefSlug(raw) {
    if (!raw) return '';
    const clean = raw.split(/[?#]/)[0];
    try {
      const u = new URL(clean, location.origin);
      const last = u.pathname.replace(/\/+$/, '').split('/').pop() || '';
      const base = last.replace(/\.html$/i, '').toLowerCase();
      return base === '' || base === 'index' ? 'home' : base;
    } catch (_) {
      const stripped = clean.replace(/^\.\//, '').replace(/^\//, '');
      const base = stripped.replace(/\.html$/i, '').toLowerCase();
      return base === '' || base === 'index' ? 'home' : base;
    }
  }
  document.querySelectorAll('.primary-nav a').forEach((a) => {
    if (hrefSlug(a.getAttribute('href')) === pageSlug) {
      a.classList.add('is-active');
    }
  });

  // Reveal on scroll
  const revealEls = document.querySelectorAll(
    '.section, .card, .industry, .founder, .contact-form, .contact-info, .cta-banner, .values'
  );
  revealEls.forEach((el) => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  // Smooth scroll for in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - anchorHeaderOffset;
      window.scrollTo({ top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  // Helper to translate
  const t = (key, fallback) => {
    const lang = (window.NATHAN_LANG || 'es');
    const dict = (window.NATHAN_I18N && window.NATHAN_I18N[lang]) || {};
    return dict[key] || fallback;
  };

  // Contacto: solo contact.php (+ PHPMailer + Gmail SMTP en el servidor).
  const form = document.getElementById('contactForm');
  if (form) {
    const btn = form.querySelector('button[type="submit"]');
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form-status';

      if (form.website && form.website.value) {
        status.textContent = t('form.ok', '¡Gracias!');
        status.classList.add('success');
        form.reset();
        return;
      }

      if (!form.checkValidity()) {
        status.textContent = t('form.errValidation', 'Revisa los campos antes de enviar.');
        status.classList.add('error');
        form.reportValidity();
        return;
      }

      const fd = new FormData(form);
      const labelEl = btn.querySelector('span:first-child');
      const labelOriginal = labelEl ? labelEl.textContent : '';
      btn.classList.add('loading');
      if (labelEl) labelEl.textContent = t('form.sending', 'Enviando…');

      try {
        const res = await fetch(form.getAttribute('action') || 'contact.php', {
          method: 'POST',
          body: fd,
          headers: { Accept: 'application/json' }
        });
        let data;
        try {
          data = JSON.parse(await res.text());
        } catch (_) {
          throw new Error('bad-json');
        }

        if (res.ok && data && data.success === true) {
          status.textContent = t('form.ok', '¡Gracias! Hemos recibido tu mensaje y te responderemos pronto.');
          status.classList.add('success');
          form.reset();
        } else {
          status.textContent =
            (data && data.message) ||
            t('form.err', 'No pudimos enviar el mensaje. Por favor intenta nuevamente.');
          status.classList.add('error');
        }
      } catch (err) {
        status.textContent = t(
          'form.phpNeeded',
          'Hace falta PHP para enviar con Gmail: en la carpeta del proyecto ejecuta php -S localhost:8080 y abre http://localhost:8080/contacto.html — o sube contact.php y vendor al hosting (el navegador no puede usar SMTP solo).'
        );
        status.classList.add('error');
      } finally {
        btn.classList.remove('loading');
        if (labelEl) labelEl.textContent = labelOriginal || t('form.submit', 'Enviar mensaje');
      }
    });
  }

  document.addEventListener('langchange', () => {
    const submitSpan = document.querySelector('#contactForm button[type="submit"] span:first-child');
    if (submitSpan) submitSpan.textContent = t('form.submit', 'Enviar mensaje');
  });
})();
