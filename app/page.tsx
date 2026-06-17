'use client';

import { useState, useEffect, useCallback } from 'react';
import { encodeConfig, decodeConfig, AddonConfig } from '@/lib/config';


const TRANSLATIONS = {
  en: {
    sub: 'Add Letterboxd catalogs directly to Stremio.',
    lbProfile: 'Letterboxd Profile',
    lbDesc: 'Enter your Letterboxd username to sync your public Watchlist, Diary and Friends Activity — no password needed.',
    connect: 'Connect',
    disconnect: 'Disconnect',
    tmdbTitle: 'TMDB',
    tmdbDesc: 'Provide a free TMDB API Key to enable localized posters and titles (e.g. in Italian) and unlock the Recommended catalog. This key is used strictly for posters, titles and recommendations, not for core metadata.',
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
    hideAddonName: 'Hide Addon Name',
    hideHyphen: 'Hide Hyphen',
    installTitle: 'Addon URL — ready to install',
    installPlaceholder: 'Configure at least one catalog to generate the URL…',
    installStremio: 'Install in Stremio',
    installWeb: 'Stremio Web',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    faqTitle: 'Frequently Asked Questions',
    faq1q: 'What is Multiboxd?',
    faq1a: 'Multiboxd is a Stremio add-on that allows you to integrate your Letterboxd catalogs directly into the application. You can sync your public Watchlist, Diary, Recommended films based on your taste, friends\' activity, and add custom public lists.',
    faq2q: 'How does it differ from other similar add-ons?',
    faq2a: 'Unlike other add-on configurations, Multiboxd does not provide its own metadata (such as descriptions, cast, trailers, etc.). Instead, it relies on the metadata already available in Stremio. This makes it lightweight and fully compatible with other metadata and playback add-ons you have installed, preventing duplicates or conflicts.',
    faq3q: 'Why are descriptions or details missing in "Show All"?',
    faq3a: 'By design, the add-on does not provide movie metadata to avoid conflicting with other add-ons. Descriptions, trailers, and other details in the catalog view are loaded automatically by Stremio from your other installed metadata add-ons (such as Cinematica or Stremio\'s default metadata).',
    faq4q: 'Why do I need a TMDB API Key?',
    faq4a: 'The TMDB (The Movie Database) API Key is optional but recommended. Because of how Stremio works, we do not fetch or store any core metadata ourselves. The TMDB key is used strictly to retrieve localized posters and titles (e.g. in Italian) in the catalog grid and is required to calculate recommendations (which are computed via TMDB services). It does not affect media playback or core metadata.',
    faq5q: 'How does the Recommended catalog work?',
    faq5a: 'The add-on fetches your recently Watched films (specifically the first page) to find your recent highly-rated films. It queries the TMDB API for similar films, and then filters the results against your entire Watched list so you only get unseen recommendations.',
    faq6q: 'What are RPDB and OpenPosterDB, and where do I get the API Key?',
    faq6a: 'They are services that add ratings (like Letterboxd or IMDb) directly onto movie posters. OpenPosterDB is a free open-source alternative to RPDB. You can test RPDB by entering the public free key "t0-free-rpdb". However, since it is a shared key used by thousands of people, it might be slow. For a smooth experience and to customize the visual style, we recommend getting your own personal key from RPDB\'s Patreon or registering for a free key on OpenPosterDB.',
    faq7q: 'How often do the catalogs update?',
    faq7a: 'Your Watchlist updates approximately every hour. The Diary, Watched, Recommended films, Custom Lists, and Friends Activity catalogs update approximately every 12 hours.',
    support: 'Support me on Ko-fi',
    footer: 'Developed with ♥ for the Stremio community',
    connectedAs: 'Connected as',
    subRecommended: 'Films recommended based on your taste',
    subDiary: 'Your recently watched films',
    subWatched: 'All your watched films',
    subWatchlist: 'Films you want to watch',
    subFriends: 'Recently watched by your friends',
    voteText: 'Support me with a vote',
    rpdbTitle: 'Ratings on Posters',
    rpdbDesc: 'Enter your RPDB or OpenPosterDB API Key to enable posters with Letterboxd/IMDb ratings.',
    rpdbKeyLabel: 'API Key',
    rpdbProviderLabel: 'Provider',
    rpdbStyleLabel: 'Poster Style',
    rpdbStyleDefault: 'Default (Title & Ratings)',
    rpdbStyleTextless: 'Textless (Ratings only, no Title)',
    getRpdb: 'Get your RPDB API key here',
    getOpdb: 'Get your OPDB API key here'
  },
  it: {
    sub: 'Aggiungi i cataloghi Letterboxd direttamente su Stremio.',
    lbProfile: 'Profilo Letterboxd',
    lbDesc: 'Inserisci il tuo username Letterboxd per sincronizzare Watchlist, Diary e attività degli amici — nessuna password necessaria.',
    connect: 'Connetti',
    disconnect: 'Disconnetti',
    tmdbTitle: 'TMDB',
    tmdbDesc: 'Inserisci una API Key gratuita di TMDB per abilitare locandine e titoli localizzati e sbloccare i Film Consigliati. La chiave viene usata solo per le immagini, i titoli nel catalogo e i consigli, non per i metadati principali.',
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
    hideAddonName: 'Nascondi Nome Addon',
    hideHyphen: 'Nascondi Trattino',
    installTitle: 'URL Addon — pronto per l\'installazione',
    installPlaceholder: 'Configura almeno un catalogo per generare l\'URL…',
    installStremio: 'Installa in Stremio',
    installWeb: 'Stremio Web',
    copyLink: 'Copia Link',
    copied: 'Copiato!',
    faqTitle: 'Domande Frequenti',
    faq1q: 'Cos\'è Multiboxd?',
    faq1a: 'Multiboxd è un add-on per Stremio che ti permette di integrare i tuoi cataloghi Letterboxd direttamente nell\'applicazione. Puoi sincronizzare le tue Watchlist, il Diary, i film Consigliati in base ai tuoi gusti, le attività degli amici e aggiungere liste pubbliche personalizzate.',
    faq2q: 'Cosa lo differenzia da altri add-on simili?',
    faq2a: 'A differenza di altre configurazioni, Multiboxd non fornisce metadati propri (come descrizioni, cast, trailer, ecc.). Si appoggia invece a quelli già disponibili su Stremio. Questo lo rende molto leggero e totalmente compatibile con gli altri add-on che hai già installato, evitando fastidiosi duplicati o conflitti.',
    faq3q: 'Perché mancano le descrizioni o i dettagli in "Mostra Tutti"?',
    faq3a: 'L\'add-on non fornisce intenzionalmente i metadati dei film. Le descrizioni, i trailer e gli altri dettagli nella vista catalogo vengono caricati in automatico da Stremio e dagli altri add-on di metadati installati (come Cinematica o i metadati di default di Stremio).',
    faq4q: 'Perché mi serve una TMDB API Key?',
    faq4a: 'La TMDB API Key è opzionale ma fortemente raccomandata. La chiave viene usata strettamente per scaricare locandine e titoli localizzati (es. in italiano) nel grid del catalogo e per calcolare i film consigliati (che passano tramite i servizi di TMDB). Non influisce né sulla riproduzione né sui metadati principali.',
    faq5q: 'Come funziona il catalogo dei Film Consigliati?',
    faq5a: 'L\'add-on analizza la cronologia dei tuoi film Visti (nello specifico la prima pagina) per trovare i titoli recenti a cui hai dato il voto più alto. Interroga poi l\'API di TMDB per trovare film simili e filtra i risultati confrontandoli con tutta la tua lista dei film Visti (Watched), per suggerirti solo film che non hai ancora visto.',
    faq6q: 'Cosa sono RPDB e OpenPosterDB e dove trovo la API Key?',
    faq6a: 'Sono servizi che aggiungono i voti (come quelli di Letterboxd o IMDb) stampati direttamente sulle locandine. OpenPosterDB è l\'alternativa gratuita e open-source a RPDB. Puoi testare RPDB inserendo la chiave pubblica "t0-free-rpdb". Tuttavia, essendo condivisa con migliaia di persone, potrebbe essere lenta. Per un\'esperienza fluida ti consigliamo di ottenere una tua API Key personale tramite il Patreon di RPDB o registrandoti gratuitamente su OpenPosterDB.',
    faq7q: 'Ogni quanto si aggiornano i cataloghi?',
    faq7a: 'La tua Watchlist si aggiorna circa ogni ora. Il Diary, i film Visti (Watched), i Consigliati, le Liste Personalizzate e il catalogo dell\'Attività degli Amici si aggiornano circa ogni 12 ore.',
    support: 'Supportami su Ko-fi',
    footer: 'Sviluppato con ♥ per la community di Stremio',
    connectedAs: 'Connesso come',
    subRecommended: 'Film consigliati in base ai tuoi gusti',
    subDiary: 'I tuoi film visti di recente',
    subWatched: 'Tutti i tuoi film visti',
    subWatchlist: 'Film che vuoi vedere',
    subFriends: 'Visti di recente dai tuoi amici',
    voteText: 'Supportami con un voto',
    rpdbTitle: 'Voti sulle locandine',
    rpdbDesc: 'Inserisci la tua API Key di RPDB o OpenPosterDB per abilitare locandine con i voti.',
    rpdbKeyLabel: 'API Key',
    rpdbProviderLabel: 'Provider',
    rpdbStyleLabel: 'Stile Locandine',
    rpdbStyleDefault: 'Default (Titolo e Voti)',
    rpdbStyleTextless: 'Textless (Solo Voti, senza Titolo)',
    getRpdb: 'Ottieni la tua API key RPDB qui',
    getOpdb: 'Ottieni la tua API key OPDB qui'
  }
};

