-- PortoSinFiltro — Valoraciones de progreso por ciudadanos
-- Ejecutar en Supabase → SQL Editor si ya tienes la base desplegada.

CREATE TABLE IF NOT EXISTS valoraciones_progreso (
  id            SERIAL PRIMARY KEY,
  denuncia_id   INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  usuario_id    UUID NOT NULL REFERENCES perfiles(id),
  progresando   BOOLEAN NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (denuncia_id, usuario_id)
);

ALTER TABLE valoraciones_progreso ENABLE ROW LEVEL SECURITY;

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
  d.estado,
  d.oculta,
  d.created_at,
  d.updated_at,
  EXTRACT(DAY FROM NOW() - d.created_at)::INTEGER AS dias_sin_resolver,
  COUNT(DISTINCT r.id) AS total_apoyos,
  COUNT(DISTINCT a.id) AS total_aportes,
  COUNT(DISTINCT f.id) AS total_fotos,
  COUNT(DISTINCT CASE WHEN vp.progresando = true  THEN vp.id END) AS total_progreso_si,
  COUNT(DISTINCT CASE WHEN vp.progresando = false THEN vp.id END) AS total_progreso_no,
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
  LEFT JOIN reacciones            r  ON r.denuncia_id  = d.id
  LEFT JOIN aportes               a  ON a.denuncia_id  = d.id
  LEFT JOIN fotos_denuncia         f  ON f.denuncia_id  = d.id
  LEFT JOIN valoraciones_progreso vp ON vp.denuncia_id = d.id
WHERE d.oculta = false
GROUP BY d.id, p.nombre, c.nombre, c.slug, z.nombre;
