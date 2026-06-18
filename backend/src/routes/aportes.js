import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// GET /denuncias/:id/aportes
router.get('/:id/aportes',
  param('id').isInt(),
  validate,
  async (req, res) => {
    const { data, error } = await supabase
      .from('aportes')
      .select(`
        id, tipo, contenido, foto_url, anonimo, created_at,
        perfiles (nombre, rol)
      `)
      .eq('denuncia_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Aplicar anonimato
    const resultado = data.map(a => ({
      ...a,
      autor: a.anonimo ? 'Ciudadano Anónimo' : a.perfiles?.nombre,
      rol: a.anonimo ? null : a.perfiles?.rol,
      perfiles: undefined,
    }));

    res.json(resultado);
  }
);

// POST /denuncias/:id/aportes — Agregar aporte/confirmación
router.post('/:id/aportes',
  requireAuth,
  param('id').isInt(),
  body('tipo').isIn(['confirmacion', 'evidencia', 'detalle', 'relacionado']),
  body('contenido').optional().trim().isLength({ max: 500 }),
  body('anonimo').optional().isBoolean(),
  validate,
  async (req, res) => {
    const { tipo, contenido, anonimo = false } = req.body;

    const { data, error } = await supabase
      .from('aportes')
      .insert({
        denuncia_id: Number(req.params.id),
        autor_id: req.user.id,
        tipo,
        contenido,
        anonimo,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  }
);

export default router;
