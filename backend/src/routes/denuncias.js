import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRol, optionalAuth } from '../middleware/auth.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// GET /denuncias — Muro público (sin auth)
// Con ?autor_id=UUID solo devuelve las denuncias de ese usuario.
// El autor_id se valida contra el JWT: solo puedes pedir las tuyas.
router.get('/',
  optionalAuth,
  query('zona_id').optional().isInt(),
  query('categoria_id').optional().isInt(),
  query('estado').optional().isIn(['pendiente', 'en_proceso', 'resuelto']),
  query('orden').optional().isIn(['reciente', 'apoyos', 'gravedad']),
  query('pagina').optional().isInt({ min: 1 }),
  query('autor_id').optional().isUUID(),
  validate,
  async (req, res) => {
    const { zona_id, categoria_id, estado, orden = 'reciente', pagina = 1, autor_id } = req.query;
    const limite = 20;
    const desde  = (pagina - 1) * limite;

    let q = supabase
      .from('vista_denuncias')
      .select('*', { count: 'exact' })
      .range(desde, desde + limite - 1);

    if (zona_id)     q = q.eq('zona_id', zona_id);
    if (categoria_id) q = q.eq('categoria_id', categoria_id);
    if (estado)      q = q.eq('estado', estado);

    // autor_id solo se aplica si el JWT coincide con el UUID pedido
    // (evita que un usuario vea la lista de denuncias de otro)
    if (autor_id) {
      if (!req.user || req.user.id !== autor_id) {
        return res.status(403).json({ error: 'Solo puedes consultar tus propias denuncias.' });
      }
      q = q.eq('autor_id', autor_id);
    }

    if (orden === 'apoyos')   q = q.order('total_apoyos', { ascending: false });
    else if (orden === 'gravedad') q = q.order('gravedad', { ascending: false });
    else                      q = q.order('created_at',   { ascending: false });

    const { data, error, count } = await q;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ data, total: count, pagina: Number(pagina), limite });
  }
);

// GET /denuncias/:id — Detalle público
router.get('/:id',
  param('id').isInt(),
  validate,
  async (req, res) => {
    const { data, error } = await supabase
      .from('vista_denuncias')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Denuncia no encontrada' });
    res.json(data);
  }
);

// POST /denuncias — Crear denuncia (requiere auth ciudadano)
router.post('/',
  requireAuth,
  requireRol('ciudadano'),
  body('categoria_id').isInt(),
  body('zona_id').isInt(),
  body('descripcion').trim().isLength({ min: 20, max: 1000 }),
  body('gravedad').isInt({ min: 1, max: 5 }),
  body('anonima').optional().isBoolean(),
  validate,
  async (req, res) => {
    const { categoria_id, zona_id, descripcion, gravedad, anonima = false } = req.body;

    // Titular: mayúsculas urgentes, generado del contenido
    const titular = descripcion.substring(0, 80).toUpperCase();

    const { data, error } = await supabase
      .from('denuncias')
      .insert({
        autor_id: req.user.id,
        categoria_id,
        zona_id,
        descripcion,
        gravedad,
        anonima,
        titular,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  }
);

// PATCH /denuncias/:id/estado — Cambiar estado (cuadrilla o municipio)
router.patch('/:id/estado',
  requireAuth,
  requireRol('cuadrilla', 'municipio'),
  param('id').isInt(),
  body('estado').isIn(['pendiente', 'en_proceso', 'resuelto']),
  body('respuesta').optional().trim().isLength({ max: 500 }),
  validate,
  async (req, res) => {
    const { estado, respuesta } = req.body;
    const denuncia_id = Number(req.params.id);

    // Obtener estado actual
    const { data: actual, error: fetchErr } = await supabase
      .from('denuncias')
      .select('estado')
      .eq('id', denuncia_id)
      .single();

    if (fetchErr) return res.status(404).json({ error: 'Denuncia no encontrada' });

    // Actualizar estado
    const { error: updateErr } = await supabase
      .from('denuncias')
      .update({ estado, cuadrilla_id: req.user.id })
      .eq('id', denuncia_id);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    // Registrar en historial
    await supabase.from('historial_estados').insert({
      denuncia_id,
      estado_anterior: actual.estado,
      estado_nuevo: estado,
      cambiado_por: req.user.id,
      respuesta,
    });

    res.json({ ok: true, estado });
  }
);

// POST /denuncias/:id/apoyo — Toggle apoyo
router.post('/:id/apoyo',
  requireAuth,
  param('id').isInt(),
  validate,
  async (req, res) => {
    const denuncia_id = Number(req.params.id);
    const usuario_id = req.user.id;

    // Verificar si ya apoyó
    const { data: existente } = await supabase
      .from('reacciones')
      .select('id')
      .eq('denuncia_id', denuncia_id)
      .eq('usuario_id', usuario_id)
      .maybeSingle();

    if (existente) {
      await supabase.from('reacciones').delete().eq('id', existente.id);
      return res.json({ apoyo: false });
    }

    await supabase.from('reacciones').insert({ denuncia_id, usuario_id });
    res.json({ apoyo: true });
  }
);

export default router;
