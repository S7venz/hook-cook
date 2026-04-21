const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Télécharge un export CSV (admin). On fetch en Bearer puis on
 * déclenche le download via un <a> éphémère (href direct impossible
 * à cause du header Authorization).
 */
export async function downloadExport(kind, token) {
  const paths = {
    orders: '/api/admin/exports/orders.csv',
    permits: '/api/admin/exports/permits.csv',
    contestRegistrations: '/api/admin/exports/contest-registrations.csv',
  };
  const path = paths[kind];
  if (!path) throw new Error(`Export inconnu : ${kind}`);

  const res = await fetch(`${BASE_URL}${path}`, {
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
  a.download = `hook-cook-${kind}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
