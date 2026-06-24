-- ============================================================
-- PortoSinFiltro — Migración: roles comunitarios
-- Ejecutar en Supabase → SQL Editor (BD ya desplegada)
-- Ver docs/PLAN-ROLES-COMUNITARIOS.md
-- ============================================================

-- 1. Ampliar CHECK de roles ANTES de migrar datos (el UPDATE falla si el CHECK viejo sigue activo)
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

UPDATE perfiles SET rol = 'administrador' WHERE rol IN ('municipio', 'cuadrilla');

ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('ciudadano', 'administrador'));

-- 2. Aportes: tipo resolucion (confirmación comunitaria de cierre)
ALTER TABLE aportes DROP CONSTRAINT IF EXISTS aportes_tipo_check;
ALTER TABLE aportes ADD CONSTRAINT aportes_tipo_check
  CHECK (tipo IN ('confirmacion', 'evidencia', 'detalle', 'relacionado', 'resolucion'));

-- 3. Reportes de denuncias falsas (ciudadanos)
CREATE TABLE IF NOT EXISTS reportes_denuncia (
  id            SERIAL PRIMARY KEY,
  denuncia_id   INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  usuario_id    UUID NOT NULL REFERENCES perfiles(id),
  motivo        TEXT NOT NULL CHECK (char_length(trim(motivo)) >= 10),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (denuncia_id, usuario_id)
);

ALTER TABLE reportes_denuncia ENABLE ROW LEVEL SECURITY;

-- 4. Recrear vista con estado comunitario calculado
DROP VIEW IF EXISTS vista_denuncias;

CREATE VIEW vista_denuncias AS
SELECT
  d.id,
  d.anonima,
  CASE WHEN d.anonima THEN NULL ELSE d.autor_id END AS autor_id,
  CASE WHEN d.anonima THEN 'Ciudadano Anónimo' ELSE p.nombre END AS autor_nombre,
  d.categoria_id,
  d.zona_id,
  c.nombre AS categoria,
  c.slug   AS categoria_slug,
  z.nombre AS zona,
  d.descripcion,
  d.gravedad,
  d.latitud,
  d.longitud,
  d.titular,
  CASE
    WHEN COUNT(DISTINCT CASE WHEN a.tipo = 'resolucion' THEN a.id END) >= 3 THEN 'resuelta'
    WHEN COUNT(DISTINCT CASE WHEN vp.progresando = true  THEN vp.id END) >= 2
     AND COUNT(DISTINCT CASE WHEN vp.progresando = true  THEN vp.id END)
       > COUNT(DISTINCT CASE WHEN vp.progresando = false THEN vp.id END)
    THEN 'con_avance'
    ELSE 'activa'
  END AS estado,
  d.oculta,
  d.created_at,
  d.updated_at,
  EXTRACT(DAY FROM NOW() - d.created_at)::INTEGER AS dias_sin_resolver,
  COUNT(DISTINCT r.id)  AS total_apoyos,
  COUNT(DISTINCT a.id)  AS total_aportes,
  COUNT(DISTINCT f.id)  AS total_fotos,
  COUNT(DISTINCT CASE WHEN vp.progresando = true  THEN vp.id END) AS total_progreso_si,
  COUNT(DISTINCT CASE WHEN vp.progresando = false THEN vp.id END) AS total_progreso_no,
  COUNT(DISTINCT rep.id) AS total_reportes,
  (
    SELECT f2.url
    FROM fotos_denuncia f2
    WHERE f2.denuncia_id = d.id
    ORDER BY f2.created_at ASC
    LIMIT 1
  ) AS foto_portada
FROM denuncias d
  JOIN perfiles   p ON p.id = d.autor_id
  JOIN categorias c ON c.id = d.categoria_id
  JOIN zonas      z ON z.id = d.zona_id
  LEFT JOIN reacciones            r   ON r.denuncia_id   = d.id
  LEFT JOIN aportes               a   ON a.denuncia_id   = d.id
  LEFT JOIN fotos_denuncia        f   ON f.denuncia_id   = d.id
  LEFT JOIN valoraciones_progreso vp  ON vp.denuncia_id  = d.id
  LEFT JOIN reportes_denuncia     rep ON rep.denuncia_id = d.id
WHERE d.oculta = false
GROUP BY d.id, p.nombre, c.nombre, c.slug, z.nombre;

-- 5. Vista admin (incluye denuncias ocultas para moderación)
CREATE VIEW vista_denuncias_admin AS
SELECT
  d.id,
  d.anonima,
  CASE WHEN d.anonima THEN NULL ELSE d.autor_id END AS autor_id,
  CASE WHEN d.anonima THEN 'Ciudadano Anónimo' ELSE p.nombre END AS autor_nombre,
  d.categoria_id,
  d.zona_id,
  c.nombre AS categoria,
  c.slug   AS categoria_slug,
  z.nombre AS zona,
  d.descripcion,
  d.gravedad,
  d.latitud,
  d.longitud,
  d.titular,
  CASE
    WHEN COUNT(DISTINCT CASE WHEN a.tipo = 'resolucion' THEN a.id END) >= 3 THEN 'resuelta'
    WHEN COUNT(DISTINCT CASE WHEN vp.progresando = true  THEN vp.id END) >= 2
     AND COUNT(DISTINCT CASE WHEN vp.progresando = true  THEN vp.id END)
       > COUNT(DISTINCT CASE WHEN vp.progresando = false THEN vp.id END)
    THEN 'con_avance'
    ELSE 'activa'
  END AS estado,
  d.oculta,
  d.created_at,
  d.updated_at,
  EXTRACT(DAY FROM NOW() - d.created_at)::INTEGER AS dias_sin_resolver,
  COUNT(DISTINCT r.id)  AS total_apoyos,
  COUNT(DISTINCT a.id)  AS total_aportes,
  COUNT(DISTINCT f.id)  AS total_fotos,
  COUNT(DISTINCT CASE WHEN vp.progresando = true  THEN vp.id END) AS total_progreso_si,
  COUNT(DISTINCT CASE WHEN vp.progresando = false THEN vp.id END) AS total_progreso_no,
  COUNT(DISTINCT rep.id) AS total_reportes,
  (
    SELECT f2.url
    FROM fotos_denuncia f2
    WHERE f2.denuncia_id = d.id
    ORDER BY f2.created_at ASC
    LIMIT 1
  ) AS foto_portada
FROM denuncias d
  JOIN perfiles   p ON p.id = d.autor_id
  JOIN categorias c ON c.id = d.categoria_id
  JOIN zonas      z ON z.id = d.zona_id
  LEFT JOIN reacciones            r   ON r.denuncia_id   = d.id
  LEFT JOIN aportes               a   ON a.denuncia_id   = d.id
  LEFT JOIN fotos_denuncia        f   ON f.denuncia_id   = d.id
  LEFT JOIN valoraciones_progreso vp  ON vp.denuncia_id  = d.id
  LEFT JOIN reportes_denuncia     rep ON rep.denuncia_id = d.id
GROUP BY d.id, p.nombre, c.nombre, c.slug, z.nombre;
