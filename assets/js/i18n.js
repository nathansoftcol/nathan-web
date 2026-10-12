/* Nathan Soft — i18n engine
   - Detecta idioma desde ?lang, localStorage, geolocalización por IP y navigator.language
   - Aplica todas las cadenas data-i18n
   - Cada página puede tener su propia clave de title via <body data-page="home|services|...">
*/
(function () {
  const SUPPORTED = ['es', 'en', 'pt', 'fr'];
  const DEFAULT = 'es';

  const COUNTRY_TO_LANG = {
    CO: 'es', MX: 'es', AR: 'es', CL: 'es', PE: 'es', EC: 'es', VE: 'es',
    UY: 'es', PY: 'es', BO: 'es', CR: 'es', PA: 'es', GT: 'es', HN: 'es',
    SV: 'es', NI: 'es', DO: 'es', CU: 'es', PR: 'es', ES: 'es',
    BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
    FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', CA: 'fr',
    SN: 'fr', CI: 'fr', MA: 'fr', TN: 'fr', DZ: 'fr',
    US: 'en', GB: 'en', IE: 'en', AU: 'en', NZ: 'en', IN: 'en', SG: 'en',
    PH: 'en', ZA: 'en'
  };

  function pickFromQuery() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q && SUPPORTED.includes(q)) return q;
    } catch (_) {}
    return null;
  }
  function pickFromStorage() {
    try {
      const s = localStorage.getItem('ns_lang');
      if (s && SUPPORTED.includes(s)) return s;
    } catch (_) {}
    return null;
  }
  function pickFromNavigator() {
    const navs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ''];
    for (const l of navs) {
      const code = (l || '').toLowerCase().split('-')[0];
      if (SUPPORTED.includes(code)) return code;
    }
    return null;
  }
  async function pickFromGeoIP() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) return null;
      const data = await res.json();
      const cc = (data && (data.country || data.country_code) || '').toUpperCase();
      if (cc && COUNTRY_TO_LANG[cc]) return COUNTRY_TO_LANG[cc];
    } catch (_) {}
    return null;
  }

  function applyLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;
    const dict = (window.NATHAN_I18N && window.NATHAN_I18N[lang]) || {};
    document.documentElement.lang = lang === 'es' ? 'es-CO' : (lang === 'pt' ? 'pt-BR' : (lang === 'fr' ? 'fr-FR' : 'en-US'));

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = dict[key];
      if (typeof val !== 'string') return;
      const tag = el.tagName.toLowerCase();
      if (tag === 'meta') {
        if (el.getAttribute('content') !== val) el.setAttribute('content', val);
      } else if (tag === 'title') {
        if (document.title !== val || el.textContent !== val) {
          el.textContent = val;
          document.title = val;
        }
      } else if (tag === 'input' || tag === 'textarea') {
        if (el.placeholder !== val) el.placeholder = val;
      } else if (tag === 'option') {
        if (el.textContent !== val) el.textContent = val;
      } else {
        if (el.textContent !== val) el.textContent = val;
      }
    });

    // Per-page title key via <body data-page="home|services|...">
    const page = document.body && document.body.dataset && document.body.dataset.page;
    if (page) {
      const titleKey = 'meta.title.' + page;
      if (dict[titleKey]) {
        const tval = dict[titleKey];
        if (document.title !== tval) document.title = tval;
        const ogt = document.querySelector('meta[property="og:title"]');
        if (ogt && ogt.getAttribute('content') !== tval) ogt.setAttribute('content', tval);
      }
    }

    const labelMap = { es: 'ES', en: 'EN', pt: 'PT', fr: 'FR' };
    const label = document.getElementById('langLabel');
    const nextLabel = labelMap[lang] || lang.toUpperCase();
    if (label && label.textContent !== nextLabel) label.textContent = nextLabel;
    document.querySelectorAll('#langMenu li').forEach((li) => {
      li.setAttribute('aria-selected', li.dataset.lang === lang ? 'true' : 'false');
    });
    const formLang = document.getElementById('formLang');
    if (formLang && formLang.value !== lang) formLang.value = lang;

    try { localStorage.setItem('ns_lang', lang); } catch (_) {}
    window.NATHAN_LANG = lang;
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  window.NathanI18n = { setLang: applyLang, supported: SUPPORTED };

  document.addEventListener('DOMContentLoaded', () => {
    const initial = pickFromQuery() || pickFromStorage() || pickFromNavigator();
    if (initial) {
      applyLang(initial);
    } else {
      applyLang(DEFAULT);
      const applyGeo = () => {
        pickFromGeoIP().then((geo) => {
          if (geo && geo !== window.NATHAN_LANG) applyLang(geo);
        });
      };
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(applyGeo, { timeout: 3500 });
      } else {
        window.setTimeout(applyGeo, 0);
      }
    }

    const wrap = document.querySelector('.lang-switch');
    const toggle = document.getElementById('langToggle');
    const menu = document.getElementById('langMenu');
    if (toggle && menu && wrap) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = wrap.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-lang]');
        if (!li) return;
        applyLang(li.dataset.lang);
        wrap.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
      document.addEventListener('click', () => {
        wrap.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    }
  });
})();
