import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon.jsx';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';

/**
 * Sélecteur de langue affiché dans le TopNav.
 *
 * - Bouton globe accessible (aria-label, aria-haspopup)
 * - Menu déroulant avec FR/EN
 * - Persistance via i18next-browser-languagedetector (localStorage hc-lang)
 * - Ferme au clic extérieur + sur Escape
 */
const LANG_LABELS = {
  fr: 'Français',
  en: 'English',
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = (i18n.resolvedLanguage || i18n.language || 'fr').slice(0, 2);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Synchronise <html lang="..."> avec la langue active (SEO + screen readers).
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = current;
    }
  }, [current]);

  function changeLanguage(lng) {
    i18n.changeLanguage(lng);
    setOpen(false);
  }

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-label={t('common.language')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t('common.language')}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="language" />
      </button>
      {open && (
        <ul role="menu" className="lang-menu">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <li key={lng} role="none">
              <button
                role="menuitem"
                type="button"
                className={`lang-menu-item ${current === lng ? 'active' : ''}`.trim()}
                onClick={() => changeLanguage(lng)}
                aria-current={current === lng ? 'true' : undefined}
              >
                {LANG_LABELS[lng] || lng.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
