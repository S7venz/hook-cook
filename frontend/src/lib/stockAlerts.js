import { api } from './api.js';

/**
 * S'inscrit à une alerte "retour en stock" sur un produit épuisé.
 * Le backend vérifie que le produit est bien à 0 et anti-double.
 */
export async function subscribeStockAlert(productId, token) {
  return api.post(
    `/api/products/${encodeURIComponent(productId)}/stock-alerts`,
    {},
    { token },
  );
}
