import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QtyStepper } from './QtyStepper.jsx';

describe('QtyStepper', () => {
  it('affiche la valeur courante', () => {
    render(<QtyStepper value={3} onChange={() => {}} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('appelle onChange(value+1) au clic sur +', () => {
    const onChange = vi.fn();
    render(<QtyStepper value={2} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Augmenter la quantité'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('appelle onChange(value-1) au clic sur -', () => {
    const onChange = vi.fn();
    render(<QtyStepper value={5} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Diminuer la quantité'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('désactive - au min', () => {
    render(<QtyStepper value={1} onChange={() => {}} />);
    const minus = screen.getByLabelText('Diminuer la quantité');
    expect(minus).toBeDisabled();
  });

  it('désactive + au max', () => {
    render(<QtyStepper value={5} onChange={() => {}} max={5} />);
    const plus = screen.getByLabelText('Augmenter la quantité');
    expect(plus).toBeDisabled();
  });

  it('respecte un max personnalisé', () => {
    const onChange = vi.fn();
    render(<QtyStepper value={3} onChange={onChange} max={3} />);
    fireEvent.click(screen.getByLabelText('Augmenter la quantité'));
    // Le bouton est disabled donc onChange n'est pas appelé
    expect(onChange).not.toHaveBeenCalled();
  });
});
