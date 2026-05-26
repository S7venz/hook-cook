/**
 * Comptes utilisés par les tests E2E. Doivent correspondre au seed démo
 * (.env.example HC_SEED_DEMO=true) ou au compte admin créé au premier
 * boot via ADMIN_EMAIL / ADMIN_PASSWORD.
 */
export const ADMIN = {
  email: process.env.HC_E2E_ADMIN_EMAIL || 'admin@hookcook.fr',
  password: process.env.HC_E2E_ADMIN_PASSWORD || 'admin1234',
}

/**
 * Génère un email unique par run pour les tests qui créent un compte.
 * Évite les collisions entre runs successifs sans nettoyage de la DB.
 */
export function uniqueEmail(prefix = 'e2e') {
  // Domaine `.fr` plutôt que `.test` car le validator Apache de Grails
  // rejette les TLD non-IANA (les TLD `.test`/`.example`/`.local` passent
  // mais le validator commercial-validator d'Apache n'accepte que les
  // TLD réels).
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@hookcook.fr`
}
