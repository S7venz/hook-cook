import { describe, expect, it } from 'vitest';
import {
  firstError,
  validateAddress,
  validateBirthDate,
  validateCardExpiry,
  validateCardNumber,
  validateCity,
  validateCvc,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
  validatePostalCode,
} from './validation.js';

describe('validateEmail', () => {
  it('accepte des emails valides', () => {
    expect(validateEmail('admin@hookcook.fr')).toBeNull();
    expect(validateEmail('jean.dupont+test@peche.co')).toBeNull();
    expect(validateEmail(' test@x.fr ')).toBeNull(); // trim
  });
  it('rejette le vide', () => {
    expect(validateEmail('')).toMatch(/requis/);
    expect(validateEmail(null)).toMatch(/requis/);
    expect(validateEmail(undefined)).toMatch(/requis/);
  });
  it('rejette les formats invalides', () => {
    expect(validateEmail('pas-un-email')).toBe('Email invalide.');
    expect(validateEmail('@nouser.fr')).toBe('Email invalide.');
    expect(validateEmail('missing@tld')).toBe('Email invalide.');
    expect(validateEmail('double@@signe.fr')).toBe('Email invalide.');
  });
});

describe('validatePassword', () => {
  it('refuse le vide et les mots de passe trop courts', () => {
    expect(validatePassword('')).toMatch(/requis/);
    expect(validatePassword('1234567')).toMatch(/8 caractères/);
  });
  it('accepte ≥ 8 caractères', () => {
    expect(validatePassword('12345678')).toBeNull();
    expect(validatePassword('mot de passe long et solide')).toBeNull();
  });
});

describe('validateName', () => {
  it('accepte lettres accentuées, espaces, tirets, apostrophes', () => {
    expect(validateName('Jean-Pierre')).toBeNull();
    expect(validateName("D'Artagnan")).toBeNull();
    expect(validateName('Élodie')).toBeNull();
    expect(validateName('de la Cruz')).toBeNull();
  });
  it('refuse vide, trop court, trop long', () => {
    expect(validateName('')).toMatch(/requis/);
    expect(validateName('A')).toMatch(/trop court/);
    expect(validateName('x'.repeat(61))).toMatch(/trop long/);
  });
  it('refuse les chiffres et caractères spéciaux', () => {
    expect(validateName('Jean123')).toMatch(/lettres/);
    expect(validateName('Jean<script>')).toMatch(/lettres/);
  });
  it('utilise le champ passé en option pour le message', () => {
    expect(validateName('', { field: 'Le prénom' })).toBe('Le prénom est requis.');
  });
});

describe('validatePhone', () => {
  it('accepte les formats français avec ou sans séparateurs', () => {
    expect(validatePhone('0612345678')).toBeNull();
    expect(validatePhone('06 12 34 56 78')).toBeNull();
    expect(validatePhone('06-12-34-56-78')).toBeNull();
    expect(validatePhone('06.12.34.56.78')).toBeNull();
    expect(validatePhone('+33612345678')).toBeNull();
  });
  it('refuse les numéros non-français ou mal formés', () => {
    expect(validatePhone('')).toMatch(/requis/);
    expect(validatePhone('1234')).toMatch(/invalide/);
    expect(validatePhone('abcdefghij')).toMatch(/invalide/);
    expect(validatePhone('0012345678')).toMatch(/invalide/); // le 2ème chiffre doit être 1-9
  });
});

describe('validatePostalCode', () => {
  it('accepte 5 chiffres', () => {
    expect(validatePostalCode('66000')).toBeNull();
    expect(validatePostalCode('75001')).toBeNull();
  });
  it('refuse autre chose que 5 chiffres', () => {
    expect(validatePostalCode('')).toMatch(/requis/);
    expect(validatePostalCode('123')).toMatch(/5 chiffres/);
    expect(validatePostalCode('123456')).toMatch(/5 chiffres/);
    expect(validatePostalCode('abc12')).toMatch(/5 chiffres/);
  });
});

