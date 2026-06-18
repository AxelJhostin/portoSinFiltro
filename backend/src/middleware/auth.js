import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';

// Carga el perfil desde el JWT. Rechaza si no hay token o es inválido.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
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
    const payload = jwt.verify(header.slice(7), process.env.SUPABASE_JWT_SECRET);
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
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }
    next();
  };
}
