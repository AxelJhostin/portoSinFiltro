-- ============================================================
-- PortoSinFiltro — Migración: ubicación (mapa) y fotos
-- Ejecutar en Supabase → SQL Editor SI ya tenías la base creada
-- con una versión anterior del schema.
-- (Si recreas todo desde schema.sql, NO necesitas este archivo.)
-- ============================================================

-- 1. Columnas de coordenadas en denuncias
ALTER TABLE denuncias
  ADD COLUMN IF NOT EXISTS latitud  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;

-- 2. Recrear la vista para exponer latitud/longitud
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
  COUNT(DISTINCT f.id) AS total_fotos
FROM denuncias d
  JOIN perfiles   p ON p.id = d.autor_id
  JOIN categorias c ON c.id = d.categoria_id
  JOIN zonas      z ON z.id = d.zona_id
  LEFT JOIN reacciones     r ON r.denuncia_id = d.id
  LEFT JOIN aportes        a ON a.denuncia_id = d.id
  LEFT JOIN fotos_denuncia f ON f.denuncia_id = d.id
WHERE d.oculta = false
GROUP BY d.id, p.nombre, c.nombre, c.slug, z.nombre;

-- 3. Bucket público de Storage para las fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('denuncias', 'denuncias', true)
ON CONFLICT (id) DO NOTHING;
