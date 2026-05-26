import { test, expect } from '@playwright/test'

/**
 * Scénario n°1 — Smoke test
 *
 * Vérifie que les 4 pages principales du site répondent et affichent leur
 * contenu clé. C'est le filet de sécurité minimum : si ces 4 tests passent,
 * l'app n'est pas catastrophiquement cassée.
 */
test.describe('Smoke — pages publiques répondent', () => {
  test('accueil charge et affiche le hero + le top nav', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Hook.*Cook/i)
    await expect(page.getByRole('navigation', { name: /Navigation principale/i })).toBeVisible()
  })

  test('catalogue charge et affiche au moins un produit', async ({ page }) => {
    await page.goto('/boutique')
    // On attend l'apparition d'au moins une card produit (rendue après fetch API)
    await expect(page.locator('.product-card').first()).toBeVisible({ timeout: 10_000 })
    // La barre de recherche est présente et accessible (preuve RGAA)
    await expect(page.getByLabel('Rechercher dans le catalogue')).toBeVisible()
  })

  test('page permis charge sans erreur', async ({ page }) => {
    await page.goto('/permis')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('page connexion charge avec les bons champs', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Mot de passe')).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  })
})
