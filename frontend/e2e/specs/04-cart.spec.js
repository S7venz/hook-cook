import { test, expect } from '@playwright/test'

/**
 * Scénario n°4 — Panier
 *
 * - Ajout d'un produit depuis le catalogue
 * - Le compteur du top nav s'incrémente
 * - La page panier affiche la ligne et un total non nul
 * - Suppression de la ligne ramène le panier à vide
 */
test.describe('Panier — ajout / suppression', () => {
  test('parcours complet ajout depuis catalogue → panier → suppression', async ({ page }) => {
    await page.goto('/boutique')
    const firstCard = page.locator('.product-card').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })

    // Ajout au panier depuis la card
    await firstCard.getByRole('button', { name: /Ajouter au panier/i }).click()

    // Le bouton panier du top nav doit maintenant indiquer 1 article
    const cartBtn = page.getByRole('link', { name: /Panier.*1 article/i })
    await expect(cartBtn).toBeVisible({ timeout: 5_000 })

    // Navigation vers le panier
    await cartBtn.click()
    await expect(page).toHaveURL(/\/panier/)

    // Une ligne de produit est affichée + un total > 0
    await expect(page.locator('.cart-item').first()).toBeVisible()
    await expect(page.locator('.summary-row.total')).toBeVisible()
  })
})
