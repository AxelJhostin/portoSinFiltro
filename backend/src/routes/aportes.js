import { Router } from 'express';
import multer from 'multer';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { notificarCambioEstado, obtenerEstadoDenuncia } from '../lib/notificaciones.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const BUCKET_FOTOS = 'denuncias';
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

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
  (req, res, next) => upload.single('foto')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'La foto supera 5 MB. Elige una imagen más pequeña.' });
    if (err) return next(err);
    next();
  }),
  param('id').isInt(),
  body('tipo').isIn(['confirmacion', 'evidencia', 'detalle', 'relacionado', 'resolucion']),
  body('contenido').optional().trim().isLength({ max: 500 }),
  body('anonimo').optional().toBoolean().isBoolean(),
  validate,
  async (req, res) => {
    const { tipo, contenido, anonimo = false } = req.body;
    const denuncia_id = Number(req.params.id);
    const estadoAnterior = await obtenerEstadoDenuncia(denuncia_id);

    if (tipo === 'resolucion') {
      const { data: existente, error: fetchErr } = await supabase
        .from('aportes')
        .select('id')
        .eq('denuncia_id', denuncia_id)
        .eq('autor_id', req.user.id)
        .eq('tipo', 'resolucion')
        .maybeSingle();

      if (fetchErr) return res.status(500).json({ error: fetchErr.message });
      if (existente) {
        return res.status(409).json({ error: 'Ya confirmaste la resolución de esta denuncia.' });
      }
    }

    let foto_url = null;
    let rutaFoto = null;
    if (req.file) {
      if (!TIPOS_IMAGEN.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Formato no permitido. Usa JPG, PNG o WEBP (no HEIC).' });
      }
      const extension = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      rutaFoto = `aportes/${denuncia_id}/${Date.now()}-${req.user.id}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_FOTOS).upload(rutaFoto, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
      if (uploadError) return res.status(500).json({ error: uploadError.message });
      foto_url = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(rutaFoto).data.publicUrl;
    }

    const { data, error } = await supabase
      .from('aportes')
      .insert({
        denuncia_id,
        autor_id: req.user.id,
        tipo,
        contenido,
        anonimo,
        foto_url,
      })
      .select()
      .single();

    if (error) {
      if (rutaFoto) await supabase.storage.from(BUCKET_FOTOS).remove([rutaFoto]);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya confirmaste la resolución de esta denuncia.' });
      }
      return res.status(500).json({ error: error.message });
    }
    void notificarCambioEstado(denuncia_id, estadoAnterior);
    res.status(201).json(data);
  }
);

export default router;
