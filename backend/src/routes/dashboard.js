import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRol } from '../middleware/auth.js';

const router = Router();

async function contarEstadoComunitario(estado) {
  const { count, error } = await supabase
    .from('vista_denuncias')
    .select('*', { count: 'exact', head: true })
    .eq('estado', estado);
  if (error) throw error;
  return count ?? 0;
}

function agrupar(data, clave, limite) {
  const mapa = {};
  data.forEach(row => {
    const val = row[clave];
    if (val) mapa[val] = (mapa[val] || 0) + 1;
  });
  return Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([nombre, total]) => ({ nombre, total }));
}

export async function getDashboardStats() {
  const [
    activa,
    con_avance,
    resuelta,
    { data: denZonas, error: errZonas },
    { data: denCats,  error: errCats  },
    { data: recientes, error: errRec  },
    { count: ocultas, error: errOcultas },
    { count: reportes, error: errReportes },
  ] = await Promise.all([
    contarEstadoComunitario('activa'),
    contarEstadoComunitario('con_avance'),
    contarEstadoComunitario('resuelta'),
    supabase.from('vista_denuncias').select('zona'),
    supabase.from('vista_denuncias').select('categoria'),
    supabase
      .from('denuncias')
      .select('created_at')
      .eq('oculta', false)
      .gte('created_at', new Date(Date.now() - 6 * 86_400_000).toISOString()),
    supabase.from('denuncias').select('*', { count: 'exact', head: true }).eq('oculta', true),
    supabase.from('reportes_denuncia').select('*', { count: 'exact', head: true }),
  ]);

  if (errZonas) throw errZonas;
  if (errCats)  throw errCats;
  if (errRec)   throw errRec;
  if (errOcultas) throw errOcultas;
  if (errReportes) throw errReportes;

  const zonas      = agrupar(denZonas,  'zona',      5);
  const categorias = agrupar(denCats,   'categoria', 6);

  const diasObj = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    diasObj[d.toISOString().slice(0, 10)] = 0;
  }
  recientes.forEach(({ created_at }) => {
    const dia = created_at.slice(0, 10);
    if (dia in diasObj) diasObj[dia]++;
  });
  const tendencia = Object.entries(diasObj).map(([fecha, total]) => ({ fecha, total }));

  const estados = { activa, con_avance, resuelta };

  return {
    estados,
    total: activa + con_avance + resuelta,
    zonas,
    categorias,
    tendencia,
    ocultas: ocultas ?? 0,
    reportes: reportes ?? 0,
  };
}

// Vista pública — ciudadanos y visitantes (solo lectura)
router.get('/public', async (_req, res, next) => {
  try {
    const stats = await getDashboardStats();
    const { ocultas, reportes, ...publico } = stats;
    res.json(publico);
  } catch (err) {
    next(err);
  }
});

// Gestión — administradores
router.get('/',
  requireAuth,
  requireRol('administrador'),
  async (_req, res, next) => {
    try {
      res.json(await getDashboardStats());
    } catch (err) {
      next(err);
    }
  }
);

export default router;
