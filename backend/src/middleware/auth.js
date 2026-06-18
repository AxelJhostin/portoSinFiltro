import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';

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

  // Cargar perfil para obtener el rol de la app
  const { data: perfil, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, activo')
    .eq('id', payload.sub)
    .single();

  if (error || !perfil) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }
  if (!perfil.activo) {
    return res.status(403).json({ error: 'Cuenta desactivada' });
  }

  req.user = perfil;
  next();
}

export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }
    next();
  };
}
