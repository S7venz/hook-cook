/**
 * Setup global Playwright : exécuté UNE fois avant tous les tests.
 *
 * - Vide les compteurs de rate-limit (Redis) pour ne pas être bloqué
 *   après quelques runs successifs.
 * - Vérifie que l'app est joignable (sinon, log clair plutôt que cascade
 *   de timeouts).
 */
import { execSync } from 'node:child_process'

export default async function globalSetup() {
  // 1. Flush Redis (rate-limit + idempotence webhooks)
  try {
    execSync('docker exec hook-cook-redis-1 redis-cli FLUSHDB', {
      stdio: 'ignore',
      timeout: 5_000,
    })
    console.log('[e2e] Redis flushed (rate-limit reset)')
  } catch {
    console.warn('[e2e] Impossible de flush Redis (container non lancé ?) — tests sensibles au rate-limit risquent d\'échouer')
  }

  // 2. Sanity check : l'app répond ?
  const base = process.env.HC_E2E_BASE || 'http://localhost:5173'
  try {
    const res = await fetch(base, { signal: AbortSignal.timeout(5_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    console.log(`[e2e] App accessible sur ${base}`)
  } catch (e) {
    console.error(`[e2e] App injoignable sur ${base} : ${e.message}`)
    console.error('[e2e] Lance \`docker compose up -d\` avant les tests.')
    process.exit(1)
  }
}
