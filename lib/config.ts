/**
 * lib/config.ts
 * Encode/decode della configurazione Stremio nell'URL (Base64 URL-safe).
 * Nessun dato viene salvato server-side: tutto è nell'URL di installazione.
 */

export interface CustomList {
  slug: string;
  name?: string;
  shuffle?: boolean;
}

export interface CatalogConfig {
  friendsActivity: boolean;
  watchlist: boolean;
  diary: boolean;
  watched: boolean;
  recommendations: boolean;
  customLists: CustomList[];
}

export interface AddonConfig {
  tmdbKey?: string;
  rpdbKey?: string;
  rpdbStyle?: string;
  rpdbProvider?: string;
  language?: string;
  catalogPrefix?: string;
  hideAddonName?: boolean;
  hideHyphen?: boolean;
  watchlistName?: string;
  diaryName?: string;
  watchedName?: string;
  friendsName?: string;
  recommendationsName?: string;
  lbSessionToken?: string;
  lbUsername?: string;
  catalogs: CatalogConfig;
  catalogOrder?: string[];
}

const DEFAULT_CONFIG: AddonConfig = {
  tmdbKey: '',
  rpdbKey: '',
  rpdbStyle: 'poster-default',
  rpdbProvider: 'rpdb',
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

export function encodeConfig(config: AddonConfig): string {
  const json = JSON.stringify(config);
  // btoa non è disponibile in tutti i contesti Node, usiamo Buffer
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeConfig(encoded: string): AddonConfig {
  try {
    // Ripristina padding Base64 standard
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(json);

    // Migrate old string arrays to object array
    if (parsed.catalogs && Array.isArray(parsed.catalogs.customLists)) {
      parsed.catalogs.customLists = parsed.catalogs.customLists.map((item: string | CustomList) => {
        if (typeof item === 'string') {
          return { slug: item, name: '' };
        }
        return item;
      });
    }

    // Merge con defaults per garantire che tutti i campi esistano
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      catalogs: {
        ...DEFAULT_CONFIG.catalogs,
        ...(parsed.catalogs ?? {}),
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function isConfigValid(config: AddonConfig): boolean {
  return config.catalogs.friendsActivity || 
         config.catalogs.watchlist || 
         config.catalogs.diary || 
         config.catalogs.watched ||
         config.catalogs.customLists.length > 0;
}

/** Verifica la chiave TMDB con una chiamata leggera */
export async function validateTmdbKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Lista lingue supportate da TMDB (le più diffuse) */
export const TMDB_LANGUAGES = [
  { code: 'it-IT', label: '🇮🇹 Italiano' },
  { code: 'en-US', label: '🇺🇸 English (US)' },
  { code: 'en-GB', label: '🇬🇧 English (UK)' },
  { code: 'fr-FR', label: '🇫🇷 Français' },
  { code: 'de-DE', label: '🇩🇪 Deutsch' },
  { code: 'es-ES', label: '🇪🇸 Español' },
  { code: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
  { code: 'pt-PT', label: '🇵🇹 Português (Portugal)' },
  { code: 'ja-JP', label: '🇯🇵 日本語' },
  { code: 'ko-KR', label: '🇰🇷 한국어' },
  { code: 'zh-CN', label: '🇨🇳 中文 (简体)' },
  { code: 'zh-TW', label: '🇹🇼 中文 (繁體)' },
  { code: 'ru-RU', label: '🇷🇺 Русский' },
  { code: 'ar-SA', label: '🇸🇦 العربية' },
  { code: 'pl-PL', label: '🇵🇱 Polski' },
  { code: 'nl-NL', label: '🇳🇱 Nederlands' },
  { code: 'sv-SE', label: '🇸🇪 Svenska' },
  { code: 'tr-TR', label: '🇹🇷 Türkçe' },
  { code: 'hi-IN', label: '🇮🇳 हिन्दी' },
];
