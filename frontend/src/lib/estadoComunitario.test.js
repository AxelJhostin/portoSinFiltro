import { describe, it, expect } from 'vitest';
import { mensajeProximoEstado } from './estadoComunitario';

describe('mensajeProximoEstado', () => {
  it('retorna null cuando la denuncia ya está resuelta', () => {
    expect(mensajeProximoEstado({
      estado: 'resuelta',
      total_resoluciones: 3,
    })).toBeNull();
  });

  it('indica votos faltantes para CON AVANCE', () => {
    const msg = mensajeProximoEstado({
      estado: 'activa',
      total_progreso_si: 1,
      total_progreso_no: 0,
      total_resoluciones: 0,
    });

    expect(msg).toMatch(/faltan 1 voto/i);
    expect(msg).toMatch(/con avance/i);
  });

  it('indica confirmaciones faltantes para RESUELTA', () => {
    const msg = mensajeProximoEstado({
      estado: 'con_avance',
      total_progreso_si: 2,
      total_progreso_no: 0,
      total_resoluciones: 1,
    });

    expect(msg).toMatch(/faltan 2 confirmaci/i);
    expect(msg).toMatch(/resuelta/i);
  });

  it('pide mayoría de sí cuando hay empate en progreso', () => {
    const msg = mensajeProximoEstado({
      estado: 'activa',
      total_progreso_si: 2,
      total_progreso_no: 2,
      total_resoluciones: 0,
    });

    expect(msg).toMatch(/más votos «sí progresa»/i);
  });
});
