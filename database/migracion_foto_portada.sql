-- PortoSinFiltro — Vista con foto_portada para miniaturas en el Muro
-- Ejecutar en Supabase → SQL Editor si ya tienes la base desplegada.

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
  LEFT JOIN reacciones     r ON r.denuncia_id = d.id
  LEFT JOIN aportes        a ON a.denuncia_id = d.id
  LEFT JOIN fotos_denuncia f ON f.denuncia_id = d.id
WHERE d.oculta = false
GROUP BY d.id, p.nombre, c.nombre, c.slug, z.nombre;
