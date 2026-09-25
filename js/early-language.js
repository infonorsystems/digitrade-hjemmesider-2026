(function () {
  const supported = ["no", "en", "de"];
  const requested = new URLSearchParams(location.search).get("lang");
  const stored = localStorage.getItem("preferredLang");
  const languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  const pageMap = {
    "index.html": "index.html",
    "digitrade.html": "digitrade.html",
    "digitrade-presale.html": "digitrade-presale.html",
    "kontakt.html": "contact.html",
    "om-oss.html": "about.html",
    "personvern.html": "privacy.html",
    "tjenester.html": "services.html"
  };
  let browserLang = "en";

  for (const language of languages) {
    const code = String(language || "").toLowerCase();
    if (code.startsWith("no") || code.startsWith("nb") || code.startsWith("nn") || code.startsWith("sv") || code.startsWith("da")) {
      browserLang = "no";
      break;
    }
    if (code.startsWith("de")) {
      browserLang = "de";
      break;
    }
    if (code.startsWith("en")) {
      browserLang = "en";
      break;
    }
  }

  const preferred = supported.includes(requested) ? requested : supported.includes(stored) ? stored : browserLang;
  if (preferred === "no") return;

  const targetPage = pageMap[location.pathname.split("/").pop()] || "index.html";
  sessionStorage.setItem("autoLangRedirectDone", "1");
  location.replace(`/${preferred}/${targetPage}`);
})();
