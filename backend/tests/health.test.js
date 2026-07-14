import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  const app = createApp();

  it('responde ok con timestamp', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
