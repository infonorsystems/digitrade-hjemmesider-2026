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

  Promise.all([
    fetch(headerFile).then(r=>r.text()).then(h=>inject("header", h)),
    fetch(footerFile).then(r=>r.text()).then(f=>inject("footer", f))
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
})();
