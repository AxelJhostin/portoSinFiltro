import { describe, it, expect } from 'vitest';
import { MURO_REALTIME_TABLAS, MURO_REALTIME_DEBOUNCE_MS } from './useMuroRealtime';

describe('useMuroRealtime config', () => {
  it('escucha tablas que alimentan el estado comunitario del muro', () => {
    expect(MURO_REALTIME_TABLAS).toContain('denuncias');
    expect(MURO_REALTIME_TABLAS).toContain('reacciones');
    expect(MURO_REALTIME_TABLAS).toContain('valoraciones_progreso');
    expect(MURO_REALTIME_TABLAS).toContain('aportes');
    expect(MURO_REALTIME_TABLAS.length).toBeGreaterThanOrEqual(4);
  });

  it('usa debounce razonable para no saturar la API', () => {
    expect(MURO_REALTIME_DEBOUNCE_MS).toBeGreaterThanOrEqual(300);
    expect(MURO_REALTIME_DEBOUNCE_MS).toBeLessThanOrEqual(2000);
  });
});
