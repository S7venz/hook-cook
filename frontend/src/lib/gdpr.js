const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Télécharge l'export RGPD complet du user courant (JSON).
 */
export async function downloadGdprExport(token) {
  const res = await fetch(`${BASE_URL}/api/users/me/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error ?? `Erreur ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hook-cook-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Anonymise le compte du user courant — irréversible.
 */
export async function deleteAccount(token) {
  const res = await fetch(`${BASE_URL}/api/users/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
  return data;
}

/**
 * Lance le flow de réinitialisation : envoie un email au user si
 * l'adresse existe. Renvoie toujours OK pour ne pas leaker.
 */
export async function requestPasswordReset(email) {
  const res = await fetch(`${BASE_URL}/api/auth/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error ?? `Erreur ${res.status}`);
  }
  return res.json();
}

/**
 * Confirme un reset avec le token reçu par email + nouveau mot de passe.
 */
export async function confirmPasswordReset(token, password) {
  const res = await fetch(`${BASE_URL}/api/auth/password-reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
  return data;
}
