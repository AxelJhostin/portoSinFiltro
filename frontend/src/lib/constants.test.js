import { describe, it, expect } from 'vitest';
import {
  CATEGORIAS,
  ZONAS,
  ESTADO_LABEL,
  ESTADO_COLOR,
  GRAVEDAD_LABEL,
} from './constants';

describe('constants', () => {
  it('define 9 categorías con id y nombre', () => {
    expect(CATEGORIAS).toHaveLength(9);
    expect(CATEGORIAS[0]).toEqual({ id: 1, nombre: 'Baches y vías' });
    expect(CATEGORIAS.every(c => c.id && c.nombre)).toBe(true);
  });

  it('define 10 zonas de Portoviejo', () => {
    expect(ZONAS).toHaveLength(10);
    expect(ZONAS.some(z => z.nombre === 'Picoazá')).toBe(true);
  });

  it('mapea estados comunitarios a labels y clases CSS', () => {
    expect(ESTADO_LABEL.activa).toBe('ACTIVA');
    expect(ESTADO_LABEL.con_avance).toBe('CON AVANCE');
    expect(ESTADO_LABEL.resuelta).toBe('RESUELTA');
    expect(ESTADO_COLOR.resuelta).toBe('estado-resuelta');
  });

  it('define etiquetas de gravedad del 1 al 5', () => {
    expect(GRAVEDAD_LABEL[1]).toBe('Baja');
    expect(GRAVEDAD_LABEL[5]).toBe('Crítica');
  });
});
