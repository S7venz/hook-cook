// Configuration i18next pour la boutique Hook & Cook.
//
// FR = langue par défaut + fallback. EN détectée via :
//   1. ?lng=en dans l'URL
//   2. localStorage (clé 'hc-lang')
//   3. Accept-Language du navigateur
//
// Persistance : la dernière langue choisie via le switcher est gardée
// dans localStorage pour la prochaine visite.

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import fr from './locales/fr.json'
import en from './locales/en.json'

export const SUPPORTED_LANGUAGES = ['fr', 'en']
export const DEFAULT_LANGUAGE = 'fr'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    detection: {
      // Ordre de détection : query string → localStorage → navigator
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'hc-lang',
      caches: ['localStorage'],
    },
    interpolation: {
      // React échappe déjà les valeurs interpolées, pas besoin de
      // double-encoding côté i18next.
      escapeValue: false,
    },
    returnNull: false,
    // En dev, log les clés manquantes dans la console pour les ajouter
    // au fur et à mesure du wiring des composants.
    saveMissing: false,
    debug: false,
  })

export default i18n
