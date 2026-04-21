import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

/**
 * Gardes de routes centralisés. Chaque guard attend que l'hydratation
 * du token (via /api/auth/me) soit terminée avant de prendre une
 * décision, pour éviter un redirect-flash au montage.
 */

function HydratingGate() {
  return (
    <div className="page">
      <div
        className="page-container"
        style={{ padding: 'var(--sp-16) 0', textAlign: 'center' }}
      >
        <p className="soft">Chargement…</p>
      </div>
    </div>
  );
}

/**
 * <RequireAuth> : expose le children uniquement si un user est
 * connecté. Sinon redirige vers /connexion avec state.from pour
 * revenir ici après login.
 */
export function RequireAuth({ children }) {
  const { user, hydrating } = useAuth();
  const location = useLocation();

  if (hydrating) return <HydratingGate />;
  if (!user) {
    return (
      <Navigate
        to="/connexion"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }
  return children;
}

/**
 * <RequireAdmin> : même logique mais exige role === 'ROLE_ADMIN'.
 * Non-admin connecté → page Forbidden dédiée (vs redirect silencieux
 * qui laisserait l'utilisateur perplexe).
 */
export function RequireAdmin({ children }) {
  const { user, hydrating } = useAuth();
  const location = useLocation();

  if (hydrating) return <HydratingGate />;
  if (!user) {
    return (
      <Navigate
        to="/connexion"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }
  if (user.role !== 'ROLE_ADMIN') {
    return <Navigate to="/403" replace />;
  }
  return children;
}
