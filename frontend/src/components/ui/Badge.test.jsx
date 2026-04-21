import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from './Badge.jsx';

describe('Badge', () => {
  it('applique la classe badge-<status> quand status est fourni', () => {
    const { container } = render(<Badge status="approved">OK</Badge>);
    const el = container.querySelector('.badge');
    expect(el).not.toBeNull();
    expect(el.className).toContain('badge-dot');
    expect(el.className).toContain('badge-approved');
    expect(el.textContent).toBe('OK');
  });

  it('applique badge-accent quand accent est true', () => {
    const { container } = render(<Badge accent>Promo</Badge>);
    const el = container.querySelector('.badge');
    expect(el.className).toContain('badge-accent');
    expect(el.className).not.toContain('badge-dot');
  });

  it('rend un badge neutre sans status ni accent', () => {
    const { container } = render(<Badge>Neutre</Badge>);
    const el = container.querySelector('.badge');
    expect(el.className).toBe('badge');
  });

  it('gère rejected, pending, approved', () => {
    const cases = ['pending', 'approved', 'rejected'];
    cases.forEach((s) => {
      const { container } = render(<Badge status={s}>x</Badge>);
      const el = container.querySelector('.badge');
      expect(el.className).toContain(`badge-${s}`);
    });
  });
});