describe('validateCity', () => {
  it('accepte noms de villes français', () => {
    expect(validateCity('Perpignan')).toBeNull();
    expect(validateCity("L'Haÿ-les-Roses")).toBeNull();
    expect(validateCity('Saint-Cyprien')).toBeNull();
  });
  it('refuse les chiffres', () => {
    expect(validateCity('Perpignan66')).toMatch(/invalide/);
  });
});

describe('validateAddress', () => {
  it('accepte une adresse plausible', () => {
    expect(validateAddress('12 rue de la République')).toBeNull();
  });
  it('refuse le vide et trop court', () => {
    expect(validateAddress('')).toMatch(/requise/);
    expect(validateAddress('12')).toMatch(/trop courte/);
  });
});

describe('validateCardNumber (Luhn)', () => {
  it('accepte les numéros valides Luhn', () => {
    // Carte test Stripe — passe Luhn
    expect(validateCardNumber('4242424242424242')).toBeNull();
    // Avec espaces
    expect(validateCardNumber('4242 4242 4242 4242')).toBeNull();
    // Autre carte test Stripe — passe Luhn
    expect(validateCardNumber('5555555555554444')).toBeNull();
  });
  it('refuse les numéros trop courts ou trop longs', () => {
    expect(validateCardNumber('123')).toMatch(/chiffres/);
    expect(validateCardNumber('1'.repeat(20))).toMatch(/chiffres/);
  });
  it('refuse un numéro qui ne passe pas Luhn', () => {
    expect(validateCardNumber('1234567890123456')).toMatch(/checksum/);
    // Le classique "1234 5678 9012 3456" échoue au Luhn — c'est voulu
    expect(validateCardNumber('1234 5678 9012 3456')).toMatch(/checksum/);
  });
  it('refuse lettres et caractères spéciaux', () => {
    expect(validateCardNumber('4242-abcd-4242-4242')).toMatch(/chiffres/);
  });
});

describe('validateCardExpiry', () => {
  it('accepte MM/AA et MM/AAAA futurs', () => {
    expect(validateCardExpiry('12/29')).toBeNull();
    expect(validateCardExpiry('12/2029')).toBeNull();
    expect(validateCardExpiry('06/30')).toBeNull();
  });
  it('refuse le format invalide', () => {
    expect(validateCardExpiry('')).toMatch(/requise/);
    expect(validateCardExpiry('abc')).toMatch(/Format/);
    expect(validateCardExpiry('13/29')).toMatch(/Mois/);
    expect(validateCardExpiry('00/29')).toMatch(/Mois/);
  });
  it('refuse les dates dans le passé', () => {
    expect(validateCardExpiry('01/20')).toMatch(/expirée/);
  });
});

describe('validateCvc', () => {
  it('accepte 3 ou 4 chiffres', () => {
    expect(validateCvc('123')).toBeNull();
    expect(validateCvc('1234')).toBeNull();
  });
  it('refuse autre chose', () => {
    expect(validateCvc('')).toMatch(/requis/);
    expect(validateCvc('12')).toMatch(/CVC/);
    expect(validateCvc('12345')).toMatch(/CVC/);
    expect(validateCvc('abc')).toMatch(/CVC/);
  });
});

describe('validateBirthDate', () => {
  it('accepte une date passée au format ISO', () => {
    expect(validateBirthDate('1990-05-12')).toBeNull();
    expect(validateBirthDate('2000-01-01')).toBeNull();
  });
  it('refuse format non ISO', () => {
    expect(validateBirthDate('')).toMatch(/requise/);
    expect(validateBirthDate('12/05/1990')).toMatch(/Format/);
  });
  it('refuse une date dans le futur', () => {
    expect(validateBirthDate('3000-01-01')).toMatch(/futur/);
  });
  it('refuse une date plus de 120 ans dans le passé', () => {
    expect(validateBirthDate('1800-01-01')).toMatch(/invalide/);
  });
});

describe('firstError', () => {
  it('renvoie la première erreur non-null', () => {
    expect(firstError(null, 'err1', 'err2')).toBe('err1');
    expect(firstError(null, null, 'err1')).toBe('err1');
  });
  it('renvoie null si tout passe', () => {
    expect(firstError(null, null, null)).toBeNull();
  });
});