const DEFAULT_CONFIG: AddonConfig = {
  tmdbKey: '',
  language: 'it-IT',
  catalogs: {
    friendsActivity: false,
    watchlist: false,
    diary: false,
    watched: false,
    recommendations: false,
    customLists: [],
  },
};

// ── Icons ──────────────────────────────────────────────────────────────────────
const GripIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
    <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const ShuffleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
    <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
    <line x1="4" y1="4" x2="9" y2="9"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);


function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
      <span className="toggle-track" />
    </label>
  );
}

// ── CatalogItem ────────────────────────────────────────────────────────────────
function CatalogItem({
  title, subtitle, enabled, onToggle,
  nameValue, onNameChange, onDelete, disabled,
  onMoveUp, onMoveDown,
  shuffled, onShuffleToggle,
}: {
  title: string; subtitle: string;
  enabled?: boolean; onToggle?: (v: boolean) => void;
  nameValue: string; onNameChange: (v: string) => void;
  onDelete?: () => void; disabled?: boolean;
  onMoveUp?: () => void; onMoveDown?: () => void;
  shuffled?: boolean; onShuffleToggle?: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="catalog-item">
      <div className="catalog-arrows" style={{ display: 'flex', flexDirection: 'column', marginRight: '10px', opacity: 0.6 }}>
        <button type="button" onClick={onMoveUp} style={{ visibility: onMoveUp ? 'visible' : 'hidden', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '10px', padding: '2px 4px' }}>▲</button>
        <button type="button" onClick={onMoveDown} style={{ visibility: onMoveDown ? 'visible' : 'hidden', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '10px', padding: '2px 4px' }}>▼</button>
      </div>

      <div className="catalog-info">
        <div className="catalog-name-row">
          {editing ? (
            <input
              autoFocus
              className="catalog-name-input"
              value={nameValue}
              onChange={e => onNameChange(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={e => e.key === 'Enter' && setEditing(false)}
            />
          ) : (
            <>
              <span className="catalog-name">{nameValue || title}</span>
              <button type="button" className="edit-btn" onClick={() => setEditing(true)}>
                <PencilIcon />
              </button>
            </>
          )}
        </div>
        <span className="catalog-sub">{subtitle}</span>
      </div>

      <div className="catalog-right">
        {onShuffleToggle && (
          <button
            type="button"
            className={`catalog-shuffle${shuffled ? ' active' : ''}`}
            onClick={onShuffleToggle}
            title={shuffled ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <ShuffleIcon />
          </button>
        )}
        {onDelete && (
          <button type="button" className="catalog-delete" onClick={onDelete}>
            <TrashIcon />
          </button>
        )}
        {onToggle !== undefined && (
          <Toggle checked={!!enabled} onChange={onToggle} disabled={disabled} />
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ConfigPage() {
  const [uiLang, setUiLang] = useState<'it'|'en'>('en');
  const t = TRANSLATIONS[uiLang];
  const [config, setConfig] = useState<AddonConfig>(DEFAULT_CONFIG);
  const [encodedUrl, setEncodedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Letterboxd
  const [lbInput, setLbInput] = useState('');
  const [lbConnected, setLbConnected] = useState(false);

  // TMDB & RPDB
  const [showKey, setShowKey] = useState(false);
  const [showRpdbKey, setShowRpdbKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [tmdbStatus, setTmdbStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [rpdbValidating, setRpdbValidating] = useState(false);
  const [rpdbStatus, setRpdbStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  // Custom list input
  const [listInput, setListInput] = useState('');

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // ── Restore from URL ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const restore = params.get('restore');
      if (restore) {
        try {
          const restored = decodeConfig(restore);
          setConfig(restored);
          if (restored.lbUsername) {
            setLbInput(restored.lbUsername);
            setLbConnected(true);
          }
          if (restored.tmdbKey) {
            fetch(`https://api.themoviedb.org/3/configuration?api_key=${restored.tmdbKey}`)
              .then(res => setTmdbStatus(res.ok ? 'ok' : 'err'))
              .catch(() => setTmdbStatus('err'));
          }
        } catch (e) {
          console.error('Failed to restore config:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!config.lbUsername && !config.catalogs.friendsActivity && !config.catalogs.watchlist && !config.catalogs.diary && !config.catalogs.watched && config.catalogs.customLists.length === 0) {
      setEncodedUrl(`${baseUrl}/manifest.json`);
    } else {
      setEncodedUrl(`${baseUrl}/${encodeConfig(config)}/manifest.json`);
    }
  }, [config, baseUrl]);

  const update = useCallback(<K extends keyof AddonConfig>(k: K, v: AddonConfig[K]) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  }, []);

  const updateCatalog = useCallback(<K extends keyof AddonConfig['catalogs']>(
    k: K, v: AddonConfig['catalogs'][K]
  ) => {
    setConfig(prev => ({ ...prev, catalogs: { ...prev.catalogs, [k]: v } }));
  }, []);

  const toggleFaq = (id: string) => {
    setOpenFaq(prev => (prev === id ? null : id));
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function validateTmdb() {
    if (!config.tmdbKey) return;
    setValidating(true);
    setTmdbStatus('idle');
    try {
      const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${config.tmdbKey}`);
      setTmdbStatus(res.ok ? 'ok' : 'err');
    } catch {
      setTmdbStatus('err');
    }
    setValidating(false);
  }

  function validateRpdb() {
    if (!config.rpdbKey) return;
    setRpdbValidating(true);
    setRpdbStatus('idle');
    
    const domain = config.rpdbProvider === 'opdb' ? 'https://openposterdb.com/api' : 'https://api.ratingposterdb.com';
    const testUrl = `${domain}/${config.rpdbKey}/imdb/poster-default/tt0111161.jpg`;

    const img = new Image();
    img.onload = () => {
      setRpdbStatus('ok');
      setRpdbValidating(false);
    };
    img.onerror = () => {
      setRpdbStatus('err');
      setRpdbValidating(false);
    };
    img.src = testUrl;
  }

  function connectLb() {
    if (!lbInput.trim()) return;
    setConfig(prev => ({ ...prev, lbUsername: lbInput.trim() }));
    setLbConnected(true);
  }

  function disconnectLb() {
    setConfig(prev => ({
      ...prev,
      lbUsername: undefined,
      catalogs: { ...prev.catalogs, friendsActivity: false, watchlist: false, diary: false, watched: false, recommendations: false },
    }));
    setLbConnected(false);
    setLbInput('');
  }

  function addList() {
    if (!listInput) return;
    let url = listInput.split('?')[0].replace(/\/?$/, '/');
    const match = url.match(/letterboxd\.com\/([^\/]+\/list\/[^\/]+)/);
    let slug = '';
    if (match) {
      slug = match[1];
    } else {
      const parts = listInput.split('/').filter(Boolean);
      if (parts.length >= 3 && parts[1] === 'list') slug = `${parts[0]}/list/${parts[2]}`;
    }
    if (slug) {
      updateCatalog('customLists', [...config.catalogs.customLists, { slug, name: undefined }]);
      setListInput('');
    } else {
      alert('Invalid URL. Format: https://letterboxd.com/username/list/list-name/');
    }
  }

  function removeList(slug: string) {
    updateCatalog('customLists', config.catalogs.customLists.filter(l => (typeof l === 'string' ? l : l.slug) !== slug));
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(encodedUrl); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = encodedUrl;
      Object.assign(ta.style, { position: 'fixed', opacity: '0' });
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Catalog Reordering Data ──
  interface CatalogItemData {
    id: string;
    title: string;
    subtitle: string;
    enabled?: boolean;
    onToggle?: (v: boolean) => void;
    nameValue: string;
    onNameChange: (v: string) => void;
    onDelete?: () => void;
    disabled?: boolean;
    shuffled?: boolean;
    onShuffleToggle?: () => void;
  }

  const itemsToRender: CatalogItemData[] = [];

  if (config.lbUsername) {
    itemsToRender.push({
      id: 'lb-recommendations',
      title: 'Recommended',
      subtitle: t.subRecommended,
      enabled: config.catalogs.recommendations,
      onToggle: (v) => updateCatalog('recommendations', v),
      nameValue: config.recommendationsName || '',
      onNameChange: (v) => update('recommendationsName', v),
      disabled: !config.tmdbKey,
    });
    itemsToRender.push({
      id: 'lb-diary',
      title: 'Diary',
      subtitle: t.subDiary,
      enabled: config.catalogs.diary,
      onToggle: (v) => updateCatalog('diary', v),
      nameValue: config.diaryName || '',
      onNameChange: (v) => update('diaryName', v),
    });
    itemsToRender.push({
      id: 'lb-watched',
      title: 'Watched',
      subtitle: t.subWatched,
      enabled: config.catalogs.watched,
      onToggle: (v) => updateCatalog('watched', v),
      nameValue: config.watchedName || '',
      onNameChange: (v) => update('watchedName', v),
    });
    itemsToRender.push({
      id: 'lb-watchlist',
      title: 'Watchlist',
      subtitle: t.subWatchlist,
      enabled: config.catalogs.watchlist,
      onToggle: (v) => updateCatalog('watchlist', v),
      nameValue: config.watchlistName || '',
      onNameChange: (v) => update('watchlistName', v),
    });
    itemsToRender.push({
      id: 'lb-friends',
      title: 'Friends Activity',
      subtitle: t.subFriends,
      enabled: config.catalogs.friendsActivity,
      onToggle: (v) => updateCatalog('friendsActivity', v),
      nameValue: config.friendsName || '',
      onNameChange: (v) => update('friendsName', v),
    });
  }

  config.catalogs.customLists.forEach((list) => {
    const slug = typeof list === 'string' ? list : list.slug;
    const name = typeof list === 'object' && list.name ? list.name : '';
    const isShuffled = typeof list === 'object' && !!list.shuffle;
    const safeSlug = slug.replace(/\//g, '__');
    const display = name || slug.split('/').pop()?.split('-').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ') || slug;

    itemsToRender.push({
      id: `lb-list-${safeSlug}`,
      title: display,
      subtitle: `by ${slug.split('/')[0]}`,
      nameValue: name,
      onNameChange: (v) => {
        const newList = config.catalogs.customLists.map((l) => {
          const ls = typeof l === 'string' ? l : l.slug;
          return ls === slug ? { slug: ls, name: v, shuffle: typeof l === 'object' ? l.shuffle : undefined } : l;
        });
        updateCatalog('customLists', newList);
      },
      onDelete: () => removeList(slug),
      shuffled: isShuffled,
      onShuffleToggle: () => {
        const newList = config.catalogs.customLists.map((l) => {
          const ls = typeof l === 'string' ? l : l.slug;
          if (ls === slug) {
            const current = typeof l === 'object' ? l : { slug: l };
            return { ...current, shuffle: !current.shuffle };
          }
          return l;
        });
        updateCatalog('customLists', newList);
      },
    });
  });

  const defaultOrder = ['lb-recommendations', 'lb-diary', 'lb-watched', 'lb-watchlist', 'lb-friends'];
  const customListIds = config.catalogs.customLists.map(l => `lb-list-${(typeof l === 'string' ? l : l.slug).replace(/\//g, '__')}`);
  const fullOrder = Array.from(new Set([...(config.catalogOrder || []), ...defaultOrder, ...customListIds]));

  const sortedItems = itemsToRender.sort((a, b) => {
    return fullOrder.indexOf(a.id) - fullOrder.indexOf(b.id);
  });

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sortedItems.length) return;

    const newOrder = sortedItems.map(item => item.id);
    const temp = newOrder[index];
    newOrder[index] = newOrder[nextIndex];
    newOrder[nextIndex] = temp;

    update('catalogOrder', newOrder);
  };

  const stremioUrl    = encodedUrl ? `stremio://${encodedUrl.replace(/^https?:\/\//, '')}` : '#';
  const stremioWebUrl = encodedUrl ? `https://web.stremio.com/#?addonOpen=${encodeURIComponent(encodedUrl)}` : '#';

  return (
    <div className="page">
      <div className="container">

        {/* ── Header ── */}
        <header className="header">
          <div className="logo" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <div className="logo-mark" style={{ background: 'transparent', boxShadow: 'none' }}><img src="/icon.png" alt="Logo" width={40} height={40} style={{ borderRadius: '10px' }} /></div>
            <span className="logo-name" style={{ marginRight: '8px' }}>Multiboxd</span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, background: 'var(--surface-2)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              v0.3.1
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green)', boxShadow: '0 0 8px var(--green)' }}></span>
            </span>
          </div>
          <p className="header-sub">{t.sub}</p>
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '8px' }}>
            <button className={`btn btn-sm ${uiLang === 'it' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setUiLang('it')}>IT</button>
            <button className={`btn btn-sm ${uiLang === 'en' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setUiLang('en')}>EN</button>
          </div>
        </header>

        {/* ── Letterboxd Profile ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">👤</div>
            <span className="card-title">{t.lbProfile}</span>
          </div>
          <div className="card-body">
            <p className="card-desc">
              {t.lbDesc}
            </p>

            {!lbConnected ? (
              <div className="input-row">
                <input
                  className="input"
                  type="text"
                  placeholder="Username (e.g. dave)"
                  value={lbInput}
                  onChange={e => setLbInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && connectLb()}
                />
                <button className="btn btn-primary btn-sm" onClick={connectLb} disabled={!lbInput.trim()}>{t.connect}</button>
              </div>
            ) : (
              <div className="connected-pill">
                <div className="connected-pill-label">
                  <span className="dot" />
                  {t.connectedAs} <strong>@{config.lbUsername}</strong>
                </div>
                <button className="btn btn-danger btn-sm" onClick={disconnectLb}>{t.disconnect}</button>
              </div>
            )}
          </div>
        </div>

        {/* ── TMDB ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">🔑</div>
            <span className="card-title">{t.tmdbTitle}</span>
            <span className="card-badge">Optional</span>
          </div>
          <div className="card-body">
            <p className="card-desc">{t.tmdbDesc}</p>

            <div className="field">
              <label className="label" htmlFor="tmdb-key">{t.tmdbKeyLabel}</label>
              <div className="input-row">
                <div className="input-with-icon">
                  <input
                    id="tmdb-key"
                    className="input input-has-icon"
                    type={showKey ? 'text' : 'password'}
                    placeholder="e.g. e9b6b55e1..."
                    value={config.tmdbKey || ''}
                    onChange={e => { update('tmdbKey', e.target.value); setTmdbStatus('idle'); }}
                  />
                  <button className="input-icon-btn" onClick={() => setShowKey(v => !v)} title="Toggle visibility" type="button">
                    {showKey ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <button className="btn btn-primary btn-sm" onClick={validateTmdb} disabled={!config.tmdbKey || validating}>
                  {validating ? '…' : t.verify}
                </button>
              </div>
              {tmdbStatus === 'ok'  && <p className="status-ok">✓ {t.validKey}</p>}
              {tmdbStatus === 'err' && <p className="status-err">✗ {t.invalidKey}</p>}
              <p className="input-hint">
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">{t.getKey}</a>.
              </p>
            </div>

            {config.tmdbKey && (
              <div className="field">
                <label className="label" htmlFor="language">{t.posterLang}</label>
                <select
                  id="language"
                  className="select"
                  value={config.language || 'it-IT'}
                  onChange={e => update('language', e.target.value)}
                >
                  <option value="it-IT">🇮🇹 Italiano (it-IT)</option>
                  <option value="en-US">🇺🇸 English (en-US)</option>
                  <option value="es-ES">🇪🇸 Español (es-ES)</option>
                  <option value="fr-FR">🇫🇷 Français (fr-FR)</option>
                  <option value="de-DE">🇩🇪 Deutsch (de-DE)</option>
                  <option value="pt-BR">🇧🇷 Português (pt-BR)</option>
                  <option value="ja-JP">🇯🇵 日本語 (ja-JP)</option>
                  <option value="ko-KR">🇰🇷 한국어 (ko-KR)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── RPDB ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">⭐</div>
            <span className="card-title">{t.rpdbTitle}</span>
            <span className="card-badge">Optional</span>
          </div>
          <div className="card-body">
            <p className="card-desc">{t.rpdbDesc}</p>

            <div className="field">
              <label className="label" htmlFor="rpdb-provider">{t.rpdbProviderLabel}</label>
              <select
                id="rpdb-provider"
                className="select"
                value={config.rpdbProvider || 'rpdb'}
                onChange={e => { update('rpdbProvider', e.target.value); setRpdbStatus('idle'); }}
              >
                <option value="rpdb">RPDB</option>
                <option value="opdb">OpenPosterDB</option>
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="rpdb-key">{t.rpdbKeyLabel}</label>
              <div className="input-row">
                <div className="input-with-icon">
                  <input
                    id="rpdb-key"
                    className="input input-has-icon"
                    type={showRpdbKey ? 'text' : 'password'}
                    placeholder="e.g. t1-xyz..."
                    value={config.rpdbKey || ''}
                    onChange={e => { update('rpdbKey', e.target.value); setRpdbStatus('idle'); }}
                  />
                  <button className="input-icon-btn" onClick={() => setShowRpdbKey(v => !v)} title="Toggle visibility" type="button">
                    {showRpdbKey ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <button className="btn btn-primary btn-sm" onClick={validateRpdb} disabled={!config.rpdbKey || rpdbValidating}>
                  {rpdbValidating ? '…' : t.verify}
                </button>
              </div>
              {rpdbStatus === 'ok'  && <p className="status-ok">✓ {t.validKey}</p>}
              {rpdbStatus === 'err' && <p className="status-err">✗ {t.invalidKey}</p>}
              <p className="input-hint">
                <a 
                  href={config.rpdbProvider === 'opdb' ? "https://openposterdb.com" : "https://ratingposterdb.com/"} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  {config.rpdbProvider === 'opdb' ? t.getOpdb : t.getRpdb}
                </a>.
              </p>
            </div>

            <div className="field">
              <label className="label" htmlFor="rpdb-style">{t.rpdbStyleLabel}</label>
              <select
                id="rpdb-style"
                className="select"
                value={config.rpdbStyle || 'poster-default'}
                onChange={e => update('rpdbStyle', e.target.value)}
              >
                <option value="poster-default">{t.rpdbStyleDefault}</option>
                <option value="poster-textless">{t.rpdbStyleTextless}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Catalogs ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">📚</div>
            <span className="card-title">{t.catalogsTitle}</span>
          </div>
          <div className="card-body">
            <div className="catalog-list">
              {config.lbUsername || config.catalogs.customLists.length > 0 ? (
                sortedItems.map((item, index) => (
                  <CatalogItem
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    enabled={item.enabled}
                    onToggle={item.onToggle}
                    nameValue={item.nameValue}
                    onNameChange={item.onNameChange}
                    onDelete={item.onDelete}
                    disabled={item.disabled}
                    onMoveUp={index > 0 ? () => moveItem(index, 'up') : undefined}
                    onMoveDown={index < sortedItems.length - 1 ? () => moveItem(index, 'down') : undefined}
                    shuffled={item.shuffled}
                    onShuffleToggle={item.onShuffleToggle}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <p className="empty-state-text">
                    {t.emptyCatalogs}
                  </p>
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="field">
              <label className="label">{t.addCustomList}</label>
              <div className="input-row">
                <input
                  className="input"
                  type="text"
                  placeholder={t.addListPlaceholder}
                  value={listInput}
                  onChange={e => setListInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addList()}
                />
                <button className="btn btn-primary btn-sm" onClick={addList} disabled={!listInput}>{t.addBtn}</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Global Settings ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">⚙️</div>
            <span className="card-title">{t.globalSettings}</span>
          </div>
          <div className="card-body">
            <div className="field">
              <label className="label" htmlFor="catalog-prefix">{t.prefixLabel}</label>
              <input
                id="catalog-prefix"
                className="input"
                type="text"
                placeholder="e.g. Multiboxd"
                value={config.catalogPrefix || ''}
                onChange={e => update('catalogPrefix', e.target.value)}
              />
              <p className="input-hint">
                {t.prefixHint1} <strong>
                  {!config.hideAddonName && `${config.catalogPrefix || 'Multiboxd'} `}
                  {!config.hideAddonName && !config.hideHyphen && '— '}
                  Watchlist
                </strong>
              </p>
            </div>
            
            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <Toggle checked={!!config.hideAddonName} onChange={v => update('hideAddonName', v)} />
              <label className="label" style={{ margin: 0, cursor: 'pointer' }} onClick={() => update('hideAddonName', !config.hideAddonName)}>{t.hideAddonName}</label>
            </div>

            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '4px', opacity: config.hideAddonName ? 0.5 : 1, pointerEvents: config.hideAddonName ? 'none' : 'auto' }}>
              <Toggle checked={!!config.hideHyphen} onChange={v => update('hideHyphen', v)} disabled={!!config.hideAddonName} />
              <label className="label" style={{ margin: 0, cursor: 'pointer' }} onClick={() => !config.hideAddonName && update('hideHyphen', !config.hideHyphen)}>{t.hideHyphen}</label>
            </div>
          </div>
        </div>

        {/* ── Install Card ── */}
        <div className="install-card">
          <p className="install-title">📡 {t.installTitle}</p>

          <div className="install-url-box">
            {encodedUrl
              ? encodedUrl
              : <span className="install-url-placeholder">{t.installPlaceholder}</span>
            }
          </div>

          <div className="install-btns">
            <a
              href={stremioUrl}
              className={`btn btn-primary install-btn-primary${!encodedUrl ? ' btn-disabled' : ''}`}
              style={!encodedUrl ? { pointerEvents: 'none', opacity: 0.4 } : {}}
            >{t.installStremio}</a>
            <a
              href={stremioWebUrl}
              className={`btn btn-ghost install-btn-secondary${!encodedUrl ? ' btn-disabled' : ''}`}
              style={!encodedUrl ? { pointerEvents: 'none', opacity: 0.4 } : {}}
              target="_blank"
              rel="noreferrer"
            >{t.installWeb}</a>
          </div>

          <button
            className="btn btn-ghost install-copy-btn"
            onClick={handleCopy}
            disabled={!encodedUrl}
          >
            {copied ? `✓ ${t.copied}` : t.copyLink}
          </button>
        </div>

        {/* ── FAQ Section ── */}
        <div className="faq-section">
          <div className="faq-title">{t.faqTitle}</div>

          <div className={`faq-item ${openFaq === 'q1' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q1')}>
              <span>{t.faq1q}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              {t.faq1a}
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q2' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q2')}>
              <span>{t.faq2q}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              {t.faq2a}
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q3' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q3')}>
              <span>{t.faq3q}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              {t.faq3a}
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q4' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q4')}>
              <span>{t.faq4q}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              {t.faq4a}
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q5' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q5')}>
              <span>{t.faq5q}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              {t.faq5a}
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q6' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q6')}>
              <span>{t.faq6q}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              {t.faq6a}
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q7' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q7')}>
              <span>{t.faq7q}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              {t.faq7a}
            </div>
          </div>
        </div>

        {/* ── Donation Button ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
          <a
            href="https://ko-fi.com/affogo"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{
              backgroundColor: '#FF5E5B',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(255, 94, 91, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minWidth: '200px',
              gap: '8px',
              padding: '10px 20px',
              fontWeight: 600,
            }}
          >
            <span>☕</span>
            <span>{t.support}</span>
          </a>
          <a
            href="https://stremio-addons.net/addons/multiboxd"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{
              backgroundColor: '#8a5aeb',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(138, 90, 235, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minWidth: '200px',
              gap: '8px',
              padding: '10px 20px',
              fontWeight: 600,
            }}
          >
            <span>⭐</span>
            <span>{t.voteText}</span>
          </a>
        </div>

        <div className="faq-footer">
          Developed with ♥ for the Stremio community
        </div>

      </div>
    </div>
  );
}
