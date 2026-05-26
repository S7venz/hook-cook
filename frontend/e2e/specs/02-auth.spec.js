import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import { ADMIN, uniqueEmail } from '../fixtures/users.js'

/**
 * Scénario n°2 — Authentification
 *
 * - login admin → accès au tableau de bord admin
 * - création de compte → connexion automatique
 * - login avec mauvais mot de passe → message d'erreur (rate-limit Redis
 *   testé séparément côté backend Spock).
 *
 * Avant chaque test on flush Redis pour éviter d'être rate-limité par
 * une exécution antérieure (LOGIN_MAX=5 par (IP,email) sur 10 min).
 */
test.describe.configure({ mode: 'serial' })
test.describe('Auth — login + inscription', () => {
  test.beforeEach(() => {
    try {
      execSync('docker exec hook-cook-redis-1 redis-cli FLUSHDB', { stdio: 'ignore', timeout: 3000 })
    } catch { /* ignore */ }
  })
  test('login admin → /admin accessible', async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel('Email').fill(ADMIN.email)
    await page.getByLabel('Mot de passe').fill(ADMIN.password)
    await page.getByRole('button', { name: /Se connecter/i }).click()

    // LoginPage redirige vers /compte (ou ?next) après succès
    await page.waitForURL(/\/(compte|admin)/, { timeout: 10_000 })

    // L'admin peut maintenant atteindre /admin
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  })

  test('login avec mauvais mot de passe → message d\'erreur', async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel('Email').fill(ADMIN.email)
    await page.getByLabel('Mot de passe').fill('mot-de-passe-bidon')
    await page.getByRole('button', { name: /Se connecter/i }).click()

    // Le composant LoginPage affiche un div.error en cas d'échec
    await expect(page.locator('.error')).toBeVisible({ timeout: 5_000 })
  })

  test('inscription d\'un nouveau compte → connexion automatique', async ({ page }) => {
    const email = uniqueEmail('signup')
    const password = 'TestE2E!2026'

    await page.goto('/inscription')
    // Pas de chiffres dans le prénom/nom — le validator côté front refuse
    // (regex /^[A-Za-zÀ-ÿ '-]+$/ ou équivalent).
    await page.getByLabel('Prénom').fill('Etienne')
    await page.getByLabel('Nom', { exact: true }).fill('Testeur')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Mot de passe', { exact: true }).fill(password)
    await page.getByLabel('Confirmer le mot de passe').fill(password)

    await page.getByRole('button', { name: /Cr.er.*compte/i }).click()

    // Après inscription, RegisterPage redirige vers /compte (auto-login).
    // On valide via le changement d'URL pour rester robuste aux mutations de TopNav.
    await page.waitForURL(/\/(compte|$)/, { timeout: 10_000 })
  })
})
