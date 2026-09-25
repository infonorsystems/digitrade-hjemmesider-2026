(function () {
  const ROOT = "";
  const path = location.pathname;
  const SUPPORTED_LANGS = ["no", "en", "de"];

  function getLangFromPath(pathname) {
    return pathname.startsWith('/en/') ? 'en' : pathname.startsWith('/de/') ? 'de' : 'no';
  }

  function stripLangPrefix(pathname) {
    if (pathname.startsWith('/en/')) return pathname.slice(3);
    if (pathname.startsWith('/de/')) return pathname.slice(3);
    return pathname;
  }

  function withLangPrefix(pathname, lang) {
    const cleanPath = stripLangPrefix(pathname);
    return lang === 'no' ? cleanPath : `/${lang}${cleanPath}`;
  }

  function detectBrowserLang() {
    const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]) || [];
    for (const lang of langs) {
      const code = String(lang || '').toLowerCase();
      if (code.startsWith('no') || code.startsWith('nb') || code.startsWith('nn') || code.startsWith('sv') || code.startsWith('da')) return 'no';
      if (code.startsWith('de')) return 'de';
      if (code.startsWith('en')) return 'en';
    }
    return 'en';
  }

  function maybeAutoRedirectByLanguage() {
    const url = new URL(location.href);
    const current = getLangFromPath(url.pathname);
    const paramLang = String(url.searchParams.get('lang') || '').toLowerCase();

    // Explicit ?lang=.. always wins and is persisted for future visits.
    if (SUPPORTED_LANGS.includes(paramLang)) {
      localStorage.setItem('preferredLang', paramLang);
      if (paramLang !== current) {
        url.pathname = withLangPrefix(url.pathname, paramLang);
        url.searchParams.delete('lang');
        location.replace(url.toString());
        return true;
      }
      url.searchParams.delete('lang');
      history.replaceState(null, '', url.toString());
      return false;
    }

    // Avoid loops and preserve explicit language URLs.
    if (current !== 'no') return false;
    if (sessionStorage.getItem('autoLangRedirectDone') === '1') return false;

    const stored = localStorage.getItem('preferredLang');
    const preferred = SUPPORTED_LANGS.includes(stored) ? stored : detectBrowserLang();
    if (preferred === 'no') return false;

    sessionStorage.setItem('autoLangRedirectDone', '1');
    url.pathname = withLangPrefix(url.pathname, preferred);
    location.replace(url.toString());
    return true;
  }

  if (maybeAutoRedirectByLanguage()) return;

  const currentLang = getLangFromPath(path);
  const langPrefix = currentLang === "no" ? "" : `/${currentLang}`;
  const isPresale = path.includes("digitrade-presale");
  const headerFile = `${ROOT}${langPrefix}${isPresale ? "/header-presale.html" : "/header.html"}`;
  const footerFile = `${ROOT}${langPrefix}/footer.html`;

  // Theme restore (localStorage wins)
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.documentElement.classList.add("dark");
  if (saved === "light") document.documentElement.classList.remove("dark");

  // Auto dark on first visit
  if (!saved) {
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      }
    } catch {}
  }

  const inject = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  const loadFragment = (id, file) => {
    const el = document.getElementById(id);
    if (el && el.innerHTML.trim()) return Promise.resolve();
    return fetch(file).then(r=>r.text()).then(html=>inject(id, html));
  };

  Promise.all([
    loadFragment("header", headerFile),
    loadFragment("footer", footerFile)
  ]).then(()=>{
    document.getElementById('current-year').innerText = new Date().getFullYear();
    wireLanguagePreference();
    setActiveNavLink();
    setActiveLangLink();
    wireThemeToggle();
    wireHamburgerMenu();
    showCookieBanner();
  });

  function normalise(href){ try{ const u=new URL(href, location.origin); return u.pathname.replace(/\/+$/,""); }catch{ return href; } }
  function setActiveNavLink(){
    const cur = normalise(location.pathname);
    const nav = document.querySelector('.site-header .main-menu'); if(!nav) return;
    const links = nav.querySelectorAll('a[href]');
    let best=null, score=-1;
    links.forEach(a=>{ const href=normalise(a.getAttribute('href')); let s=0; if(href===cur) s=2; else if(cur.startsWith(href) && href!=='' && href!=='/') s=1; if(s>score){best=a; score=s;} });
    if(best) best.classList.add('active');
  }
  function setActiveLangLink(){
    const langMenu = document.querySelector('.site-header .lang-menu'); if(!langMenu) return;
    const links = langMenu.querySelectorAll('a[href]');
    const currentPath = location.pathname;
    const currentLang = currentPath.startsWith('/en/') ? 'en' : currentPath.startsWith('/de/') ? 'de' : 'no';
    links.forEach(a => {
      const href = a.getAttribute('href');
      const hrefLang = href.startsWith('/en/') ? 'en' : href.startsWith('/de/') ? 'de' : 'no';
      if (hrefLang === currentLang) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }
  function wireLanguagePreference(){
    const langMenu = document.querySelector('.site-header .lang-menu'); if(!langMenu) return;
    const links = langMenu.querySelectorAll('a[href]');
    links.forEach(a => {
      a.addEventListener('click', () => {
        const href = a.getAttribute('href') || '';
        const hrefLang = href.startsWith('/en/') ? 'en' : href.startsWith('/de/') ? 'de' : 'no';
        localStorage.setItem('preferredLang', hrefLang);
      });
    });
  }
  function wireThemeToggle(){ const btn=document.querySelector('.theme-toggle'); if(!btn) return; btn.addEventListener('click',()=>{ const on=document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', on? 'dark':'light'); }); }
  function wireHamburgerMenu(){ const btn=document.querySelector('.hamburger'); if(!btn) return; btn.addEventListener('click',()=>{ document.body.classList.toggle('mobile-menu-open'); }); const links = document.querySelectorAll('.main-menu a'); links.forEach(link => { link.addEventListener('click', () => { document.body.classList.remove('mobile-menu-open'); }); }); }
  // Cookie consent banner
  function showCookieBanner() {
    const consent = localStorage.getItem('cookieConsent');
    const banner = document.getElementById('cookie-banner');
    if (!consent && banner) {
      banner.style.display = 'block';
      const btn = document.getElementById('cookie-accept');
      if (btn) {
        btn.addEventListener('click', function () {
          localStorage.setItem('cookieConsent', 'accepted');
          banner.style.display = 'none';
        });
      }
    }
  }

  function wireHeroImageLightbox() {
    const heroImgs = document.querySelectorAll('.sub-hero-media img, .hero-art img');
    if (!heroImgs.length) return;

    const style = document.createElement('style');
    style.textContent = `
      #lightbox-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.78);
        z-index: 2000;
        padding: 24px;
      }
      #lightbox-overlay.is-visible {
        display: flex;
      }
      body.lightbox-open {
        overflow: hidden;
      }
      .lightbox-panel {
        position: relative;
        max-width: min(90vw, 1100px);
        max-height: 90vh;
        padding: 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
      }
      #lightbox-image {
        display: block;
        max-width: 100%;
        max-height: 80vh;
        width: auto;
        height: auto;
        border-radius: 8px;
        object-fit: contain;
      }
      .lightbox-close {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: rgba(15, 23, 42, 0.8);
        color: #fff;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="lightbox-panel" role="dialog" aria-modal="true" aria-label="Forstørret bilde">
        <button class="lightbox-close" type="button" aria-label="Lukk bilde">×</button>
        <img id="lightbox-image" src="" alt="Forstørret bilde" />
      </div>
    `;
    document.body.appendChild(overlay);

    const lightboxImage = document.getElementById('lightbox-image');
    const closeBtn = overlay.querySelector('.lightbox-close');

    const closeLightbox = () => {
      overlay.classList.remove('is-visible');
      document.body.classList.remove('lightbox-open');
      overlay.setAttribute('aria-hidden', 'true');
    };

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('is-visible')) {
        closeLightbox();
      }
    });

    heroImgs.forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt || 'Forstørret bilde';
        overlay.classList.add('is-visible');
        document.body.classList.add('lightbox-open');
        overlay.setAttribute('aria-hidden', 'false');
      });
    });
  }

  wireHeroImageLightbox();
})();
