const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Télécharge la facture PDF d'une commande.
 *
 * Note : on peut pas utiliser <a href> direct car l'endpoint exige un
 * header Authorization. On fetch le blob puis on déclenche le download
 * via un <a> éphémère.
 */
export async function downloadInvoice(reference, token) {
  const res = await fetch(
    `${BASE_URL}/api/orders/${encodeURIComponent(reference)}/invoice`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error ?? `Erreur ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facture-${reference}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Retarder le revoke pour que Chrome ait le temps de lancer le download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
