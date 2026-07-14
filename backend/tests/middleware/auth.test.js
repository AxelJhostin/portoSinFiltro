import { describe, it, expect } from 'vitest';
import { requireRol } from '../../src/middleware/auth.js';

function mockRes() {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

describe('requireRol', () => {
  it('permite rol esperado', () => {
    const req = { user: { rol: 'ciudadano' } };
    const res = mockRes();
    let called = false;
    requireRol('ciudadano')(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  it('rechaza rol incorrecto con mensaje claro', () => {
    const req = { user: { rol: 'administrador' } };
    const res = mockRes();
    requireRol('ciudadano')(req, res, () => {});
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/administrador/i);
  });

  it('rechaza usuario sin rol', () => {
    const req = { user: {} };
    const res = mockRes();
    requireRol('administrador')(req, res, () => {});
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/administrador/);
  });
});
