import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { supabaseMock, mockQuery } = vi.hoisted(() => {
  function buildQuery(result) {
    const builder = {
      select: () => builder,
      insert: () => builder,
      update: () => builder,
      delete: () => builder,
      eq: () => builder,
      in: () => builder,
      gte: () => builder,
      order: () => builder,
      range: () => builder,
      single: () => builder,
      maybeSingle: () => builder,
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
    builder.gte = vi.fn(() => builder);
    return builder;
  };

  const from = vi.fn(() => mockQueryFn({ data: null, error: null }));

  return {
    mockQuery: mockQueryFn,
    supabaseMock: { from, storage: { from: vi.fn() } },
  };
});

vi.mock('../src/db/supabase.js', () => ({ supabase: supabaseMock }));
vi.mock('../src/middleware/auth.js', () => import('./mocks/auth.js'));

const { createApp } = await import('../src/app.js');
const { authHeaders } = await import('./mocks/auth.js');

describe('GET /dashboard/public', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    let vistaCalls = 0;
    supabaseMock.from.mockImplementation((table) => {
      if (table === 'vista_denuncias') {
        vistaCalls += 1;
        if (vistaCalls === 1) return mockQuery({ count: 5, error: null });
        if (vistaCalls === 2) return mockQuery({ count: 2, error: null });
        if (vistaCalls === 3) return mockQuery({ count: 1, error: null });
        return mockQuery({
          data: [
            { zona: 'Picoazá', categoria: 'Baches y vías' },
            { zona: 'Colón', categoria: 'Basura y aseo' },
          ],
          error: null,
        });
      }
      if (table === 'denuncias') {
        return mockQuery({
          data: [{ created_at: new Date().toISOString() }],
          error: null,
        });
      }
      if (table === 'reportes_denuncia') {
        return mockQuery({ count: 0, error: null });
      }
      return mockQuery({ data: [], error: null, count: 0 });
    });
  });

  it('expone estadísticas públicas sin auth', async () => {
    const res = await request(app).get('/dashboard/public');

    expect(res.status).toBe(200);
    expect(res.body.estados).toEqual({ activa: 5, con_avance: 2, resuelta: 1 });
    expect(res.body.total).toBe(8);
    expect(res.body.zonas).toBeDefined();
    expect(res.body.categorias).toBeDefined();
    expect(res.body.tendencia).toHaveLength(7);
    expect(res.body.ocultas).toBeUndefined();
    expect(res.body.reportes).toBeUndefined();
  });
});

describe('GET /dashboard', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.from.mockImplementation(() => mockQuery({ count: 0, data: [], error: null }));
  });

  it('rechaza visitante sin token', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(401);
  });

  it('rechaza ciudadano', async () => {
    const res = await request(app)
      .get('/dashboard')
      .set(authHeaders.ciudadano);

    expect(res.status).toBe(403);
  });
});
