import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { supabaseMock, mockQuery } = vi.hoisted(() => {
  function buildQuery(result) {
    const builder = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      range: () => builder,
      then(onFulfilled, onRejected) {
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  const mockQueryFn = (result) => {
    const builder = buildQuery(result);
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    builder.range = vi.fn(() => builder);
    return builder;
  };

  const from = vi.fn(() => mockQueryFn({ data: [], error: null, count: 0 }));

  return { mockQuery: mockQueryFn, supabaseMock: { from, storage: { from: vi.fn() } } };
});

vi.mock('../src/db/supabase.js', () => ({ supabase: supabaseMock }));
vi.mock('../src/middleware/auth.js', () => import('./mocks/auth.js'));

const { createApp } = await import('../src/app.js');
const { authHeaders } = await import('./mocks/auth.js');

describe('GET /admin/denuncias', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza visitante sin token', async () => {
    const res = await request(app).get('/admin/denuncias');
    expect(res.status).toBe(401);
  });

  it('pagina resultados y devuelve metadatos', async () => {
    supabaseMock.from.mockImplementation(() => mockQuery({
      data: [{ id: 21, titular: 'DENUNCIA PAGINA 2' }],
      error: null,
      count: 25,
    }));

    const res = await request(app)
      .get('/admin/denuncias?pagina=2&oculta=false')
      .set(authHeaders.administrador);

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(2);
    expect(res.body.limite).toBe(20);
    expect(res.body.total).toBe(25);
    expect(res.body.data).toHaveLength(1);

    const builder = supabaseMock.from.mock.results[0].value;
    expect(builder.range).toHaveBeenCalledWith(20, 39);
  });
});

describe('GET /admin/reportes', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pagina reportes con límite de 30', async () => {
    supabaseMock.from.mockImplementation(() => mockQuery({
      data: [{
        id: 1,
        motivo: 'Denuncia falsa',
        created_at: '2026-01-01T00:00:00Z',
        denuncia_id: 5,
        perfiles: { nombre: 'Adolfo' },
        denuncias: {
          titular: 'TITULAR',
          oculta: false,
          categorias: { nombre: 'Basura' },
          zonas: { nombre: 'Picoazá' },
        },
      }],
      error: null,
      count: 35,
    }));

    const res = await request(app)
      .get('/admin/reportes?pagina=2')
      .set(authHeaders.administrador);

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(2);
    expect(res.body.limite).toBe(30);
    expect(res.body.total).toBe(35);
    expect(res.body.data[0].reportado_por).toBe('Adolfo');

    const builder = supabaseMock.from.mock.results[0].value;
    expect(builder.range).toHaveBeenCalledWith(30, 59);
  });
});
