import { Router } from 'express';
import multer from 'multer';
import { body, query, param, validationResult } from 'express-validator';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRol, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Subida de fotos en memoria (máx. 5 MB), se reenvía a Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const BUCKET_FOTOS = 'denuncias';

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// Primera foto de cada denuncia (para miniaturas en el Muro)
async function adjuntarFotosPortada(items) {
  if (!items?.length) return items;

  const ids = items
    .filter(d => Number(d.total_fotos) > 0)
    .map(d => d.id);
  if (!ids.length) {
    return items.map(d => ({ ...d, foto_portada: null }));
  }

  const { data: fotos, error } = await supabase
    .from('fotos_denuncia')
    .select('denuncia_id, url, created_at')
    .in('denuncia_id', ids)
    .order('created_at', { ascending: true });

  if (error || !fotos?.length) {
    return items.map(d => ({ ...d, foto_portada: null }));
  }

  const primera = {};
  for (const f of fotos) {
    if (!primera[f.denuncia_id]) primera[f.denuncia_id] = f.url;
  }

  return items.map(d => ({ ...d, foto_portada: primera[d.id] ?? null }));
}

// GET /denuncias — Muro público (sin auth)
// Con ?autor_id=UUID solo devuelve las denuncias de ese usuario.
// El autor_id se valida contra el JWT: solo puedes pedir las tuyas.
router.get('/',
  optionalAuth,
  query('zona_id').optional().isInt(),
  query('categoria_id').optional().isInt(),
  query('estado').optional().isIn(['activa', 'con_avance', 'resuelta']),
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
      // La vista oculta autor_id en denuncias anónimas, así que no se puede
      // filtrar por autor directamente sin perder las propias anónimas.
      // Buscamos los IDs en la tabla base (donde autor_id siempre existe)
      // y luego filtramos la vista por esos IDs.
      const { data: propias, error: errPropias } = await supabase
        .from('denuncias')
        .select('id')
        .eq('autor_id', autor_id)
        .eq('oculta', false);

      if (errPropias) return res.status(500).json({ error: errPropias.message });

      const ids = propias.map(d => d.id);
      if (ids.length === 0) {
        return res.json({ data: [], total: 0, pagina: Number(pagina), limite });
      }
      q = q.in('id', ids);
    }

    if (orden === 'apoyos')   q = q.order('total_apoyos', { ascending: false });
    else if (orden === 'gravedad') q = q.order('gravedad', { ascending: false });
    else                      q = q.order('created_at',   { ascending: false });

    const { data, error, count } = await q;
    if (error) return res.status(500).json({ error: error.message });

    const enriquecidas = await adjuntarFotosPortada(data);
    res.json({ data: enriquecidas, total: count, pagina: Number(pagina), limite });
  }
);

