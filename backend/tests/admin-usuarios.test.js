import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const CIUDADANO_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const OTRO_ADMIN_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const { supabaseMock, mockQuery } = vi.hoisted(() => {
  function buildQuery(result) {
    const builder = {
      select: () => builder,
      update: () => builder,
      eq: () => builder,
      order: () => builder,
      range: () => builder,
      single: () => builder,
      then(onFulfilled, onRejected) {
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  const mockQueryFn = (result) => {
    const builder = buildQuery(result);
    builder.select = vi.fn(() => builder);
    builder.update = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    builder.range = vi.fn(() => builder);
    builder.single = vi.fn(() => builder);
    return builder;
  };

  const from = vi.fn(() => mockQueryFn({ data: [], error: null, count: 0 }));

  return {
    mockQuery: mockQueryFn,
    supabaseMock: {
      from,
      storage: { from: vi.fn() },
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: 'usuario@demo.com' } },
          }),
        },
      },
    },
  };
});

vi.mock('../src/db/supabase.js', () => ({ supabase: supabaseMock }));
vi.mock('../src/middleware/auth.js', () => import('./mocks/auth.js'));

const { createApp } = await import('../src/app.js');
const { authHeaders } = await import('./mocks/auth.js');

describe('GET /admin/usuarios', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza visitante sin token', async () => {
    const res = await request(app).get('/admin/usuarios');
    expect(res.status).toBe(401);
  });

  it('lista usuarios con email y metadatos de paginación', async () => {
    supabaseMock.from.mockImplementationOnce(() => mockQuery({
      data: [{
        id: CIUDADANO_ID,
        nombre: 'Adolfo',
        rol: 'ciudadano',
        activo: true,
        created_at: '2026-01-01T00:00:00Z',
      }],
      error: null,
      count: 1,
    }));

    const res = await request(app)
      .get('/admin/usuarios?pagina=1')
      .set(authHeaders.administrador);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({
      nombre: 'Adolfo',
      rol: 'ciudadano',
      activo: true,
      email: 'usuario@demo.com',
    });
    expect(res.body.total).toBe(1);
    expect(supabaseMock.auth.admin.getUserById).toHaveBeenCalledWith(CIUDADANO_ID);
  });
});

describe('PATCH /admin/usuarios/:id', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza desactivar la propia cuenta', async () => {
    const res = await request(app)
      .patch(`/admin/usuarios/${authHeaders.administrador['x-test-user-id']}`)
      .set(authHeaders.administrador)
      .send({ activo: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/propia cuenta/i);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('rechaza desactivar a otro administrador', async () => {
    supabaseMock.from.mockImplementationOnce(() => mockQuery({
      data: { id: OTRO_ADMIN_ID, nombre: 'Elkin', rol: 'administrador', activo: true },
      error: null,
    }));

    const res = await request(app)
      .patch(`/admin/usuarios/${OTRO_ADMIN_ID}`)
      .set(authHeaders.administrador)
      .send({ activo: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/administrador/i);
  });

  it('desactiva cuenta de ciudadano', async () => {
    supabaseMock.from
      .mockImplementationOnce(() => mockQuery({
        data: { id: CIUDADANO_ID, nombre: 'Adolfo', rol: 'ciudadano', activo: true },
        error: null,
      }))
      .mockImplementationOnce(() => mockQuery({
        data: {
          id: CIUDADANO_ID,
          nombre: 'Adolfo',
          rol: 'ciudadano',
          activo: false,
          created_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }));

    const res = await request(app)
      .patch(`/admin/usuarios/${CIUDADANO_ID}`)
      .set(authHeaders.administrador)
      .send({ activo: false });

    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(false);
    expect(res.body.email).toBe('usuario@demo.com');
  });

  it('reactiva cuenta de ciudadano', async () => {
    supabaseMock.from
      .mockImplementationOnce(() => mockQuery({
        data: { id: CIUDADANO_ID, nombre: 'Adolfo', rol: 'ciudadano', activo: false },
        error: null,
      }))
      .mockImplementationOnce(() => mockQuery({
        data: {
          id: CIUDADANO_ID,
          nombre: 'Adolfo',
          rol: 'ciudadano',
          activo: true,
          created_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }));

    const res = await request(app)
      .patch(`/admin/usuarios/${CIUDADANO_ID}`)
      .set(authHeaders.administrador)
      .send({ activo: true });

    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(true);
  });
});
