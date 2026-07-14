import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Paginacion from './Paginacion';

describe('Paginacion', () => {
  it('no renderiza si solo hay una página', () => {
    const { container } = render(
      <Paginacion pagina={1} total={10} limite={20} onChange={() => {}} label="Test" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('muestra controles y navega entre páginas', () => {
    const onChange = vi.fn();
    render(
      <Paginacion pagina={2} total={45} limite={20} onChange={onChange} label="Paginación test" />
    );

    expect(screen.getByLabelText('Paginación test')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
    expect(onChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('deshabilita anterior en la primera página', () => {
    render(
      <Paginacion pagina={1} total={45} limite={20} onChange={() => {}} label="Test" />
    );
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
  });
});
