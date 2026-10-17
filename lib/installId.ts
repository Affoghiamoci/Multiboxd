/**
 * Codice di installazione: un numero casuale generato la prima volta che si apre la pagina
 * di configurazione e scritto nella config. Serve solo a contare le installazioni in modo
 * stabile (resta uguale se cambi le impostazioni). Non contiene dati personali.
 */
const KEY = 'multiboxd.cid';
export const CID_RE = /^[A-Za-z0-9-]{16,64}$/;

export function ensureInstallId(existing?: string): string {
  if (existing && CID_RE.test(existing)) return existing;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && CID_RE.test(saved)) return saved;
  } catch { /* storage non disponibile */ }
  const id = crypto.randomUUID();
  try { localStorage.setItem(KEY, id); } catch { /* ignora */ }
  return id;
}
