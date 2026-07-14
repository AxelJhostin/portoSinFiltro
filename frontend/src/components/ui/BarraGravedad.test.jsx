import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BarraGravedad from './BarraGravedad';

describe('BarraGravedad', () => {
  it('renderiza el meter con nivel indicado', () => {
    render(<BarraGravedad nivel={4} />);

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '4');
    expect(meter).toHaveAttribute('aria-valuemin', '1');
    expect(meter).toHaveAttribute('aria-valuemax', '5');
    expect(meter).toHaveAccessibleName(/gravedad 4 de 5/i);
  });

  it('limita valores fuera de rango', () => {
    render(<BarraGravedad nivel={99} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '5');
  });

  it('usa nivel mínimo 1 cuando el valor es inválido', () => {
    render(<BarraGravedad nivel={0} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '1');
  });
});
