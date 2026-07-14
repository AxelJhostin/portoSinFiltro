function usuarioDesdeHeader(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;

  const token = auth.slice(7);
  if (token === 'invalid') return { invalid: true };

  const rol = req.headers['x-test-rol'];
  if (!rol) return null;

  return {
    id: req.headers['x-test-user-id'] ?? '11111111-1111-1111-1111-111111111111',
    nombre: req.headers['x-test-nombre'] ?? 'Usuario Test',
    rol,
    activo: req.headers['x-test-activo'] !== 'false',
  };
}

export async function requireAuth(req, res, next) {
  const user = usuarioDesdeHeader(req);
  if (!user) return res.status(401).json({ error: 'Token requerido' });
  if (user.invalid) return res.status(401).json({ error: 'Token inválido o expirado' });
  if (!user.activo) return res.status(403).json({ error: 'Cuenta desactivada' });
  req.user = user;
  next();
}

export async function optionalAuth(req, _res, next) {
  const user = usuarioDesdeHeader(req);
  if (user && !user.invalid && user.activo) req.user = user;
  next();
}

export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      const actual = req.user?.rol ?? 'desconocido';
      const esperados = roles.join(' o ');
      return res.status(403).json({
        error: actual === 'administrador'
          ? 'Tu cuenta es de administrador. Esta acción es solo para ciudadanos.'
          : `Sin permisos para esta acción (se requiere rol: ${esperados}).`,
      });
    }
    next();
  };
}

export const authHeaders = {
  ciudadano: {
    Authorization: 'Bearer test-ciudadano',
    'x-test-rol': 'ciudadano',
    'x-test-user-id': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'x-test-nombre': 'Adolfo',
  },
  administrador: {
    Authorization: 'Bearer test-admin',
    'x-test-rol': 'administrador',
    'x-test-user-id': 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'x-test-nombre': 'Axel',
  },
};
