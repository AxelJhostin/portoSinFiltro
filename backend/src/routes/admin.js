import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
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

// GET /admin/usuarios — listado de perfiles para moderación de cuentas
router.get('/usuarios',
  requireAuth,
  requireRol('administrador'),
  query('pagina').optional().isInt({ min: 1 }),
  query('rol').optional().isIn(['ciudadano', 'administrador']),
  query('activo').optional().isIn(['true', 'false']),
  validate,
  async (req, res, next) => {
    try {
      const { pagina = 1, rol, activo } = req.query;
      const limite = 20;
      const desde  = (pagina - 1) * limite;

      let q = supabase
        .from('perfiles')
        .select('id, nombre, rol, activo, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(desde, desde + limite - 1);

      if (rol) q = q.eq('rol', rol);
      if (activo === 'true')  q = q.eq('activo', true);
      if (activo === 'false') q = q.eq('activo', false);

      const { data, error, count } = await q;
      if (error) return res.status(500).json({ error: error.message });

      const enriquecidos = await Promise.all(
        (data ?? []).map(async (perfil) => {
          const { data: authData } = await supabase.auth.admin.getUserById(perfil.id);
          return { ...perfil, email: authData?.user?.email ?? null };
        })
      );

      res.json({ data: enriquecidos, total: count, pagina: Number(pagina), limite });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /admin/usuarios/:id — activar o desactivar cuenta
router.patch('/usuarios/:id',
  requireAuth,
  requireRol('administrador'),
  param('id').isUUID(),
  body('activo').isBoolean(),
  validate,
  async (req, res) => {
    const usuarioId = req.params.id;
    const { activo } = req.body;

    if (usuarioId === req.user.id && !activo) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta.' });
    }

    const { data: objetivo, error: fetchErr } = await supabase
      .from('perfiles')
      .select('id, nombre, rol, activo')
      .eq('id', usuarioId)
      .single();

    if (fetchErr || !objetivo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!activo && objetivo.rol === 'administrador') {
      return res.status(400).json({ error: 'No puedes desactivar a otro administrador.' });
    }

    const { data, error } = await supabase
      .from('perfiles')
      .update({ activo })
      .eq('id', usuarioId)
      .select('id, nombre, rol, activo, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const { data: authData } = await supabase.auth.admin.getUserById(usuarioId);

    res.json({ ...data, email: authData?.user?.email ?? null });
  }
);

export default router;
