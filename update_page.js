const fs = require('fs');

let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Rimuovere badge "Optional" da Letterboxd
code = code.replace(
  /<span className="card-badge">Optional<\/span>\s*<\/div>\s*<div className="card-body">\s*<p className="card-desc">\s*Enter your Letterboxd username/m,
  `</div>
          <div className="card-body">
            <p className="card-desc">
              {t.lbDesc}`
);

// 2. Modificare il GripIcon in frecce e rimuoverle dalla destra
code = code.replace(
  /<span className="catalog-grip"><GripIcon \/><\/span>/,
  `<div className="catalog-arrows" style={{ display: 'flex', flexDirection: 'column', marginRight: '10px', opacity: 0.6 }}>
        <button type="button" onClick={onMoveUp} style={{ visibility: onMoveUp ? 'visible' : 'hidden', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '10px', padding: '2px 4px' }}>▲</button>
        <button type="button" onClick={onMoveDown} style={{ visibility: onMoveDown ? 'visible' : 'hidden', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '10px', padding: '2px 4px' }}>▼</button>
      </div>`
);

code = code.replace(
  /\{onMoveUp && \(\s*<button type="button" className="edit-btn"[^>]+>\s*▲\s*<\/button>\s*\)\}\s*\{onMoveDown && \(\s*<button type="button" className="edit-btn"[^>]+>\s*▼\s*<\/button>\s*\)\}/m,
  ''
);

// 3. Sostituire 🎬 con l'icona
code = code.replace(
  /<div className="logo-mark">🎬<\/div>/,
  `<div className="logo-mark" style={{ background: 'transparent', boxShadow: 'none' }}><img src="/icon.png" alt="Logo" width={40} height={40} style={{ borderRadius: '10px' }} /></div>`
);

// 4. Aggiungere le traduzioni e lo stato della lingua
const translationsObj = `
const TRANSLATIONS = {
  en: {
    sub: 'Add Letterboxd catalogs directly to Stremio.',
    lbProfile: 'Letterboxd Profile',
    lbDesc: 'Enter your Letterboxd username to sync your public Watchlist, Diary and Friends Activity — no password needed.',
    connect: 'Connect',
    disconnect: 'Disconnect',
    tmdbTitle: 'TMDB',
    tmdbDesc: 'Provide a free TMDB API Key to enable localized posters (e.g. in Italian) and unlock the Recommended catalog. This key is used strictly for posters and recommendations, not for metadata.',
    tmdbKeyLabel: 'TMDB API Key',
    verify: 'Verify',
    validKey: 'Valid API Key',
    invalidKey: 'Invalid API Key',
    getKey: 'Get your free API key here',
    posterLang: 'Poster Language',
    catalogsTitle: 'Your Catalogs',
    emptyCatalogs: 'Connect your Letterboxd profile above to sync your Watchlist, Diary and Friends Activity.',
    addCustomList: 'Add a Custom List',
    addListPlaceholder: 'Paste Letterboxd List URL…',
    addBtn: 'Add',
    globalSettings: 'Global Settings',
    prefixLabel: 'Catalog Name Prefix',
    prefixHint1: 'Catalogs will appear as',
    prefixHint2: '— Watchlist etc.',
    installTitle: 'Addon URL — ready to install',
    installPlaceholder: 'Configure at least one catalog to generate the URL…',
    installStremio: 'Install in Stremio',
    installWeb: 'Stremio Web',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    faqTitle: 'Frequently Asked Questions',
    support: 'Support me on Ko-fi',
    footer: 'Developed with ♥ for the Stremio community'
  },
  it: {
    sub: 'Aggiungi i cataloghi Letterboxd direttamente su Stremio.',
    lbProfile: 'Profilo Letterboxd',
    lbDesc: 'Inserisci il tuo username Letterboxd per sincronizzare Watchlist, Diary e attività degli amici — nessuna password necessaria.',
    connect: 'Connetti',
    disconnect: 'Disconnetti',
    tmdbTitle: 'TMDB',
    tmdbDesc: 'Inserisci una API Key gratuita di TMDB per abilitare le locandine localizzate e sbloccare i Film Consigliati. La chiave viene usata solo per le immagini e i consigli, non per i metadati.',
    tmdbKeyLabel: 'TMDB API Key',
    verify: 'Verifica',
    validKey: 'API Key Valida',
    invalidKey: 'API Key Non Valida',
    getKey: 'Ottieni la tua API key gratuita qui',
    posterLang: 'Lingua Locandine',
    catalogsTitle: 'I Tuoi Cataloghi',
    emptyCatalogs: 'Connetti il tuo profilo Letterboxd qui sopra per sincronizzare Watchlist, Diary e le attività degli amici.',
    addCustomList: 'Aggiungi Lista Personalizzata',
    addListPlaceholder: 'Incolla URL Lista Letterboxd…',
    addBtn: 'Aggiungi',
    globalSettings: 'Impostazioni Globali',
    prefixLabel: 'Prefisso Nome Catalogo',
    prefixHint1: 'I cataloghi appariranno come',
    prefixHint2: '— Watchlist ecc.',
    installTitle: 'URL Addon — pronto per l\\'installazione',
    installPlaceholder: 'Configura almeno un catalogo per generare l\\'URL…',
    installStremio: 'Installa in Stremio',
    installWeb: 'Stremio Web',
    copyLink: 'Copia Link',
    copied: 'Copiato!',
    faqTitle: 'Domande Frequenti',
    support: 'Supportami su Ko-fi',
    footer: 'Sviluppato con ♥ per la community di Stremio'
  }
};
`;

