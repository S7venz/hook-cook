import { describe, expect, it } from 'vitest';
import { emailValid, passwordStrongEnough } from './auth.js';

describe('emailValid', () => {
  it('accepts valid emails', () => {
    expect(emailValid('admin@hookcook.fr')).toBe(true);
    expect(emailValid('jean.dupont+test@peche.co')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(emailValid('not-an-email')).toBe(false);
    expect(emailValid('missing@tld')).toBe(false);
    expect(emailValid('@nouser.fr')).toBe(false);
    expect(emailValid('')).toBe(false);
  });

  it('tolerates surrounding whitespace (trims before checking)', () => {
    expect(emailValid(' test@x.fr ')).toBe(true);
    expect(emailValid('\ttest@x.fr\n')).toBe(true);
  });
});

describe('passwordStrongEnough', () => {
  it('requires at least 8 characters', () => {
    expect(passwordStrongEnough('1234567')).toBe(false);
    expect(passwordStrongEnough('12345678')).toBe(true);
    expect(passwordStrongEnough('password-long')).toBe(true);
  });
});
