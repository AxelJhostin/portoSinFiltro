import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRol } from '../middleware/auth.js';

const router = Router();

// Devuelve el total de denuncias con oculta=false y un estado dado
async function contarEstado(estado) {
  const { count, error } = await supabase
    .from('denuncias')
    .select('*', { count: 'exact', head: true })
    .eq('estado', estado)
    .eq('oculta', false);
  if (error) throw error;
  return count ?? 0;
}

// Agrupa un array de objetos por una clave y devuelve [{nombre, total}] ordenado desc
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

router.get('/',
  requireAuth,
  requireRol('municipio', 'cuadrilla'),
  async (req, res, next) => {
    try {
      // Conteos por estado y datos para rankings — todo en paralelo
      const [
        pendiente,
        en_proceso,
        resuelto,
        { data: denZonas, error: errZonas },
        { data: denCats,  error: errCats  },
        { data: recientes, error: errRec  },
      ] = await Promise.all([
        contarEstado('pendiente'),
        contarEstado('en_proceso'),
        contarEstado('resuelto'),

        // Zona de cada denuncia (para ranking)
        supabase
          .from('vista_denuncias')
          .select('zona')
          .eq('oculta', false),   // vista ya filtra oculta, pero lo dejamos explícito

        // Categoría de cada denuncia (para ranking)
        supabase
          .from('vista_denuncias')
          .select('categoria')
          .eq('oculta', false),

        // Denuncias de los últimos 7 días (para sparkline de tendencia)
        supabase
          .from('denuncias')
          .select('created_at')
          .eq('oculta', false)
          .gte('created_at', new Date(Date.now() - 6 * 86_400_000).toISOString()),
      ]);

      if (errZonas) throw errZonas;
      if (errCats)  throw errCats;
      if (errRec)   throw errRec;

      // Rankings con helper
      const zonas      = agrupar(denZonas,  'zona',      5);
      const categorias = agrupar(denCats,   'categoria', 6);

      // Tendencia: agrupar por día
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

      const estados = { pendiente, en_proceso, resuelto };

      res.json({
        estados,
        total: pendiente + en_proceso + resuelto,
        zonas,
        categorias,
        tendencia,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
