import { createHash } from 'crypto';

/**
 * Crea un hash SHA-256 anonimo della config utente.
 * Stesso utente = stesso hash. Non è reversibile.
 */
function hashConfig(configStr: string): string {
  return createHash('sha256').update(configStr).digest('hex').slice(0, 16);
}

/**
 * Invia un evento di tracking alla Dashboard.
 * Fire-and-forget: non blocca la risposta all'utente in caso di errore.
 */
export async function trackEvent(
  addon: 'cagelog' | 'multiboxd',
  event: 'catalog_request' | 'manifest_request' | 'meta_request' | 'stream_request',
  configStr?: string
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
        configHash: configStr ? hashConfig(configStr) : undefined,
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Silenzioso: la dashboard potrebbe essere offline
  }
}
