import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('rate limiting', () => {
  it('responde 429 al superar 100 peticiones globales en 15 min', async () => {
    const app = createApp();
    let first429 = null;

    for (let i = 1; i <= 105; i++) {
      const res = await request(app).get('/health');
      if (res.status === 429) {
        first429 = i;
        expect(res.body.error).toMatch(/demasiadas peticiones/i);
        break;
      }
    }

    expect(first429).not.toBeNull();
    expect(first429).toBeGreaterThan(100);
  });

  it('responde 429 al superar 20 escrituras de aportes en 15 min', async () => {
    const app = createApp();
    let first429 = null;

    for (let i = 1; i <= 25; i++) {
      const res = await request(app)
        .post('/denuncias/1/aportes')
        .send({ tipo: 'detalle', contenido: 'test rate limit' });

      if (res.status === 429) {
        first429 = i;
        expect(res.body.error).toMatch(/límite de escritura/i);
        break;
      }
    }

    expect(first429).not.toBeNull();
    expect(first429).toBeGreaterThan(20);
  });
});
