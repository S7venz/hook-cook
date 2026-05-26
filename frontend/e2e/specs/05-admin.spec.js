import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import { ADMIN } from '../fixtures/users.js'

test.describe.configure({ mode: 'serial' })

test.beforeEach(() => {
  try {
    execSync('docker exec hook-cook-redis-1 redis-cli FLUSHDB', { stdio: 'ignore', timeout: 3000 })
  } catch { /* ignore */ }
})

/**
 * Scénario n°5 — Admin
 *
 * Vérifie que :
 * - Un visiteur non connecté est redirigé loin de /admin (403 ou /connexion)
 * - L'admin connecté accède au tableau de bord
 * - Au moins une des sections (commandes / produits / permis / stats)
 *   est rendue.
 */
test.describe('Admin — accès protégé', () => {
  test('visiteur non connecté → /admin refusé', async ({ page }) => {
    await page.goto('/admin')
    // Selon l'implémentation, l'app redirige vers /connexion ou affiche /403
    await page.waitForURL((url) =>
      /\/(connexion|403)/.test(url.pathname) || !url.pathname.includes('/admin'),
      { timeout: 5_000 }
    ).catch(() => {})
    const url = page.url()
    expect(url).not.toMatch(/\/admin\/?$/)
  })

  test('admin connecté → tableau de bord accessible', async ({ page }) => {
    // Login admin
    await page.goto('/connexion')
    await page.getByLabel('Email').fill(ADMIN.email)
    await page.getByLabel('Mot de passe').fill(ADMIN.password)
    await page.getByRole('button', { name: /Se connecter/i }).click()
    await page.waitForURL(/\/(compte|admin)/, { timeout: 10_000 })

    // Accès admin
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)

    // Au moins un H1 ET un KPI visible (preuve qu'on est sur le dashboard
    // et pas sur un redirect)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.kpi').first()).toBeVisible({ timeout: 10_000 })
  })
})
