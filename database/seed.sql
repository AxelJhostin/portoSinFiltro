-- ============================================================
-- PortoSinFiltro — Datos de prueba
-- NOTA: Ejecutar DESPUÉS del schema. Requiere crear
-- los usuarios en Supabase Auth primero y pegar los UUIDs.
-- ============================================================

-- Reemplaza estos UUIDs con los que genera Supabase Auth
-- al crear los usuarios de prueba desde el dashboard.

-- Ejemplo de cómo insertar perfiles manualmente:
-- INSERT INTO perfiles (id, nombre, rol) VALUES
--   ('UUID-DEL-MUNICIPIO',  'GAD Portoviejo',         'municipio'),
--   ('UUID-CUADRILLA-VIAS', 'Cuadrilla Obras Viales', 'cuadrilla'),
--   ('UUID-CIUDADANO-1',    'Mateo Cedeño',           'ciudadano'),
--   ('UUID-CIUDADANO-2',    'Ana Reyes',              'ciudadano');

-- Denuncias de prueba (ajusta los UUIDs y IDs de categoría/zona)
-- INSERT INTO denuncias (autor_id, anonima, categoria_id, zona_id, descripcion, gravedad, titular) VALUES
--   ('UUID-CIUDADANO-1', false, 1, 1,
--    'Un bache enorme lleva más de dos meses en la Av. Manabí, se come media calzada y ya causó caídas.',
--    5,
--    '¡CATÁSTROFE! ANDRÉS DE VERA: BACHE DESTRUYE LA CALZADA — 64 DÍAS SIN SOLUCIÓN'),
--   ('UUID-CIUDADANO-2', true, 2, 5,
--    'El sector lleva 23 noches sin alumbrado. La oscuridad aumentó los robos.',
--    4,
--    '¡INDIGNANTE! EL FLORÓN: SECTOR EN TOTAL OSCURIDAD');
