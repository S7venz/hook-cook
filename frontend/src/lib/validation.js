/**
 * Validateurs de formulaires centralisés.
 *
 * Toutes les fonctions renvoient `null` si la valeur est valide, ou
 * un message d'erreur lisible en français sinon. Cette convention
 * permet de chaîner plusieurs validations et d'afficher directement
 * le retour dans l'UI sans switch/case.
 */

// Email — regex simple mais suffisante (RFC complète illisible)
export function validateEmail(value) {
  const v = (value ?? '').trim();
  if (!v) return 'L\'email est requis.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Email invalide.';
  return null;
}

// Mot de passe — 8 caractères minimum
export function validatePassword(value) {
  if (!value) return 'Le mot de passe est requis.';
  if (value.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
  return null;
}

// Prénom / nom — lettres (avec accents), tirets, apostrophes, espaces
export function validateName(value, { field = 'Le nom' } = {}) {
  const v = (value ?? '').trim();
  if (!v) return `${field} est requis.`;
  if (v.length < 2) return `${field} est trop court.`;
  if (v.length > 60) return `${field} est trop long.`;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v)) {
    return `${field} ne peut contenir que des lettres, espaces, tirets et apostrophes.`;
  }
  return null;
}

// Téléphone français — 10 chiffres avec ou sans espaces/points/tirets,
// ou format international +33
export function validatePhone(value) {
  const v = (value ?? '').replace(/[\s.-]/g, '');
  if (!v) return 'Le téléphone est requis.';
  if (!/^(?:\+33|0)[1-9]\d{8}$/.test(v)) {
    return 'Téléphone invalide — format attendu : 06 12 34 56 78.';
  }
  return null;
}

// Code postal français — 5 chiffres
export function validatePostalCode(value) {
  const v = (value ?? '').trim();
  if (!v) return 'Le code postal est requis.';
  if (!/^\d{5}$/.test(v)) return 'Code postal invalide (5 chiffres).';
  return null;
}

// Ville — lettres (avec accents), tirets, espaces
export function validateCity(value) {
  const v = (value ?? '').trim();
  if (!v) return 'La ville est requise.';
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v)) {
    return 'Nom de ville invalide.';
  }
  return null;
}

// Adresse — non vide, longueur min
export function validateAddress(value) {
  const v = (value ?? '').trim();
  if (!v) return 'L\'adresse est requise.';
  if (v.length < 5) return 'Adresse trop courte.';
  return null;
}

// Numéro de carte — 13 à 19 chiffres (Luhn simplifié — ignore espaces)
export function validateCardNumber(value) {
  const digits = (value ?? '').replace(/\s/g, '');
  if (!digits) return 'Le numéro de carte est requis.';
  if (!/^\d{13,19}$/.test(digits)) {
    return 'Numéro de carte invalide (13 à 19 chiffres).';
  }
  if (!luhn(digits)) return 'Numéro de carte invalide (checksum).';
  return null;
}

function luhn(digits) {
  let sum = 0;
  let doubleIt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (doubleIt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleIt = !doubleIt;
  }
  return sum % 10 === 0;
}

// Date d'expiration carte — MM/AA ou MM/AAAA, future
export function validateCardExpiry(value) {
  const v = (value ?? '').replace(/\s/g, '');
  if (!v) return 'La date d\'expiration est requise.';
  const match = /^(\d{2})\s*\/\s*(\d{2}|\d{4})$/.exec(v);
  if (!match) return 'Format attendu : MM/AA.';
  const month = Number(match[1]);
  let year = Number(match[2]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12) return 'Mois invalide.';
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59); // last day of month
  if (exp < now) return 'Carte expirée.';
  return null;
}

// CVC — 3 chiffres (Visa/MC) ou 4 (Amex)
export function validateCvc(value) {
  const v = (value ?? '').trim();
  if (!v) return 'Le CVC est requis.';
  if (!/^\d{3,4}$/.test(v)) return 'CVC invalide (3 ou 4 chiffres).';
  return null;
}

// Date de naissance — ISO YYYY-MM-DD, utilisateur doit être né
export function validateBirthDate(value) {
  const v = (value ?? '').trim();
  if (!v) return 'La date de naissance est requise.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Format attendu : JJ/MM/AAAA.';
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return 'Date invalide.';
  const now = new Date();
  if (date > now) return 'La date de naissance ne peut pas être dans le futur.';
  const age = (now - date) / (365.25 * 24 * 3600 * 1000);
  if (age > 120) return 'Date de naissance invalide.';
  return null;
}

/**
 * Retourne la première erreur non-null d'une liste de validations,
 * ou null si toutes passent.
 */
export function firstError(...errors) {
  return errors.find((e) => e) ?? null;
}
