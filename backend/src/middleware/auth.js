import 'dotenv/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { supabase } from '../db/supabase.js';

// Supabase firma los access tokens con llaves asimétricas (ES256) expuestas
// vía JWKS. createRemoteJWKSet descarga y cachea las llaves públicas, y
// refresca automáticamente cuando Supabase rota la llave.
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);
const ISSUER = `${process.env.SUPABASE_URL}/auth/v1`;

// Verifica el token contra el JWKS de Supabase. Devuelve el payload o lanza.
async function verificarToken(token) {
  const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });
  return payload;
}

// Carga el perfil desde el JWT. Rechaza si no hay token o es inválido.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = await verificarToken(token);
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  const { data: perfil, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, activo')
    .eq('id', payload.sub)
    .single();

  if (error || !perfil) return res.status(401).json({ error: 'Usuario no encontrado' });
  if (!perfil.activo)   return res.status(403).json({ error: 'Cuenta desactivada' });

  req.user = perfil;
  next();
}

// Igual que requireAuth pero no rechaza si no hay token.
// Útil para rutas públicas que tienen comportamiento extra cuando el usuario está logueado.
export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const payload = await verificarToken(header.slice(7));
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, nombre, rol, activo')
      .eq('id', payload.sub)
      .single();

    if (perfil?.activo) req.user = perfil;
  } catch {
    // Token inválido en ruta pública — se ignora, la request continúa sin usuario
  }
  next();
}

// Verifica que req.user tenga uno de los roles indicados.
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
