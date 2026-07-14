import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DenunciaCard from './DenunciaCard';

vi.mock('../../lib/api', () => ({
  api: {
    denuncias: {
      apoyo: vi.fn(),
    },
  },
}));

const denunciaBase = {
  id: 1,
  titular: 'BACHE GIGANTE EN LA ESQUINA',
  descripcion: 'El bache lleva semanas sin reparar y daña los vehículos.',
  zona: 'Picoazá',
  categoria: 'Baches y vías',
  estado: 'activa',
  gravedad: 4,
  total_apoyos: 3,
  ya_apoyo: false,
  dias_sin_resolver: 5,
  total_progreso_si: 1,
  total_progreso_no: 0,
  latitud: -1.05,
  longitud: -80.45,
  foto_portada: null,
};

describe('DenunciaCard', () => {
  it('muestra titular, zona y estado', () => {
    render(
      <DenunciaCard
        denuncia={denunciaBase}
        session={null}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('BACHE GIGANTE EN LA ESQUINA')).toBeInTheDocument();
    expect(screen.getByText('Picoazá')).toBeInTheDocument();
    expect(screen.getByText('ACTIVA')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('deshabilita apoyo sin sesión', () => {
    render(
      <DenunciaCard
        denuncia={denunciaBase}
        session={null}
        onSelect={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /inicia sesión para apoyar/i })).toBeDisabled();
  });

  it('llama onSelect al hacer clic en la tarjeta', () => {
    const onSelect = vi.fn();
    render(
      <DenunciaCard
        denuncia={denunciaBase}
        session={null}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /denuncia: bache gigante/i }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('muestra miniatura cuando hay foto_portada', () => {
    render(
      <DenunciaCard
        denuncia={{ ...denunciaBase, foto_portada: 'https://example.com/foto.jpg' }}
        session={null}
        onSelect={() => {}}
      />
    );

    expect(document.querySelector('img[src="https://example.com/foto.jpg"]')).toBeTruthy();
  });
});
