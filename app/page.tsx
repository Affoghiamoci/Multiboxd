'use client';

import { useState, useEffect, useCallback } from 'react';
import { encodeConfig, decodeConfig, AddonConfig } from '@/lib/config';

const DEFAULT_CONFIG: AddonConfig = {
  tmdbKey: '',
  language: 'it-IT',
  catalogs: {
    friendsActivity: false,
    watchlist: false,
    diary: false,
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

// ── Toggle component ───────────────────────────────────────────────────────────
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
}: {
  title: string; subtitle: string;
  enabled?: boolean; onToggle?: (v: boolean) => void;
  nameValue: string; onNameChange: (v: string) => void;
  onDelete?: () => void; disabled?: boolean;
  onMoveUp?: () => void; onMoveDown?: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="catalog-item">
      <span className="catalog-grip"><GripIcon /></span>

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
        {onMoveUp && (
          <button type="button" className="edit-btn" style={{ opacity: 0.8, padding: '3px 6px', fontSize: '11px' }} onClick={onMoveUp} title="Move Up">
            ▲
          </button>
        )}
        {onMoveDown && (
          <button type="button" className="edit-btn" style={{ opacity: 0.8, padding: '3px 6px', fontSize: '11px' }} onClick={onMoveDown} title="Move Down">
            ▼
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
  const [config, setConfig] = useState<AddonConfig>(DEFAULT_CONFIG);
  const [encodedUrl, setEncodedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Letterboxd
  const [lbInput, setLbInput] = useState('');
  const [lbConnected, setLbConnected] = useState(false);

  // TMDB
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [tmdbStatus, setTmdbStatus] = useState<'idle' | 'ok' | 'err'>('idle');

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
    setEncodedUrl(`${baseUrl}/${encodeConfig(config)}/manifest.json`);
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

  function connectLb() {
    if (!lbInput.trim()) return;
    setConfig(prev => ({ ...prev, lbUsername: lbInput.trim() }));
    setLbConnected(true);
  }

  function disconnectLb() {
    setConfig(prev => ({
      ...prev,
      lbUsername: undefined,
      catalogs: { ...prev.catalogs, friendsActivity: false, watchlist: false, diary: false, recommendations: false },
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
  }

  const itemsToRender: CatalogItemData[] = [];

  if (config.lbUsername) {
    itemsToRender.push({
      id: 'lb-recommendations',
      title: 'Recommended',
      subtitle: 'Films recommended based on your taste',
      enabled: config.catalogs.recommendations,
      onToggle: (v) => updateCatalog('recommendations', v),
      nameValue: config.recommendationsName || '',
      onNameChange: (v) => update('recommendationsName', v),
      disabled: !config.tmdbKey,
    });
    itemsToRender.push({
      id: 'lb-diary',
      title: 'Diary',
      subtitle: 'Your recently watched films',
      enabled: config.catalogs.diary,
      onToggle: (v) => updateCatalog('diary', v),
      nameValue: config.diaryName || '',
      onNameChange: (v) => update('diaryName', v),
    });
    itemsToRender.push({
      id: 'lb-watchlist',
      title: 'Watchlist',
      subtitle: 'Films you want to watch',
      enabled: config.catalogs.watchlist,
      onToggle: (v) => updateCatalog('watchlist', v),
      nameValue: config.watchlistName || '',
      onNameChange: (v) => update('watchlistName', v),
    });
    itemsToRender.push({
      id: 'lb-friends',
      title: 'Friends Activity',
      subtitle: 'Recently watched by your friends',
      enabled: config.catalogs.friendsActivity,
      onToggle: (v) => updateCatalog('friendsActivity', v),
      nameValue: config.friendsName || '',
      onNameChange: (v) => update('friendsName', v),
    });
  }

  config.catalogs.customLists.forEach((list) => {
    const slug = typeof list === 'string' ? list : list.slug;
    const name = typeof list === 'object' && list.name ? list.name : '';
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
          return ls === slug ? { slug: ls, name: v } : l;
        });
        updateCatalog('customLists', newList);
      },
      onDelete: () => removeList(slug),
    });
  });

  const defaultOrder = ['lb-recommendations', 'lb-diary', 'lb-watchlist', 'lb-friends'];
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
          <div className="logo">
            <div className="logo-mark">🎬</div>
            <span className="logo-name">Multiboxd</span>
          </div>
          <p className="header-sub">Add Letterboxd catalogs directly to Stremio.</p>
        </header>

        {/* ── Letterboxd Profile ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">👤</div>
            <span className="card-title">Letterboxd Profile</span>
            <span className="card-badge">Optional</span>
          </div>
          <div className="card-body">
            <p className="card-desc">
              Enter your Letterboxd username to sync your public Watchlist, Diary and Friends Activity — no password needed.
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
                <button className="btn btn-primary btn-sm" onClick={connectLb} disabled={!lbInput.trim()}>
                  Connect
                </button>
              </div>
            ) : (
              <div className="connected-pill">
                <div className="connected-pill-label">
                  <span className="dot" />
                  Connected as <strong>@{config.lbUsername}</strong>
                </div>
                <button className="btn btn-danger btn-sm" onClick={disconnectLb}>Disconnect</button>
              </div>
            )}
          </div>
        </div>

        {/* ── TMDB ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">🔑</div>
            <span className="card-title">TMDB</span>
            <span className="card-badge">Optional</span>
          </div>
          <div className="card-body">
            <p className="card-desc">
              Provide a free TMDB API Key to enable localized posters (e.g. in Italian) and unlock the Recommended catalog. This key is used strictly for posters and recommendations, not for metadata.
            </p>

            <div className="field">
              <label className="label" htmlFor="tmdb-key">TMDB API Key</label>
              <div className="input-row">
                <input
                  id="tmdb-key"
                  className="input"
                  type={showKey ? 'text' : 'password'}
                  placeholder="e.g. e9b6b55e1..."
                  value={config.tmdbKey || ''}
                  onChange={e => { update('tmdbKey', e.target.value); setTmdbStatus('idle'); }}
                />
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowKey(v => !v)} title="Toggle visibility">
                  {showKey ? '🙈' : '👁️'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={validateTmdb} disabled={!config.tmdbKey || validating}>
                  {validating ? '…' : 'Verify'}
                </button>
              </div>
              {tmdbStatus === 'ok'  && <p className="status-ok">✓ Valid API Key</p>}
              {tmdbStatus === 'err' && <p className="status-err">✗ Invalid API Key</p>}
              <p className="input-hint">
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">Get your free API key here</a>.
              </p>
            </div>

            {config.tmdbKey && (
              <div className="field">
                <label className="label" htmlFor="language">Poster Language</label>
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

        {/* ── Catalogs ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">📚</div>
            <span className="card-title">Your Catalogs</span>
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
                  />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <p className="empty-state-text">
                    Connect your Letterboxd profile above to sync your Watchlist, Diary and Friends Activity.
                  </p>
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="field">
              <label className="label">Add a Custom List</label>
              <div className="input-row">
                <input
                  className="input"
                  type="text"
                  placeholder="Paste Letterboxd List URL…"
                  value={listInput}
                  onChange={e => setListInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addList()}
                />
                <button className="btn btn-primary btn-sm" onClick={addList} disabled={!listInput}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Global Settings ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-icon">⚙️</div>
            <span className="card-title">Global Settings</span>
          </div>
          <div className="card-body">
            <div className="field">
              <label className="label" htmlFor="catalog-prefix">Catalog Name Prefix</label>
              <input
                id="catalog-prefix"
                className="input"
                type="text"
                placeholder="e.g. Letterboxd"
                value={config.catalogPrefix || ''}
                onChange={e => update('catalogPrefix', e.target.value)}
              />
              <p className="input-hint">
                Catalogs will appear as <strong>{config.catalogPrefix || 'Letterboxd'} — Watchlist</strong> etc.
              </p>
            </div>
          </div>
        </div>

        {/* ── Install Card ── */}
        <div className="install-card">
          <p className="install-title">📡 Addon URL — ready to install</p>

          <div className="install-url-box">
            {encodedUrl
              ? encodedUrl
              : <span className="install-url-placeholder">Configure at least one catalog to generate the URL…</span>
            }
          </div>

          <div className="install-btns">
            <a
              href={stremioUrl}
              className={`btn btn-primary install-btn-primary${!encodedUrl ? ' btn-disabled' : ''}`}
              style={!encodedUrl ? { pointerEvents: 'none', opacity: 0.4 } : {}}
            >
              Install in Stremio
            </a>
            <a
              href={stremioWebUrl}
              className={`btn btn-ghost install-btn-secondary${!encodedUrl ? ' btn-disabled' : ''}`}
              style={!encodedUrl ? { pointerEvents: 'none', opacity: 0.4 } : {}}
              target="_blank"
              rel="noreferrer"
            >
              Stremio Web
            </a>
          </div>

          <button
            className="btn btn-ghost install-copy-btn"
            onClick={handleCopy}
            disabled={!encodedUrl}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* ── FAQ Section ── */}
        <div className="faq-section">
          <div className="faq-title">Frequently Asked Questions</div>

          <div className={`faq-item ${openFaq === 'q1' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q1')}>
              <span>What is Multiboxd?</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              Multiboxd is a Stremio add-on that allows you to integrate your Letterboxd catalogs directly into the application. You can sync your public Watchlist, Diary, Recommended films based on your taste, friends' activity, and add custom public lists.
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q2' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q2')}>
              <span>How does it differ from other similar add-ons?</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              Unlike other add-on configurations, Multiboxd does not provide its own metadata (such as descriptions, cast, trailers, etc.). Instead, it relies on the metadata already available in Stremio. This makes it lightweight and fully compatible with other metadata and playback add-ons you have installed, preventing duplicates or conflicts.
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q3' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q3')}>
              <span>How does the Recommended catalog work?</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              The add-on fetches your Letterboxd Diary history (specifically the first page), filters and selects your highest-rated films (assigning weights to each rating), and queries the TMDB API for similar films. These suggestions are then aggregated and sorted to deliver a highly personalized feed.
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q4' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q4')}>
              <span>Why do I need a TMDB API Key?</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              The TMDB (The Movie Database) API Key is optional but recommended. Because of how Stremio works, we do not fetch or store any metadata ourselves. The TMDB key is used strictly to retrieve localized posters (e.g. in Italian) in the catalog grid and is required to calculate recommendations (which are computed via TMDB services). It does not affect media playback or core metadata.
            </div>
          </div>

          <div className={`faq-item ${openFaq === 'q5' ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq('q5')}>
              <span>Why are descriptions or details missing in &quot;Show All&quot;?</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-a">
              By design, the add-on does not provide movie metadata to avoid conflicting with other add-ons. Descriptions, trailers, and other details in the catalog view are loaded automatically by Stremio from your other installed metadata add-ons (such as Cinematica or Stremio's default metadata).
            </div>
          </div>
        </div>

        {/* ── Donation Button ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
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
              gap: '8px',
              padding: '10px 20px',
              fontWeight: 600,
            }}
          >
            <span>☕</span>
            <span>Support me on Ko-fi</span>
          </a>
        </div>

        <div className="faq-footer">
          Developed with ♥ for the Stremio community
        </div>

      </div>
    </div>
  );
}
