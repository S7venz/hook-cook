import { useCallback, useState } from 'react';
import { ToastContext } from '../lib/toast.js';

// Détection heuristique du "kind" depuis le texte : si le message
// contient un mot-clé d'erreur, on colore en rouge ; si succès, vert ;
// sinon accent par défaut. Garde l'API push(message) simple.
function inferKind(message) {
  if (!message) return 'info';
  const m = message.toString().toLowerCase();
  if (/(erreur|échec|impossible|refusé|invalide|incorrect)/.test(m)) return 'error';
  if (/(ajouté|créé|enregistré|envoyé|confirmé|téléchargé|publié|mise à jour)/.test(m)) return 'success';
  return 'info';
}

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 12l5 5L20 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8v4M12 16h.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3l10 18H2L12 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v4M12 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8h.01M12 12v4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, explicitKind) => {
    const id = Math.random().toString(36).slice(2);
    const kind = explicitKind ?? inferKind(message);
    setToasts((current) => [...current, { id, message, kind }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div className="toast-item" key={t.id} data-kind={t.kind}>
            <span className="toast-ico" aria-hidden="true">
              {ICONS[t.kind] ?? ICONS.info}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
