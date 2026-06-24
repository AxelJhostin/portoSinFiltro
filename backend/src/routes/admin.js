import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRol } from '../middleware/auth.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// GET /admin/denuncias — cola de moderación (incluye ocultas)
router.get('/denuncias',
  requireAuth,
  requireRol('administrador'),
  query('oculta').optional().isIn(['true', 'false', 'all']),
  query('pagina').optional().isInt({ min: 1 }),
  validate,
  async (req, res) => {
    const { oculta = 'all', pagina = 1 } = req.query;
    const limite = 20;
    const desde  = (pagina - 1) * limite;

    let q = supabase
      .from('vista_denuncias_admin')
      .select('*', { count: 'exact' })
      .range(desde, desde + limite - 1);

    if (oculta === 'true')  q = q.eq('oculta', true);
    if (oculta === 'false') q = q.eq('oculta', false);

    q = q
      .order('total_reportes', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error, count } = await q;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ data, total: count, pagina: Number(pagina), limite });
  }
);

// GET /admin/reportes — reportes recientes de denuncias falsas
router.get('/reportes',
  requireAuth,
  requireRol('administrador'),
  query('pagina').optional().isInt({ min: 1 }),
  validate,
  async (req, res) => {
    const { pagina = 1 } = req.query;
    const limite = 30;
    const desde  = (pagina - 1) * limite;

    const { data, error, count } = await supabase
      .from('reportes_denuncia')
      .select(`
        id, motivo, created_at, denuncia_id,
        perfiles ( nombre ),
        denuncias ( titular, oculta, categorias ( nombre ), zonas ( nombre ) )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(desde, desde + limite - 1);

    if (error) return res.status(500).json({ error: error.message });

    const resultado = data.map(r => ({
      id: r.id,
      motivo: r.motivo,
      created_at: r.created_at,
      denuncia_id: r.denuncia_id,
      denuncia_titular: r.denuncias?.titular,
      denuncia_oculta: r.denuncias?.oculta ?? false,
      categoria: r.denuncias?.categorias?.nombre,
      zona: r.denuncias?.zonas?.nombre,
      reportado_por: r.perfiles?.nombre ?? 'Ciudadano',
    }));

    res.json({ data: resultado, total: count, pagina: Number(pagina), limite });
  }
);

export default router;
