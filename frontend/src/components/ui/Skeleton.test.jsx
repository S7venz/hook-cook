import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ProductCardSkeleton, Skeleton, SkeletonLine, TableRowSkeleton } from './Skeleton.jsx';

describe('Skeleton', () => {
  it('rend un bloc avec la classe skeleton', () => {
    const { container } = render(<Skeleton width="50%" height={20} />);
    const el = container.querySelector('.skeleton');
    expect(el).not.toBeNull();
    expect(el.style.width).toBe('50%');
    expect(el.style.height).toBe('20px');
  });

  it('masque le skeleton du screen reader', () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector('.skeleton');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('SkeletonLine', () => {
  it('rend N lignes', () => {
    const { container } = render(<SkeletonLine lines={4} />);
    expect(container.querySelectorAll('.skeleton').length).toBe(4);
  });

  it('la dernière ligne est plus courte (70% par défaut)', () => {
    const { container } = render(<SkeletonLine lines={3} />);
    const lines = container.querySelectorAll('.skeleton');
    expect(lines[2].style.width).toBe('70%');
  });
});

describe('ProductCardSkeleton', () => {
  it('reproduit la structure product-card/card-media/info', () => {
    const { container } = render(<ProductCardSkeleton />);
    expect(container.querySelector('.product-card')).not.toBeNull();
    expect(container.querySelector('.card-media')).not.toBeNull();
    expect(container.querySelector('.info')).not.toBeNull();
  });
});

describe('TableRowSkeleton', () => {
  it('rend N cellules TD dans un TR', () => {
    // Encapsuler dans un <table> pour éviter le warning HTML
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton cols={5} />
        </tbody>
      </table>,
    );
    expect(container.querySelectorAll('td').length).toBe(5);
  });
});