// GET /denuncias/:id — Detalle público
router.get('/:id',
  optionalAuth,
  param('id').isInt(),
  validate,
  async (req, res) => {
    const denuncia_id = Number(req.params.id);

    const { data, error } = await supabase
      .from('vista_denuncias')
      .select('*')
      .eq('id', denuncia_id)
      .single();

    if (error) return res.status(404).json({ error: 'Denuncia no encontrada' });

    let mi_progreso = null;
    let ya_reporto = false;
    if (req.user) {
      const [{ data: voto }, { data: reporte }] = await Promise.all([
        supabase
          .from('valoraciones_progreso')
          .select('progresando')
          .eq('denuncia_id', denuncia_id)
          .eq('usuario_id', req.user.id)
          .maybeSingle(),
        supabase
          .from('reportes_denuncia')
          .select('id')
          .eq('denuncia_id', denuncia_id)
          .eq('usuario_id', req.user.id)
          .maybeSingle(),
      ]);
      mi_progreso = voto?.progresando ?? null;
      ya_reporto = !!reporte;
    }

    res.json({
      ...data,
      total_progreso_si:  data.total_progreso_si  ?? 0,
      total_progreso_no:  data.total_progreso_no  ?? 0,
      total_reportes:     data.total_reportes     ?? 0,
      mi_progreso,
      ya_reporto,
    });
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
  body('latitud').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body('longitud').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
  validate,
  async (req, res) => {
    const { categoria_id, zona_id, descripcion, gravedad, anonima = false, latitud, longitud } = req.body;

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
        latitud: latitud ?? null,
        longitud: longitud ?? null,
        titular,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  }
);

// POST /denuncias/:id/reporte — Ciudadano reporta denuncia falsa
router.post('/:id/reporte',
  requireAuth,
  requireRol('ciudadano'),
  param('id').isInt(),
  body('motivo').trim().isLength({ min: 10, max: 300 }),
  validate,
  async (req, res) => {
    const denuncia_id = Number(req.params.id);
    const usuario_id = req.user.id;
    const { motivo } = req.body;

    const { data: denuncia, error: fetchErr } = await supabase
      .from('denuncias')
      .select('id, autor_id, oculta')
      .eq('id', denuncia_id)
      .single();

    if (fetchErr || !denuncia) {
      return res.status(404).json({ error: 'Denuncia no encontrada' });
    }
    if (denuncia.oculta) {
      return res.status(400).json({ error: 'Esta denuncia ya no está visible.' });
    }
    if (denuncia.autor_id === usuario_id) {
      return res.status(400).json({ error: 'No puedes reportar tu propia denuncia.' });
    }

    const { error: insErr } = await supabase
      .from('reportes_denuncia')
      .insert({ denuncia_id, usuario_id, motivo });

    if (insErr) {
      if (insErr.code === '23505') {
        return res.status(409).json({ error: 'Ya reportaste esta denuncia.' });
      }
      return res.status(500).json({ error: insErr.message });
    }

    const { count } = await supabase
      .from('reportes_denuncia')
      .select('*', { count: 'exact', head: true })
      .eq('denuncia_id', denuncia_id);

    res.status(201).json({ ok: true, total_reportes: count ?? 1 });
  }
);

// PATCH /denuncias/:id/ocultar — Admin oculta o restaura denuncia
router.patch('/:id/ocultar',
  requireAuth,
  requireRol('administrador'),
  param('id').isInt(),
  body('oculta').isBoolean(),
  validate,
  async (req, res) => {
    const denuncia_id = Number(req.params.id);
    const { oculta } = req.body;

    const { data, error } = await supabase
      .from('denuncias')
      .update({ oculta })
      .eq('id', denuncia_id)
      .select('id, oculta')
      .single();

    if (error) return res.status(404).json({ error: 'Denuncia no encontrada' });
    res.json({ ok: true, oculta: data.oculta });
  }
);

// POST /denuncias/:id/progreso — Ciudadano marca si la denuncia progresa
router.post('/:id/progreso',
  requireAuth,
  requireRol('ciudadano'),
  param('id').isInt(),
  body('progresando').isBoolean(),
  validate,
  async (req, res) => {
    const denuncia_id = Number(req.params.id);
    const usuario_id = req.user.id;
    const { progresando } = req.body;

    const { data: existente, error: fetchErr } = await supabase
      .from('valoraciones_progreso')
      .select('id, progresando')
      .eq('denuncia_id', denuncia_id)
      .eq('usuario_id', usuario_id)
      .maybeSingle();

    if (fetchErr) return res.status(500).json({ error: fetchErr.message });

    if (existente) {
      if (existente.progresando === progresando) {
        const { error: delErr } = await supabase
          .from('valoraciones_progreso')
          .delete()
          .eq('id', existente.id);
        if (delErr) return res.status(500).json({ error: delErr.message });
      } else {
        const { error: updErr } = await supabase
          .from('valoraciones_progreso')
          .update({ progresando, updated_at: new Date().toISOString() })
          .eq('id', existente.id);
        if (updErr) return res.status(500).json({ error: updErr.message });
      }
    } else {
      const { error: insErr } = await supabase
        .from('valoraciones_progreso')
        .insert({ denuncia_id, usuario_id, progresando });
      if (insErr) return res.status(500).json({ error: insErr.message });
    }

    const { data: voto } = await supabase
      .from('valoraciones_progreso')
      .select('progresando')
      .eq('denuncia_id', denuncia_id)
      .eq('usuario_id', usuario_id)
      .maybeSingle();

    const { data: stats, error: statsErr } = await supabase
      .from('vista_denuncias')
      .select('total_progreso_si, total_progreso_no')
      .eq('id', denuncia_id)
      .single();

    if (statsErr) return res.status(500).json({ error: statsErr.message });

    res.json({
      mi_progreso: voto?.progresando ?? null,
      total_progreso_si: stats.total_progreso_si ?? 0,
      total_progreso_no: stats.total_progreso_no ?? 0,
    });
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

// GET /denuncias/:id/fotos — Fotos públicas de una denuncia
router.get('/:id/fotos',
  param('id').isInt(),
  validate,
  async (req, res) => {
    const { data, error } = await supabase
      .from('fotos_denuncia')
      .select('id, url, created_at')
      .eq('denuncia_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }
);

// POST /denuncias/:id/foto — Subir foto a Supabase Storage (multipart: campo "foto")
router.post('/:id/foto',
  requireAuth,
  (req, res, next) => {
    upload.single('foto')(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La foto supera 5 MB. Elige una imagen más pequeña.' });
      }
      if (err) return next(err);
      next();
    });
  },
  param('id').isInt(),
  validate,
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna foto.' });

    const ext = req.file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const mimePorExt = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const mimetype = req.file.mimetype && req.file.mimetype !== 'application/octet-stream'
      ? req.file.mimetype
      : (mimePorExt[ext] ?? req.file.mimetype);

    const tiposOk = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposOk.includes(mimetype)) {
      return res.status(400).json({ error: 'Formato no permitido. Usa JPG, PNG o WEBP (no HEIC).' });
    }

    const denuncia_id = Number(req.params.id);
    const path = `${denuncia_id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(path, req.file.buffer, { contentType: mimetype, upsert: false });

    if (upErr) return res.status(500).json({ error: upErr.message });

    const { data: pub } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(path);

    const { data, error } = await supabase
      .from('fotos_denuncia')
      .insert({ denuncia_id, url: pub.publicUrl, subida_por: req.user.id })
      .select('id, url, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  }
);

export default router;