code = code.replace("const DEFAULT_CONFIG: AddonConfig = {", translationsObj + "\nconst DEFAULT_CONFIG: AddonConfig = {");

// 5. Inserire lo stato `uiLang`
code = code.replace(
  /const \[config, setConfig\] = useState<AddonConfig>\(DEFAULT_CONFIG\);/,
  `const [uiLang, setUiLang] = useState<'it'|'en'>('en');\n  const t = TRANSLATIONS[uiLang];\n  const [config, setConfig] = useState<AddonConfig>(DEFAULT_CONFIG);`
);

// 6. Sostituire le stringhe con {t.xxx}
code = code.replace(/>Add Letterboxd catalogs directly to Stremio\.<\/p>/, ">{t.sub}</p>\n          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '8px' }}>\n            <button className={`btn btn-sm ${uiLang === 'it' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setUiLang('it')}>IT</button>\n            <button className={`btn btn-sm ${uiLang === 'en' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setUiLang('en')}>EN</button>\n          </div>");
code = code.replace(/<span className="card-title">Letterboxd Profile<\/span>/, `<span className="card-title">{t.lbProfile}</span>`);
code = code.replace(/>\s*Connect\s*<\/button>/, ">{t.connect}</button>");
code = code.replace(/>Disconnect<\/button>/, ">{t.disconnect}</button>");
code = code.replace(/<span className="card-title">TMDB<\/span>/, `<span className="card-title">{t.tmdbTitle}</span>`);
code = code.replace(/<p className="card-desc">\s*Provide a free TMDB API Key[^<]+<\/p>/, `<p className="card-desc">{t.tmdbDesc}</p>`);
code = code.replace(/<label className="label" htmlFor="tmdb-key">TMDB API Key<\/label>/, `<label className="label" htmlFor="tmdb-key">{t.tmdbKeyLabel}</label>`);
code = code.replace(/\{validating \? '…' : 'Verify'\}/, `{validating ? '…' : t.verify}`);
code = code.replace(/✓ Valid API Key/, `✓ {t.validKey}`);
code = code.replace(/✗ Invalid API Key/, `✗ {t.invalidKey}`);
code = code.replace(/>Get your free API key here<\/a>/, `>{t.getKey}</a>`);
code = code.replace(/<label className="label" htmlFor="language">Poster Language<\/label>/, `<label className="label" htmlFor="language">{t.posterLang}</label>`);
code = code.replace(/<span className="card-title">Your Catalogs<\/span>/, `<span className="card-title">{t.catalogsTitle}</span>`);
code = code.replace(/Connect your Letterboxd profile above to sync your Watchlist, Diary and Friends Activity\./, `{t.emptyCatalogs}`);
code = code.replace(/<label className="label">Add a Custom List<\/label>/, `<label className="label">{t.addCustomList}</label>`);
code = code.replace(/placeholder="Paste Letterboxd List URL…"/, `placeholder={t.addListPlaceholder}`);
code = code.replace(/>\s*Add\s*<\/button>/, ">{t.addBtn}</button>");
code = code.replace(/<span className="card-title">Global Settings<\/span>/, `<span className="card-title">{t.globalSettings}</span>`);
code = code.replace(/<label className="label" htmlFor="catalog-prefix">Catalog Name Prefix<\/label>/, `<label className="label" htmlFor="catalog-prefix">{t.prefixLabel}</label>`);
code = code.replace(/Catalogs will appear as <strong>\{config\.catalogPrefix \|\| 'Letterboxd'\} — Watchlist<\/strong> etc\./, `{t.prefixHint1} <strong>{config.catalogPrefix || 'Letterboxd'} {t.prefixHint2}</strong>`);
code = code.replace(/<p className="install-title">📡 Addon URL — ready to install<\/p>/, `<p className="install-title">📡 {t.installTitle}</p>`);
code = code.replace(/>Configure at least one catalog to generate the URL…<\/span>/, `>{t.installPlaceholder}</span>`);
code = code.replace(/>\s*Install in Stremio\s*<\/a>/, ">{t.installStremio}</a>");
code = code.replace(/>\s*Stremio Web\s*<\/a>/, ">{t.installWeb}</a>");
code = code.replace(/\{copied \? '✓ Copied!' : 'Copy Link'\}/, `{copied ? \`✓ \${t.copied}\` : t.copyLink}`);
code = code.replace(/<div className="faq-title">Frequently Asked Questions<\/div>/, `<div className="faq-title">{t.faqTitle}</div>`);
code = code.replace(/>Support me on Ko-fi<\/span>/, `>{t.support}</span>`);
code = code.replace(/Developed with ♥ for the Stremio community/, `{t.footer}`);

fs.writeFileSync('app/page.tsx', code);
console.log('Fatto!');
