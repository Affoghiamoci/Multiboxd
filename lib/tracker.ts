import { createHash, createHmac } from 'crypto';

/**
 * Crea un hash SHA-256 anonimo della config utente.
 * Stesso utente = stesso hash. Non è reversibile.
 */
function hashConfig(configStr: string): string {
  return createHash('sha256').update(configStr).digest('hex').slice(0, 16);
}

/**
 * Identità stabile dell'utente: l'account Letterboxd (minuscolo), così chi cambia
 * impostazioni, token o dispositivo resta lo stesso utente. Il nome è pubblico, quindi
 * l'hash usa la chiave segreta (HMAC): senza chiave non si risale al nome.
 * Senza account Letterboxd si ricade sull'hash dell'intera config, come prima.
 */
export function identityHash(configStr: string, lbUsername?: string): string {
  const name = lbUsername?.trim().toLowerCase();
  const secret = process.env.ADDON_SECRET;
  if (name && secret) return createHmac('sha256', secret).update(`lb:${name}`).digest('hex').slice(0, 16);
  return hashConfig(configStr);
}

/**
 * Invia un evento di tracking alla Dashboard.
 * Fire-and-forget: non blocca la risposta all'utente in caso di errore.
 */
export async function trackEvent(
  addon: 'cagelog' | 'multiboxd',
  event: 'catalog_request' | 'manifest_request' | 'meta_request' | 'stream_request',
  configStr?: string,
  lbUsername?: string
): Promise<void> {
  const dashboardUrl = process.env.DASHBOARD_URL;
  const addonSecret  = process.env.ADDON_SECRET;

  if (!dashboardUrl) return;

  try {
    await fetch(`${dashboardUrl}/api/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(addonSecret ? { 'x-addon-secret': addonSecret } : {}),
      },
      body: JSON.stringify({
        addon,
        event,
        configHash: configStr ? identityHash(configStr, lbUsername) : undefined,
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Silenzioso: la dashboard potrebbe essere offline
  }
}
