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
    builder.insert = vi.fn(() => builder);
    builder.update = vi.fn(() => builder);
    builder.delete = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.in = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    builder.range = vi.fn(() => builder);
    builder.single = vi.fn(() => builder);
    builder.maybeSingle = vi.fn(() => builder);
    return builder;
  };

  const from = vi.fn(() => mockQueryFn({ data: null, error: null }));

  return {
    mockQuery: mockQueryFn,
    supabaseMock: {
      from,
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/foto.jpg' } })),
        })),
      },
    },
  };
});

vi.mock('../src/db/supabase.js', () => ({ supabase: supabaseMock }));
vi.mock('../src/middleware/auth.js', () => import('./mocks/auth.js'));

const { createApp } = await import('../src/app.js');
const { authHeaders } = await import('./mocks/auth.js');

describe('GET /denuncias', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.from.mockImplementation(() => mockQuery({
      data: [{
        id: 1,
        titular: 'BACHE EN LA CALLE',
        descripcion: 'Hay un bache enorme frente al colegio',
        zona: 'Picoazá',
        categoria: 'Baches y vías',
        estado: 'activa',
        gravedad: 4,
        total_apoyos: 2,
        total_fotos: 0,
        dias_sin_resolver: 3,
        total_progreso_si: 0,
        total_progreso_no: 0,
      }],
      error: null,
      count: 1,
    }));
  });

  it('lista denuncias públicamente sin auth', async () => {
    const res = await request(app).get('/denuncias');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].titular).toBe('BACHE EN LA CALLE');
    expect(res.body.data[0].ya_apoyo).toBe(false);
    expect(res.body.total).toBe(1);
  });

  it('rechaza estado inválido en query', async () => {
    const res = await request(app).get('/denuncias?estado=invalido');

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /denuncias', () => {
  const app = createApp();
  const denunciaCreada = {
    id: 99,
    titular: 'ALUMBRADO PUBLICO ROTO EN LA ESQUINA',
    descripcion: 'El poste lleva semanas sin funcionar en la esquina principal',
    gravedad: 3,
    anonima: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.from.mockImplementation(() => mockQuery({
      data: denunciaCreada,
      error: null,
    }));
  });

  it('rechaza creación sin token', async () => {
    const res = await request(app)
      .post('/denuncias')
      .send({
        categoria_id: 1,
        zona_id: 2,
        descripcion: 'Descripción válida con más de veinte caracteres',
        gravedad: 3,
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

  it('rechaza administrador (solo ciudadanos crean denuncias)', async () => {
    const res = await request(app)
      .post('/denuncias')
      .set(authHeaders.administrador)
      .send({
        categoria_id: 1,
        zona_id: 2,
        descripcion: 'Descripción válida con más de veinte caracteres',
        gravedad: 3,
      });

    expect(res.status).toBe(403);
  });

  it('rechaza descripción demasiado corta', async () => {
    const res = await request(app)
      .post('/denuncias')
      .set(authHeaders.ciudadano)
      .send({
        categoria_id: 1,
        zona_id: 2,
        descripcion: 'corta',
        gravedad: 3,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('crea denuncia como ciudadano autenticado', async () => {
    const res = await request(app)
      .post('/denuncias')
      .set(authHeaders.ciudadano)
      .send({
        categoria_id: 2,
        zona_id: 3,
        descripcion: 'El alumbrado público está roto desde hace varias semanas',
        gravedad: 4,
        anonima: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(99);
    expect(res.body.titular).toBe(denunciaCreada.titular);
  });
});

describe('PATCH /denuncias/:id/ocultar', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.from.mockImplementation(() => mockQuery({
      data: { id: 1, oculta: true },
      error: null,
    }));
  });

  it('rechaza ciudadano sin permisos de admin', async () => {
    const res = await request(app)
      .patch('/denuncias/1/ocultar')
      .set(authHeaders.ciudadano)
      .send({ oculta: true });

    expect(res.status).toBe(403);
  });

  it('permite ocultar denuncia como administrador', async () => {
    const res = await request(app)
      .patch('/denuncias/1/ocultar')
      .set(authHeaders.administrador)
      .send({ oculta: true });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.oculta).toBe(true);
  });
});

describe('POST /denuncias/:id/apoyo', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requiere autenticación', async () => {
    const res = await request(app).post('/denuncias/1/apoyo');
    expect(res.status).toBe(401);
  });

  it('registra apoyo cuando no existía', async () => {
    supabaseMock.from
      .mockImplementationOnce(() => mockQuery({ data: null, error: null }))
      .mockImplementationOnce(() => mockQuery({ data: null, error: null }));

    const res = await request(app)
      .post('/denuncias/1/apoyo')
      .set(authHeaders.ciudadano);

    expect(res.status).toBe(200);
    expect(res.body.apoyo).toBe(true);
  });
});
